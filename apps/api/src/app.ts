import Fastify from 'fastify';
import type { Kysely } from 'kysely';
import { MAX_BET, MIN_BET, type RaceResult } from '@lab/domain';
import type { Database } from './db';

const isDog = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 4;

/** Confere o corpo de `POST /api/races`. Devolve a mensagem de erro ou `null`. */
export function validateRace(body: unknown): string | null {
  const race = body as Partial<RaceResult> | null;
  if (!race || !isDog(race.winner)) return 'winner deve ser um cão de 1 a 4';
  if (!Array.isArray(race.bets) || race.bets.length === 0) return 'a corrida precisa de ao menos uma aposta';
  for (const bet of race.bets) {
    if (typeof bet?.bettor !== 'string' || bet.bettor.length === 0) return 'aposta sem apostador';
    if (!Number.isInteger(bet.amount) || bet.amount < MIN_BET || bet.amount > MAX_BET)
      return `aposta deve ser de R$ ${MIN_BET} a R$ ${MAX_BET}`;
    if (!isDog(bet.dog)) return 'aposta em cão inexistente';
    if (bet.delta !== (bet.dog === race.winner ? bet.amount : -bet.amount)) return 'pagamento incoerente';
  }
  return null;
}

export function buildApp(db: Kysely<Database>) {
  const app = Fastify({ logger: { level: 'info' } });

  app.get('/api/health', async () => ({ ok: true }));

  app.get<{ Querystring: { limit?: string } }>('/api/races', async (req) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const races = await db.selectFrom('races').selectAll().orderBy('id', 'desc').limit(limit).execute();
    const bets = races.length
      ? await db.selectFrom('bets').selectAll().where('race_id', 'in', races.map((r) => r.id)).execute()
      : [];
    return races.map((race) => ({
      id: race.id,
      winner: race.winner,
      createdAt: race.created_at,
      bets: bets
        .filter((b) => b.race_id === race.id)
        .map(({ bettor, amount, dog, delta }) => ({ bettor, amount, dog, delta })),
    }));
  });

  app.get('/api/stats', async () => {
    const rows = await db
      .selectFrom('races')
      .select(['winner', db.fn.countAll<number>().as('wins')])
      .groupBy('winner')
      .execute();
    return Object.fromEntries(rows.map((r) => [r.winner, Number(r.wins)]));
  });

  app.post('/api/races', async (req, reply) => {
    const error = validateRace(req.body);
    if (error) return reply.code(422).send({ error });
    const race = req.body as RaceResult;
    const id = await db.transaction().execute(async (trx) => {
      const { id } = await trx
        .insertInto('races')
        .values({ winner: race.winner })
        .returning('id')
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('bets')
        .values(race.bets.map((b) => ({ race_id: id, bettor: b.bettor, amount: b.amount, dog: b.dog, delta: b.delta })))
        .execute();
      return id;
    });
    return reply.code(201).send({ id });
  });

  return app;
}
