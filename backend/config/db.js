const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'event_booking'
});

async function hasColumn(conn, table, column) {
  const [rows] = await conn
    .promise()
    .query(
      `SELECT 1
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [table, column]
    );
  return rows.length > 0;
}

async function ensureSchema(conn) {
  const query = conn.promise().query.bind(conn.promise());

  const usersHasRole = await hasColumn(conn, 'users', 'role');
  const usersHasIsAdmin = await hasColumn(conn, 'users', 'is_admin');
  if (!usersHasRole) {
    await query(
      "ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user'"
    );
  }
  if (usersHasIsAdmin) {
    await query(
      "UPDATE users SET role = CASE WHEN is_admin = 1 THEN 'admin' ELSE 'user' END WHERE role IS NULL OR role = ''"
    );
  }

  const eventsHasTotalSeats = await hasColumn(conn, 'events', 'total_seats');
  if (!eventsHasTotalSeats) {
    await query('ALTER TABLE events ADD COLUMN total_seats INT NOT NULL DEFAULT 0');
    await query('UPDATE events SET total_seats = COALESCE(available_seats, 0)');
  }

  const eventsHasCreatedBy = await hasColumn(conn, 'events', 'created_by');
  if (!eventsHasCreatedBy) {
    await query('ALTER TABLE events ADD COLUMN created_by INT NULL');
  }
}

connection.connect(async (err) => {
  if (err) throw err;
  try {
    await ensureSchema(connection);
    console.log('MySQL Connected');
  } catch (schemaErr) {
    console.error('Schema migration failed:', schemaErr.message);
    process.exit(1);
  }
});

module.exports = connection;
