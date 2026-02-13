const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'event_booking'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected');
});

module.exports = connection;
