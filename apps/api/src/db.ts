import { Kysely, Migrator, PostgresDialect, type Generated } from 'kysely';
import pg from 'pg';
import { migrations } from './migrations/index';

export interface RacesTable {
  id: Generated<number>;
  winner: number;
  created_at: Generated<Date>;
}

export interface BetsTable {
  id: Generated<number>;
  race_id: number;
  bettor: string;
  amount: number;
  dog: number;
  delta: number;
}

export interface Database {
  races: RacesTable;
  bets: BetsTable;
}

export function createDb(url = process.env.DATABASE_URL ?? 'postgres://lab:lab@localhost:5432/lab') {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: url }) }),
  });
}

/** Aplica as migrations pendentes (equivalente ao banco do cap. 1). */
export async function migrate(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({ db, provider: { getMigrations: async () => migrations } });
  const { error, results } = await migrator.migrateToLatest();
  for (const r of results ?? []) console.log(`migration ${r.migrationName}: ${r.status}`);
  if (error) throw error;
}
