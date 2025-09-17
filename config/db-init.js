/**
 * Database Initialization Module - User Management System
 *
 * This module handles database schema creation and sample data population.
 * It ensures the application has the necessary database structure and
 * provides initial data for development and testing purposes.
 *
 * @author Development Team
 * @version 1.0.0
 */

const { pool } = require('./db');
const bcrypt = require('bcryptjs');

/**
 * Database Schema Definition
 *
 * Creates the users table with the following structure:
 * - id: Primary key, auto-incrementing integer
 * - username: Unique username (max 50 characters)
 * - email: Unique email address (max 100 characters)
 * - password: Hashed password (255 characters for bcrypt)
 * - role: User role enumeration (admin, user)
 * - created_at: Record creation timestamp
 * - updated_at: Last modification timestamp
 */

/**
 * Create Users Table
 *
 * Creates the users table if it doesn't exist.
 * Includes proper indexing and constraints for data integrity.
 *
 * @returns {Promise<boolean>} Success status
 */
async function createUsersTable() {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Users table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating users table:', error.message);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Create Sample Users
 *
 * Populates the database with initial user accounts for development
 * and testing purposes. Skips creation if users already exist.
 *
 * @returns {Promise<boolean>} Success status
 */
async function createSampleUsers() {
  const connection = await pool.getConnection();

  try {
    // Check for existing users
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');

    if (existingUsers[0].count > 0) {
      console.log('Sample users already exist, skipping creation');
      return true;
    }

    // Define sample user accounts
    const sampleUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user'
      }
    ];

    // Create users with hashed passwords
    for (const user of sampleUsers) {
      const saltRounds = 12; // Increased salt rounds for better security
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [user.username, user.email, hashedPassword, user.role]
      );

      console.log(`Created sample user: ${user.username} (${user.role})`);
    }

    return true;
  } catch (error) {
    console.error('Error creating sample users:', error.message);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Database Initialization
 *
 * Main initialization function that orchestrates database setup.
 * Creates schema and populates initial data.
 *
 * @returns {Promise<boolean>} Overall success status
 */
async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Create database schema
    const tableCreated = await createUsersTable();
    if (!tableCreated) {
      throw new Error('Failed to create users table');
    }

    // Populate sample data
    const usersCreated = await createSampleUsers();
    if (!usersCreated) {
      throw new Error('Failed to create sample users');
    }

    console.log('Database initialization completed successfully');
    console.log('Available test accounts:');
    console.log('  Admin: username=admin, password=admin123');
    console.log('  User:  username=john_doe, password=password123');

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
}

/**
 * Drop and Recreate Users Table
 *
 * Utility function for development/testing.
 * WARNING: This will delete all user data.
 *
 * @returns {Promise<boolean>} Success status
 */
async function resetDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('Users table dropped');

    const tableCreated = await createUsersTable();
    const usersCreated = await createSampleUsers();

    return tableCreated && usersCreated;
  } catch (error) {
    console.error('Error resetting database:', error.message);
    return false;
  } finally {
    connection.release();
  }
}

module.exports = {
  initializeDatabase,
  createUsersTable,
  createSampleUsers,
  resetDatabase
};

// Execute initialization when run directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      console.log(success ? 'Initialization completed' : 'Initialization failed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled initialization error:', error);
      process.exit(1);
    });
}
