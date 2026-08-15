const mongoose = require('mongoose');

const Trip = mongoose.model('trips');

/**
 * Escapes special characters before placing user input
 * inside a regular expression.
 */
const escapeRegex = value =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Creates a case-insensitive exact-match query for trip codes.
 * This supports older records that may not be uppercase.
 */
const tripCodeQuery = tripCode => {
  const normalizedCode =
    typeof tripCode === 'string'
      ? tripCode.trim()
      : '';

  if (!normalizedCode) {
    return null;
  }

  return {
    code: {
      $regex: new RegExp(
        `^${escapeRegex(normalizedCode)}$`,
        'i'
      )
    }
  };
};

/**
 * Converts database errors into consistent API responses.
 */
const sendDatabaseError = (res, error) => {
  if (error?.code === 11000) {
    return res.status(409).json({
      message: 'A trip with that code already exists.'
    });
  }

  if (error?.name === 'ValidationError') {
    const details = Object.values(error.errors).map(
      validationError => validationError.message
    );

    return res.status(400).json({
      message: 'Trip validation failed.',
      details
    });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid value provided for ${error.path}.`
    });
  }

  console.error('Trip database error:', error.message);

  return res.status(500).json({
    message: 'An unexpected server error occurred.'
  });
};

/**
 * POST: /api/trips
 * Creates a new trip.
 */
const tripsAddTrip = async (req, res) => {
  try {
    const requestedCode =
      typeof req.body.code === 'string'
        ? req.body.code.trim().toUpperCase()
        : '';

    if (!requestedCode) {
      return res.status(400).json({
        message: 'A trip code is required.'
      });
    }

    // Explicit duplicate check because an existing database
    // may not have created the unique index yet.
    const existingTrip = await Trip.findOne(
      tripCodeQuery(requestedCode)
    ).exec();

    if (existingTrip) {
      return res.status(409).json({
        message: 'A trip with that code already exists.'
      });
    }

    const newTrip = await Trip.create({
      code: requestedCode,
      name: req.body.name,
      length: req.body.length,
      start: req.body.start,
      resort: req.body.resort,
      perPerson: req.body.perPerson,
      image: req.body.image,
      description: req.body.description
    });

    return res.status(201).json(newTrip);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

/**
 * GET: /api/trips
 * Returns all trips.
 */
const tripsList = async (req, res) => {
  try {
    const trips = await Trip.find({})
      .sort({ start: 1 })
      .exec();

    return res.status(200).json(trips);
  } catch (error) {
    console.error('Unable to retrieve trips:', error.message);

    return res.status(500).json({
      message: 'Unable to retrieve trips.'
    });
  }
};

/**
 * GET: /api/trips/:tripCode
 * Returns one trip by its code.
 */
const tripsFindByCode = async (req, res) => {
  const query = tripCodeQuery(req.params.tripCode);

  if (!query) {
    return res.status(400).json({
      message: 'A trip code is required.'
    });
  }

  try {
    const trip = await Trip.findOne(query).exec();

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('Unable to retrieve trip:', error.message);

    return res.status(500).json({
      message: 'Unable to retrieve the requested trip.'
    });
  }
};

/**
 * PUT: /api/trips/:tripCode
 * Updates an existing trip.
 */
const tripsUpdateTrip = async (req, res) => {
  const originalQuery = tripCodeQuery(
    req.params.tripCode
  );

  if (!originalQuery) {
    return res.status(400).json({
      message: 'A trip code is required.'
    });
  }

  try {
    const requestedCode =
      typeof req.body.code === 'string'
        ? req.body.code.trim().toUpperCase()
        : '';

    if (!requestedCode) {
      return res.status(400).json({
        message: 'A trip code is required.'
      });
    }

    const currentTrip = await Trip.findOne(
      originalQuery
    ).exec();

    if (!currentTrip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    const duplicateTrip = await Trip.findOne({
      ...tripCodeQuery(requestedCode),
      _id: {
        $ne: currentTrip._id
      }
    }).exec();

    if (duplicateTrip) {
      return res.status(409).json({
        message: 'A trip with that code already exists.'
      });
    }

    currentTrip.code = requestedCode;
    currentTrip.name = req.body.name;
    currentTrip.length = req.body.length;
    currentTrip.start = req.body.start;
    currentTrip.resort = req.body.resort;
    currentTrip.perPerson = req.body.perPerson;
    currentTrip.image = req.body.image;
    currentTrip.description = req.body.description;

    const updatedTrip = await currentTrip.save();

    return res.status(200).json(updatedTrip);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

/**
 * DELETE: /api/trips/:tripCode
 * Deletes an existing trip.
 */
const tripsDeleteTrip = async (req, res) => {
  const query = tripCodeQuery(req.params.tripCode);

  if (!query) {
    return res.status(400).json({
      message: 'A trip code is required.'
    });
  }

  try {
    const deletedTrip = await Trip.findOneAndDelete(
      query
    ).exec();

    if (!deletedTrip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    return res.status(200).json({
      message: 'Trip deleted successfully.'
    });
  } catch (error) {
    console.error('Unable to delete trip:', error.message);

    return res.status(500).json({
      message: 'Unable to delete the trip.'
    });
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripsAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip
};