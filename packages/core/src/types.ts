export type TransactionType = 'udhaar' | 'wapis' | 'adjustment';

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  createdAt: string; // ISO timestamp
  dueDays?: number; // default credit window in days (e.g., 14)
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  /** Integer amount in Pakistani Rupees (no floats). */
  amount: number;
  /** Signed delta for adjustment events (+ increases balance owed, - decreases), or derived for udhaar/wapis. */
  direction?: 1 | -1;
  note: string;
  occurredAt: string; // YYYY-MM-DD or ISO timestamp
  createdAt: string; // ISO timestamp
  reversedTxId?: string | null;
  sourceText?: string | null;
  adjustmentReason?: string | null;
}

export interface LedgerRow extends Transaction {
  signedAmount: number;
  runningBalance: number;
  isReversed: boolean;
}

export interface PaymentPattern {
  dataPoints: number;
  averageDaysLate: number | null;
  hint: string | null;
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
  paymentPattern: PaymentPattern;
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

export interface CustomerCandidate {
  id: string;
  name: string;
  score: number;
}

export interface ParsedEntry {
  customer: string | null;
  matchedCustomerId?: string | null;
  customerCandidates?: CustomerCandidate[];
  type: TransactionType | null;
  amount: number | null;
  note: string | null;
  date: string | null;
  confidence: number;
  ambiguities: string[];
}

export type ReminderLanguage = 'roman' | 'ur' | 'en';
export type ReminderTone = 'friendly' | 'polite' | 'firm';

export interface ReminderDraft {
  customerId: string;
  customerName: string;
  amount: number;
  lang: ReminderLanguage;
  tone: ReminderTone;
  text: string;
  whatsappUrl: string;
}

export interface ProviderHealth {
  slot: string;
  active: string;
  isStub: boolean;
  awsSlot: string;
  envVar: string;
}
