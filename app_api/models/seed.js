const mongoose = require('./db');
const fs = require('fs');
const Trip = mongoose.model('trips');

const trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

const seedDB = async () => {
  try {
    await Trip.deleteMany({});
    await Trip.insertMany(trips);
    console.log('Database seeded successfully');
    console.log(`${trips.length} trips inserted`);
  } catch (err) {
    console.error('Database seed failed:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();