/**
 * User Management Routes - User Management System
 *
 * This module handles all HTTP requests related to user management operations.
 * All endpoints require administrative privileges for access.
 *
 * Available endpoints:
 * - GET /api/users - Retrieve all users
 * - GET /api/users/:id - Retrieve specific user
 * - POST /api/users - Create new user
 * - PUT /api/users/:id - Update user
 * - DELETE /api/users/:id - Delete user
 *
 * @author Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { User, ROLES } = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * Retrieve All Users
 * GET /api/users
 *
 * Returns a list of all users in the system.
 * Administrative access required.
 *
 * @returns {Array} List of user objects (passwords excluded)
 */
router.get('/', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    // Get all users from the database (passwords are automatically excluded)
    const users = await User.getAllUsers();

    // Send the users back as JSON
    res.json(users);
  } catch (error) {
    console.error('Error getting all users:', error.message);
    res.status(500).json({ message: 'Could not retrieve users' });
  }
});

/**
 * Retrieve User by ID
 * GET /api/users/:id
 *
 * Returns detailed information for a specific user.
 * Administrative access required.
 *
 * @param {number} id - User ID
 * @returns {Object} User data (password excluded)
 */
router.get('/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user in the database
    const user = await User.findById(userId);

    // If user doesn't exist, return error
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user data (password excluded automatically)
    res.json(user);
  } catch (error) {
    console.error(`Error getting user ${req.params.id}:`, error.message);
    res.status(500).json({ message: 'Could not retrieve user' });
  }
});

/**
 * Create New User
 * POST /api/users
 *
 * Creates a new user account with validation.
 * Administrative access required.
 *
 * @body {string} username - Unique username
 * @body {string} email - Valid email address
 * @body {string} password - Password (minimum 6 characters)
 * @body {string} role - User role (admin or user)
 * @returns {Object} Created user data
 */
router.post('/', [
  // Authentication and authorization middleware
  authenticateToken,
  authorize(ROLES.ADMIN),

  // Input validation rules
  check('username', 'Username is required').notEmpty(),
  check('email', 'Please provide a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('role', 'Role must be either admin or user').isIn(['admin', 'user'])
], async (req, res) => {

  // Check if the input data is valid
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid input data',
      errors: errors.array()
    });
  }

  const { username, email, password, role } = req.body;

  try {
    // Check if username already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if email already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create the new user (password hashing handled automatically)
    const newUser = await User.createUser({
      username,
      email,
      password,
      role
    });

    // Return the created user (password excluded)
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: 'Could not create user' });
  }
});

/**
 * Update User
 * PUT /api/users/:id
 *
 * Updates user information with validation.
 * Administrative access required.
 *
 * @param {number} id - User ID to update
 * @body {string} [username] - New username
 * @body {string} [email] - New email address
 * @body {string} [password] - New password
 * @body {string} [role] - New role
 * @returns {Object} Updated user data
 */
router.put('/:id', [
  authenticateToken,
  authorize(ROLES.ADMIN),

  // Optional validation - only validate if fields are provided
  check('username').optional().notEmpty().withMessage('Username cannot be empty'),
  check('email').optional().isEmail().withMessage('Please provide a valid email'),
  check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('role').optional().isIn(['admin', 'user']).withMessage('Role must be either admin or user')
], async (req, res) => {

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid input data',
      errors: errors.array()
    });
  }

  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from removing their own admin privileges
    if (existingUser.id === req.user.id && req.body.role && req.body.role !== ROLES.ADMIN) {
      return res.status(400).json({
        message: 'You cannot remove your own admin privileges'
      });
    }

    // Prepare updates object with only the fields that are being changed
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;

    // Handle password update separately (needs hashing)
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updates.password = hashedPassword;
    }

    // Update basic user information
    let updatedUser = await User.updateUser(userId, updates);

    // Update role if provided (using separate method for clarity)
    if (req.body.role) {
      updatedUser = await User.updateUserRole(userId, req.body.role);
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Could not update user' });
  }
});

/**
 * Delete User
 * DELETE /api/users/:id
 *
 * Permanently removes a user from the system.
 * Administrative access required.
 *
 * @param {number} id - User ID to delete
 * @returns {Object} Success confirmation
 */
router.delete('/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    // Delete the user
    const deleted = await User.deleteUser(userId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }

    res.json({
      message: `User '${user.username}' deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Could not delete user' });
  }
});

module.exports = router;
