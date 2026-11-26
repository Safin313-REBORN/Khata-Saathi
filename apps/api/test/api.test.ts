import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createProviders } from '../src/providers.js';

describe('Khata Saathi API', () => {
  it('exposes /health/providers with local defaults and supports env-based AWS stub swapping', async () => {
    const app = await buildApp(createProviders({ SQLITE_PATH: ':memory:' }));
    const res = await app.inject({ method: 'GET', url: '/health/providers' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.providers).toHaveLength(7);
    expect(body.providers.find((p: { slot: string }) => p.slot === 'Storage').active).toBe('sqlite');

    const awsApp = await buildApp(
      createProviders({
        STT_PROVIDER: 'aws-transcribe',
        NLU_PROVIDER: 'aws-bedrock',
        STORAGE_PROVIDER: 'aws-dynamodb',
        FILESTORE_PROVIDER: 'aws-s3',
        NOTIFIER_PROVIDER: 'aws-sns',
        TRANSLATOR_PROVIDER: 'aws-translate',
        OCR_PROVIDER: 'aws-textract',
      })
    );
    const awsRes = await awsApp.inject({ method: 'GET', url: '/health/providers' });
    const awsBody = awsRes.json();
    for (const p of awsBody.providers) {
      expect(p.isStub).toBe(true);
    }
  });

  it('parses, confirms, computes balances, undoes without losing history, and generates reminder drafts', async () => {
    const app = await buildApp(createProviders({ SQLITE_PATH: ':memory:' }));

    // Seed demo data
    const seedRes = await app.inject({ method: 'POST', url: '/api/seed' });
    expect(seedRes.statusCode).toBe(200);

    // Parse sentence
    const parseRes = await app.inject({
      method: 'POST',
      url: '/api/parse',
      payload: { text: 'Ali ko 500 ka udhaar likh do' },
    });
    expect(parseRes.statusCode).toBe(200);
    const parsed = parseRes.json();
    expect(parsed.customer).toBe('Ali Raza');
    expect(parsed.amount).toBe(500);
    expect(parsed.proposedNewBalance).toBe(3000);

    // Confirm transaction
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      payload: {
        customerId: parsed.matchedCustomerId,
        type: parsed.type,
        amount: parsed.amount,
        note: 'Milk & biscuits',
        sourceText: 'Ali ko 500 ka udhaar likh do',
      },
    });
    expect(confirmRes.statusCode).toBe(201);
    const created = confirmRes.json();
    expect(created.newBalance).toBe(3000);

    // Undo transaction
    const undoRes = await app.inject({
      method: 'POST',
      url: `/api/transactions/${created.transaction.id}/undo`,
      payload: { reason: 'Test undo' },
    });
    expect(undoRes.statusCode).toBe(200);
    expect(undoRes.json().newBalance).toBe(2500);

    // Reminder draft in Urdu
    const remRes = await app.inject({
      method: 'GET',
      url: `/api/reminders/${parsed.matchedCustomerId}?lang=ur&tone=polite`,
    });
    expect(remRes.statusCode).toBe(200);
    const rem = remRes.json();
    expect(rem.sent).toBe(false);
    expect(rem.whatsappUrl).toContain('https://wa.me/');
    expect(rem.text).toContain('Rs 2,500');
  });
});
