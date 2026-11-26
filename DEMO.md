# Khata Saathi — 2:30 Demo Script

**Total Runtime:** 2 minutes 30 seconds

---

## 0:00 – 0:20 | The Counter Problem (20s)
- **Visual:** Start on the Landing page (`/`) showing *"Bolo. Khata likh jaye."*
- **Narration:** "Walk into any kiryana store in Pakistan and you'll find a paper *udhaar-khata* register on the counter. At rush hour, shopkeepers don't have time to open spreadsheets or tap through accounting forms. We built **Khata Saathi** so a shopkeeper can update their khata at the speed of a sentence."

## 0:20 – 1:00 | Say a Sentence & Confirm (40s)
- **Visual:** Click **Try it with sample data** → `/app`. Click the quick-try or speak/type `"Ali ko 500 ka udhaar likh do"` and press **Send**.
- **Narration:** "Watch what happens when Rizwan says *'Ali ko 500 ka udhaar likh do'*. Our deterministic Roman Urdu and Urdu parser extracts Ali Raza, Udhaar, and Rs 500 — and computes his new balance of Rs 3,000 in plain integer code, never AI. Notice nothing is saved yet: Rizwan sees a clear read-back card and taps **Confirm**. One tap, saved."

## 1:00 – 1:30 | Balances & Ledger (30s)
- **Visual:** Point to the left customer list sorted by who needs a reminder first, then click **Open Ali's ledger** (`/app/customers/:id`).
- **Narration:** "Customers are automatically sorted by who needs a reminder first. Opening Ali's ledger shows his full append-only history, running balance, and a payment-pattern hint calculated from his past settled cycles — plus one-click CSV export and printable statements."

## 1:30 – 2:00 | Reminder in Urdu (30s)
- **Visual:** On Ali's ledger, click **اردو** and switch tone between **Polite** and **Firm**. Show **Open in WhatsApp** and **Copy text**.
- **Narration:** "Need to follow up? Rizwan switches to Urdu Nastaliq or Roman Urdu, picks Friendly, Polite, or Firm, and gets an exact draft with the current balance. Reminders are drafts only — nothing is ever sent without the shopkeeper's tap."

## 2:00 – 2:20 | Trust & Undo (20s)
- **Visual:** Click **Undo last entry** on Ali's ledger. Show the reversed row staying in history with a strikethrough and the balance returning to Rs 2,500.
- **Narration:** "Made a mistake? Tapping **Undo** never erases history — it appends a reversing adjustment event so the audit trail stays intact and the balance returns to Rs 2,500."

## 2:20 – 2:30 | Architecture, AWS-Ready Adapters & Close (10s)
- **Visual:** Briefly show `GET /health/providers` in browser/terminal and switch to mobile 390px view of `/app`.
- **Narration:** "Everything runs 100% offline of any cloud account on SQLite and local defaults, while 7 port interfaces make swapping in any AWS service a single environment-variable change. Khata Saathi — *Bolo. Khata likh jaye.*"
