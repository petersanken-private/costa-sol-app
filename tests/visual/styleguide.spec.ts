import { test, expect } from '@playwright/test';

/**
 * Visuell regression-test för Styleguide-sidan.
 *
 * Styleguide-sidan visar alla UI-primitiver med alla varianter. Om något
 * ändras (medvetet eller av misstag) i en UI-komponent fångas det här.
 *
 * Workflow:
 *   - Innan Tailwind-/CSS-ändring: `npm run test:visual:update` (sparar baseline)
 *   - Efter ändring: `npm run test:visual` (jämför)
 *
 * Snapshots sparas i tests/visual/styleguide.spec.ts-snapshots/
 */
test('styleguide — alla UI-primitiver', async ({ page }) => {
  await page.goto('/?styleguide');

  // Vänta in att webbtypsnitt laddats — annars kan första körningen
  // ge falska positiver pga fallback-fontmetrik.
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('styleguide-full.png', {
    fullPage: true,
  });
});

test('styleguide — modal öppen', async ({ page }) => {
  await page.goto('/?styleguide');
  await page.evaluate(() => document.fonts.ready);

  await page.getByRole('button', { name: 'Öppna modal' }).click();
  // Vänta tills modalen är synlig
  await page.getByRole('heading', { name: 'Exempel-modal' }).waitFor();

  await expect(page).toHaveScreenshot('styleguide-modal-open.png', {
    fullPage: false,
  });
});
