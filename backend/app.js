const http = require('http');
const { URL } = require('url');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const db = require('./config/db');
const query = db.promise().query.bind(db.promise());

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  setCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain');
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function authenticate(req) {
  const token = req.headers.authorization;
  if (!token) return { ok: false, code: 403, message: 'Token required' };

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { ok: true, user };
  } catch (error) {
    return { ok: false, code: 401, message: 'Invalid token' };
  }
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const path = parsedUrl.pathname;

  try {
    if (req.method === 'POST' && path === '/api/auth/register') {
      const { name, email, password, role } = await parseBody(req);
      const hash = bcrypt.hashSync(password, 10);
      await query('INSERT INTO users SET ?', { name, email, password: hash, role });
      return sendText(res, 200, 'User registered');
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const { email, password } = await parseBody(req);
      const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return sendText(res, 400, 'Invalid credentials');

      const user = rows[0];
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) return sendText(res, 401, 'Incorrect password');

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });
      return sendJson(res, 200, { token, role: user.role, userId: user.id });
    }

    if (req.method === 'GET' && path === '/api/events') {
      const [rows] = await query('SELECT * FROM events');
      return sendJson(res, 200, rows);
    }

    if (req.method === 'GET' && path === '/api/events/mine') {
      const auth = authenticate(req);
      if (!auth.ok) return sendText(res, auth.code, auth.message);
      if (auth.user.role !== 'admin') return sendText(res, 403, 'Unauthorized');

      const [rows] = await query('SELECT * FROM events WHERE created_by = ?', [auth.user.id]);
      return sendJson(res, 200, rows);
    }

    if (req.method === 'POST' && path === '/api/events') {
      const auth = authenticate(req);
      if (!auth.ok) return sendText(res, auth.code, auth.message);
      if (auth.user.role !== 'admin') return sendText(res, 403, 'Unauthorized');

      const { title, description, date, time, total_seats } = await parseBody(req);
      const seats = Number(total_seats);
      if (!title || !description || !date || !time || !Number.isFinite(seats) || seats < 1) {
        return sendText(res, 400, 'Invalid event payload');
      }

      const [insert] = await query('INSERT INTO events SET ?', {
        title,
        description,
        date,
        time,
        total_seats: seats,
        available_seats: seats,
        created_by: auth.user.id
      });

      const [rows] = await query('SELECT * FROM events WHERE id = ?', [insert.insertId]);
      const newEvent = rows[0];
      io.emit('newEvent', newEvent);
      return sendJson(res, 200, newEvent);
    }

    if (req.method === 'DELETE' && /^\/api\/events\/\d+$/.test(path)) {
      const auth = authenticate(req);
      if (!auth.ok) return sendText(res, auth.code, auth.message);
      if (auth.user.role !== 'admin') return sendText(res, 403, 'Unauthorized');

      const eventId = path.split('/').pop();
      const [found] = await query('SELECT id FROM events WHERE id = ? AND created_by = ?', [
        eventId,
        auth.user.id
      ]);
      if (!found.length) return sendText(res, 404, 'Event not found');

      await query('DELETE FROM bookings WHERE event_id = ?', [eventId]);
      await query('DELETE FROM events WHERE id = ?', [eventId]);
      return sendText(res, 200, 'Deleted');
    }

    if (req.method === 'POST' && path === '/api/bookings') {
      const auth = authenticate(req);
      if (!auth.ok) return sendText(res, auth.code, auth.message);

      const { event_id } = await parseBody(req);
      const [events] = await query('SELECT available_seats FROM events WHERE id = ?', [event_id]);
      if (!events.length) return sendText(res, 400, 'Event not found');
      if (events[0].available_seats <= 0) return sendText(res, 400, 'No seats available');

      await query('INSERT INTO bookings SET ?', { user_id: auth.user.id, event_id });
      await query('UPDATE events SET available_seats = available_seats - 1 WHERE id = ?', [event_id]);
      return sendText(res, 200, 'Booking confirmed');
    }

    if (req.method === 'GET' && path === '/api/bookings') {
      const auth = authenticate(req);
      if (!auth.ok) return sendText(res, auth.code, auth.message);
      if (auth.user.role !== 'admin') return sendText(res, 403, 'Unauthorized');

      const [rows] = await query(
        `SELECT b.id, u.name as user_name, e.title as event_title
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN events e ON b.event_id = e.id`
      );
      return sendJson(res, 200, rows);
    }

    return sendText(res, 404, `Cannot ${req.method} ${path}`);
  } catch (error) {
    const message =
      error && error.code === 'ER_DUP_ENTRY'
        ? 'Email already exists'
        : error && error.message
          ? error.message
          : 'Internal server error';
    const status = error && error.message === 'Invalid JSON' ? 400 : 500;
    return sendText(res, status, message);
  }
});

const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
