import { buildApp } from './app.js';
import { createProviders } from './providers.js';
import { seedDemoData } from './seed.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

async function main() {
  const providers = createProviders();
  // Auto-seed on first run if database has no customers so the demo works out of the box
  const existing = await providers.storage.listCustomers();
  if (existing.length === 0 && process.env.DISABLE_AUTO_SEED !== '1') {
    await seedDemoData(providers.storage);
  }

  const app = await buildApp(providers);
  await app.listen({ port, host });
  console.log(`Khata Saathi API listening on http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
