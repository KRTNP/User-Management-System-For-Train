# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon (auto-restart on changes)
- `node server.js` - Direct server start

### Database Operations
- `npm run db:init` - Initialize database and create tables
- `npm run db:reset` - Reset database (drops and recreates tables with sample data)

### CSS/Frontend Build
- `npm run build:css` - Build Tailwind CSS from src/input.css to public/css/tailwind.css
- `npm run build:css:watch` - Build CSS with file watching
- `npm run build` - Alias for build:css

### Development Tools
- `npm run audit` - Check for security vulnerabilities
- `npm run audit:fix` - Automatically fix security issues
- Tests and linting are not yet configured (placeholders exist in package.json)

## Architecture Overview

### Core Components
1. **Server Entry Point** (`server.js`) - Express.js application with middleware configuration, security headers (Helmet), rate limiting, and graceful shutdown handling
2. **Database Layer** (`config/`) - MySQL connection pooling with environment-based configuration
3. **Authentication** (`middleware/auth.js`, `routes/auth.js`) - JWT-based authentication system
4. **User Management** (`models/User.js`, `routes/users.js`) - User CRUD operations with role-based access
5. **Frontend** (`public/`) - Static HTML/CSS/JS interface

### Database Architecture
- MySQL database with connection pooling (default: 10 connections)
- Environment-based configuration via `.env` file (see `.env.example`)
- Auto-initialization creates users table and sample data on startup
- Sample users: admin/admin123 (admin role), john_doe/password123 (user role)

### Security Implementation
- Password hashing with BCrypt
- JWT tokens for stateless authentication (1-hour expiration)
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet.js security headers with development-friendly CSP
- Input validation using express-validator
- Parameterized queries to prevent SQL injection

### API Structure
- RESTful endpoints under `/api/`
- Authentication routes: `/api/auth/` (register, login, profile)
- User management routes: `/api/users/` (CRUD operations, admin-protected)
- Health check: `/api/` returns API status
- Dashboard stats: `/api/dashboard` (unprotected, provides user metrics)

### Environment Configuration
Key environment variables (see `.env.example`):
- Database: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Security: `JWT_SECRET`, `JWT_EXPIRATION`
- Server: `PORT`, `NODE_ENV`, `CORS_ORIGIN`

### Development Notes
- Uses CommonJS modules (`type: "commonjs"` in package.json)
- Frontend is served as static files with SPA fallback routing
- Database connection automatically tested and seeded on startup
- Graceful shutdown handling for SIGTERM/SIGINT signals
- Error handling includes global error middleware and structured responses