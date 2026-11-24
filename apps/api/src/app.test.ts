import { describe, expect, it } from 'vitest';
import { validateRace } from './app';

const ok = { winner: 2, bets: [{ bettor: 'João', amount: 10, dog: 2, delta: 10 }] };

describe('validateRace', () => {
  it('aceita uma corrida coerente', () => {
    expect(validateRace(ok)).toBeNull();
  });

  it('recusa aposta fora de R$ 5 a R$ 15', () => {
    expect(validateRace({ ...ok, bets: [{ ...ok.bets[0], amount: 20, delta: 20 }] })).toMatch(/R\$ 5/);
  });

  it('recusa pagamento que não segue o dobro ou nada', () => {
    expect(validateRace({ ...ok, bets: [{ ...ok.bets[0], delta: 20 }] })).toBe('pagamento incoerente');
  });

  it('recusa vencedor inexistente e corrida sem apostas', () => {
    expect(validateRace({ ...ok, winner: 7 })).toMatch(/winner/);
    expect(validateRace({ winner: 1, bets: [] })).toMatch(/ao menos uma/);
  });
});
