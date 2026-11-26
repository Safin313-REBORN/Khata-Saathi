# Khata Saathi (کھاتہ ساتھی)

**Bolo. Khata likh jaye.**
A voice- and text-first *udhaar-khata* ledger assistant for small shopkeepers in Pakistan (kiryana stores, tailors, tutors, and home businesses).

Built for **National Hackathon 2026 (Pakistan)** — Track: *Everyday Productivity & Automation* (also fits *Social Impact*).

**Live Demo:** https://khata-saathi-five.vercel.app
**GitHub Repo:** https://github.com/Safin313-REBORN/Khata-Saathi

---

## The Problem

Millions of small shopkeepers in Pakistan still track customer credit (*udhaar*) in paper registers. At a busy counter, flipping pages to add Rs 500 or check who owes what wastes time, leads to calculation mistakes, and makes following up on overdue balances awkward.

## The Solution

1. **Bolo (Say or type naturally):** `"Ali ko 500 ka udhaar likh do"` or `"Sara ne 400 wapis kiye"` in Roman Urdu, Urdu script, or mixed English.
2. **Check (Read-back & Confirm):** Nothing is saved until the shopkeeper taps **Confirm**. The read-back shows Customer, Type, Amount, and the new balance.
3. **Yaad dihani (Polite reminders):** Ready-to-send payment reminder drafts in **Roman Urdu**, **Urdu (Nastaliq)**, or **English** across **Friendly**, **Polite**, and **Firm** tones — with one-tap **Open in WhatsApp** (`wa.me`) or **Copy text**. Nothing is ever sent automatically.

---

## Quick Start (One Command, Zero Cloud Account Needed)

### Prerequisites
- Node.js 20+
- pnpm 9+

### Run locally
```bash
pnpm install
pnpm build
pnpm start
```
Then open `http://localhost:3001` in your browser.

For development with hot reload (API on `:3001`, Web on `:5173`):
```bash
pnpm dev
```

### Run tests
```bash
pnpm test        # Vitest: 62 parser tests, ledger maths, adapters, API integration
pnpm test:e2e    # Playwright smoke test (desktop + 390px mobile overflow check)
```

---

## Architecture (Ports & Adapters)

Khata Saathi separates deterministic domain logic (`packages/core`) from external providers behind 7 typed port interfaces (`SpeechToText`, `LanguageUnderstanding`, `Storage`, `FileStore`, `Notifier`, `Translator`, `Ocr`). Every slot defaults to a local offline-capable implementation and can be swapped to AWS via environment variables.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the Mermaid diagram and [docs/AWS_ADAPTERS.md](docs/AWS_ADAPTERS.md) for the 20-minute integration checklist per AWS service.

Check active providers at `GET /health/providers`.

---

## Parser Approach & Honest Accuracy

- **Approach:** Deterministic rule-based parser (`packages/core/src/parser.ts`) supporting Roman Urdu, Urdu script (`کو`, `نے`, `ادھار`, `واپس`), Urdu digits (`۰-۹`), number words (`paanch sau`, `ek hazaar`, `dhai sau`, `dedh hazaar`, `saade teen sau`), date words (`aaj`, `kal`, `parso`), grammar cues (`ne ... diye` vs `ko ... diya`), and Damerau-Levenshtein fuzzy customer matching.
- **Test set:** 62 test cases in `packages/core/test/parser.test.ts` covering Roman Urdu, Urdu script, mixed sentences, number words, typos, date words, and ambiguous/incomplete inputs.
- **Reported accuracy:** **60 / 60** expected extractions pass on the curated 60-sentence benchmark (**100%** on the current test suite), plus explicit ambiguity detection tests.
- **Honest limitations of rule-based parsing:** Novel slang, multi-item itemized bills in one sentence (e.g. `"200 ka atta aur 300 ki chini"`), or unfamiliar Urdu-script customer names without `کو/نے` particles can lower confidence — which is why the UI always routes low-confidence or ambiguous parses to the **Edit / Clarify** step and never guesses an amount.

---

## Open-Source Libraries, Frameworks & APIs Used

- **Frontend:** React 19, Vite 6, React Router 7, TypeScript 5
- **Backend:** Fastify 5, `@fastify/cors`, `@fastify/static`, Zod 3, `better-sqlite3`
- **Testing:** Vitest 3, Playwright
- **Browser APIs:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `ur-PK` / `en-IN`), Service Worker + Web App Manifest (PWA), Clipboard API
- **Fonts:** Google Fonts (`Young Serif`, `Figtree`, `IBM Plex Mono`, `Noto Nastaliq Urdu`)

---

## AI Tools Used

- Built with assistance from **Antigravity (Google Deepmind coding assistant)** for scaffolding, TypeScript implementation, test authoring, and documentation.

---

## Limitations & Future Work

- **Limitations:** Web Speech API recognition accuracy depends on browser support (best in Chrome/Edge; typed fallback always works). Single-shop local SQLite by default.
- **Future Work:** Optional AWS Bedrock NLU fallback for complex multi-item sentences, Amazon Textract import for photos of handwritten khata pages, and multi-user shop sync.

---

## License

MIT — see [LICENSE](LICENSE).
