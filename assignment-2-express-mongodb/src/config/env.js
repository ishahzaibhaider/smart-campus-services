require('dotenv').config({ quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_campus_a2'
};
