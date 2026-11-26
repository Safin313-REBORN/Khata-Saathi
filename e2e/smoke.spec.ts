import { expect, test } from '@playwright/test';

test('smoke: landing -> dashboard parse & confirm -> ledger undo & reminder -> 390px mobile no overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.request.post('/api/seed');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Bolo. Khata likh jaye.' })).toBeVisible();

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/app/);

  // Type a Roman Urdu sentence and submit
  const input = page.getByLabel('Type or say an entry');
  await input.fill('Ali ko 500 ka udhaar likh do');
  await page.getByRole('button', { name: 'Send' }).click();

  // Confirm read-back card appears
  const confirmRegion = page.getByRole('region', { name: 'Confirm ledger entry' });
  await expect(confirmRegion).toBeVisible();
  await expect(confirmRegion).toContainText('Ali Raza');
  await expect(confirmRegion).toContainText('Rs 500');
  await confirmRegion.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText(/Saved: Ali Raza/)).toBeVisible();

  // Open Ali's ledger
  await page.getByRole('link', { name: /Open Ali's ledger/i }).click();
  await expect(page).toHaveURL(/\/app\/customers\//);
  await expect(page.getByRole('heading', { name: 'Ali Raza' })).toBeVisible();

  // Switch reminder to Urdu and verify WhatsApp link
  await page.getByRole('button', { name: 'اردو' }).click();
  await expect(page.getByRole('link', { name: 'Open in WhatsApp' })).toHaveAttribute('href', /wa\.me/);

  // Undo last entry
  await page.getByRole('button', { name: /Undo last entry/i }).click();
  await expect(page.locator('tbody tr.reversed')).toHaveCount(1);

  // Check 390px mobile viewport has zero horizontal scroll
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(consoleErrors).toEqual([]);
});
