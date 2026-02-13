const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// --- ROUTES ---
const authRoutes    = require('./routes/authRoutes');
const eventRoutes   = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Listening on ${PORT}`));

