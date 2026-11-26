import type { Storage } from '@khata-saathi/core';

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function seedDemoData(storage: Storage): Promise<{ customersCreated: number; transactionsCreated: number }> {
  await storage.clearAll();

  const ali = await storage.createCustomer({ name: 'Ali Raza', phone: '923001112233', dueDays: 14 });
  const hina = await storage.createCustomer({ name: 'Hina Traders', phone: '923004445566', dueDays: 14 });
  const bilal = await storage.createCustomer({ name: 'Bilal Ahmed', phone: '923003334455', dueDays: 14 });
  const sara = await storage.createCustomer({ name: 'Sara Khan', phone: '923002223344', dueDays: 14 });
  const usman = await storage.createCustomer({ name: 'Usman Tailors', phone: '923005556677', dueDays: 14 });

  let txCount = 0;
  const add = async (
    customerId: string,
    type: 'udhaar' | 'wapis',
    amount: number,
    note: string,
    daysBack: number
  ) => {
    await storage.appendTransaction({
      customerId,
      type,
      amount,
      note,
      occurredAt: daysAgo(daysBack),
    });
    txCount++;
  };

  // Ali Raza: 3 settled cycles (~12 days late each) + current Rs 2,500 due 12 days ago (26 days old)
  await add(ali.id, 'udhaar', 1200, 'Flour and pulses', 110);
  await add(ali.id, 'wapis', 1200, 'Cash received', 84); // 26 days -> 12 days late
  await add(ali.id, 'udhaar', 1500, 'Rice and cooking oil', 78);
  await add(ali.id, 'wapis', 1500, 'EasyPaisa transfer', 52); // 26 days -> 12 days late
  await add(ali.id, 'udhaar', 900, 'Milk, bread, eggs', 48);
  await add(ali.id, 'wapis', 900, 'Cash received', 22); // 26 days -> 12 days late

  await add(ali.id, 'udhaar', 1800, 'Atta, oil, sugar', 26); // oldest unpaid -> 26-14 = 12 days overdue
  await add(ali.id, 'wapis', 500, 'Cash received', 15);
  await add(ali.id, 'udhaar', 1200, 'Tea, biscuits, soap', 7);
  // Ali balance: 1800 - 500 + 1200 = 2,500

  // Hina Traders: Rs 9,950 due 9 days ago (23 days old)
  await add(hina.id, 'udhaar', 12000, 'Wholesale carton supply', 23);
  await add(hina.id, 'wapis', 2050, 'Partial bank transfer', 10);

  // Bilal Ahmed: Rs 4,800 due in 3 days (11 days old)
  await add(bilal.id, 'udhaar', 4800, 'Monthly grocery ration', 11);

  // Sara Khan: Rs 1,200 due in 6 days (8 days old)
  await add(sara.id, 'udhaar', 1600, 'Cotton suit & lace', 8);
  await add(sara.id, 'wapis', 400, 'Advance paid', 4);

  // Usman Tailors: Rs 0 (all clear)
  await add(usman.id, 'udhaar', 2400, 'Thread & buttons bulk', 20);
  await add(usman.id, 'wapis', 2400, 'Settled in full', 12);

  return { customersCreated: 5, transactionsCreated: txCount };
}
