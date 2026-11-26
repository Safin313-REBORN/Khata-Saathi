import type { IncomingMessage, ServerResponse } from 'node:http';

let appPromise: Promise<{ server: { emit: (ev: string, req: IncomingMessage, res: ServerResponse) => void } }> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const [{ buildApp }, { createProviders }, { seedDemoData }] = await Promise.all([
        import('../apps/api/dist/app.js'),
        import('../apps/api/dist/providers.js'),
        import('../apps/api/dist/seed.js'),
      ]);
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
