const path = require('path');

const basePath = path.resolve(__dirname);
const dataDir = path.resolve(basePath, 'data');

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: path.join(dataDir, 'ia-test-board.sqlite3')
  },
  migrations: {
    directory: path.join(basePath, 'migrations'),
    extension: 'js'
  },
  seeds: {
    directory: path.join(basePath, 'seeds')
  },
  useNullAsDefault: true
};
