import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  computeLedgerRows,
  createReversingEvent,
  customerLedgerToCsv,
  parseKhataSentence,
  respondWithKhataBot,
  sortCustomersByReminderPriority,
  summarizeCustomer,
  summarizeShop,
  type ReminderLanguage,
  type ReminderTone,
} from '@khata-saathi/core';
import { createProviders, type ProviderRegistry } from './providers.js';
import { seedDemoData } from './seed.js';

const ParseBodySchema = z.object({
  text: z.string().min(1).max(500),
});

const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(24).optional().nullable(),
  dueDays: z.number().int().min(1).max(90).optional(),
});

const CreateTransactionSchema = z.object({
  customerId: z.string().min(1).optional(),
  customerName: z.string().min(1).max(80).optional(),
  type: z.enum(['udhaar', 'wapis', 'adjustment']),
  amount: z.number().int().positive(),
  direction: z.union([z.literal(1), z.literal(-1)]).optional(),
  note: z.string().max(240).optional().default(''),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  sourceText: z.string().max(500).optional().nullable(),
  adjustmentReason: z.string().max(240).optional().nullable(),
});

const UndoBodySchema = z.object({
  reason: z.string().max(200).optional(),
});

const OcrImportSchema = z.object({
  imageBase64: z.string().min(1),
});

const TrainKeywordSchema = z.object({
  phrase: z.string().min(2).max(40),
  type: z.enum(['udhaar', 'wapis']),
});

export async function buildApp(customProviders?: ProviderRegistry): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true',
  });
  const providers = customProviders ?? createProviders();

  const allowedOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow same-origin / non-browser requests (no Origin header) and configured origins
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Origin not allowed by CORS'), false);
    },
  });

  // Lightweight in-memory rate limiter for /api/* routes
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 120);
  const rateWindowMs = 60_000;
  const hits = new Map<string, { count: number; resetAt: number }>();

  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    const now = Date.now();
    const ip = req.ip || 'local';
    const entry = hits.get(ip);
    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + rateWindowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > rateLimitMax) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      reply.header('Retry-After', String(retryAfterSec));
      return reply.code(429).send({ error: 'Too many requests. Please try again shortly.' });
    }
  });

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    const statusCode =
      typeof err === 'object' && err !== null && 'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
        ? (err as { statusCode: number }).statusCode
        : 500;
    const message =
      statusCode >= 500
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : 'Request error';
    return reply.code(statusCode).send({ error: message });
  });

  app.get('/health', async () => ({ ok: true, service: 'khata-saathi-api' }));

  app.get('/health/providers', async () => ({
    ok: true,
    providers: providers.health(),
  }));

  app.get('/api/shop', async () => {
    const [meta, customers, transactions] = await Promise.all([
      providers.storage.getShopMeta(),
      providers.storage.listCustomers(),
      providers.storage.listTransactions(),
    ]);

    const txByCustomer = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const list = txByCustomer.get(tx.customerId) ?? [];
      list.push(tx);
      txByCustomer.set(tx.customerId, list);
    }

    const summaries = customers.map((c) => summarizeCustomer(c, txByCustomer.get(c.id) ?? []));
    return summarizeShop(meta, summaries);
  });

  app.get('/api/customers', async () => {
    const [customers, transactions] = await Promise.all([
      providers.storage.listCustomers(),
      providers.storage.listTransactions(),
    ]);

    const txByCustomer = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const list = txByCustomer.get(tx.customerId) ?? [];
      list.push(tx);
      txByCustomer.set(tx.customerId, list);
    }

    const summaries = customers.map((c) => summarizeCustomer(c, txByCustomer.get(c.id) ?? []));
    return { customers: sortCustomersByReminderPriority(summaries) };
  });

  app.post('/api/customers', async (req, reply) => {
    const parsed = CreateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid customer payload', details: parsed.error.flatten() });
    }
    const customer = await providers.storage.createCustomer(parsed.data);
    return reply.code(201).send({ customer });
  });

  app.get('/api/customers/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const customer = await providers.storage.getCustomer(id);
    if (!customer) {
      return reply.code(404).send({ error: 'Customer not found' });
    }
    const transactions = await providers.storage.listTransactions(id);
    const rows = computeLedgerRows(transactions);
    const summary = summarizeCustomer(customer, transactions);
    return { customer, summary, rows };
  });

  app.post('/api/parse', async (req, reply) => {
    const parsedBody = ParseBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: 'Text is required' });
    }
    const customers = await providers.storage.listCustomers();
    const result =
      providers.nlu.providerName === 'rule-based-urdu-parser' &&
      (customTerms.udhaar.length > 0 || customTerms.wapis.length > 0)
        ? parseKhataSentence(parsedBody.data.text, customers, new Date(), customTerms)
        : await providers.nlu.parse(parsedBody.data.text, { customers });

    let currentBalance = 0;
    if (result.matchedCustomerId) {
      const txs = await providers.storage.listTransactions(result.matchedCustomerId);
      const rows = computeLedgerRows(txs);
      currentBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
    }

    let proposedNewBalance: number | null = null;
    if (result.amount !== null && result.type !== null) {
      const delta = result.type === 'udhaar' ? result.amount : -result.amount;
      proposedNewBalance = currentBalance + delta;
    }

    return {
      ...result,
      currentBalance,
      proposedNewBalance,
      nluProvider: providers.nlu.providerName,
    };
  });

  const customTerms: { udhaar: string[]; wapis: string[] } = { udhaar: [], wapis: [] };

  app.get('/api/nlu/terms', async () => ({ terms: customTerms }));

  app.post('/api/nlu/train', async (req, reply) => {
    const parsed = TrainKeywordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Valid phrase and type (udhaar/wapis) required' });
    }
    const clean = parsed.data.phrase.trim().toLowerCase();
    const bucket = customTerms[parsed.data.type];
    if (!bucket.includes(clean)) {
      bucket.push(clean);
    }
    return { ok: true, terms: customTerms };
  });

  app.post('/api/bot/message', async (req, reply) => {
    const parsedBody = ParseBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: 'Text is required' });
    }
    const [meta, customers, transactions] = await Promise.all([
      providers.storage.getShopMeta(),
      providers.storage.listCustomers(),
      providers.storage.listTransactions(),
    ]);

    const txByCustomer = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const list = txByCustomer.get(tx.customerId) ?? [];
      list.push(tx);
      txByCustomer.set(tx.customerId, list);
    }
    const summaries = sortCustomersByReminderPriority(
      customers.map((c) => summarizeCustomer(c, txByCustomer.get(c.id) ?? []))
    );
    const shop = summarizeShop(meta, summaries);
    const botReply = respondWithKhataBot(parsedBody.data.text, summaries, shop);

    if (botReply.intent !== 'ledger_entry') {
      return {
        mode: 'bot_answer' as const,
        ...botReply,
      };
    }

    const parsed =
      providers.nlu.providerName === 'rule-based-urdu-parser' &&
      (customTerms.udhaar.length > 0 || customTerms.wapis.length > 0)
        ? parseKhataSentence(parsedBody.data.text, customers, new Date(), customTerms)
        : await providers.nlu.parse(parsedBody.data.text, { customers });

    let currentBalance = 0;
    if (parsed.matchedCustomerId) {
      const rows = computeLedgerRows(txByCustomer.get(parsed.matchedCustomerId) ?? []);
      currentBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
    }
    const proposedNewBalance =
      parsed.amount !== null && parsed.type !== null
        ? currentBalance + (parsed.type === 'udhaar' ? parsed.amount : -parsed.amount)
        : null;

    return {
      mode: 'ledger_entry' as const,
      parse: {
        ...parsed,
        currentBalance,
        proposedNewBalance,
        nluProvider: providers.nlu.providerName,
      },
    };
  });

  app.post('/api/transactions', async (req, reply) => {
    const parsed = CreateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid transaction payload', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    let customerId = data.customerId;

    if (!customerId) {
      if (!data.customerName) {
        return reply.code(400).send({ error: 'Either customerId or customerName is required' });
      }
      const existing = (await providers.storage.listCustomers()).find(
        (c) => c.name.toLowerCase() === data.customerName!.trim().toLowerCase()
      );
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await providers.storage.createCustomer({ name: data.customerName.trim() });
        customerId = created.id;
      }
    } else {
      const exists = await providers.storage.getCustomer(customerId);
      if (!exists) {
        return reply.code(404).send({ error: 'Customer not found' });
      }
    }

    const tx = await providers.storage.appendTransaction({
      customerId,
      type: data.type,
      amount: data.amount,
      direction: data.direction,
      note: data.note || (data.type === 'udhaar' ? 'Udhaar entry' : data.type === 'wapis' ? 'Payment received' : 'Adjustment'),
      occurredAt: data.occurredAt ?? new Date().toISOString().slice(0, 10),
      sourceText: data.sourceText ?? null,
      adjustmentReason: data.adjustmentReason ?? null,
    });

    const txs = await providers.storage.listTransactions(customerId);
    const rows = computeLedgerRows(txs);
    const newBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;

    return reply.code(201).send({ transaction: tx, newBalance });
  });

  app.post('/api/transactions/:id/undo', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UndoBodySchema.safeParse(req.body ?? {});
    const original = await providers.storage.getTransaction(id);
    if (!original) {
      return reply.code(404).send({ error: 'Transaction not found' });
    }

    const allForCustomer = await providers.storage.listTransactions(original.customerId);
    if (allForCustomer.some((t) => t.reversedTxId === original.id)) {
      return reply.code(409).send({ error: 'Transaction was already reversed' });
    }

    const reversingPayload = createReversingEvent(
      original,
      body.success ? body.data.reason : 'Undo entry'
    );
    const reversingTx = await providers.storage.appendTransaction(reversingPayload);
    const updatedTxs = await providers.storage.listTransactions(original.customerId);
    const rows = computeLedgerRows(updatedTxs);
    const newBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;

    return { reversingTransaction: reversingTx, newBalance };
  });

  app.get('/api/reminders/:customerId', async (req, reply) => {
    const { customerId } = req.params as { customerId: string };
    const query = req.query as { lang?: string; tone?: string };
    const lang: ReminderLanguage =
      query.lang === 'ur' || query.lang === 'en' ? query.lang : 'roman';
    const tone: ReminderTone =
      query.tone === 'friendly' || query.tone === 'firm' ? query.tone : 'polite';

    const customer = await providers.storage.getCustomer(customerId);
    if (!customer) {
      return reply.code(404).send({ error: 'Customer not found' });
    }

    const [shopMeta, txs] = await Promise.all([
      providers.storage.getShopMeta(),
      providers.storage.listTransactions(customerId),
    ]);
    const summary = summarizeCustomer(customer, txs);
    const amount = Math.max(0, summary.balance);

    const text = await providers.translator.draftReminder({
      customerName: customer.name,
      amount,
      shopName: shopMeta.shopName,
      lang,
      tone,
    });

    const notification = await providers.notifier.prepareNotification({
      recipientName: customer.name,
      phone: customer.phone,
      message: text,
    });

    return {
      customerId: customer.id,
      customerName: customer.name,
      amount,
      lang,
      tone,
      text: notification.copyText,
      whatsappUrl: notification.whatsappUrl,
      sent: notification.sent,
      providers: {
        translator: providers.translator.providerName,
        notifier: providers.notifier.providerName,
      },
    };
  });

  app.get('/api/customers/:id/export.csv', async (req, reply) => {
    const { id } = req.params as { id: string };
    const customer = await providers.storage.getCustomer(id);
    if (!customer) {
      return reply.code(404).send({ error: 'Customer not found' });
    }
    const txs = await providers.storage.listTransactions(id);
    const rows = computeLedgerRows(txs);
    const csv = customerLedgerToCsv(customer, rows);

    await providers.fileStore.saveFile(`exports/${customer.id}-ledger.csv`, csv, 'text/csv');

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${customer.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-khata.csv"`)
      .send(csv);
  });

  app.post('/api/seed', async () => {
    const result = await seedDemoData(providers.storage);
    return { ok: true, ...result };
  });

  app.get('/api/backup', async (_req, reply) => {
    const [shopMeta, customers, transactions] = await Promise.all([
      providers.storage.getShopMeta(),
      providers.storage.listCustomers(),
      providers.storage.listTransactions(),
    ]);
    const dateStr = new Date().toISOString().slice(0, 10);
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), shopMeta, customers, transactions },
      null,
      2
    );
    return reply
      .header('Content-Type', 'application/json; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="khata-saathi-backup-${dateStr}.json"`)
      .send(payload);
  });

  app.post('/api/ocr/import', async (req, reply) => {
    const parsed = OcrImportSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'imageBase64 is required' });
    }
    const customers = await providers.storage.listCustomers();
    const result = await providers.ocr.extractLedgerLines(parsed.data.imageBase64, { customers });
    return result;
  });

  // Serve built web app in production if present
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/health')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
