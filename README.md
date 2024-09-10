# Dataset Curation Web Application

This project is a web application designed to facilitate the curation and management of datasets. It provides tools for
organizing, viewing, and editing data efficiently.

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

## Development Mode

The application includes a development mode feature that limits the number of pairs displayed in the pairs view. This is
useful for testing and development purposes.

### Environment Variables

- `NODE_ENV`: Set this to anything other than 'production' to enable development mode.
- `DEV_MODE_LIMIT`: Set this to an integer to control the number of pairs displayed in development mode. If not set, it
  defaults to 3.

### Usage

To enable development mode:

1. Set the environment variables when starting the server:
   ```
   NODE_ENV=development DEV_MODE_LIMIT=5 npm start
   ```
   This example will display 5 pairs in development mode.

2. In development mode, the pairs view will display only the specified number of pairs from the database.

3. A notice will be shown at the top of the pairs view indicating that dev mode is active, showing the number of pairs
   displayed, and the total number of pairs in the database.

To run the application in production mode (displaying all pairs):

   ```
   NODE_ENV=production npm start
   ```

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

