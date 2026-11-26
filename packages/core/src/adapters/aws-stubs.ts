/**
 * AWS Adapter Stubs for National Hackathon 2026 Finale.
 *
 * Each class below is a clearly marked STUB implementing its corresponding
 * port interface in packages/core/src/ports.ts.
 *
 * Swapping any adapter requires only setting the corresponding env var
 * (see docs/AWS_ADAPTERS.md for the 20-minute integration checklist per slot).
 */

import { formatRs } from '../ledger.js';
import { parseKhataSentence } from '../parser.js';
import type {
  FileStore,
  LanguageUnderstanding,
  LanguageUnderstandingContext,
  NotificationDraftInput,
  NotificationDraftResult,
  Notifier,
  Ocr,
  OcrResult,
  SpeechToText,
  SpeechToTextInput,
  SpeechToTextResult,
  Storage,
  TranslateReminderInput,
  Translator,
} from '../ports.js';
import type { Customer, ParsedEntry, Transaction } from '../types.js';

export class AwsTranscribeSttStub implements SpeechToText {
  readonly providerName = 'aws-transcribe-stub';
  readonly isStub = true;

  async transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    return {
      transcript: input.fallbackText?.trim() || 'Ali ko 500 ka udhaar likh do',
      confidence: 0.9,
      languageCode: input.languageCode ?? 'ur-PK',
      provider: this.providerName,
    };
  }
}

export class AwsBedrockNluStub implements LanguageUnderstanding {
  readonly providerName = 'aws-bedrock-stub';
  readonly isStub = true;

  async parse(text: string, context: LanguageUnderstandingContext): Promise<ParsedEntry> {
    // Stub: delegates to deterministic parser; real adapter calls Bedrock Converse API
    // and passes the proposed JSON through the same validator + Confirm step.
    return parseKhataSentence(text, context.customers, context.referenceDate);
  }
}

export class AwsComprehendNluStub implements LanguageUnderstanding {
  readonly providerName = 'aws-comprehend-stub';
  readonly isStub = true;

  async parse(text: string, context: LanguageUnderstandingContext): Promise<ParsedEntry> {
    return parseKhataSentence(text, context.customers, context.referenceDate);
  }
}

export class AwsDynamoDbStorageStub implements Storage {
  readonly providerName = 'aws-dynamodb-stub';
  readonly isStub = true;
  private customers: Customer[] = [];
  private transactions: Transaction[] = [];
  private seq = 1;

  async getShopMeta() {
    return { shopName: 'Rizwan General Store', location: 'Sahiwal' };
  }

  async listCustomers() {
    return [...this.customers];
  }

  async getCustomer(id: string) {
    return this.customers.find((c) => c.id === id) ?? null;
  }

  async createCustomer(input: { name: string; phone?: string | null; dueDays?: number }) {
    const c: Customer = {
      id: `ddb-cust-${this.seq++}`,
      name: input.name,
      phone: input.phone ?? null,
      dueDays: input.dueDays ?? 14,
      createdAt: new Date().toISOString(),
    };
    this.customers.push(c);
    return c;
  }

  async listTransactions(customerId?: string) {
    return customerId
      ? this.transactions.filter((t) => t.customerId === customerId)
      : [...this.transactions];
  }

  async getTransaction(id: string) {
    return this.transactions.find((t) => t.id === id) ?? null;
  }

  async appendTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    const record: Transaction = {
      ...tx,
      id: `ddb-tx-${this.seq++}`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.push(record);
    return record;
  }

  async clearAll() {
    this.customers = [];
    this.transactions = [];
  }
}

export class AwsS3FileStoreStub implements FileStore {
  readonly providerName = 'aws-s3-stub';
  readonly isStub = true;
  private objects = new Map<string, Uint8Array>();

  async saveFile(key: string, content: Uint8Array | string) {
    const buf = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    this.objects.set(key, buf);
    return { key, location: `s3://khata-saathi-stub/${key}` };
  }

  async readFile(key: string) {
    return this.objects.get(key) ?? null;
  }
}

export class AwsSnsNotifierStub implements Notifier {
  readonly providerName = 'aws-sns-stub';
  readonly isStub = true;

  async prepareNotification(input: NotificationDraftInput): Promise<NotificationDraftResult> {
    const cleanPhone = (input.phone ?? '').replace(/[^\d]/g, '');
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(input.message)}`
      : `https://wa.me/?text=${encodeURIComponent(input.message)}`;

    return {
      channel: 'sns',
      whatsappUrl,
      copyText: input.message,
      sent: false, // Draft mode; real SNS publish only on explicit user action
      provider: this.providerName,
    };
  }
}

export class AwsTranslateStub implements Translator {
  readonly providerName = 'aws-translate-stub';
  readonly isStub = true;

  async draftReminder(input: TranslateReminderInput): Promise<string> {
    const amt = formatRs(input.amount);
    return `[AWS Translate Stub:${input.lang}/${input.tone}] Assalam o Alaikum ${input.customerName}, your khata balance is ${amt}. — ${input.shopName}`;
  }
}

export class AwsTextractOcrStub implements Ocr {
  readonly providerName = 'aws-textract-stub';
  readonly isStub = true;

  async extractLedgerLines(
    _imageBase64: string,
    context: LanguageUnderstandingContext
  ): Promise<OcrResult> {
    const sampleLines = [
      'Ali Raza ko 500 ka udhaar',
      'Sara Khan ne 400 wapis kiye',
    ];
    return {
      provider: this.providerName,
      lines: sampleLines.map((rawText) => ({
        rawText,
        parsed: parseKhataSentence(rawText, context.customers, context.referenceDate),
      })),
    };
  }
}
