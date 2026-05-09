# Database

This folder contains database setup scripts and helper files for the Fitness Center Management System.

## Structure

### schema/
Contains SQL scripts for database setup:
- `Project.sql` - Main database schema with tables and relationships
- `functions.sql` - Stored functions used by the application

### helpers/
Contains helper code for database operations:
- `DatabaseHelper.cs` - C# helper class for database operations (optional)

## Setup Instructions

1. Open SQL Server Management Studio
2. Create a new database named `FitnessCenterDB` (if not already created)
3. Run the scripts in this order:
   - `Project.sql` - Sets up tables and relationships
   - `functions.sql` - Creates stored functions

## Database Schema

The database includes the following main tables:
- Members
- Coach  
- MembershipPlan
- Equipment
- Classes
- Attendance records

## Notes

- All database operations use SQL parameters to prevent SQL injection
- The backend communicates with the database using the `mssql` Node.js driver
- Database helper functions are used to calculate member age, plan end dates, etc.
