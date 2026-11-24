import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedRace, Stats } from './api';
import { App } from './App';

/** `fetch` falso com a API em memória: GET devolve o que foi salvo, POST acrescenta ao histórico. */
function mockApi(opts: { races?: SavedRace[]; stats?: Stats; offline?: boolean } = {}) {
  const saved = [...(opts.races ?? [])];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (opts.offline) throw new TypeError('Failed to fetch');
    const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Omit<SavedRace, 'id' | 'createdAt'>;
      saved.unshift({ ...body, id: saved.length + 1, createdAt: '2026-11-24T12:00:00Z' });
      return reply({ id: saved.length });
    }
    if (url.startsWith('/api/stats')) {
      const wins: Stats = {};
      for (const r of saved) wins[r.winner] = (wins[r.winner] ?? 0) + 1;
      return reply(opts.stats ?? wins);
    }
    return reply(saved);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Cão 1 anda 4 casas por passo e os outros 1: o cão 1 vence em 25 passos (2,25 s). */
function dogOneWins() {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => [0.99, 0, 0, 0][i++ % 4]!);
}

const advance = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const corram = () => screen.getByRole('button', { name: /Corram!/ });
const guyRadio = (name: RegExp) => screen.getByRole('radio', { name });

async function renderApp() {
  render(<App />);
  await advance(0);
}

async function bet(u: ReturnType<typeof user>, guy: RegExp, dog: RegExp, amount?: string) {
  await u.click(guyRadio(guy));
  await u.click(screen.getByRole('radio', { name: dog }));
  if (amount) fireEvent.change(screen.getByRole('spinbutton'), { target: { value: amount } });
  await u.click(screen.getByRole('button', { name: /Apostar|Trocar aposta/ }));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('balcão de apostas', () => {
  it('mostra os três apostadores com o saldo inicial e "Corram!" desabilitado sem aposta', async () => {
    mockApi();
    await renderApp();
    expect(guyRadio(/João.*R\$\s50/)).toBeInTheDocument();
    expect(guyRadio(/Beto.*R\$\s75/)).toBeInTheDocument();
    expect(guyRadio(/Alfredo.*R\$\s45/)).toBeInTheDocument();
    expect(corram()).toBeDisabled();
  });

  it('escolhe o apostador e mostra o nome dele no campo de valor', async () => {
    mockApi();
    await renderApp();
    expect(guyRadio(/João/)).toBeChecked();
    await user().click(guyRadio(/Beto/));
    expect(guyRadio(/Beto/)).toBeChecked();
    expect(screen.getByLabelText('Valor da aposta de Beto')).toBeInTheDocument();
  });

  it('o stepper anda de R$ 5 a R$ 15 e trava nos extremos', async () => {
    mockApi();
    await renderApp();
    const u = user();
    const amount = screen.getByRole('spinbutton');
    expect(amount).toHaveValue(5);
    expect(screen.getByRole('button', { name: 'Diminuir' })).toBeDisabled();
    for (let i = 0; i < 12; i++) await u.click(screen.getByRole('button', { name: 'Aumentar' }));
    expect(amount).toHaveValue(15);
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDisabled();
    await u.click(screen.getByRole('button', { name: 'Diminuir' }));
    expect(amount).toHaveValue(14);
  });

  it('valores digitados fora de R$ 5 a R$ 15 são corrigidos para o limite', async () => {
    mockApi();
    await renderApp();
    const amount = screen.getByRole('spinbutton');
    fireEvent.change(amount, { target: { value: '20' } });
    expect(amount).toHaveValue(15);
    fireEvent.change(amount, { target: { value: '1' } });
    expect(amount).toHaveValue(5);
    fireEvent.change(screen.getByRole('slider', { name: 'Valor da aposta' }), { target: { value: '9' } });
    expect(amount).toHaveValue(9);
  });

  it('escolhe o cão e registra a aposta, habilitando "Corram!"', async () => {
    mockApi();
    await renderApp();
    const u = user();
    await u.click(screen.getByRole('radio', { name: /Faísca/ }));
    expect(screen.getByRole('radio', { name: /Faísca/ })).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Apostar' }));
    expect(screen.getByText(/R\$\s5 no 3/)).toBeInTheDocument();
    expect(guyRadio(/Beto/)).toBeChecked(); // o balcão passa para quem ainda não apostou
    expect(corram()).toBeEnabled();
  });

  it('cancela a aposta e volta a desabilitar "Corram!"', async () => {
    mockApi();
    await renderApp();
    const u = user();
    await bet(u, /João/, /Bolinha/, '12');
    await u.click(guyRadio(/João/));
    expect(screen.getByRole('button', { name: 'Trocar aposta' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Cancelar aposta' }));
    expect(screen.getAllByText('sem aposta')).toHaveLength(3);
    expect(corram()).toBeDisabled();
  });
});

describe('corrida', () => {
  it('trava os botões durante a corrida e termina com o vencedor e os saldos atualizados', async () => {
    const fetchMock = mockApi();
    dogOneWins();
    await renderApp();
    const u = user();
    await bet(u, /João/, /Relâmpago/, '10');
    await bet(u, /Beto/, /Bolinha/, '5');
    await u.click(corram());

    expect(screen.getByRole('button', { name: /Correndo/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nova rodada' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apostar' })).toBeDisabled();
    expect(guyRadio(/Alfredo/)).toBeDisabled();
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByText(/Valendo!/)).toBeInTheDocument();

    await advance(1000);
    expect(screen.getByRole('button', { name: /Correndo/ })).toBeDisabled();

    await advance(2000);
    expect(screen.getByText(/Relâmpago venceu!/)).toBeInTheDocument();
    expect(guyRadio(/João.*R\$\s60/)).toBeInTheDocument();
    expect(guyRadio(/Beto.*R\$\s70/)).toBeInTheDocument();
    expect(guyRadio(/Alfredo.*R\$\s45/)).toBeInTheDocument();
    expect(screen.getByText('+R$ 10')).toBeInTheDocument();
    expect(screen.getByText('−R$ 5')).toBeInTheDocument();
    expect(corram()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nova rodada' })).toBeEnabled();

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({
      winner: 1,
      bets: [
        { bettor: 'João', amount: 10, dog: 1, delta: 10 },
        { bettor: 'Beto', amount: 5, dog: 2, delta: -5 },
      ],
    });
  });

  it('a corrida salva aparece no histórico e nas vitórias por cão', async () => {
    mockApi();
    dogOneWins();
    await renderApp();
    expect(screen.getByText('As corridas aparecem aqui.')).toBeInTheDocument();
    await bet(user(), /João/, /Relâmpago/);
    await user().click(corram());
    await advance(3000);
    expect(screen.getByText('Corrida #1')).toBeInTheDocument();
    expect(screen.getByText('1 corridas')).toBeInTheDocument();
  });

  it('"Nova rodada" devolve os saldos iniciais e limpa o último resultado', async () => {
    mockApi();
    dogOneWins();
    await renderApp();
    const u = user();
    await bet(u, /João/, /Relâmpago/, '15');
    await u.click(corram());
    await advance(3000);
    expect(guyRadio(/João.*R\$\s65/)).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Nova rodada' }));
    expect(guyRadio(/João.*R\$\s50/)).toBeInTheDocument();
    expect(screen.getByText('Nenhuma corrida nesta rodada ainda.')).toBeInTheDocument();
    expect(corram()).toBeDisabled();
  });
});

describe('histórico e API', () => {
  it('mostra o histórico e as vitórias por cão vindos da API', async () => {
    mockApi({
      races: [
        {
          id: 12,
          winner: 2,
          createdAt: '2026-11-20T15:30:00Z',
          bets: [
            { bettor: 'João', amount: 10, dog: 2, delta: 10 },
            { bettor: 'Beto', amount: 5, dog: 4, delta: -5 },
          ],
        },
      ],
      stats: { 1: 11, 2: 7, 3: 5, 4: 9 },
    });
    await renderApp();
    expect(screen.getByText('Corrida #12')).toBeInTheDocument();
    expect(screen.getByText('J +R$ 10')).toBeInTheDocument();
    expect(screen.getByText('B −R$ 5')).toBeInTheDocument();

    const wins = within(screen.getByRole('heading', { name: 'Vitórias por cão' }).closest('section')!);
    expect(wins.getByText('32 corridas')).toBeInTheDocument();
    for (const n of ['11', '7', '5', '9']) expect(wins.getByText(n)).toBeInTheDocument();
  });

  it('avisa quando a API está fora do ar', async () => {
    mockApi({ offline: true });
    await renderApp();
    expect(screen.getByText('Histórico indisponível: a API não respondeu.')).toBeInTheDocument();
    expect(screen.queryByText('As corridas aparecem aqui.')).not.toBeInTheDocument();
  });
});
