import { pool } from '../config/database';
import { Migration } from './migrationRunner';
import { up, down } from './023_create_parent_tables';

export const migration_023_create_parent_tables: Migration = {
  id: '023',
  name: '023_create_parent_tables',
  async up() {
    await up(pool);
  },
  async down() {
    await down(pool);
  }
};
