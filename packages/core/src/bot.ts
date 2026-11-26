import { formatRs } from './ledger.js';
import type { CustomerSummary, ShopSummary } from './types.js';

export type BotIntent = 'balance_query' | 'reminder_list' | 'shop_totals' | 'help' | 'ledger_entry';

export interface BotReply {
  intent: BotIntent;
  reply: string;
  matchedCustomerId?: string | null;
}

export function respondWithKhataBot(
  text: string,
  summaries: CustomerSummary[],
  shop: ShopSummary
): BotReply {
  const lower = text.trim().toLowerCase();

  // 1. Help intent
  if (/^(help|madad|kya kar sakte|commands|\?)$/i.test(lower)) {
    return {
      intent: 'help',
      reply:
        'You can record entries ("Ali ko 500 ka udhaar likh do", "Sara ne 400 wapis kiye") or ask me questions like "Total kitna lena hai?", "Kis ko reminder bhejna hai?", or "Ali ka kitna baqi hai?".',
    };
  }

  // 2. Reminder list intent
  if (
    /\b(reminder|yaad\s*dihani|overdue|kis\s*ko\s*bhejn|who\s*needs\s*a?\s*reminder)\b/i.test(lower) ||
    text.includes('یاددہانی')
  ) {
    const due = summaries.filter((s) => s.needsReminder);
    if (due.length === 0) {
      return {
        intent: 'reminder_list',
        reply: 'All caught up! Nobody is overdue for a reminder right now.',
      };
    }
    const list = due
      .slice(0, 5)
      .map((s) => `${s.customer.name} (${formatRs(s.balance)}, ${s.dueStatusLabel})`)
      .join('; ');
    return {
      intent: 'reminder_list',
      reply: `${due.length} customer${due.length === 1 ? '' : 's'} need a reminder: ${list}.`,
    };
  }

  // 3. Shop totals intent
  if (
    /\b(total|kul|kitna\s*lena|how\s*much\s*to\s*collect|summary|hisab)\b/i.test(lower) &&
    !/\b(ka|ki|ke)\b/.test(lower.replace(/total|kul|hisab/g, '').trim())
  ) {
    return {
      intent: 'shop_totals',
      reply: `${shop.shopName}: Total to collect is ${formatRs(shop.totalToCollect)} across ${shop.customerCount} customers (Given: ${formatRs(shop.totalGiven)}, Received: ${formatRs(shop.totalReceived)}).`,
    };
  }

  // 4. Customer balance query ("Ali ka kitna baqi hai?", "Ali balance?", "How much does Sara owe?")
  if (
    /\b(kitna|baqi|baki|balance|hisab|owe|owes|status)\b/i.test(lower) ||
    text.includes('باقی') ||
    text.includes('حساب')
  ) {
    const match = summaries.find((s) => {
      const first = s.customer.name.toLowerCase().split(/\s+/)[0];
      return lower.includes(s.customer.name.toLowerCase()) || (first.length >= 2 && new RegExp(`\\b${first}\\b`, 'i').test(lower));
    });

    if (match) {
      return {
        intent: 'balance_query',
        matchedCustomerId: match.customer.id,
        reply: `${match.customer.name} has a balance of ${formatRs(match.balance)} (${match.dueStatusLabel}).`,
      };
    }

    return {
      intent: 'shop_totals',
      reply: `Total to collect across all customers is ${formatRs(shop.totalToCollect)}. Ask with a customer name like "Ali ka kitna baqi hai?" for an individual balance.`,
    };
  }

  // 5. Otherwise treat as a ledger entry for the parser + Confirm flow
  return {
    intent: 'ledger_entry',
    reply: '',
  };
}
