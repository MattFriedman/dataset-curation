const fs = require('fs').promises;
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const baseUrl = 'http://localhost:3000'; // Adjust if your server is running on a different address
const healthEndpoint = `${baseUrl}/health`;
const loginEndpoint = `${baseUrl}/auth/token`;
const importEndpoint = `${baseUrl}/import`;

async function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkServerHealth() {
  try {
    const response = await axios.get(healthEndpoint);
    return response.data.status === 'OK';
  } catch (error) {
    return false;
  }
}

async function getJwtToken(username, password) {
  try {
    const response = await axios.post(loginEndpoint, { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    throw new Error('Failed to obtain JWT token');
  }
}

async function importData(token, data) {
  try {
    const response = await axios.post(importEndpoint, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    throw new Error('Import failed: ' + (error.response ? error.response.data : error.message));
  }
}

async function main() {
  try {
    // Check server health
    console.log('Checking server health...');
    const isServerHealthy = await checkServerHealth();
    if (!isServerHealthy) {
      throw new Error('Server is not running or not healthy. Please start the server and try again.');
    }
    console.log('Server is healthy.');

    // Get import file path
    const importFilePath = await question('Enter the path to your JSON import file: ');

    // Get user credentials
    const username = await question('Enter your username: ');
    const password = await question('Enter your password: ');

    // Get JWT token
    console.log('Obtaining JWT token...');
    const token = await getJwtToken(username, password);
    console.log('JWT token obtained successfully.');

    // Read the JSON file
    console.log('Reading import file...');
    const data = await fs.readFile(importFilePath, 'utf8');
    const jsonData = JSON.parse(data);

    // Import the data
    console.log('Importing data...');
    const result = await importData(token, jsonData);
    console.log('Import successful:', result);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
