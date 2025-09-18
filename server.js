/**
 * User Management System - Main Server File
 *
 * This is the main entry point for the User Management System.
 * It configures the Express.js server with middleware, routes, and error handling.
 *
 * Features:
 * - User authentication and authorization
 * - User management operations (CRUD)
 * - JWT token-based security
 * - MySQL database integration
 * - RESTful API architecture
 * - Static file serving
 * - Security headers and rate limiting
 *
 * @author Development Team
 * @version 1.0.0
 */

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { User } = require("./models/User");

// Import route handlers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Disable X-Powered-By header for security
app.disable('x-powered-by');

console.log("Starting User Management System...");

// Security middleware with development-friendly settings
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers temporarily
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      // Remove upgrade-insecure-requests for local development
      upgradeInsecureRequests: null,
    },
  },
  // Disable HSTS for local development
  hsts: false,
}));

// Rate limiting middleware (more permissive for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Core middleware configuration
app.use(express.json({ limit: "10mb" })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

// Serve static files with cache control
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1d",
  etag: false
}));

// Initialize database and create sample data
console.log("Initializing database...");
User.seedDatabase();

// API Routes
app.use("/api/auth", authRoutes); // Authentication endpoints
app.use("/api/users", userRoutes); // User management endpoints

/**
 * API Health Check
 * GET /api
 * Returns API status and available endpoints
 */
app.get("/api", (_req, res) => {
  res.json({
    message: "User Management API is operational",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth (authentication)",
      users: "/api/users (user management)",
      dashboard: "/api/dashboard (statistics)"
    }
  });
});

/**
 * Dashboard Statistics
 * GET /api/dashboard
 * Provides system statistics for administrative dashboard
 * Note: In production, this should be protected with authentication
 */
app.get("/api/dashboard", async (_req, res) => {
  try {
    const users = await User.getAllUsers();

    res.json({
      stats: {
        totalUsers: users.length,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Simulated metric
        newUsersToday: Math.floor(Math.random() * 10) // Simulated metric
      },
      recentActivity: [
        {
          action: "User login",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          description: "User authentication event"
        },
        {
          action: "Profile updated",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          description: "User profile modification"
        },
        {
          action: "New user registered",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          description: "New user account created"
        }
      ]
    });
  } catch (error) {
    console.error('Error retrieving dashboard data:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to retrieve dashboard statistics'
    });
  }
});

/**
 * Global Error Handler
 * Catches and handles all unhandled errors in the application
 */
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.stack);

  // Handle specific error types
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON in request body"
    });
  }

  // Generic error response
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred"
  });
});

/**
 * Catch-all route handler
 * Serves the main HTML file for any unmatched routes
 * Enables Single Page Application (SPA) routing
 */
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * Start the server
 * Begin listening for incoming requests on the specified port
 */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/api`);
  console.log("User Management System is ready");
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});