# Dataset Curation Web Application

This project is a web application designed to facilitate the curation and management of datasets. It provides tools for organizing, viewing, and editing data efficiently.

## Features

- User authentication and authorization
- CRUD operations for instruction-output pairs
- Data approval system
- CSV export functionality
- API endpoints for programmatic access

## Technologies Used

- Backend: Node.js with Express.js
- Database: MongoDB
- Authentication: Passport.js with JWT for API authentication
- Frontend: EJS templates
- CSS: Custom styles
- JavaScript: Client-side interactivity

## Prerequisites

- Node.js (v14 or later recommended)
- MongoDB (v4 or later)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dataset-curation.git
   cd dataset-curation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   MONGODB_URI=mongodb://localhost:27017/dataset
   SESSION_SECRET=your_session_secret
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:
   ```
   npm start
   ```

   The application will be available at `http://localhost:3000`.

## Usage

1. Register an admin account (the first account created will be an admin).
2. Log in to the application.
3. Use the interface to add, edit, and approve data pairs.
4. Export data as needed.

## API Endpoints

- GET /api/pairs: Fetch all data pairs
- POST /pairs: Add a new data pair
- PUT /pairs/:id: Update a data pair
- DELETE /pairs/:id: Delete a data pair
- POST /pairs/:id/toggle-approval: Toggle approval status of a pair
- GET /export: Export data (supports CSV and JSON formats)

API requests require JWT authentication. Obtain a token by logging in through the web interface.

## Testing

Run the test suite with:
```
npm test
```

For coverage report:
```
npm run test:coverage
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

