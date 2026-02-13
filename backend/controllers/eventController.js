const db = require('../config/db');

// Get all events (for users)
exports.getEvents = (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

// Get only events created by this admin
exports.getMyEvents = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Unauthorized');
  db.query(
    'SELECT * FROM events WHERE created_by = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
};

// Create a new event (admin only) and emit it to all users
exports.createEvent = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Unauthorized');
  const { title, description, date, time, total_seats } = req.body;
  const created_by = req.user.id;
  db.query(
    'INSERT INTO events SET ?',
    { title, description, date, time, total_seats, available_seats: total_seats, created_by },
    (err, result) => {
      if (err) return res.status(400).send(err);
      // fetch the newly inserted event
      db.query('SELECT * FROM events WHERE id = ?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).send(err2);
        const newEvent = rows[0];
        // emit to all connected clients
        req.app.get('io').emit('newEvent', newEvent);
        res.json(newEvent);
      });
    }
  );
};

// Delete event (admin only)
exports.deleteEvent = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Unauthorized');
  db.query('DELETE FROM events WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(400).send(err);
    res.send('Deleted');
  });
};
