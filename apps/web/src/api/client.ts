export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  dueDays?: number;
  createdAt: string;
}

export interface CustomerSummary {
  customer: Customer;
  balance: number;
  totalGiven: number;
  totalReceived: number;
  lastActivityAt: string | null;
  oldestUnpaidAt: string | null;
  daysSinceOldestUnpaid: number;
  dueStatusLabel: string;
  needsReminder: boolean;
  urgencyScore: number;
  paymentPattern: {
    dataPoints: number;
    averageDaysLate: number | null;
    hint: string | null;
  };
}

export interface ShopSummary {
  shopName: string;
  location: string;
  totalToCollect: number;
  totalGiven: number;
  totalReceived: number;
  customerCount: number;
  needsReminderCount: number;
}

export interface LedgerRow {
  id: string;
  customerId: string;
  type: 'udhaar' | 'wapis' | 'adjustment';
  amount: number;
  signedAmount: number;
  runningBalance: number;
  isReversed: boolean;
  note: string;
  occurredAt: string;
  createdAt: string;
  reversedTxId?: string | null;
  sourceText?: string | null;
}

export interface ParseResult {
  customer: string | null;
  matchedCustomerId?: string | null;
  customerCandidates?: Array<{ id: string; name: string; score: number }>;
  type: 'udhaar' | 'wapis' | 'adjustment' | null;
  amount: number | null;
  note: string | null;
  date: string | null;
  confidence: number;
  ambiguities: string[];
  currentBalance: number;
  proposedNewBalance: number | null;
  nluProvider: string;
}

export interface ReminderDraft {
  customerId: string;
  customerName: string;
  amount: number;
  lang: 'roman' | 'ur' | 'en';
  tone: 'friendly' | 'polite' | 'firm';
  text: string;
  whatsappUrl: string;
  sent: boolean;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getShop: () => fetchJson<ShopSummary>('/api/shop'),
  getCustomers: () => fetchJson<{ customers: CustomerSummary[] }>('/api/customers'),
  getCustomerLedger: (id: string) =>
    fetchJson<{ customer: Customer; summary: CustomerSummary; rows: LedgerRow[] }>(`/api/customers/${id}`),
  parseSentence: (text: string) =>
    fetchJson<ParseResult>('/api/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  createTransaction: (payload: {
    customerId?: string;
    customerName?: string;
    type: 'udhaar' | 'wapis' | 'adjustment';
    amount: number;
    note?: string;
    occurredAt?: string;
    sourceText?: string;
  }) =>
    fetchJson<{ transaction: LedgerRow; newBalance: number }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  undoTransaction: (id: string, reason?: string) =>
    fetchJson<{ reversingTransaction: LedgerRow; newBalance: number }>(`/api/transactions/${id}/undo`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getReminder: (customerId: string, lang: 'roman' | 'ur' | 'en', tone: 'friendly' | 'polite' | 'firm') =>
    fetchJson<ReminderDraft>(`/api/reminders/${customerId}?lang=${lang}&tone=${tone}`),
  seedDemo: () => fetchJson<{ ok: boolean }>('/api/seed', { method: 'POST', body: '{}' }),
};

export function formatRs(amount: number): string {
  const abs = Math.abs(Math.trunc(amount));
  const formatted = abs.toLocaleString('en-US');
  return amount < 0 ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function formatPlain(amount: number): string {
  return Math.trunc(amount).toLocaleString('en-US');
}
