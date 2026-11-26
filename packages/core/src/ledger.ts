import type {
  Customer,
  CustomerSummary,
  LedgerRow,
  PaymentPattern,
  ShopSummary,
  Transaction,
} from './types.js';

export function assertIntegerAmount(amount: number, label = 'amount'): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive integer (got ${String(amount)})`);
  }
  return amount;
}

export function getSignedAmount(tx: Pick<Transaction, 'type' | 'amount' | 'direction'>): number {
  assertIntegerAmount(tx.amount, 'transaction amount');
  if (tx.type === 'udhaar') return tx.amount;
  if (tx.type === 'wapis') return -tx.amount;
  const dir = tx.direction === -1 ? -1 : 1;
  return dir * tx.amount;
}

export function computeLedgerRows(transactions: Transaction[]): LedgerRow[] {
  const reversedIds = new Set<string>();
  for (const tx of transactions) {
    if (tx.reversedTxId) {
      reversedIds.add(tx.reversedTxId);
    }
  }

  const sorted = [...transactions].sort((a, b) => {
    const d1 = a.occurredAt.localeCompare(b.occurredAt);
    if (d1 !== 0) return d1;
    const d2 = a.createdAt.localeCompare(b.createdAt);
    if (d2 !== 0) return d2;
    return a.id.localeCompare(b.id);
  });

  let running = 0;
  return sorted.map((tx) => {
    const signedAmount = getSignedAmount(tx);
    running += signedAmount;
    return {
      ...tx,
      signedAmount,
      runningBalance: running,
      isReversed: reversedIds.has(tx.id),
    };
  });
}

export function createReversingEvent(
  originalTx: Transaction,
  reason = 'Undo entry'
): Omit<Transaction, 'id' | 'createdAt'> {
  const originalSigned = getSignedAmount(originalTx);
  return {
    customerId: originalTx.customerId,
    type: 'adjustment',
    amount: originalTx.amount,
    direction: originalSigned >= 0 ? -1 : 1,
    note: `Undo: ${originalTx.note}`,
    occurredAt: new Date().toISOString().slice(0, 10),
    reversedTxId: originalTx.id,
    sourceText: originalTx.sourceText ?? null,
    adjustmentReason: reason,
  };
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso.slice(0, 10) + 'T00:00:00Z').getTime();
  const to = new Date(toIso.slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.round((to - from) / 86_400_000);
}

/**
 * Computes payment lateness using FIFO matching of non-reversed udhaar charges
 * against wapis payments. Only returns a hint when at least 3 settled data points exist.
 */
export function computePaymentPattern(
  transactions: Transaction[],
  dueDays = 14
): PaymentPattern {
  const rows = computeLedgerRows(transactions);
  const active = rows.filter((r) => !r.isReversed && !r.reversedTxId);

  const charges: Array<{ date: string; remaining: number }> = [];
  const latenessSamples: number[] = [];

  for (const tx of active) {
    if (tx.type === 'udhaar') {
      charges.push({ date: tx.occurredAt, remaining: tx.amount });
    } else if (tx.type === 'wapis') {
      let paymentLeft = tx.amount;
      while (paymentLeft > 0 && charges.length > 0) {
        const head = charges[0];
        const applied = Math.min(head.remaining, paymentLeft);
        head.remaining -= applied;
        paymentLeft -= applied;
        if (head.remaining === 0) {
          const daysElapsed = Math.max(0, daysBetween(head.date, tx.occurredAt));
          const daysLate = Math.max(0, daysElapsed - dueDays);
          latenessSamples.push(daysLate);
          charges.shift();
        }
      }
    }
  }

  if (latenessSamples.length < 3) {
    return {
      dataPoints: latenessSamples.length,
      averageDaysLate: null,
      hint: null,
    };
  }

  const avg = Math.round(
    latenessSamples.reduce((sum, n) => sum + n, 0) / latenessSamples.length
  );

  const hint =
    avg <= 0
      ? `Usually pays on time (based on ${latenessSamples.length} past payments).`
      : `Usually pays ~${avg} days late after the ${dueDays}-day due date (based on ${latenessSamples.length} past payments).`;

  return {
    dataPoints: latenessSamples.length,
    averageDaysLate: avg,
    hint,
  };
}

export function summarizeCustomer(
  customer: Customer,
  transactions: Transaction[],
  now = new Date()
): CustomerSummary {
  const rows = computeLedgerRows(transactions);
  const balance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;

  let totalGiven = 0;
  let totalReceived = 0;
  for (const r of rows) {
    if (r.isReversed || r.reversedTxId) continue;
    if (r.type === 'udhaar') totalGiven += r.amount;
    if (r.type === 'wapis') totalReceived += r.amount;
  }

  const lastActivityAt = rows.length > 0 ? rows[rows.length - 1].occurredAt : null;

  // Find oldest unpaid udhaar using FIFO
  const active = rows.filter((r) => !r.isReversed && !r.reversedTxId);
  const openCharges: Array<{ date: string; remaining: number }> = [];
  for (const tx of active) {
    if (tx.type === 'udhaar') {
      openCharges.push({ date: tx.occurredAt, remaining: tx.amount });
    } else if (tx.type === 'wapis' || (tx.type === 'adjustment' && tx.signedAmount < 0)) {
      let left = Math.abs(tx.signedAmount);
      while (left > 0 && openCharges.length > 0) {
        const head = openCharges[0];
        const applied = Math.min(head.remaining, left);
        head.remaining -= applied;
        left -= applied;
        if (head.remaining === 0) openCharges.shift();
      }
    }
  }

  const dueDays = customer.dueDays ?? 14;
  const todayIso = now.toISOString().slice(0, 10);
  const oldestUnpaidAt = balance > 0 && openCharges.length > 0 ? openCharges[0].date : null;
  const daysSinceOldestUnpaid = oldestUnpaidAt ? Math.max(0, daysBetween(oldestUnpaidAt, todayIso)) : 0;

  let dueStatusLabel = 'All clear';
  let needsReminder = false;
  let urgencyScore = 0;

  if (balance > 0) {
    const overdueBy = daysSinceOldestUnpaid - dueDays;
    if (overdueBy > 0) {
      dueStatusLabel = `Due ${overdueBy} ${overdueBy === 1 ? 'day' : 'days'} ago`;
      needsReminder = true;
      urgencyScore = 1_000_000 + overdueBy * 10_000 + balance;
    } else if (overdueBy === 0) {
      dueStatusLabel = 'Due today';
      needsReminder = true;
      urgencyScore = 500_000 + balance;
    } else {
      const daysLeft = Math.abs(overdueBy);
      dueStatusLabel = `Due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
      needsReminder = false;
      urgencyScore = (100 - daysLeft) * 1000 + balance;
    }
  }

  return {
    customer,
    balance,
    totalGiven,
    totalReceived,
    lastActivityAt,
    oldestUnpaidAt,
    daysSinceOldestUnpaid,
    dueStatusLabel,
    needsReminder,
    urgencyScore,
    paymentPattern: computePaymentPattern(transactions, dueDays),
  };
}

export function sortCustomersByReminderPriority(summaries: CustomerSummary[]): CustomerSummary[] {
  return [...summaries].sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore;
    if (b.balance !== a.balance) return b.balance - a.balance;
    return a.customer.name.localeCompare(b.customer.name);
  });
}

export function summarizeShop(
  shopMeta: { shopName: string; location: string },
  summaries: CustomerSummary[]
): ShopSummary {
  let totalToCollect = 0;
  let totalGiven = 0;
  let totalReceived = 0;
  let needsReminderCount = 0;

  for (const s of summaries) {
    if (s.balance > 0) totalToCollect += s.balance;
    totalGiven += s.totalGiven;
    totalReceived += s.totalReceived;
    if (s.needsReminder) needsReminderCount += 1;
  }

  return {
    shopName: shopMeta.shopName,
    location: shopMeta.location,
    totalToCollect,
    totalGiven,
    totalReceived,
    customerCount: summaries.length,
    needsReminderCount,
  };
}

export function formatRs(amount: number): string {
  const abs = Math.abs(Math.trunc(amount));
  const formatted = abs.toLocaleString('en-US');
  return amount < 0 ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function formatAmountPlain(amount: number): string {
  return Math.trunc(amount).toLocaleString('en-US');
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function customerLedgerToCsv(customer: Customer, rows: LedgerRow[]): string {
  const header = ['Date', 'Customer', 'Note', 'Type', 'Signed Amount (PKR)', 'Running Balance (PKR)', 'Status'].join(',');
  const lines = rows.map((r) =>
    [
      csvEscape(r.occurredAt.slice(0, 10)),
      csvEscape(customer.name),
      csvEscape(r.note),
      csvEscape(r.type),
      String(r.signedAmount),
      String(r.runningBalance),
      csvEscape(r.isReversed ? 'Reversed' : r.reversedTxId ? 'Reversal' : 'Active'),
    ].join(',')
  );
  return [header, ...lines].join('\n');
}
