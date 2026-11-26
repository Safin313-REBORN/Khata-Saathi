import { describe, expect, it } from 'vitest';
import {
  AwsBedrockNluStub,
  AwsComprehendNluStub,
  AwsDynamoDbStorageStub,
  AwsS3FileStoreStub,
  AwsSnsNotifierStub,
  AwsTextractOcrStub,
  AwsTranscribeSttStub,
  AwsTranslateStub,
  DisabledOcr,
  InMemoryFileStore,
  RuleBasedLanguageUnderstanding,
  TemplateTranslator,
  WebSpeechFallbackStt,
  WhatsAppLinkNotifier,
} from '../src/index.js';

describe('Ports and adapters (local defaults + AWS stubs)', () => {
  it('local adapters work offline with no cloud account', async () => {
    const stt = new WebSpeechFallbackStt();
    expect(stt.isStub).toBe(false);
    const transcript = await stt.transcribe({ fallbackText: 'Ali ko 500 ka udhaar likh do' });
    expect(transcript.transcript).toBe('Ali ko 500 ka udhaar likh do');

    const nlu = new RuleBasedLanguageUnderstanding();
    const parsed = await nlu.parse(transcript.transcript, { customers: [] });
    expect(parsed.amount).toBe(500);

    const fs = new InMemoryFileStore();
    const saved = await fs.saveFile('test.csv', 'a,b\n1,2', 'text/csv');
    const raw = await fs.readFile(saved.key);
    expect(new TextDecoder().decode(raw!)).toBe('a,b\n1,2');

    const translator = new TemplateTranslator();
    const urMsg = await translator.draftReminder({
      customerName: 'Ali Raza',
      amount: 2500,
      shopName: 'Rizwan General Store',
      lang: 'ur',
      tone: 'polite',
    });
    expect(urMsg).toContain('Rs 2,500');

    const notifier = new WhatsAppLinkNotifier();
    const draft = await notifier.prepareNotification({
      recipientName: 'Ali Raza',
      phone: '923001112233',
      message: urMsg,
    });
    expect(draft.sent).toBe(false);
    expect(draft.whatsappUrl).toContain('https://wa.me/923001112233?text=');

    const ocr = new DisabledOcr();
    expect((await ocr.extractLedgerLines()).lines).toEqual([]);
  });

  it('all AWS adapter stubs implement their port contracts and mark isStub=true', async () => {
    const stt = new AwsTranscribeSttStub();
    const bedrock = new AwsBedrockNluStub();
    const comprehend = new AwsComprehendNluStub();
    const ddb = new AwsDynamoDbStorageStub();
    const s3 = new AwsS3FileStoreStub();
    const sns = new AwsSnsNotifierStub();
    const translate = new AwsTranslateStub();
    const textract = new AwsTextractOcrStub();

    for (const adapter of [stt, bedrock, comprehend, ddb, s3, sns, translate, textract]) {
      expect(adapter.isStub).toBe(true);
    }

    const cust = await ddb.createCustomer({ name: 'Ali Raza' });
    await ddb.appendTransaction({
      customerId: cust.id,
      type: 'udhaar',
      amount: 500,
      note: 'Test',
      occurredAt: '2026-11-27',
    });
    expect(await ddb.listTransactions(cust.id)).toHaveLength(1);

    const ocrRes = await textract.extractLedgerLines('base64', { customers: [cust] });
    expect(ocrRes.lines.length).toBeGreaterThan(0);
    expect(ocrRes.lines[0].parsed?.amount).toBe(500);
  });
});
