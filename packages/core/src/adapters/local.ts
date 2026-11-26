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
  TranslateReminderInput,
  Translator,
} from '../ports.js';
import type { ParsedEntry } from '../types.js';

export class WebSpeechFallbackStt implements SpeechToText {
  readonly providerName = 'web-speech-fallback';
  readonly isStub = false;

  async transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    if (input.fallbackText && input.fallbackText.trim().length > 0) {
      return {
        transcript: input.fallbackText.trim(),
        confidence: 1,
        languageCode: input.languageCode ?? 'ur-PK',
        provider: this.providerName,
      };
    }
    throw new Error(
      'WebSpeechFallbackStt expects browser Web Speech API transcript or fallbackText. Configure STT_PROVIDER=aws-transcribe for server-side audio transcription.'
    );
  }
}

export class RuleBasedLanguageUnderstanding implements LanguageUnderstanding {
  readonly providerName = 'rule-based-urdu-parser';
  readonly isStub = false;

  async parse(text: string, context: LanguageUnderstandingContext): Promise<ParsedEntry> {
    return parseKhataSentence(text, context.customers, context.referenceDate);
  }
}

export class InMemoryFileStore implements FileStore {
  readonly providerName = 'in-memory-filestore';
  readonly isStub = false;
  private readonly files = new Map<string, Uint8Array>();

  async saveFile(key: string, content: Uint8Array | string): Promise<{ key: string; location: string }> {
    const buf = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    this.files.set(key, buf);
    return { key, location: `memory://${key}` };
  }

  async readFile(key: string): Promise<Uint8Array | null> {
    return this.files.get(key) ?? null;
  }
}

export class WhatsAppLinkNotifier implements Notifier {
  readonly providerName = 'whatsapp-link-draft';
  readonly isStub = false;

  async prepareNotification(input: NotificationDraftInput): Promise<NotificationDraftResult> {
    const cleanPhone = (input.phone ?? '').replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(input.message);
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    // Never auto-send: draft only.
    return {
      channel: 'whatsapp-link',
      whatsappUrl,
      copyText: input.message,
      sent: false,
      provider: this.providerName,
    };
  }
}

export class TemplateTranslator implements Translator {
  readonly providerName = 'template-translator';
  readonly isStub = false;

  async draftReminder(input: TranslateReminderInput): Promise<string> {
    const amt = formatRs(input.amount);
    const firstName = input.customerName.split(/\s+/)[0] || input.customerName;

    if (input.lang === 'ur') {
      switch (input.tone) {
        case 'friendly':
          return `السلام علیکم ${firstName} بھائی، امید ہے آپ خیریت سے ہوں گے۔ آپ کے کھاتے میں ${amt} باقی ہیں۔ جب آسانی ہو بھجوا دیجیے گا۔ شکریہ! — ${input.shopName}`;
        case 'firm':
          return `السلام علیکم ${firstName}، یاددہانی ہے کہ آپ کے کھاتے میں ${amt} واجب الادا ہیں۔ برائے مہربانی جلد ادائیگی کر دیں۔ شکریہ۔ — ${input.shopName}`;
        case 'polite':
        default:
          return `السلام علیکم ${firstName} بھائی، امید ہے آپ خیریت سے ہیں۔ آپ کے کھاتے میں ${amt} باقی ہیں۔ جب سہولت ہو، ادا کر دیں۔ شکریہ۔ — ${input.shopName}`;
      }
    }

    if (input.lang === 'en') {
      switch (input.tone) {
        case 'friendly':
          return `Assalam o Alaikum ${firstName}, hope you're doing well! Just a friendly note that ${amt} is pending on your khata. Please settle whenever convenient. Thank you! — ${input.shopName}`;
        case 'firm':
          return `Assalam o Alaikum ${firstName}, this is a reminder that ${amt} is overdue on your khata account. Kindly arrange payment at your earliest convenience. — ${input.shopName}`;
        case 'polite':
        default:
          return `Assalam o Alaikum ${firstName}, hope you are well. A balance of ${amt} is currently due on your khata. Please pay when convenient. Thank you. — ${input.shopName}`;
      }
    }

    // Default: Roman Urdu
    switch (input.tone) {
      case 'friendly':
        return `Assalam o Alaikum ${firstName} bhai, kya haal hain? Aap ke khate mein ${amt} baqi hain, jab aasani ho bhej dein. Shukriya! — ${input.shopName}`;
      case 'firm':
        return `Assalam o Alaikum ${firstName}, yaad dihani hai ke aap ke khate mein ${amt} wajib-ul-ada hain. Meherbani farma kar jald adaigi kar dein. Shukriya. — ${input.shopName}`;
      case 'polite':
      default:
        return `Assalam o Alaikum ${firstName} bhai, umeed hai aap khairiyat se hain. Aap ke khate mein ${amt} baqi hain. Jab suhoolat ho, ada kar dein. Shukriya. — ${input.shopName}`;
    }
  }
}

export class DisabledOcr implements Ocr {
  readonly providerName = 'none';
  readonly isStub = false;

  async extractLedgerLines(): Promise<OcrResult> {
    return {
      lines: [],
      provider: this.providerName,
    };
  }
}
