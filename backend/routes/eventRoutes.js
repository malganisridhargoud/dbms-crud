const express = require('express');
const auth    = require('../middleware/auth');
const {
  getEvents,
  getMyEvents,
  createEvent,
  deleteEvent
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/mine', auth, getMyEvents);
router.post('/', auth, createEvent);
router.delete('/:id', auth, deleteEvent);

module.exports = router;


