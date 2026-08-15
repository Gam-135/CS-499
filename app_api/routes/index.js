const express = require('express');
const { expressjwt: jwt } = require('express-jwt');

const authController = require('../controllers/authentication');
const tripsController = require('../controllers/trips');

const router = express.Router();

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not configured. Add it to the environment variables.'
  );
}

const auth = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
});

// Public trip routes and protected trip creation
router
  .route('/trips')
  .get(tripsController.tripsList)
  .post(auth, tripsController.tripsAddTrip);

// Public registration route
router
  .route('/register')
  .post(authController.register);

// Public single-trip route and protected modification routes
router
  .route('/trips/:tripCode')
  .get(tripsController.tripsFindByCode)
  .put(auth, tripsController.tripsUpdateTrip)
  .delete(auth, tripsController.tripsDeleteTrip);

// Public login route
router
  .route('/login')
  .post(authController.login);

module.exports = router;