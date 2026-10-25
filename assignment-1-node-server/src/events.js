// A single EventEmitter shared by the app (Node.js events module)
const { EventEmitter } = require('events');

module.exports = new EventEmitter();
