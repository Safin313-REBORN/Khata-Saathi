# Khata Saathi — Devpost Submission

## Project Name
**Khata Saathi** (کھاتہ ساتھی) — *Bolo. Khata likh jaye.*

## Track
Everyday Productivity & Automation (also fits Social Impact)

## Inspiration
Walk into any kiryana store, tailor shop, or neighborhood business in Pakistan and you will see a dog-eared paper *udhaar-khata* register on the counter. Shopkeepers are busy serving customers; they don't have time to tap through multi-column accounting forms, and asking regular customers for overdue money feels awkward.

## What It Does
Khata Saathi lets a shopkeeper speak or type a natural Urdu / Roman Urdu sentence — `"Ali ko 500 ka udhaar likh do"` — and immediately turns it into a confirmed ledger entry:
- **Voice & Text Entry:** Browser Web Speech API (`ur-PK` / `en-IN`) with instant typed fallback.
- **Always-Confirm Read-Back:** Shows Customer, Type (`Udhaar` / `Wapis`), Amount, and New Balance. Nothing is saved until the shopkeeper taps **Confirm**.
- **Deterministic Integer Ledger:** Money is stored as integer rupees in an append-only `transactions` table. Undoing an entry appends a reversing event so history is never lost.
- **Polite Reminders:** Drafts messages in Roman Urdu, Urdu (Nastaliq), or English across Friendly, Polite, and Firm tones, with one-tap **Open in WhatsApp** (`wa.me`) and **Copy text**.
- **Payment-Pattern Hint & Exports:** Estimates average payment lateness once 3+ settled cycles exist, and exports CSV or printable customer statements.

## How We Built It
- **Monorepo:** pnpm workspaces (`packages/core`, `apps/api`, `apps/web`).
- **Core Domain (`packages/core`):** Pure TypeScript deterministic Roman Urdu/Urdu parser, integer-only ledger maths, and 7 port interfaces (`SpeechToText`, `LanguageUnderstanding`, `Storage`, `FileStore`, `Notifier`, `Translator`, `Ocr`) with local defaults and env-swappable AWS adapter stubs.
- **Backend (`apps/api`):** Fastify + Zod + SQLite (`better-sqlite3`) + `/health/providers` endpoint.
- **Frontend (`apps/web`):** React + Vite + TypeScript + React Router + offline-capable PWA.

## Challenges We Ran Into
- Handling mixed Roman Urdu, Urdu script (`کو/نے`), Urdu digits (`۰-۹`), and fractional idioms (`dhai sau`, `dedh hazaar`, `saade teen sau`) deterministically without relying on cloud LLMs.
- Designing a 390px mobile-first counter UI with >= 48px tap targets, RTL-safe Nastaliq Urdu rendering, and zero horizontal scroll.

## What's Next
- Integrating an on-demand AWS service adapter (Bedrock, Transcribe, Textract, DynamoDB, S3, SNS, or Translate) behind our existing port interfaces.
