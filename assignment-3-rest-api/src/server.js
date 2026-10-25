const { port, mongoUri } = require('./config/env');
const { connectDB } = require('./config/db');
const createApp = require('./app');

async function start() {
  await connectDB(mongoUri);
  const app = createApp();
  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Smart Campus REST API on http://localhost:${port}/api`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start().catch(err => { console.error('Failed to start:', err.message); process.exit(1); });
}

module.exports = start;
