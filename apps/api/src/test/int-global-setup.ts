import pg from 'pg';
import { createDb, migrate } from '../db';

const baseUrl = () => process.env.DATABASE_URL ?? 'postgres://lab:lab@localhost:5432/lab';

/** Banco separado para os testes de integração: o mesmo servidor, outro nome (`lab_test`). */
export const TEST_DB = 'lab_test';

export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const url = new URL(baseUrl());
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

/** Roda uma vez antes dos testes: cria o `lab_test` se não existir e aplica as migrations. */
export async function setup(): Promise<void> {
  if (!process.env.TEST_DATABASE_URL) {
    const admin = new pg.Client({ connectionString: baseUrl() });
    await admin.connect();
    try {
      const found = await admin.query('select 1 from pg_database where datname = $1', [TEST_DB]);
      if (found.rowCount === 0) await admin.query(`create database ${TEST_DB}`);
    } finally {
      await admin.end();
    }
  }
  const db = createDb(testDatabaseUrl());
  try {
    await migrate(db);
  } finally {
    await db.destroy();
  }
}
