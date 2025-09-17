/**
 * Database Configuration - User Management System
 *
 * This module configures the MySQL database connection using a connection pool.
 * Connection pooling improves performance by reusing database connections
 * instead of creating new ones for each request.
 *
 * @author Development Team
 * @version 1.0.0
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Database Connection Pool Configuration
 *
 * A connection pool manages multiple database connections efficiently.
 * This configuration should be adjusted based on production requirements.
 *
 * Configuration parameters:
 * - host: Database server hostname
 * - user: Database authentication username
 * - password: Database authentication password
 * - database: Target database name
 * - connectionLimit: Maximum concurrent connections
 * - waitForConnections: Queue requests when pool is exhausted
 * - queueLimit: Maximum queued connection requests
 * - acquireTimeout: Maximum time to wait for connection (ms)
 * - timeout: Maximum time for query execution (ms)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'user_management',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  charset: 'utf8mb4'
});

/**
 * Test Database Connection
 *
 * Validates database connectivity and configuration.
 * Used for health checks and startup validation.
 *
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');

    // Test basic query execution
    await connection.query('SELECT 1');
    connection.release();

    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Verify MySQL service status and connection credentials');
    return false;
  }
}

/**
 * Get Pool Statistics
 *
 * Returns current connection pool metrics for monitoring.
 *
 * @returns {Object} Pool statistics
 */
function getPoolStats() {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    acquiringConnections: pool.pool._acquiringConnections.length,
    connectionLimit: pool.pool.config.connectionLimit
  };
}

/**
 * Graceful Pool Shutdown
 *
 * Closes all connections in the pool gracefully.
 * Should be called during application shutdown.
 *
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('Database connection pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  getPoolStats,
  closePool
};
