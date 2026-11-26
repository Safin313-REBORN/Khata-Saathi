import type { Customer, CustomerCandidate, ParsedEntry, TransactionType } from './types.js';

const URDU_DIGITS: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const NUMBER_WORDS: Record<string, number> = {
  ek: 1, aik: 1, ik: 1, one: 1, 'ایک': 1,
  do: 2, two: 2, 'دو': 2,
  teen: 3, tin: 3, three: 3, 'تین': 3,
  chaar: 4, char: 4, four: 4, 'چار': 4,
  paanch: 5, panch: 5, five: 5, 'پانچ': 5,
  chhe: 6, che: 6, chay: 6, six: 6, 'چھ': 6,
  saat: 7, sat: 7, seven: 7, 'سات': 7,
  aath: 8, ath: 8, eight: 8, 'آٹھ': 8,
  nau: 9, noh: 9, nine: 9, 'نو': 9,
  das: 10, ten: 10, 'دس': 10,
  gyarah: 11, eleven: 11, 'گیارہ': 11,
  barah: 12, twelve: 12, 'بارہ': 12,
  terah: 13, thirteen: 13, 'تیرہ': 13,
  chaudah: 14, fourteen: 14, 'چودہ': 14,
  pandrah: 15, fifteen: 15, 'پندرہ': 15,
  solah: 16, sixteen: 16, 'سولہ': 16,
  satrah: 17, seventeen: 17, 'سترہ': 17,
  atharah: 18, eighteen: 18, 'اٹھارہ': 18,
  unnees: 19, nineteen: 19, 'انیس': 19,
  bees: 20, bis: 20, twenty: 20, 'بیس': 20,
  pachees: 25, pachis: 25, 'پچیس': 25,
  tees: 30, tis: 30, thirty: 30, 'تیس': 30,
  chalees: 40, chalis: 40, forty: 40, 'چالیس': 40,
  pachaas: 50, pachas: 50, fifty: 50, 'پچاس': 50,
  saath: 60, sath: 60, sixty: 60, 'ساٹھ': 60,
  sattar: 70, seventy: 70, 'ستر': 70,
  assi: 80, eighty: 80, 'اسی': 80,
  nabbay: 90, nawwe: 90, ninety: 90, 'نوے': 90,
};

const FRACTION_WORDS: Record<string, number> = {
  dedh: 1.5, derh: 1.5, 'ڈیڑھ': 1.5,
  dhai: 2.5, dhaii: 2.5, 'ڈھائی': 2.5,
};

const SAADE_WORDS = new Set(['saade', 'sadhe', 'saaray', 'sare', 'ساڑھے']);
const HUNDRED_WORDS = new Set(['sau', 'so', 'hundred', 'سو']);
const THOUSAND_WORDS = new Set(['hazaar', 'hazar', 'hazaaron', 'thousand', 'k', 'ہزار']);
const LAKH_WORDS = new Set(['lakh', 'lac', 'لاکھ']);

const WAPIS_KEYWORDS = [
  'wapis', 'wapas', 'waapis', 'waapas', 'ada', 'jama', 'return', 'returned',
  'paid', 'received', 'wusul', 'vasool', 'bheje', 'bheja', 'lauta', 'lautaye',
  'واپس', 'جمع', 'ادا', 'وصول', 'بھیجے', 'لوٹائے',
];

const UDHAAR_KEYWORDS = [
  'udhaar', 'udhar', 'udhaarh', 'credit', 'likh', 'likho', 'likhdo',
  'saman', 'saaman', 'khata', 'baqi', 'baki', 'liya', 'liye', 'le gaya', 'le gayi',
  'ادھار', 'لکھ', 'لکھو', 'سامان', 'لیا', 'لیے', 'باقی', 'کھاتہ',
];

const STOP_WORDS = new Set([
  'ko', 'ka', 'ki', 'ke', 'ne', 'se', 'mein', 'me', 'par', 'pe', 'per', 'aur',
  'likh', 'do', 'dein', 'dena', 'kar', 'karo', 'diye', 'diya', 'di', 'liye', 'liya',
  'kiye', 'kiya', 'gaya', 'gayi', 'hai', 'hain', 'tha', 'thi', 'the',
  'rs', 'rupay', 'rupee', 'rupees', 'pkr', 'rp', 'paisa', 'paise',
  'udhaar', 'udhar', 'wapis', 'wapas', 'waapis', 'ada', 'jama', 'return', 'returned', 'paid', 'received',
  'aaj', 'kal', 'parso', 'parson', 'today', 'yesterday',
  'bhai', 'sahab', 'sahib', 'ji', 'madam', 'baji',
  'کو', 'کا', 'کی', 'کے', 'نے', 'سے', 'میں', 'پر', 'اور',
  'لکھ', 'دو', 'دیں', 'دیا', 'دیے', 'لیا', 'لیے', 'کیا', 'کیے', 'واپس', 'ادھار', 'جمع', 'روپے',
  'آج', 'کل', 'پرسوں',
]);

export function normalizeDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => URDU_DIGITS[ch] ?? ch);
}

function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function similarityScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!q || !t) return 0;
  if (q === t) return 1;
  const tTokens = t.split(/\s+/);
  if (tTokens[0] === q) return 0.92;
  if (t.startsWith(q) && q.length >= 3) return 0.85;
  const firstDist = damerauLevenshtein(q, tTokens[0]);
  const fullDist = damerauLevenshtein(q, t);
  const firstScore = 1 - firstDist / Math.max(q.length, tTokens[0].length);
  const fullScore = 1 - fullDist / Math.max(q.length, t.length);
  return Math.max(firstScore * 0.9, fullScore);
}

function extractAmount(normalized: string): { amount: number | null; matchedSpan: string | null } {
  // 1. Check numeric + multiplier like "2 hazaar", "1.5 hazaar", "5 sau", "2k"
  const numMultMatch = normalized.match(/\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|hazaar|hazar|ہزار|sau|so|سو|lakh|lac|لاکھ)\b/i);
  if (numMultMatch) {
    const base = parseFloat(numMultMatch[1].replace(/,/g, ''));
    const unit = numMultMatch[2].toLowerCase();
    let mult = 1;
    if (THOUSAND_WORDS.has(unit)) mult = 1000;
    else if (HUNDRED_WORDS.has(unit)) mult = 100;
    else if (LAKH_WORDS.has(unit)) mult = 100000;
    const val = Math.round(base * mult);
    if (val > 0) return { amount: val, matchedSpan: numMultMatch[0] };
  }

  // 2. Check Urdu/Roman number words sequence
  const tokens = normalized
    .replace(/[،,۔.!?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let bestWordAmount: number | null = null;
  let bestSpanTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    let total = 0;
    let current = 0;
    let j = i;
    let consumed = false;

    while (j < tokens.length) {
      const tok = tokens[j].toLowerCase();
      if (SAADE_WORDS.has(tok) && j + 1 < tokens.length) {
        const nextVal = NUMBER_WORDS[tokens[j + 1].toLowerCase()];
        if (nextVal !== undefined) {
          current += nextVal + 0.5;
          consumed = true;
          j += 2;
          continue;
        }
      }
      if (FRACTION_WORDS[tok] !== undefined) {
        current += FRACTION_WORDS[tok];
        consumed = true;
        j += 1;
        continue;
      }
      if (NUMBER_WORDS[tok] !== undefined) {
        current += NUMBER_WORDS[tok];
        consumed = true;
        j += 1;
        continue;
      }
      if (HUNDRED_WORDS.has(tok)) {
        current = (current === 0 ? 1 : current) * 100;
        consumed = true;
        j += 1;
        continue;
      }
      if (THOUSAND_WORDS.has(tok)) {
        total += (current === 0 ? 1 : current) * 1000;
        current = 0;
        consumed = true;
        j += 1;
        continue;
      }
      if (LAKH_WORDS.has(tok)) {
        total += (current === 0 ? 1 : current) * 100000;
        current = 0;
        consumed = true;
        j += 1;
        continue;
      }
      break;
    }

    const candidate = Math.round(total + current);
    if (consumed && candidate > 0) {
      // Require at least > 1 or explicit currency/multiplier if single small word, to avoid "ek" in "ek minute"
      const spanLen = j - i;
      if (spanLen >= 2 || candidate >= 10) {
        bestWordAmount = candidate;
        bestSpanTokens = tokens.slice(i, j);
        break;
      }
    }
  }

  if (bestWordAmount !== null) {
    return { amount: bestWordAmount, matchedSpan: bestSpanTokens.join(' ') };
  }

  // 3. Plain digits (e.g., "Rs 500", "1,200", "500")
  const digitMatch = normalized.match(/(?:rs\.?\s*|pkr\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?!\s*(?:nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct))/i);
  if (digitMatch) {
    const val = parseInt(digitMatch[1].replace(/,/g, ''), 10);
    if (Number.isInteger(val) && val > 0) {
      return { amount: val, matchedSpan: digitMatch[0] };
    }
  }

  return { amount: null, matchedSpan: null };
}

function extractDate(normalized: string, referenceDate: Date): string | null {
  const lower = normalized.toLowerCase();
  const base = new Date(referenceDate);

  if (/\b(parso|parson)\b/.test(lower) || normalized.includes('پرسوں')) {
    base.setUTCDate(base.getUTCDate() - 2);
    return base.toISOString().slice(0, 10);
  }
  if (/\b(kal|yesterday)\b/.test(lower) || normalized.includes('کل')) {
    base.setUTCDate(base.getUTCDate() - 1);
    return base.toISOString().slice(0, 10);
  }
  if (/\b(aaj|today)\b/.test(lower) || normalized.includes('آج')) {
    return base.toISOString().slice(0, 10);
  }
  return null;
}

function extractType(
  normalized: string,
  customKeywords?: { udhaar?: string[]; wapis?: string[] }
): TransactionType | null {
  const lower = normalized.toLowerCase();

  for (const kw of [...WAPIS_KEYWORDS, ...(customKeywords?.wapis ?? [])]) {
    if (kw.charCodeAt(0) > 127 ? normalized.includes(kw) : new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(lower)) {
      return 'wapis';
    }
  }

  // Grammar cue: "<Name> ne ... diye/diya/bheje" (customer gave money)
  if (/\bne\b.*\b(diye|diya|di|bheje)\b/i.test(lower) || /نے.*(دیے|دیا|بھیجے)/.test(normalized)) {
    // Unless explicitly says udhaar
    if (!/\b(udhaar|udhar)\b/i.test(lower) && !normalized.includes('ادھار')) {
      return 'wapis';
    }
  }

  for (const kw of [...UDHAAR_KEYWORDS, ...(customKeywords?.udhaar ?? [])]) {
    if (kw.charCodeAt(0) > 127 ? normalized.includes(kw) : new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(lower)) {
      return 'udhaar';
    }
  }

  // Grammar cue: "<Name> ko ... diya/diye" (shopkeeper gave goods/credit to customer)
  if (/\bko\b.*\b(diya|diye|di)\b/i.test(lower) || /کو.*(دیا|دیے)/.test(normalized)) {
    return 'udhaar';
  }

  return null;
}

function extractRawCustomerName(normalized: string): string | null {
  // Strip leading date words so "Kal Ali ko ..." -> "Ali ko ..."
  const stripped = normalized
    .replace(/^(?:aaj|kal|parso|parson|today|yesterday|آج|کل|پرسوں)\s+/i, '')
    .trim();

  // Pattern 1: "<Name> ko ..." or "<Name> ne ..." or "<Name> ka ..."
  const romanMatch = stripped.match(/^([A-Za-z][A-Za-z\s]{1,30}?)\s+(?:ko|ne|ka|ki|ke|se)\b/i);
  if (romanMatch) {
    const candidate = romanMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Pattern 2: Urdu script "<Name> کو ..." or "<Name> نے ..." (use \s|$ instead of \b for Unicode)
  const urduMatch = stripped.match(/^([\u0600-\u06FF\s]{2,30}?)\s+(?:کو|نے|کا|کی|کے|سے)(?:\s|$)/);
  if (urduMatch) {
    return urduMatch[1].trim();
  }

  return null;
}

function matchCustomer(
  rawName: string | null,
  normalized: string,
  customers: Customer[]
): {
  customerName: string | null;
  matchedCustomerId: string | null;
  candidates: CustomerCandidate[];
  ambiguity: string | null;
} {
  if (customers.length === 0) {
    return {
      customerName: rawName ? titleCase(rawName) : null,
      matchedCustomerId: null,
      candidates: [],
      ambiguity: rawName ? null : 'Could not identify the customer name.',
    };
  }

  // If rawName wasn't found via particle, try matching any token against existing customers
  let query = rawName;
  if (!query) {
    const words = normalized.replace(/[،,۔.!?]/g, ' ').split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (STOP_WORDS.has(w.toLowerCase()) || /^\d+$/.test(w)) continue;
      for (const c of customers) {
        if (similarityScore(w, c.name) >= 0.8) {
          query = w;
          break;
        }
      }
      if (query) break;
    }
  }

  if (!query) {
    return {
      customerName: null,
      matchedCustomerId: null,
      candidates: [],
      ambiguity: 'Could not identify the customer name.',
    };
  }

  const minThreshold = query.length <= 4 ? 0.55 : 0.65;
  const scored: CustomerCandidate[] = customers
    .map((c) => ({ id: c.id, name: c.name, score: similarityScore(query!, c.name) }))
    .filter((c) => c.score >= minThreshold)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      customerName: titleCase(query),
      matchedCustomerId: null,
      candidates: [],
      ambiguity: null,
    };
  }

  // Check if multiple customers share the same high score (e.g., "Ali" matching "Ali Raza" and "Ali Hassan")
  const top = scored[0];
  const closeMatches = scored.filter((c) => top.score - c.score <= 0.05 && c.score >= 0.8);

  if (closeMatches.length > 1) {
    return {
      customerName: titleCase(query),
      matchedCustomerId: null,
      candidates: closeMatches,
      ambiguity: `Multiple customers match "${query}": ${closeMatches.map((c) => c.name).join(', ')}. Please pick one.`,
    };
  }

  return {
    customerName: top.name,
    matchedCustomerId: top.id,
    candidates: scored.slice(0, 3),
    ambiguity: null,
  };
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractNote(
  normalized: string,
  rawCustomer: string | null,
  amountSpan: string | null
): string | null {
  let work = normalized;
  if (rawCustomer) {
    work = work.replace(new RegExp(escapeRegex(rawCustomer), 'i'), ' ');
  }
  if (amountSpan) {
    work = work.replace(new RegExp(escapeRegex(amountSpan), 'i'), ' ');
  }

  const tokens = work
    .replace(/["""'']/g, '')
    .split(/[\s,،]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !STOP_WORDS.has(t.toLowerCase()))
    .filter((t) => !/^\d+$/.test(t));

  if (tokens.length === 0) return null;
  return tokens.join(' ');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseKhataSentence(
  text: string,
  customers: Customer[] = [],
  referenceDate = new Date(),
  customKeywords?: { udhaar?: string[]; wapis?: string[] }
): ParsedEntry {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      customer: null,
      matchedCustomerId: null,
      customerCandidates: [],
      type: null,
      amount: null,
      note: null,
      date: null,
      confidence: 0,
      ambiguities: ['Sentence is empty.'],
    };
  }

  const normalized = normalizeDigits(trimmed);
  const { amount, matchedSpan } = extractAmount(normalized);
  const type = extractType(normalized, customKeywords);
  const date = extractDate(normalized, referenceDate);
  const rawCustomer = extractRawCustomerName(normalized);
  const customerMatch = matchCustomer(rawCustomer, normalized, customers);
  const note = extractNote(normalized, rawCustomer, matchedSpan);

  const ambiguities: string[] = [];
  if (customerMatch.ambiguity) ambiguities.push(customerMatch.ambiguity);
  if (amount === null) ambiguities.push('Could not find an amount.');
  if (type === null) ambiguities.push('Could not tell if this is udhaar (credit) or wapis (payment).');

  let confidence = 1.0;
  if (!customerMatch.customerName) confidence -= 0.35;
  if (customerMatch.ambiguity) confidence -= 0.25;
  if (amount === null) confidence -= 0.4;
  if (type === null) confidence -= 0.25;
  confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(2))));

  return {
    customer: customerMatch.customerName,
    matchedCustomerId: customerMatch.matchedCustomerId,
    customerCandidates: customerMatch.candidates,
    type,
    amount,
    note,
    date,
    confidence,
    ambiguities,
  };
}
