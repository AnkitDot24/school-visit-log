/**
 * Writes dump/visit_log.archive.gz with mongodump, using MONGODB_URI from server/.env.
 * Usage: npm run dump   (set MONGODUMP_PATH if mongodump is not on PATH)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { mongoUri } = require('../src/config/env');

const archive = path.resolve(__dirname, '../../dump/visit_log.archive.gz');
fs.mkdirSync(path.dirname(archive), { recursive: true });

const result = spawnSync(
  process.env.MONGODUMP_PATH || 'mongodump',
  [`--uri=${mongoUri}`, '--db=visit_log', '--gzip', `--archive=${archive}`],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Could not run mongodump: ${result.error.message}. Install MongoDB Database Tools or set MONGODUMP_PATH.`);
  process.exit(1);
}
if (result.status === 0) console.log(`Dump written to ${archive}`);
process.exit(result.status ?? 1);
