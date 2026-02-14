# dbms-crud

# DBMS Project - Event Booking App

Simple event booking app with:
- `backend`: Node.js API + MySQL
- `frontend`: Static HTML/CSS/JS

## Requirements
- Node.js
- MySQL

## Setup
1. Open `backend/.env` and set your DB values.
2. Install backend packages:
```bash
cd backend
npm install
```

## Run
Open 2 terminals.

Terminal 1 (backend):
```bash
cd backend
npm start
```


```

## Open App
- Frontend: `http://127.0.0.1:5501/index.html`
- Backend API: `http://127.0.0.1:5000/api/events`

## Basic Flow
1. Register Admin and User.
2. Login as Admin and create event.
3. Login as User and book event.
4. Admin can view bookings and delete events.
