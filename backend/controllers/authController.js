const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.query('INSERT INTO users SET ?', { name, email, password: hash, role }, (err) => {
    if (err) return res.status(400).send(err);
    res.send('User registered');
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Invalid credentials');

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).send('Incorrect password');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role });
  });
};

