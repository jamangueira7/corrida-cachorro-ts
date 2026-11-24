import { sql, type Kysely } from 'kysely';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { createDb, type Database } from './db';
import { testDatabaseUrl } from './test/int-global-setup';

let db: Kysely<Database>;
let app: FastifyInstance;

beforeAll(async () => {
  db = createDb(testDatabaseUrl());
  app = buildApp(db);
  await app.ready();
});

beforeEach(async () => {
  await sql`truncate table bets, races restart identity cascade`.execute(db);
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

interface BetInput {
  bettor: string;
  amount: number;
  dog: number;
}

/** Monta o corpo de `POST /api/races` com o pagamento coerente (dobro ou nada). */
const raceBody = (winner: number, bets: BetInput[]) => ({
  winner,
  bets: bets.map((b) => ({ ...b, delta: b.dog === winner ? b.amount : -b.amount })),
});

const postRace = (payload: unknown) => app.inject({ method: 'POST', url: '/api/races', payload: payload as object });
const countRows = async (table: 'races' | 'bets') => (await db.selectFrom(table).selectAll().execute()).length;

describe('API com Postgres real', () => {
  it('responde ao health check', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('começa vazia: sem corridas e sem vitórias', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/races' })).json()).toEqual([]);
    expect((await app.inject({ method: 'GET', url: '/api/stats' })).json()).toEqual({});
  });

  it('cria uma corrida (201) e a lista com as apostas', async () => {
    const res = await postRace(
      raceBody(2, [
        { bettor: 'João', amount: 10, dog: 2 },
        { bettor: 'Beto', amount: 5, dog: 4 },
      ]),
    );
    expect(res.statusCode).toBe(201);
    const { id } = res.json<{ id: number }>();

    const [race] = (await app.inject({ method: 'GET', url: '/api/races' })).json<
      { id: number; winner: number; createdAt: string; bets: unknown[] }[]
    >();
    expect(race).toMatchObject({
      id,
      winner: 2,
      bets: [
        { bettor: 'João', amount: 10, dog: 2, delta: 10 },
        { bettor: 'Beto', amount: 5, dog: 4, delta: -5 },
      ],
    });
    expect(Number.isNaN(Date.parse(race!.createdAt))).toBe(false);
    expect(await countRows('bets')).toBe(2);
  });

  it.each([
    ['vencedor inexistente', raceBody(7, [{ bettor: 'João', amount: 10, dog: 1 }])],
    ['corrida sem apostas', { winner: 1, bets: [] }],
    ['aposta acima de R$ 15', raceBody(1, [{ bettor: 'João', amount: 20, dog: 1 }])],
    ['aposta abaixo de R$ 5', raceBody(1, [{ bettor: 'João', amount: 2, dog: 1 }])],
    ['cão inexistente', raceBody(1, [{ bettor: 'João', amount: 10, dog: 9 }])],
    ['pagamento incoerente', { winner: 1, bets: [{ bettor: 'João', amount: 10, dog: 1, delta: 99 }] }],
  ])('recusa com 422 e não grava: %s', async (_nome, body) => {
    const res = await postRace(body);
    expect(res.statusCode).toBe(422);
    expect(res.json()).toHaveProperty('error');
    expect(await countRows('races')).toBe(0);
    expect(await countRows('bets')).toBe(0);
  });

  it('recusa JSON quebrado com 400 e não grava', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/races',
      headers: { 'content-type': 'application/json' },
      payload: '{"winner": 1, "bets": [',
    });
    expect(res.statusCode).toBe(400);
    expect(await countRows('races')).toBe(0);
  });

  it('lista da corrida mais nova para a mais antiga e respeita o limite', async () => {
    const ids: number[] = [];
    for (const winner of [1, 2, 3]) {
      const res = await postRace(raceBody(winner, [{ bettor: 'João', amount: 5, dog: 1 }]));
      ids.push(res.json<{ id: number }>().id);
    }
    const all = (await app.inject({ method: 'GET', url: '/api/races' })).json<{ id: number }[]>();
    expect(all.map((r) => r.id)).toEqual([...ids].reverse());

    const two = (await app.inject({ method: 'GET', url: '/api/races?limit=2' })).json<{ id: number }[]>();
    expect(two.map((r) => r.id)).toEqual([ids[2], ids[1]]);
  });

  it('cada corrida traz só as suas apostas', async () => {
    await postRace(raceBody(1, [{ bettor: 'João', amount: 10, dog: 1 }]));
    await postRace(
      raceBody(3, [
        { bettor: 'Beto', amount: 7, dog: 3 },
        { bettor: 'Alfredo', amount: 5, dog: 1 },
      ]),
    );
    const races = (await app.inject({ method: 'GET', url: '/api/races' })).json<
      { winner: number; bets: { bettor: string }[] }[]
    >();
    expect(races.map((r) => [r.winner, r.bets.map((b) => b.bettor).sort()])).toEqual([
      [3, ['Alfredo', 'Beto']],
      [1, ['João']],
    ]);
  });

  it('conta as vitórias por cão', async () => {
    for (const winner of [1, 1, 3, 4, 1]) await postRace(raceBody(winner, [{ bettor: 'João', amount: 5, dog: 2 }]));
    const stats = (await app.inject({ method: 'GET', url: '/api/stats' })).json();
    expect(stats).toEqual({ '1': 3, '3': 1, '4': 1 });
  });
});
