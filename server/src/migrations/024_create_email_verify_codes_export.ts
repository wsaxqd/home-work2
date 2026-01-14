import { pool } from '../config/database';
import { Migration } from './migrationRunner';
import { up, down } from './024_create_email_verify_codes';

export const migration_024_create_email_verify_codes: Migration = {
  id: '024',
  name: '024_create_email_verify_codes',
  async up() {
    await up(pool);
  },
  async down() {
    await down(pool);
  }
};
