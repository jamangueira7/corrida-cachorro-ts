import { sql, type Kysely, type Migration } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = Kysely<any>;

export const migrations: Record<string, Migration> = {
  '0001_races_e_bets': {
    async up(db: AnyDb) {
      await db.schema
        .createTable('races')
        .addColumn('id', 'serial', (c) => c.primaryKey())
        .addColumn('winner', 'integer', (c) => c.notNull().check(sql`winner between 1 and 4`))
        .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
        .execute();
      await db.schema
        .createTable('bets')
        .addColumn('id', 'serial', (c) => c.primaryKey())
        .addColumn('race_id', 'integer', (c) => c.notNull().references('races.id').onDelete('cascade'))
        .addColumn('bettor', 'varchar(40)', (c) => c.notNull())
        .addColumn('amount', 'integer', (c) => c.notNull().check(sql`amount between 5 and 15`))
        .addColumn('dog', 'integer', (c) => c.notNull().check(sql`dog between 1 and 4`))
        .addColumn('delta', 'integer', (c) => c.notNull())
        .execute();
      await db.schema.createIndex('bets_race_id_idx').on('bets').column('race_id').execute();
    },
    async down(db: AnyDb) {
      await db.schema.dropTable('bets').execute();
      await db.schema.dropTable('races').execute();
    },
  },
};
