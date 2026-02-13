const express = require('express');
const auth = require('../middleware/auth');
const { bookEvent, getAllBookings } = require('../controllers/bookingController');
const router = express.Router();

router.post('/', auth, bookEvent);
router.get('/', auth, getAllBookings);

module.exports = router;

