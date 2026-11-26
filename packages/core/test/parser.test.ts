import { describe, expect, it } from 'vitest';
import { parseKhataSentence, type Customer } from '../src/index.js';

const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Ali Raza', phone: '923001112233', createdAt: '2026-03-01T00:00:00Z', dueDays: 14 },
  { id: 'c2', name: 'Sara Khan', phone: '923002223344', createdAt: '2026-03-05T00:00:00Z', dueDays: 14 },
  { id: 'c3', name: 'Bilal Ahmed', phone: '923003334455', createdAt: '2026-04-01T00:00:00Z', dueDays: 14 },
  { id: 'c4', name: 'Hina Traders', phone: '923004445566', createdAt: '2026-05-01T00:00:00Z', dueDays: 14 },
  { id: 'c5', name: 'Usman Tailors', phone: '923005556677', createdAt: '2026-06-01T00:00:00Z', dueDays: 14 },
  { id: 'c6', name: 'Zainab Bibi', phone: '923006667788', createdAt: '2026-06-15T00:00:00Z', dueDays: 14 },
];

const REF_DATE = new Date('2026-11-27T10:00:00Z');

interface Case {
  text: string;
  customer: string | null;
  type: 'udhaar' | 'wapis' | null;
  amount: number | null;
  date?: string | null;
  noteIncludes?: string;
}

const CASES: Case[] = [
  // 1-10: Core Roman Urdu udhaar
  { text: 'Ali ko 500 ka udhaar likh do', customer: 'Ali Raza', type: 'udhaar', amount: 500 },
  { text: 'Sara ko 1,200 ka suit udhaar', customer: 'Sara Khan', type: 'udhaar', amount: 1200, noteIncludes: 'suit' },
  { text: 'Bilal ko 250 ka saman diya', customer: 'Bilal Ahmed', type: 'udhaar', amount: 250, noteIncludes: 'saman' },
  { text: 'Hina Traders ko 4500 ka udhaar likh dein', customer: 'Hina Traders', type: 'udhaar', amount: 4500 },
  { text: 'Usman ko 800 rupay ka udhar likho', customer: 'Usman Tailors', type: 'udhaar', amount: 800 },
  { text: 'Zainab ko Rs 1500 ka atta oil udhaar', customer: 'Zainab Bibi', type: 'udhaar', amount: 1500, noteIncludes: 'atta' },
  { text: 'Ali Raza ko 700 ki chai aur biscuit udhaar', customer: 'Ali Raza', type: 'udhaar', amount: 700, noteIncludes: 'chai' },
  { text: 'Bilal ko Rs. 350 ka doodh likh do', customer: 'Bilal Ahmed', type: 'udhaar', amount: 350, noteIncludes: 'doodh' },
  { text: 'Sara Khan ko 950 ka saman likh do', customer: 'Sara Khan', type: 'udhaar', amount: 950 },
  { text: 'Tariq ko 600 ka udhaar likh do', customer: 'Tariq', type: 'udhaar', amount: 600 },

  // 11-20: Roman Urdu wapis / payments
  { text: 'Sara ne 400 wapis kiye', customer: 'Sara Khan', type: 'wapis', amount: 400 },
  { text: 'Bilal ne 300 wapis kiye', customer: 'Bilal Ahmed', type: 'wapis', amount: 300 },
  { text: 'Ali ne 500 ada kiye', customer: 'Ali Raza', type: 'wapis', amount: 500 },
  { text: 'Hina Traders ne 2000 jama karwaye', customer: 'Hina Traders', type: 'wapis', amount: 2000 },
  { text: 'Usman ne Rs 1,000 wapas kiye', customer: 'Usman Tailors', type: 'wapis', amount: 1000 },
  { text: 'Zainab ne 650 return kiye', customer: 'Zainab Bibi', type: 'wapis', amount: 650 },
  { text: 'Ali Raza ne 1200 diye', customer: 'Ali Raza', type: 'wapis', amount: 1200 },
  { text: 'Sara ne 250 bheje', customer: 'Sara Khan', type: 'wapis', amount: 250 },
  { text: 'Bilal Ahmed paid 500', customer: 'Bilal Ahmed', type: 'wapis', amount: 500 },
  { text: 'Ali ne 300 rupay wapis diye', customer: 'Ali Raza', type: 'wapis', amount: 300 },

  // 21-32: Number words (Roman Urdu & mixed)
  { text: 'Ali ko paanch sau ka udhaar likh do', customer: 'Ali Raza', type: 'udhaar', amount: 500 },
  { text: 'Sara ko ek hazaar ka udhaar', customer: 'Sara Khan', type: 'udhaar', amount: 1000 },
  { text: 'Bilal ko dhai sau ka saman diya', customer: 'Bilal Ahmed', type: 'udhaar', amount: 250 },
  { text: 'Ali ne dedh hazaar wapis kiye', customer: 'Ali Raza', type: 'wapis', amount: 1500 },
  { text: 'Usman ko saade teen sau ka udhaar', customer: 'Usman Tailors', type: 'udhaar', amount: 350 },
  { text: 'Hina Traders ne do hazaar paanch sau jama kiye', customer: 'Hina Traders', type: 'wapis', amount: 2500 },
  { text: 'Zainab ko dhai hazaar ka udhaar likh do', customer: 'Zainab Bibi', type: 'udhaar', amount: 2500 },
  { text: 'Sara ne panch sau rupay ada kiye', customer: 'Sara Khan', type: 'wapis', amount: 500 },
  { text: 'Bilal ko 2 hazaar ka udhaar', customer: 'Bilal Ahmed', type: 'udhaar', amount: 2000 },
  { text: 'Ali ko 3 sau ka chawal diya', customer: 'Ali Raza', type: 'udhaar', amount: 300, noteIncludes: 'chawal' },
  { text: 'Usman ne pachaas rupay wapis kiye', customer: 'Usman Tailors', type: 'wapis', amount: 50 },
  { text: 'Sara ko saade paanch sau ka udhaar', customer: 'Sara Khan', type: 'udhaar', amount: 550 },

  // 33-42: Urdu script & Urdu digits
  { text: 'علی کو 500 کا ادھار لکھ دو', customer: 'علی', type: 'udhaar', amount: 500 },
  { text: 'سارہ نے 400 واپس کیے', customer: 'سارہ', type: 'wapis', amount: 400 },
  { text: 'بلال کو ۵۰۰ کا سامان دیا', customer: 'بلال', type: 'udhaar', amount: 500 },
  { text: 'علی نے ۱۲۰۰ روپے جمع کیے', customer: 'علی', type: 'wapis', amount: 1200 },
  { text: 'عثمان کو ایک ہزار کا ادھار لکھ دیں', customer: 'عثمان', type: 'udhaar', amount: 1000 },
  { text: 'زینب نے پانچ سو روپے واپس دیے', customer: 'زینب', type: 'wapis', amount: 500 },
  { text: 'حنا کو ڈھائی سو کا ادھار', customer: 'حنا', type: 'udhaar', amount: 250 },
  { text: 'بلال نے ڈیڑھ ہزار ادا کیے', customer: 'بلال', type: 'wapis', amount: 1500 },
  { text: 'سارہ کو ۳۵۰ روپے کا ادھار', customer: 'سارہ', type: 'udhaar', amount: 350 },
  { text: 'علی نے 750 روپے دیے', customer: 'علی', type: 'wapis', amount: 750 },

  // 43-50: Date words (kal, parso, aaj)
  { text: 'Kal Ali ko 500 ka udhaar likh do', customer: 'Ali Raza', type: 'udhaar', amount: 500, date: '2026-11-26' },
  { text: 'Parso Sara ne 600 wapis kiye', customer: 'Sara Khan', type: 'wapis', amount: 600, date: '2026-11-25' },
  { text: 'Aaj Bilal ko 300 ka saman diya', customer: 'Bilal Ahmed', type: 'udhaar', amount: 300, date: '2026-11-27' },
  { text: 'Ali ko kal 1000 ka udhaar diya', customer: 'Ali Raza', type: 'udhaar', amount: 1000, date: '2026-11-26' },
  { text: 'Sara ne parso 450 ada kiye', customer: 'Sara Khan', type: 'wapis', amount: 450, date: '2026-11-25' },
  { text: 'Today Usman ko 200 ka udhaar', customer: 'Usman Tailors', type: 'udhaar', amount: 200, date: '2026-11-27' },
  { text: 'Yesterday Hina Traders ne 1500 jama kiye', customer: 'Hina Traders', type: 'wapis', amount: 1500, date: '2026-11-26' },
  { text: 'کل علی کو 250 کا ادھار لکھ دو', customer: 'علی', type: 'udhaar', amount: 250, date: '2026-11-26' },

  // 51-56: Typos & casual phrasing
  { text: 'Ail ko 500 ka udhar likh do', customer: 'Ali Raza', type: 'udhaar', amount: 500 },
  { text: 'Bial ne 300 wapas kiye', customer: 'Bilal Ahmed', type: 'wapis', amount: 300 },
  { text: 'Sraa ko 1200 ka udhaar', customer: 'Sara Khan', type: 'udhaar', amount: 1200 },
  { text: 'Ali ko 450 chini aur chawal udhaar', customer: 'Ali Raza', type: 'udhaar', amount: 450, noteIncludes: 'chini' },
  { text: 'Bilal ne 2k wapis kiye', customer: 'Bilal Ahmed', type: 'wapis', amount: 2000 },
  { text: 'Sara ko Rs 1,800 atta oil sugar udhaar', customer: 'Sara Khan', type: 'udhaar', amount: 1800, noteIncludes: 'atta' },

  // 57-60: Ambiguous / incomplete sentences (must NOT guess!)
  { text: 'Ali ko udhaar likh do', customer: 'Ali Raza', type: 'udhaar', amount: null },
  { text: '500 ka udhaar likh do', customer: null, type: 'udhaar', amount: 500 },
  { text: 'Ali 500', customer: 'Ali Raza', type: null, amount: 500 },
  { text: 'kuch likh do', customer: null, type: 'udhaar', amount: null },
];

describe('Roman Urdu & Urdu khata parser (60+ sentences)', () => {
  it('has at least 60 test sentences', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(60);
  });

  it.each(CASES)('parses: $text', (c) => {
    const res = parseKhataSentence(c.text, CUSTOMERS, REF_DATE);
    expect(res.customer).toBe(c.customer);
    expect(res.type).toBe(c.type);
    expect(res.amount).toBe(c.amount);
    if (c.date !== undefined) {
      expect(res.date).toBe(c.date);
    }
    if (c.noteIncludes) {
      expect(res.note?.toLowerCase()).toContain(c.noteIncludes);
    }
  });

  it('flags ambiguity when multiple customers match the same first name', () => {
    const twoAlis: Customer[] = [
      { id: 'a1', name: 'Ali Raza', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'a2', name: 'Ali Hassan', createdAt: '2026-01-01T00:00:00Z' },
    ];
    const res = parseKhataSentence('Ali ko 500 ka udhaar likh do', twoAlis, REF_DATE);
    expect(res.matchedCustomerId).toBeNull();
    expect(res.customerCandidates?.length).toBe(2);
    expect(res.ambiguities.length).toBeGreaterThan(0);
    expect(res.confidence).toBeLessThan(0.8);
  });
});
