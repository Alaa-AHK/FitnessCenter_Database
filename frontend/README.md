# Fitness Center Frontend

This folder contains the web user interface for the Fitness Center Management System.

## Files

- `fitness_center_ui.html` - Main HTML UI for the application
- `api.js` - JavaScript file with API client functions for communicating with the backend

## Usage

1. Open `fitness_center_ui.html` in a web browser
2. Ensure the backend API server is running on `http://localhost:5000`
3. The UI will automatically communicate with the API

## Setup

Update the `API_BASE` URL in `api.js` if running the backend on a different host or port.

```javascript
const API_BASE = 'http://localhost:5000/api';
```

## Features

- Member management
- Coach management  
- Membership plans
- Class scheduling
- Equipment management
