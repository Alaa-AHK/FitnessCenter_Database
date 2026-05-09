# Fitness Center Management System

A comprehensive web-based application for managing fitness center operations, including member management, class scheduling, and gym activities.

## Project Structure

```
FitnessCenter-DB/
├── backend/              # Node.js Express backend
│   ├── src/
│   │   ├── server.js     # Main server file
│   │   ├── config/       # Configuration files
│   │   └── routes/       # API routes
│   ├── package.json
│   └── .env.example
├── frontend/             # Web UI
│   └── public/
│       └── fitness_center_ui.html
├── database/             # Database scripts & helpers
│   ├── schema/           # SQL schema files
│   └── helpers/          # Database helper functions
├── docs/                 # Documentation
└── README.md
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Microsoft SQL Server
- **Frontend**: HTML, JavaScript
- **Additional**: CORS, mssql driver

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server 2019 or later
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update database credentials in `.env`

5. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Open `frontend/public/fitness_center_ui.html` in your browser

## Database Setup

1. Run the SQL scripts in the `database/schema/` directory to set up the database:
   - `Project.sql` - Main schema
   - `functions.sql` - Database functions

2. Update the database configuration in `backend/src/config/`

## API Endpoints

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Add new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

## Configuration

Create a `.env` file in the backend directory:

```
DB_SERVER=DESKTOP-4I814ME\SQLEXPRESS
DB_NAME=FitnessCenterDB
DB_PORT=5000
NODE_ENV=development
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.
