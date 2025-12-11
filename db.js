// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.HEALTH_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.HEALTH_USER ,
  password: process.env.HEALTH_PASSWORD,
  database: process.env.HEALTH_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

