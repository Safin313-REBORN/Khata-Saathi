import type {
  Customer,
  ParsedEntry,
  ReminderLanguage,
  ReminderTone,
  Transaction,
} from './types.js';

export interface SpeechToTextInput {
  audioBase64?: string;
  mimeType?: string;
  languageCode?: 'ur-PK' | 'en-IN' | 'en-US';
  fallbackText?: string;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  languageCode: string;
  provider: string;
}

export interface SpeechToText {
  readonly providerName: string;
  readonly isStub: boolean;
  transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult>;
}

export interface LanguageUnderstandingContext {
  customers: Customer[];
  referenceDate?: Date;
}

export interface LanguageUnderstanding {
  readonly providerName: string;
  readonly isStub: boolean;
  parse(text: string, context: LanguageUnderstandingContext): Promise<ParsedEntry>;
}

export interface Storage {
  readonly providerName: string;
  readonly isStub: boolean;
  getShopMeta(): Promise<{ shopName: string; location: string }>;
  listCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(input: { name: string; phone?: string | null; dueDays?: number }): Promise<Customer>;
  listTransactions(customerId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | null>;
  appendTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  clearAll(): Promise<void>;
}

export interface FileStore {
  readonly providerName: string;
  readonly isStub: boolean;
  saveFile(key: string, content: Uint8Array | string, contentType: string): Promise<{ key: string; location: string }>;
  readFile(key: string): Promise<Uint8Array | null>;
}

export interface NotificationDraftInput {
  recipientName: string;
  phone?: string | null;
  message: string;
}

export interface NotificationDraftResult {
  channel: 'whatsapp-link' | 'sns' | 'ses';
  whatsappUrl: string;
  copyText: string;
  sent: boolean;
  provider: string;
}

export interface Notifier {
  readonly providerName: string;
  readonly isStub: boolean;
  prepareNotification(input: NotificationDraftInput): Promise<NotificationDraftResult>;
}

export interface TranslateReminderInput {
  customerName: string;
  amount: number;
  shopName: string;
  lang: ReminderLanguage;
  tone: ReminderTone;
}

export interface Translator {
  readonly providerName: string;
  readonly isStub: boolean;
  draftReminder(input: TranslateReminderInput): Promise<string>;
}

export interface OcrExtractedLine {
  rawText: string;
  parsed?: ParsedEntry;
}

export interface OcrResult {
  lines: OcrExtractedLine[];
  provider: string;
}

export interface Ocr {
  readonly providerName: string;
  readonly isStub: boolean;
  extractLedgerLines(imageBase64: string, context: LanguageUnderstandingContext): Promise<OcrResult>;
}
