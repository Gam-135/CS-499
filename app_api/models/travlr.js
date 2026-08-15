const mongoose = require('mongoose');

// Define the trip schema
const tripSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Trip code is required.'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [3, 'Trip code must be at least 3 characters.'],
    maxlength: [20, 'Trip code cannot exceed 20 characters.'],
    match: [
      /^[A-Z0-9-]+$/,
      'Trip code may contain only letters, numbers, and hyphens.'
    ]
  },

  name: {
    type: String,
    required: [true, 'Trip name is required.'],
    trim: true,
    minlength: [3, 'Trip name must be at least 3 characters.'],
    maxlength: [100, 'Trip name cannot exceed 100 characters.'],
    index: true
  },

  length: {
    type: Number,
    required: [true, 'Trip length is required.'],
    min: [1, 'Trip length must be at least 1 day.']
  },

  start: {
    type: Date,
    required: [true, 'A start date is required.']
  },

  resort: {
    type: String,
    required: [true, 'Resort name is required.'],
    trim: true,
    minlength: [2, 'Resort name must be at least 2 characters.'],
    maxlength: [100, 'Resort name cannot exceed 100 characters.']
  },

  perPerson: {
    type: Number,
    required: [true, 'Price per person is required.'],
    min: [0.01, 'Price per person must be greater than zero.']
  },

  image: {
    type: String,
    required: [true, 'Image filename is required.'],
    trim: true,
    maxlength: [255, 'Image filename cannot exceed 255 characters.']
  },

  description: {
    type: String,
    required: [true, 'Trip description is required.'],
    trim: true,
    minlength: [20, 'Trip description must be at least 20 characters.'],
    maxlength: [1000, 'Trip description cannot exceed 1,000 characters.']
  }
});

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;