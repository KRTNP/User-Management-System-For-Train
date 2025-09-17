/**
 * User Model - User Management System
 *
 * This module contains the User data model and all database operations
 * related to user management. It provides a clean abstraction layer
 * between the application logic and database operations.
 *
 * @author Development Team
 * @version 1.0.0
 */

const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Define user roles - makes code more readable and prevents typos
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

class User {
  // Constructor - creates a new User object from database data
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || ROLES.USER;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  /**
   * Retrieve All Users
   *
   * Fetches all users from the database with password field excluded
   * for security purposes. Results are ordered by creation date.
   *
   * @returns {Promise<User[]>} Array of User instances
   * @throws {Error} Database operation errors
   */
  static async getAllUsers() {
    try {
      const query = `
        SELECT id, username, email, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `;

      const [rows] = await pool.query(query);
      return rows.map(row => new User(row));
    } catch (error) {
      console.error('Error retrieving users:', error);
      throw new Error('Database query failed: unable to retrieve users');
    }
  }

  /**
   * Find User by ID
   *
   * Retrieves a single user by their unique identifier.
   *
   * @param {number} userId - User ID to search for
   * @returns {Promise<User|null>} User instance or null if not found
   * @throws {Error} Database operation errors
   */
  static async findById(userId) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const [rows] = await pool.query(query, [userId]);
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Database query failed: unable to find user by ID');
    }
  }

  /**
   * Find User by Username
   *
   * Retrieves a user by their unique username.
   * Primarily used for authentication operations.
   *
   * @param {string} username - Username to search for
   * @returns {Promise<User|null>} User instance or null if not found
   * @throws {Error} Database operation errors
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = ?';
      const [rows] = await pool.query(query, [username]);
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Database query failed: unable to find user by username');
    }
  }

  /**
   * Find User by Email
   *
   * Retrieves a user by their email address.
   * Used for registration validation and account recovery.
   *
   * @param {string} email - Email address to search for
   * @returns {Promise<User|null>} User instance or null if not found
   * @throws {Error} Database operation errors
   */
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const [rows] = await pool.query(query, [email]);
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database query failed: unable to find user by email');
    }
  }

  /**
   * Create New User
   *
   * Creates a new user account with secure password hashing.
   * Validates input parameters and handles database insertion.
   *
   * @param {Object} userData - User data object
   * @param {string} userData.username - Unique username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} [userData.role=user] - User role
   * @returns {Promise<User>} Created user instance
   * @throws {Error} Database operation errors
   */
  static async createUser({ username, email, password, role = ROLES.USER }) {
    try {
      const saltRounds = 12; // Enhanced security with higher salt rounds
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await pool.query(query, [username, email, hashedPassword, role]);
      return await User.findById(result.insertId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Database operation failed: unable to create user');
    }
  }

  /**
   * Update User Information
   *
   * Updates allowed user fields with validation.
   * Password updates are handled separately for security.
   *
   * @param {number} userId - User ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<User>} Updated user instance
   * @throws {Error} Database operation errors
   */
  static async updateUser(userId, updates) {
    try {
      const allowedFields = ['username', 'email'];
      const updateParts = [];
      const values = [];

      // Build dynamic SQL query for allowed fields
      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field) && value !== undefined) {
          updateParts.push(`${field} = ?`);
          values.push(value);
        }
      }

      if (updateParts.length === 0) {
        return await User.findById(userId);
      }

      values.push(userId);

      const query = `
        UPDATE users
        SET ${updateParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await pool.query(query, values);
      return await User.findById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Database operation failed: unable to update user');
    }
  }

  /**
   * Update User Role
   *
   * Updates a user's role with validation.
   * Restricted to administrative functions.
   *
   * @param {number} userId - User ID to update
   * @param {string} newRole - New role value
   * @returns {Promise<User>} Updated user instance
   * @throws {Error} Invalid role or database errors
   */
  static async updateUserRole(userId, newRole) {
    try {
      if (!Object.values(ROLES).includes(newRole)) {
        throw new Error('Invalid role provided');
      }

      const query = `
        UPDATE users
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await pool.query(query, [newRole, userId]);
      return await User.findById(userId);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Database operation failed: unable to update user role');
    }
  }

  /**
   * Delete User
   *
   * Permanently removes a user from the database.
   *
   * @param {number} userId - User ID to delete
   * @returns {Promise<boolean>} True if user was deleted
   * @throws {Error} Database operation errors
   */
  static async deleteUser(userId) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const [result] = await pool.query(query, [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Database operation failed: unable to delete user');
    }
  }

  /**
   * Validate Password
   *
   * Compares a provided password against the stored hash.
   * Instance method for password authentication.
   *
   * @param {string} providedPassword - Plain text password to verify
   * @returns {Promise<boolean>} Password validity
   * @throws {Error} Password validation errors
   */
  async checkPassword(providedPassword) {
    try {
      return await bcrypt.compare(providedPassword, this.password);
    } catch (error) {
      console.error('Error validating password:', error);
      throw new Error('Password validation failed');
    }
  }

  /**
   * Initialize Database
   *
   * Triggers database schema creation and sample data population.
   * Called during application startup.
   *
   * @returns {Promise<void>}
   */
  static async seedDatabase() {
    try {
      const { initializeDatabase } = require('../config/db-init');
      await initializeDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  /**
   * Serialize User Data
   *
   * Converts user instance to JSON with sensitive data removed.
   * Excludes password field for security.
   *
   * @returns {Object} Safe user data for API responses
   */
  toJSON() {
    const { password, ...safeUserData } = this;
    return safeUserData;
  }
}

/**
 * Module Exports
 */
module.exports = { User, ROLES };