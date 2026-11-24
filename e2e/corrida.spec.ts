import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const guyRadio = (page: Page, name: string) => page.getByRole('radio', { name: new RegExp(name) });

async function placeBet(page: Page, guy: string, dog: string, amount: number) {
  await guyRadio(page, guy).click();
  await page.getByRole('radio', { name: new RegExp(dog) }).click();
  await page.getByRole('spinbutton').fill(String(amount));
  await page.getByRole('button', { name: /^(Apostar|Trocar aposta)$/ }).click();
}

/** O banco de dev guarda corridas de execuções anteriores: o teste compara com o que já existia. */
async function history(request: APIRequestContext) {
  const stats = (await (await request.get('/api/stats')).json()) as Record<string, number>;
  const [last] = (await (await request.get('/api/races?limit=1')).json()) as { id: number }[];
  return { total: Object.values(stats).reduce((a, b) => a + b, 0), lastId: last?.id ?? 0 };
}

test('três apostas, largada e vencedor: saldos mudam e a corrida entra no histórico', async ({ page, request }) => {
  const before = await history(request);
  await page.goto('/');

  const start = page.getByRole('button', { name: /Corram!/ });
  await expect(start).toBeDisabled();

  // Cada um aposta num cão diferente: um ganha e os outros dois perdem, então os três saldos mudam.
  await placeBet(page, 'João', 'Relâmpago', 10);
  await placeBet(page, 'Beto', 'Faísca', 15);
  await placeBet(page, 'Alfredo', 'Bolinha', 5);
  await expect(start).toBeEnabled();

  await start.click();
  await expect(page.getByRole('button', { name: /Correndo/ })).toBeDisabled();
  await expect(page.getByText(/venceu!/)).toBeVisible({ timeout: 30_000 });

  await expect(guyRadio(page, 'João')).not.toContainText(/R\$\s50\b/);
  await expect(guyRadio(page, 'Beto')).not.toContainText(/R\$\s75\b/);
  await expect(guyRadio(page, 'Alfredo')).not.toContainText(/R\$\s45\b/);

  await expect(page.getByText(`${before.total + 1} corridas`, { exact: true })).toBeVisible();
  const after = await history(request);
  expect(after.lastId).toBeGreaterThan(before.lastId);
  await expect(page.getByText(`Corrida #${after.lastId}`, { exact: true })).toBeVisible();
});

test('aposta acima de R$ 15 é bloqueada', async ({ page }) => {
  await page.goto('/');

  const amount = page.getByRole('spinbutton');
  await amount.fill('20');
  await expect(amount).toHaveValue('15');
  await expect(page.getByRole('button', { name: 'Aumentar' })).toBeDisabled();
  await expect(page.getByRole('slider', { name: 'Valor da aposta' })).toHaveAttribute('max', '15');

  await page.getByRole('button', { name: 'Apostar' }).click();
  await expect(guyRadio(page, 'João')).toContainText(/R\$\s15 no 1/);
  await expect(page.getByText(/R\$\s20\b/)).toHaveCount(0);
});
