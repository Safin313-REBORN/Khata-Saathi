# AWS Adapter Integration Guide

Khata Saathi defines 7 port interfaces in `packages/core/src/ports.ts`. Each port has a working local default (requiring no cloud account) and a clearly marked AWS stub in `packages/core/src/adapters/aws-stubs.ts`.

You can inspect active providers at any time via `GET /health/providers`.

## Adapter Matrix

| Port Interface | Env Var | Local Default | AWS Finale Slot | Stub Location |
|---|---|---|---|---|
| `SpeechToText` | `STT_PROVIDER` | `web-speech-fallback` | AWS Transcribe | `packages/core/src/adapters/aws-stubs.ts` |
| `LanguageUnderstanding` | `NLU_PROVIDER` | `rule-based-urdu-parser` | Amazon Bedrock / Comprehend | `packages/core/src/adapters/aws-stubs.ts` |
| `Storage` | `STORAGE_PROVIDER` | `sqlite` | Amazon DynamoDB / RDS | `packages/core/src/adapters/aws-stubs.ts` |
| `FileStore` | `FILESTORE_PROVIDER` | `local-disk` | Amazon S3 | `packages/core/src/adapters/aws-stubs.ts` |
| `Notifier` | `NOTIFIER_PROVIDER` | `whatsapp-link-draft` | Amazon SNS / SES | `packages/core/src/adapters/aws-stubs.ts` |
| `Translator` | `TRANSLATOR_PROVIDER` | `template-translator` | Amazon Translate | `packages/core/src/adapters/aws-stubs.ts` |
| `Ocr` | `OCR_PROVIDER` | `none` | Amazon Textract | `packages/core/src/adapters/aws-stubs.ts` |

---

## 20-Minute Integration Checklists

### 1. `SpeechToText` → AWS Transcribe (`STT_PROVIDER=aws-transcribe`)
- **Interface**: `SpeechToText` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-transcribe.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-transcribe-streaming` (or `@aws-sdk/client-transcribe`).
  2. Implement `transcribe(input)` sending audio bytes with `LanguageCode: input.languageCode ?? 'ur-PK'`.
  3. Wire `case 'aws-transcribe'` in `apps/api/src/providers.ts`.
  4. Verify `GET /health/providers` reports `isStub: false`.

### 2. `LanguageUnderstanding` → Amazon Bedrock / Comprehend (`NLU_PROVIDER=aws-bedrock`)
- **Interface**: `LanguageUnderstanding` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-bedrock.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-bedrock-runtime`.
  2. Run `parseKhataSentence` first; only call Bedrock Converse API when `confidence < 0.75`.
  3. Validate the returned JSON with Zod so `amount` is an integer and `type` is `udhaar | wapis`. The UI **Confirm** step still applies.
  4. Wire in `apps/api/src/providers.ts`.

### 3. `Storage` → Amazon DynamoDB / RDS (`STORAGE_PROVIDER=aws-dynamodb`)
- **Interface**: `Storage` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-dynamodb.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`.
  2. Create tables `khata_customers` (PK: `id`) and `khata_transactions` (PK: `customerId`, SK: `occurredAt#id`).
  3. Implement `listCustomers`, `appendTransaction`, etc. keeping `transactions` append-only.
  4. Wire in `apps/api/src/providers.ts`.

### 4. `FileStore` → Amazon S3 (`FILESTORE_PROVIDER=aws-s3`)
- **Interface**: `FileStore` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-s3.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-s3`.
  2. Implement `saveFile` (`PutObjectCommand`) and `readFile` (`GetObjectCommand`) targeting `process.env.S3_BUCKET`.
  3. Wire in `apps/api/src/providers.ts` so CSV exports upload to S3 automatically.

### 5. `Notifier` → Amazon SNS / SES (`NOTIFIER_PROVIDER=aws-sns`)
- **Interface**: `Notifier` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-sns.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-sns`.
  2. Keep `prepareNotification` returning a draft (`sent: false`) by default; only call `PublishCommand` when the user explicitly confirms sending an SMS.
  3. Wire in `apps/api/src/providers.ts`.

### 6. `Translator` → Amazon Translate (`TRANSLATOR_PROVIDER=aws-translate`)
- **Interface**: `Translator` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-translate.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-translate`.
  2. Format the exact `Rs <amount>` in code first, then call `TranslateTextCommand` (`TargetLanguageCode: 'ur'`) and verify the numeric amount is preserved.
  3. Wire in `apps/api/src/providers.ts`.

### 7. `Ocr` → Amazon Textract (`OCR_PROVIDER=aws-textract`)
- **Interface**: `Ocr` in `packages/core/src/ports.ts`
- **Where to add**: `apps/api/src/adapters/aws-textract.ts`
- **Checklist**:
  1. `pnpm --filter @khata-saathi/api add @aws-sdk/client-textract`.
  2. Call `DetectDocumentTextCommand` on `Buffer.from(imageBase64, 'base64')` and pass each extracted `LINE` through `parseKhataSentence`.
  3. Wire in `apps/api/src/providers.ts`.
