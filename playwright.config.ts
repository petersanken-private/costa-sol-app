import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config för visuell regressionstest.
 *
 * Workflow:
 *   1. `npm run test:visual:update` — uppdaterar baselines (innan ändring)
 *   2. Gör Tailwind-/CSS-ändringar
 *   3. `npm run test:visual` — jämför mot baselines
 *   4. Vid diff: kolla testresultatet i playwright-report/, bekräfta att
 *      ändringen är avsiktlig, kör :update igen
 */
export default defineConfig({
  testDir:  './tests/visual',
  fullyParallel: false,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:4173',  // vite preview (snabbare än dev för screenshots)
    trace:   'on-first-retry',
  },

  /** Bara desktop Chromium tills vidare. Lägg till mobile + Firefox vid behov. */
  projects: [
    {
      name: 'desktop',
      use:  { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],

  /** Snapshot-tolerans: 0.2% pixel-diff för att tillåta små anti-aliasing-skillnader. */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations:        'disabled',
    },
  },

  /** Starta automatiskt vite-preview om den inte redan kör. */
  webServer: {
    command:             'npm run build && npm run preview',
    url:                 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout:             120_000,
  },
});
