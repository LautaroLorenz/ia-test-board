import * as fs from 'fs';
import * as path from 'path';
import knex, { Knex } from 'knex';

const knexConfig = require('./knexfile');

let dbInstance: Knex | null = null;

function ensureDataDirectory(): void {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getDb(): Knex {
  if (!dbInstance) {
    ensureDataDirectory();
    dbInstance = knex(knexConfig);
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();
  const [batchNo, migrations] = await db.migrate.latest();

  if (migrations.length > 0) {
    console.log(`[db] Applied ${migrations.length} migration(s) in batch ${batchNo}: ${migrations.join(', ')}`);
  } else {
    console.log('[db] Schema is up to date.');
  }
}
