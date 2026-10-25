const { port, mongoUri } = require('./config/env');
const { connectDB } = require('./config/db');
const createApp = require('./app');

async function start() {
  await connectDB(mongoUri);
  const app = createApp();
  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Assignment 2 server on http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start().catch(err => { console.error('Failed to start:', err.message); process.exit(1); });
}

module.exports = start;
