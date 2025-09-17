# User Management System

A comprehensive Node.js application demonstrating enterprise-level user management with authentication, authorization, and administrative functionality.

## Purpose

This application serves as a reference implementation for:
- Node.js and Express.js server architecture
- MySQL database integration and management
- JWT-based authentication and authorization
- RESTful API design principles
- Security best practices implementation
- Professional web application development

## Features

### Backend Services
- **User Registration**: Secure account creation with validation
- **Authentication**: JWT-based login system
- **Authorization**: Role-based access control (RBAC)
- **User Management**: Complete CRUD operations
- **Security**: Password hashing, rate limiting, security headers
- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: Structured error management
- **Database Management**: Connection pooling and optimization

### Web Interface
- **User Registration**: Account creation interface
- **Authentication**: Secure login functionality
- **User Dashboard**: Profile management interface
- **Administrative Panel**: User management for administrators
- **Responsive Design**: Cross-platform compatibility

### Database Architecture
- **MySQL Database**: Production-ready database implementation
- **Connection Pooling**: Optimized database connections
- **Sample Data**: Development and testing datasets
- **Schema Management**: Automated database initialization

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MySQL** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/)
3. **Basic understanding of**:
   - JavaScript programming
   - SQL databases
   - Command line interface
   - Web development concepts

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Configuration
```sql
-- Create database using MySQL command line or administration tool
CREATE DATABASE `krtn-data`;

-- Optional: Create dedicated user account
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON `krtn-data`.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Database Connection
Update the database credentials in `config/db.js`:
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',     // Update credentials
  password: 'your_password', // Update credentials
  database: 'krtn-data',     // Update if needed
  // ... additional configuration
});
```

### 4. Start the Application
```bash
npm start
# or
node server.js
```

Expected output:
```
Starting User Management System...
Initializing database...
Users table created successfully
Created sample user: admin (admin)
Created sample user: john_doe (user)
Created sample user: jane_smith (user)
Server running at http://localhost:3000
```

## Usage

### Application Access
Navigate to: `http://localhost:3000`

### Test Credentials
Pre-configured accounts for development and testing:

**Administrator Account:**
- Username: `admin`
- Password: `admin123`
- Privileges: Full system access

**Standard User Account:**
- Username: `john_doe`
- Password: `password123`
- Privileges: Limited user access

### API Endpoints

#### Authentication Services
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Profile retrieval

#### User Management (Administrative)
- `GET /api/users` - Retrieve all users
- `GET /api/users/:id` - Retrieve specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### System Services
- `GET /api` - Health check
- `GET /api/dashboard` - System statistics

## Project Structure

```
user-management-system/
├── config/
│   ├── db.js           # Database connection configuration
│   ├── db-init.js      # Database initialization and sample data
│   └── default.js      # Application configuration (JWT secrets, etc.)
├── middleware/
│   └── auth.js         # Authentication middleware
├── models/
│   └── User.js         # User data model and database operations
├── routes/
│   ├── auth.js         # Authentication routes
│   └── users.js        # User management routes
├── public/
│   ├── index.html      # Main web page
│   ├── script/
│   │   └── script.js   # Frontend JavaScript
│   └── css/
│       └── style.css   # Styling
├── package.json        # Project dependencies and scripts
├── server.js           # Main server file
└── README.md          # Documentation
```

## Architecture Overview

### Core Components

1. **Server Entry Point** (`server.js`) - Application bootstrap and middleware configuration
2. **User Model** (`models/User.js`) - Data layer and business logic
3. **Route Handlers** (`routes/`) - HTTP request processing and response logic
4. **Database Layer** (`config/`) - Connection management and initialization
5. **Frontend Interface** (`public/`) - Client-side user interface

### Design Patterns

- **Model-View-Controller (MVC)**: Separation of concerns between data, presentation, and logic
- **RESTful API**: HTTP methods mapping to CRUD operations
- **Middleware Pipeline**: Request/response processing chain
- **Repository Pattern**: Data access abstraction
- **JWT Authentication**: Stateless token-based security

## Development Features

### Security Implementation
- **Password Hashing**: BCrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side request validation
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Request throttling for API protection
- **Security Headers**: Helmet.js security middleware

### Database Features
- **Connection Pooling**: Optimized database connections
- **Schema Management**: Automated table creation
- **Transaction Support**: Database consistency
- **Query Optimization**: Indexed columns for performance

## Configuration

### Environment Variables
Configure the following environment variables for production deployment:
- `DB_HOST` - Database host address
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `PORT` - Application port
- `CORS_ORIGIN` - CORS allowed origins

### Security Configuration
- Update JWT secret in `config/default.js`
- Configure rate limiting in `server.js`
- Set appropriate CORS origins for production

## Troubleshooting

### Common Issues

**Database Connection Failures:**
- Verify MySQL service status
- Confirm database credentials
- Check network connectivity
- Validate database existence

**Authentication Errors:**
- Verify JWT secret configuration
- Check token expiration settings
- Confirm user credentials
- Review middleware configuration

**Performance Issues:**
- Monitor database connection pool
- Check query execution times
- Review server resource usage
- Optimize database indexes

## Testing

### Manual Testing
Use the provided test accounts for functionality verification:
- Admin account for administrative features
- User account for standard functionality

### API Testing
Use tools like Postman or curl for endpoint testing:
```bash
# Health check
curl http://localhost:3000/api

# User authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Production Deployment

### Pre-deployment Checklist
- [ ] Update all default passwords
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures
- [ ] Review security configurations

### Recommended Platforms
- **Cloud Providers**: AWS, Google Cloud, Azure
- **Platform as a Service**: Heroku, DigitalOcean App Platform
- **Container Platforms**: Docker, Kubernetes

## Support & Maintenance

### Documentation
- Code comments provide implementation details
- API documentation available through endpoint inspection
- Database schema documented in initialization files

### Updates & Security
- Regular dependency updates recommended
- Security patches should be applied promptly
- Monitor for vulnerability disclosures

## License

This project is intended for educational and reference purposes. Review and adapt the code according to your specific requirements and security standards.

## Professional Development

This codebase demonstrates enterprise-level patterns and practices suitable for production environments. Study the implementation details to understand professional Node.js application development.
