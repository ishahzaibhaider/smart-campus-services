// Runs the API on a throw-away in-memory MongoDB with sample data (no MongoDB install needed)
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('smart_campus');
  const start = require('../src/server');
  await start();
  await require('./seed')();
  const stop = async () => { await require('mongoose').disconnect(); await mongod.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch(err => { console.error(err); process.exit(1); });
