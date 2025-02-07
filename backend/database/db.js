// Import the Pool class from the 'pg' module to manage PostgreSQL connections
const { Pool } = require('pg');

// Import and configure environment variables from a .env file
require('dotenv').config();

// Create a connection pool for interacting with the PostgreSQL database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

// Export the connection pool for use in other parts of the application
module.exports = pool;