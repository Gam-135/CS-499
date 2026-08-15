const mongoose = require('mongoose');
const passport = require('passport');

const User = mongoose.model('users');

/**
 * Creates a new user account and returns a JWT.
 */
const register = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Name, email, and password are required.'
    });
  }

  try {
    const user = new User({
      name,
      email
    });

    user.setPassword(password);
    await user.save();

    return res.status(201).json({
      token: user.generateJWT()
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: 'An account with that email address already exists.'
      });
    }

    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors).map(
        validationError => validationError.message
      );

      return res.status(400).json({
        message: 'Account validation failed.',
        details
      });
    }

    console.error('Registration error:', error.message);

    return res.status(500).json({
      message: 'The account could not be created. Please try again.'
    });
  }
};

/**
 * Authenticates an existing user and returns a JWT.
 */
const login = (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required.'
    });
  }

  passport.authenticate('local', (error, user, info) => {
    if (error) {
      console.error('Authentication error:', error.message);
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || 'The email or password is incorrect.'
      });
    }

    return res.status(200).json({
      token: user.generateJWT()
    });
  })(req, res, next);
};

module.exports = {
  register,
  login
};