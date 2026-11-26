import { describe, expect, it } from 'vitest';
import {
  parseKhataSentence,
  respondWithKhataBot,
  type CustomerSummary,
  type ShopSummary,
} from '../src/index.js';

const SHOP: ShopSummary = {
  shopName: 'Rizwan General Store',
  location: 'Sahiwal',
  totalToCollect: 3700,
  totalGiven: 4200,
  totalReceived: 500,
  customerCount: 2,
  needsReminderCount: 1,
};

const SUMMARIES: CustomerSummary[] = [
  {
    customer: { id: 'c1', name: 'Ali Raza', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 },
    balance: 2500,
    totalGiven: 3000,
    totalReceived: 500,
    lastActivityAt: '2026-11-26',
    oldestUnpaidAt: '2026-11-01',
    daysSinceOldestUnpaid: 26,
    dueStatusLabel: 'Due 12 days ago',
    needsReminder: true,
    urgencyScore: 100,
    paymentPattern: { dataPoints: 0, averageDaysLate: null, hint: null },
  },
  {
    customer: { id: 'c2', name: 'Sara Khan', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 },
    balance: 1200,
    totalGiven: 1200,
    totalReceived: 0,
    lastActivityAt: '2026-11-20',
    oldestUnpaidAt: '2026-11-20',
    daysSinceOldestUnpaid: 7,
    dueStatusLabel: 'Due in 7 days',
    needsReminder: false,
    urgencyScore: 10,
    paymentPattern: { dataPoints: 0, averageDaysLate: null, hint: null },
  },
];

describe('KhataBot & custom trained keywords', () => {
  it('answers balance, reminder, and shop total questions using code-computed numbers', () => {
    const bal = respondWithKhataBot('Ali ka kitna baqi hai?', SUMMARIES, SHOP);
    expect(bal.intent).toBe('balance_query');
    expect(bal.reply).toContain('Rs 2,500');

    const rem = respondWithKhataBot('Kis ko reminder bhejna hai?', SUMMARIES, SHOP);
    expect(rem.intent).toBe('reminder_list');
    expect(rem.reply).toContain('Ali Raza');

    const tot = respondWithKhataBot('Total kitna lena hai?', SUMMARIES, SHOP);
    expect(tot.intent).toBe('shop_totals');
    expect(tot.reply).toContain('Rs 3,700');

    const entry = respondWithKhataBot('Ali ko 500 ka udhaar likh do', SUMMARIES, SHOP);
    expect(entry.intent).toBe('ledger_entry');
  });

  it('supports custom trained slang keywords in parseKhataSentence', () => {
    const res = parseKhataSentence('Ali ne 500 chukta kiye', [SUMMARIES[0].customer], new Date('2026-11-27'), {
      wapis: ['chukta'],
    });
    expect(res.type).toBe('wapis');
    expect(res.amount).toBe(500);
    expect(res.customer).toBe('Ali Raza');
  });
});
