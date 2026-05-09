# Backend API

This folder contains the Express.js backend server for the Fitness Center Management System.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory with your database credentials:

```
DB_SERVER=your_server_name
DB_NAME=FitnessCenterDB
DB_DRIVER=ODBC Driver 17 for SQL Server
PORT=5000
NODE_ENV=development
```

### 3. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:5000/api`

## Project Structure

- `src/server.js` - Main server file with all API routes
- `src/config/` - Configuration files
- `src/routes/` - Route handlers (future refactoring)
- `.env` - Environment variables (git-ignored)
- `.env.example` - Example environment configuration
- `package.json` - Dependencies and scripts

## API Endpoints

See [README.md](../../README.md#api-endpoints) in the root directory for a complete list of API endpoints.

## Technologies

- Express.js - Web framework
- mssql - SQL Server driver
- dotenv - Environment variable management
- CORS - Cross-Origin Resource Sharing
