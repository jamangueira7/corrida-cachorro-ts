import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// `make screenshot`: joga até o meio da corrida e salva docs/screenshot.png para o README.
test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

async function placeBet(page: Page, guy: string, dog: string, amount: number) {
  await page.getByRole('radio', { name: new RegExp(guy) }).click();
  await page.getByRole('radio', { name: new RegExp(dog) }).click();
  await page.getByRole('spinbutton').fill(String(amount));
  await page.getByRole('button', { name: 'Apostar' }).click();
}

test('print do jogo no meio da corrida', async ({ page }) => {
  // Aleatório combinado para o print sair bonito: cada cão com um ritmo (Faísca na frente, Bolinha atrás).
  await page.addInitScript(() => {
    const pace = [0.6, 0.1, 0.8, 0.35];
    let call = 0;
    Math.random = () => Math.min(0.99, Math.max(0, (pace[call++ % 4] ?? 0.5) + (Math.sin(call * 12.9898) * 0.5) * 0.3));
  });
  await page.goto('/');
  await placeBet(page, 'João', 'Relâmpago', 10);
  await placeBet(page, 'Beto', 'Faísca', 15);
  await placeBet(page, 'Alfredo', 'Bolinha', 5);

  await page.getByRole('button', { name: /Corram!/ }).click();
  await expect(page.getByText(/Valendo!/)).toBeVisible();
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  await expect(page.getByText(/venceu!/)).toHaveCount(0);

  await page.screenshot({ path: fileURLToPath(new URL('../docs/screenshot.png', import.meta.url)) });
});
