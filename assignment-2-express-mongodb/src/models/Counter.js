// Atomic counter used to generate readable ids such as REQ-101
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 100 } }, { versionKey: false });
const Counter = mongoose.model('Counter', counterSchema);

Counter.next = async name => {
  const c = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return c.seq;
};

module.exports = Counter;
