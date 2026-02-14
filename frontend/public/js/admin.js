// admin.js
const tokenA = localStorage.getItem('token');
const roleA = localStorage.getItem('role');
const evtList = document.getElementById('eventList');
const bkgList = document.getElementById('bookingList');
const socket = io(window.API_BASE);

function appendEvent(e) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>${e.title}</h3>
    <p>${e.date} @ ${e.time}</p>
    <p>Seats: ${e.available_seats}/${e.total_seats}</p>
    <button onclick="deleteEvent(${e.id})">Delete</button>
  `;
  evtList.prepend(card);
}

function appendBooking(b) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>${b.event_title}</h3>
    <p>User: ${b.user_name}</p>
  `;
  bkgList.appendChild(card);
}

async function loadAdminEvents() {
  const res = await fetch(`${window.API_BASE}/api/events/mine`, {
    headers: { 'Authorization': tokenA }
  });
  const evts = await res.json();
  evtList.innerHTML = '';
  evts.forEach(appendEvent);
}

async function loadBookings() {
  const res = await fetch(`${window.API_BASE}/api/bookings`, {
    headers: { 'Authorization': tokenA }
  });
  const bk = await res.json();
  bkgList.innerHTML = '';
  bk.forEach(appendBooking);
}

document.getElementById('eventForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    total_seats: document.getElementById('total_seats').value
  };

  const res = await fetch(`${window.API_BASE}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': tokenA
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await res.text();
    return alert(`Failed to create event: ${msg}`);
  }
  const newEvent = await res.json();

  appendEvent(newEvent);
  loadBookings();

  e.target.reset();
});

async function deleteEvent(id) {
  const res = await fetch(`${window.API_BASE}/api/events/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': tokenA }
  });
  if (res.ok) loadAdminEvents();
  else {
    const msg = await res.text();
    alert(`Delete failed: ${msg}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!tokenA || roleA !== 'admin') return window.location = 'login.html?role=admin';

  document.getElementById('logout').onclick = () => {
    localStorage.clear();
    window.location = 'index.html';
  };

  loadAdminEvents();
  loadBookings();

  socket.on('newEvent', () => loadAdminEvents());
});
