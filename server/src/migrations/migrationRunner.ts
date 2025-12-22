import { query, getClient } from '../config/database';

export interface Migration {
  id: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export const createMigrationsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row: { name: string }) => row.name);
};

export const recordMigration = async (name: string) => {
  await query('INSERT INTO migrations (name) VALUES ($1)', [name]);
};

export const removeMigrationRecord = async (name: string) => {
  await query('DELETE FROM migrations WHERE name = $1', [name]);
};

export const runMigration = async (migration: Migration) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await migration.up();
    await recordMigration(migration.name);
    await client.query('COMMIT');
    console.log(`✅ Migration ${migration.name} completed`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${migration.name} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

export const rollbackMigration = async (migration: Migration) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await migration.down();
    await removeMigrationRecord(migration.name);
    await client.query('COMMIT');
    console.log(`✅ Rollback ${migration.name} completed`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Rollback ${migration.name} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};
