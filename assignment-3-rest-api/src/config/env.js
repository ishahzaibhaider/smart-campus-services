require('dotenv').config({ quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_campus',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:4200').split(',').map(s => s.trim()).filter(Boolean)
};
