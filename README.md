# Identity & Access Management (IAM) System

A lightweight, secure, and role-based user management platform built with Node.js and MySQL. This project demonstrates a "bare-metal" implementation of authentication flows and access control without relying on high-level auth-as-a-service providers.

## Overview

This application serves as a foundational implementation of a secure Identity Provider (IdP). It handles user lifecycle management, secure credential storage, and session validation using JSON Web Tokens (JWT). The system is designed to distinguish between standard users and administrators, enforcing Role-Based Access Control (RBAC) at the middleware level.

**Design Philosophy:**
Instead of using heavy full-stack frameworks, this project utilizes a "No-Magic" architecture—coupling a vanilla JavaScript/Tailwind frontend with a raw Express.js backend—to maintain complete control over the request/response cycle and state management.

## Key Technical Features

* **Secure Authentication Engine:** Implements industry-standard security practices including password hashing (Bcrypt) and stateless session management (JWT).
* **Role-Based Access Control (RBAC):** Features distinct access levels (User vs. Admin) enforced via custom Express middleware, ensuring robust API endpoint protection.
* **RESTful API Architecture:** Exposes a structured API for registration, authentication, and user management, adhering to HTTP status code standards and REST principles.
* **Database Integration:** Utilizes a connection pool pattern with MySQL for efficient query execution and scalability.
* **Responsive Interface:** A client-side rendered UI built with Tailwind CSS and Vanilla JavaScript, demonstrating asynchronous communication with the backend API.

## Technology Stack

**Backend**
![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/-Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/-MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/-JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

**Frontend**
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat&logo=html5&logoColor=white)

## System Architecture

The project follows a modified MVC (Model-View-Controller) pattern:

1.  **API Layer (Routes/Controllers):** Handles HTTP requests, input validation, and route dispatching.
2.  **Service Layer (Middleware):** Manages authentication verification (`auth.js`) and authorization logic.
3.  **Data Layer (MySQL):** Direct SQL interactions via `mysql2` driver for maximum performance and control.

## Getting Started

### Prerequisites
* Node.js (v16+)
* MySQL Server

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/iam-system-core.git](https://github.com/yourusername/iam-system-core.git)
    cd iam-system-core
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Database Configuration**
    Create a database named `train_booking` (or update config) and import the schema:
    ```bash
    # Run the initialization script
    node config/db-init.js
    ```
    *Alternatively, manually execute the SQL commands found in `config/db-init.js` in your MySQL client.*

4.  **Environment Setup**
    Create a `.env` file based on `.env.example`:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=train_booking
    JWT_SECRET=your_secure_secret_key
    PORT=3000
    ```

5.  **Run the Application**
    ```bash
    # Development mode with auto-reload
    npm run dev
    
    # Production start
    npm start
    ```
    Access the application at `http://localhost:3000`.

## API Endpoints

* `POST /api/auth/register` - Create a new user account.
* `POST /api/auth/login` - Authenticate and receive JWT.
* `GET /api/auth/me` - Retrieve current user context (Protected).
* `GET /api/users` - List all users (Admin only).
* `DELETE /api/users/:id` - Remove a user (Admin only).
