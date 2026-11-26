import { describe, expect, it } from 'vitest';
import {
  assertIntegerAmount,
  computeLedgerRows,
  computePaymentPattern,
  createReversingEvent,
  customerLedgerToCsv,
  sortCustomersByReminderPriority,
  summarizeCustomer,
  summarizeShop,
  type Customer,
  type Transaction,
} from '../src/index.js';

describe('Ledger maths (deterministic, integer-only, append-only)', () => {
  it('rejects floats, zero, and negative amounts', () => {
    expect(() => assertIntegerAmount(500.5)).toThrow();
    expect(() => assertIntegerAmount(0)).toThrow();
    expect(() => assertIntegerAmount(-100)).toThrow();
    expect(assertIntegerAmount(500)).toBe(500);
  });

  it('computes running balances from append-only udhaar, wapis, and undo events', () => {
    const txs: Transaction[] = [
      { id: 't1', customerId: 'c1', type: 'udhaar', amount: 1800, note: 'Atta, oil', occurredAt: '2026-11-12', createdAt: '2026-11-12T09:00:00Z' },
      { id: 't2', customerId: 'c1', type: 'wapis', amount: 500, note: 'Cash', occurredAt: '2026-11-15', createdAt: '2026-11-15T09:00:00Z' },
      { id: 't3', customerId: 'c1', type: 'udhaar', amount: 700, note: 'Tea', occurredAt: '2026-11-19', createdAt: '2026-11-19T09:00:00Z' },
      { id: 't4', customerId: 'c1', type: 'udhaar', amount: 500, note: 'Milk', occurredAt: '2026-11-26', createdAt: '2026-11-26T09:00:00Z' },
    ];

    const rows = computeLedgerRows(txs);
    expect(rows.map((r) => r.runningBalance)).toEqual([1800, 1300, 2000, 2500]);

    // Undo t4 creates a reversing adjustment event; t4 stays in history
    const rev = createReversingEvent(txs[3], 'Mistyped');
    const withUndo: Transaction[] = [
      ...txs,
      { ...rev, id: 't5', occurredAt: '2026-11-26', createdAt: '2026-11-26T09:05:00Z' },
    ];
    const rowsAfterUndo = computeLedgerRows(withUndo);
    expect(rowsAfterUndo).toHaveLength(5);
    expect(rowsAfterUndo[3].isReversed).toBe(true);
    expect(rowsAfterUndo[4].runningBalance).toBe(2000);
  });

  it('computes payment-pattern hint only when >= 3 settled data points exist', () => {
    const twoPoints: Transaction[] = [
      { id: '1', customerId: 'c1', type: 'udhaar', amount: 500, note: 'A', occurredAt: '2026-09-01', createdAt: '2026-09-01T00:00:00Z' },
      { id: '2', customerId: 'c1', type: 'wapis', amount: 500, note: 'B', occurredAt: '2026-09-25', createdAt: '2026-09-25T00:00:00Z' },
      { id: '3', customerId: 'c1', type: 'udhaar', amount: 500, note: 'C', occurredAt: '2026-10-01', createdAt: '2026-10-01T00:00:00Z' },
      { id: '4', customerId: 'c1', type: 'wapis', amount: 500, note: 'D', occurredAt: '2026-10-27', createdAt: '2026-10-27T00:00:00Z' },
    ];
    expect(computePaymentPattern(twoPoints, 14).hint).toBeNull();

    const threePoints: Transaction[] = [
      ...twoPoints,
      { id: '5', customerId: 'c1', type: 'udhaar', amount: 500, note: 'E', occurredAt: '2026-11-01', createdAt: '2026-11-01T00:00:00Z' },
      { id: '6', customerId: 'c1', type: 'wapis', amount: 500, note: 'F', occurredAt: '2026-11-27', createdAt: '2026-11-27T00:00:00Z' },
    ];
    const pattern = computePaymentPattern(threePoints, 14);
    expect(pattern.dataPoints).toBe(3);
    expect(pattern.averageDaysLate).toBe(11);
    expect(pattern.hint).toContain('~11 days late');
  });

  it('sorts customers by reminder urgency and computes shop totals', () => {
    const now = new Date('2026-11-27T00:00:00Z');
    const c1: Customer = { id: 'c1', name: 'Ali Raza', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 };
    const c2: Customer = { id: 'c2', name: 'Sara Khan', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 };
    const c3: Customer = { id: 'c3', name: 'Usman Tailors', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 };

    const s1 = summarizeCustomer(c1, [
      { id: 't1', customerId: 'c1', type: 'udhaar', amount: 2500, note: 'Atta', occurredAt: '2026-11-01', createdAt: '2026-11-01T00:00:00Z' },
    ], now);
    const s2 = summarizeCustomer(c2, [
      { id: 't2', customerId: 'c2', type: 'udhaar', amount: 1200, note: 'Suit', occurredAt: '2026-11-20', createdAt: '2026-11-20T00:00:00Z' },
    ], now);
    const s3 = summarizeCustomer(c3, [
      { id: 't3', customerId: 'c3', type: 'udhaar', amount: 500, note: 'Thread', occurredAt: '2026-11-01', createdAt: '2026-11-01T00:00:00Z' },
      { id: 't4', customerId: 'c3', type: 'wapis', amount: 500, note: 'Paid', occurredAt: '2026-11-05', createdAt: '2026-11-05T00:00:00Z' },
    ], now);

    const sorted = sortCustomersByReminderPriority([s3, s2, s1]);
    expect(sorted.map((s) => s.customer.name)).toEqual(['Ali Raza', 'Sara Khan', 'Usman Tailors']);

    const shop = summarizeShop({ shopName: 'Rizwan General Store', location: 'Sahiwal' }, sorted);
    expect(shop.totalToCollect).toBe(3700);
    expect(shop.totalGiven).toBe(4200);
    expect(shop.totalReceived).toBe(500);
    expect(shop.needsReminderCount).toBe(1);

    const csv = customerLedgerToCsv(c1, computeLedgerRows([
      { id: 't1', customerId: 'c1', type: 'udhaar', amount: 2500, note: 'Atta, oil', occurredAt: '2026-11-01', createdAt: '2026-11-01T00:00:00Z' },
    ]));
    expect(csv).toContain('"Atta, oil"');
  });
});
