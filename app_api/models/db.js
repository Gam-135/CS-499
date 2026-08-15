const mongoose = require('mongoose');
const readLine = require('readline');

// Build the connection string
const dbURI = 'mongodb://127.0.0.1:27017/travlr';

// Connect to MongoDB
const connect = () => {
  setTimeout(() => mongoose.connect(dbURI, {}), 1000);
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  console.log(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('error', err => {
  console.log('Mongoose connection error: ', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Windows-specific listener
if (process.platform === 'win32') {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}

// Graceful shutdown
const gracefulShutdown = msg => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
  });
};

// Shutdown invoked by nodemon restart
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart');
  process.kill(process.pid, 'SIGUSR2');
});

// Shutdown invoked by app termination
process.on('SIGINT', () => {
  gracefulShutdown('app termination');
  process.exit(0);
});

// Shutdown invoked by container termination
process.on('SIGTERM', () => {
  gracefulShutdown('app shutdown');
  process.exit(0);
});

// Make initial connection to DB
connect();

// Import Mongoose schema
require('./travlr');
require('./user');

module.exports = mongoose;