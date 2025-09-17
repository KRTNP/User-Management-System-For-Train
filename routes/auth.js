/**
 * Authentication Routes - User Management System
 *
 * This module handles user authentication operations including
 * registration, login, and profile management with JWT token support.
 *
 * Available endpoints:
 * - POST /api/auth/register - User registration
 * - POST /api/auth/login - User authentication
 * - GET /api/auth/me - Profile retrieval
 *
 * @author Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('../config/default');
const { User, ROLES } = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

/**
 * User Registration
 * POST /api/auth/register
 *
 * Creates a new user account with validation and returns JWT token.
 * Public endpoint - no authentication required.
 *
 * @body {string} username - Unique username
 * @body {string} email - Valid email address
 * @body {string} password - Password (minimum 6 characters)
 * @returns {Object} JWT token and user data
 */
router.post('/register', [
  // Input validation rules
  check('username', 'Username is required').notEmpty(),
  check('email', 'Please provide a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {

  // Check if the input data is valid
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  const { username, email, password } = req.body;

  try {
    // Check if username is already taken
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if email is already registered
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create the new user (password hashing handled automatically in User model)
    const newUser = await User.createUser({
      username,
      email,
      password,
      role: ROLES.USER // All new registrations get 'user' role by default
    });

    console.log(`New user registered: ${username}`);

    // Create a JWT token for immediate login after registration
    const tokenPayload = {
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    };

    // Generate the JWT token
    const token = jwt.sign(
      tokenPayload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    // Send back the token and basic user info (no password)
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed, please try again' });
  }
});

/**
 * User Authentication
 * POST /api/auth/login
 *
 * Authenticates user credentials and returns JWT token.
 * Public endpoint for user login.
 *
 * @body {string} username - User's username
 * @body {string} password - User's password
 * @returns {Object} JWT token and user data
 */
router.post('/login', [
  // Input validation
  check('username', 'Username is required').notEmpty(),
  check('password', 'Password is required').notEmpty()
], async (req, res) => {

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Please provide username and password',
      errors: errors.array()
    });
  }

  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check if the password matches (using the User model method)
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    console.log(`User authenticated: ${username} (${user.role})`);

    // Create JWT token payload
    const tokenPayload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    // Generate JWT token
    const token = jwt.sign(
      tokenPayload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    // Send back token and user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login failed, please try again' });
  }
});

/**
 * User Profile Retrieval
 * GET /api/auth/me
 *
 * Returns current user's profile information.
 * Requires valid JWT authentication token.
 *
 * @header {string} Authorization - Bearer JWT token
 * @returns {Object} User profile data
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user is set by the authenticateToken middleware
    const userId = req.user.id;

    // Get the full user details from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile (password automatically excluded by toJSON method)
    res.json({
      message: 'Profile retrieved successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error getting user profile:', error.message);
    res.status(500).json({ message: 'Could not retrieve profile' });
  }
});

module.exports = router;
