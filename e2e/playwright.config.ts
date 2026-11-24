import { defineConfig, devices } from '@playwright/test';

// Roda no container `e2e` (imagem do Playwright) contra o app de dev: http://web:5173 na rede do Compose.
// `pnpm test` (make check) não executa este pacote: o script se chama `e2e`, não `test`.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '/tmp/playwright-results',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://web:5173',
    locale: 'pt-BR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
