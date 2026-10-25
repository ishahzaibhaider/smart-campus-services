// Migrates the JSON file of Assignment 1 into MongoDB using the official MongoDB Node.js driver
// (no Mongoose here, to show the low-level client). Run: npm run import:a1 [path/to/requests.json]
const fs = require('fs/promises');
const path = require('path');
const { MongoClient } = require('mongodb');
const { mongoUri } = require('../src/config/env');

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'assignment-1-node-server', 'data', 'requests.json');

async function importFromA1(uri = mongoUri) {
  const old = JSON.parse(await fs.readFile(FILE, 'utf8'));
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    const users = db.collection('users');
    const categories = db.collection('categories');
    const requests = db.collection('servicerequests');
    let imported = 0;
    for (const r of old) {
      if (await requests.findOne({ requestId: r.id })) continue; // already imported
      // A1 stored names as plain text; A2 references documents in other collections
      const email = `${r.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@campus.edu`;
      const user = await users.findOneAndUpdate({ name: r.name },
        { $setOnInsert: { name: r.name, email, type: 'Student', createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' });
      const code = r.category.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
      const category = await categories.findOneAndUpdate({ name: r.category },
        { $setOnInsert: { name: r.category, code, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' });
      await requests.insertOne({
        requestId: r.id, requester: user._id, category: category._id, description: r.description,
        priority: r.priority, status: r.status, date: new Date(r.date), createdAt: new Date(), updatedAt: new Date()
      });
      imported++;
    }
    console.log(`Imported ${imported} of ${old.length} requests from ${FILE}`);
    return imported;
  } finally {
    await client.close();
  }
}

if (require.main === module) importFromA1().catch(err => { console.error(err.message); process.exit(1); });

module.exports = importFromA1;
