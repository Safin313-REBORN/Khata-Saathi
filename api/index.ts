import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../apps/api/dist/app.js';
import { createProviders } from '../apps/api/dist/providers.js';
import { seedDemoData } from '../apps/api/dist/seed.js';

let appPromise: ReturnType<typeof buildApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const providers = createProviders();
      const existing = await providers.storage.listCustomers();
      if (existing.length === 0) {
        await seedDemoData(providers.storage);
      }
      const app = await buildApp(providers);
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
