import path from 'node:path';
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
  RuleBasedLanguageUnderstanding,
  TemplateTranslator,
  WebSpeechFallbackStt,
  WhatsAppLinkNotifier,
  type FileStore,
  type LanguageUnderstanding,
  type Notifier,
  type Ocr,
  type ProviderHealth,
  type SpeechToText,
  type Storage,
  type Translator,
} from '@khata-saathi/core';
import { LocalDiskFileStore } from './adapters/disk-filestore.js';
import { SqliteStorage } from './adapters/sqlite-storage.js';

export interface ProviderRegistry {
  stt: SpeechToText;
  nlu: LanguageUnderstanding;
  storage: Storage;
  fileStore: FileStore;
  notifier: Notifier;
  translator: Translator;
  ocr: Ocr;
  health(): ProviderHealth[];
}

export function createProviders(env: NodeJS.ProcessEnv = process.env): ProviderRegistry {
  const sttMode = env.STT_PROVIDER || 'local';
  const nluMode = env.NLU_PROVIDER || 'local';
  const storageMode = env.STORAGE_PROVIDER || 'sqlite';
  const fileStoreMode = env.FILESTORE_PROVIDER || 'local';
  const notifierMode = env.NOTIFIER_PROVIDER || 'whatsapp';
  const translatorMode = env.TRANSLATOR_PROVIDER || 'template';
  const ocrMode = env.OCR_PROVIDER || 'none';

  const stt: SpeechToText =
    sttMode === 'aws-transcribe' ? new AwsTranscribeSttStub() : new WebSpeechFallbackStt();

  const nlu: LanguageUnderstanding =
    nluMode === 'aws-bedrock'
      ? new AwsBedrockNluStub()
      : nluMode === 'aws-comprehend'
        ? new AwsComprehendNluStub()
        : new RuleBasedLanguageUnderstanding();

  const dbPath = env.SQLITE_PATH || path.resolve(process.cwd(), 'storage/khata.db');
  const storage: Storage =
    storageMode === 'aws-dynamodb' ? new AwsDynamoDbStorageStub() : new SqliteStorage(dbPath);

  const filesDir = env.FILESTORE_DIR || path.resolve(process.cwd(), 'storage/files');
  const fileStore: FileStore =
    fileStoreMode === 'aws-s3' ? new AwsS3FileStoreStub() : new LocalDiskFileStore(filesDir);

  const notifier: Notifier =
    notifierMode === 'aws-sns' ? new AwsSnsNotifierStub() : new WhatsAppLinkNotifier();

  const translator: Translator =
    translatorMode === 'aws-translate' ? new AwsTranslateStub() : new TemplateTranslator();

  const ocr: Ocr =
    ocrMode === 'aws-textract' ? new AwsTextractOcrStub() : new DisabledOcr();

  return {
    stt,
    nlu,
    storage,
    fileStore,
    notifier,
    translator,
    ocr,
    health(): ProviderHealth[] {
      return [
        {
          slot: 'SpeechToText',
          active: stt.providerName,
          isStub: stt.isStub,
          awsSlot: 'AWS Transcribe',
          envVar: 'STT_PROVIDER',
        },
        {
          slot: 'LanguageUnderstanding',
          active: nlu.providerName,
          isStub: nlu.isStub,
          awsSlot: 'Amazon Bedrock / Comprehend',
          envVar: 'NLU_PROVIDER',
        },
        {
          slot: 'Storage',
          active: storage.providerName,
          isStub: storage.isStub,
          awsSlot: 'Amazon DynamoDB / RDS',
          envVar: 'STORAGE_PROVIDER',
        },
        {
          slot: 'FileStore',
          active: fileStore.providerName,
          isStub: fileStore.isStub,
          awsSlot: 'Amazon S3',
          envVar: 'FILESTORE_PROVIDER',
        },
        {
          slot: 'Notifier',
          active: notifier.providerName,
          isStub: notifier.isStub,
          awsSlot: 'Amazon SNS / SES',
          envVar: 'NOTIFIER_PROVIDER',
        },
        {
          slot: 'Translator',
          active: translator.providerName,
          isStub: translator.isStub,
          awsSlot: 'Amazon Translate',
          envVar: 'TRANSLATOR_PROVIDER',
        },
        {
          slot: 'Ocr',
          active: ocr.providerName,
          isStub: ocr.isStub,
          awsSlot: 'Amazon Textract',
          envVar: 'OCR_PROVIDER',
        },
      ];
    },
  };
}
