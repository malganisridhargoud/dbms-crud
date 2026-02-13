const db = require('../config/db');

exports.bookEvent = (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  db.query('SELECT available_seats FROM events WHERE id = ?', [event_id], (err, result) => {
    if (err || result.length === 0) return res.status(400).send('Event not found');
    if (result[0].available_seats <= 0) return res.status(400).send('No seats available');

    db.query('INSERT INTO bookings SET ?', { user_id, event_id }, (err) => {
      if (err) return res.status(500).send(err);
      db.query('UPDATE events SET available_seats = available_seats - 1 WHERE id = ?', [event_id]);
      res.send('Booking confirmed');
    });
  });
};

exports.getAllBookings = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Unauthorized');
  db.query(`
    SELECT b.id, u.name as user_name, e.title as event_title 
    FROM bookings b 
    JOIN users u ON b.user_id = u.id 
    JOIN events e ON b.event_id = e.id
  `, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};
