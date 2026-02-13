const token = localStorage.getItem('token');
const eventsEl = document.getElementById('events');
const socket = io('http://localhost:5000');

async function loadEvents() {
  const res = await fetch('http://localhost:5000/api/events');
  const events = await res.json();
  eventsEl.innerHTML = '';
  events.forEach(e => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${e.title}</h3>
      <p>${e.description}</p>
      <p>${e.date} @ ${e.time}</p>
      <p>Seats left: ${e.available_seats}</p>
      <button ${!token || e.available_seats < 1 ? 'disabled' : ''}
        onclick="book(${e.id})">
        ${!token ? 'Login to Book' : e.available_seats > 0 ? 'Book Now' : 'Sold Out'}
      </button>
    `;
    eventsEl.appendChild(card);
  });
}

async function book(id) {
  if (!token) {
    window.location = 'login.html?role=user';
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ event_id: id })
    });

    if (res.ok) {
      alert('Event booked successfully!');
      await loadEvents();
    } else {
      const errText = await res.text();
      alert(errText);
    }
  } catch (err) {
    console.error(err);
    alert('An error occurred. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location = 'login.html?role=user';
    return;
  }

  loadEvents();

  // Logout
  document.getElementById('logout').onclick = () => {
    localStorage.clear();
    window.location = 'index.html';
  };

  // Real-time updates
  socket.on('newEvent', () => loadEvents());
});
