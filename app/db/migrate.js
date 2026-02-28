const fs = require('fs');
const path = require('path');
const knex = require('knex');
const config = require('./knexfile');

async function run() {
  const dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = knex(config);
  await db.migrate.latest();
  await db.destroy();
  console.log('Migrations completed.');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
