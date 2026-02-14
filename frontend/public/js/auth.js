// Role-aware register/login
const apiUrl = `${window.API_BASE}/api/auth`;
const params = new URLSearchParams(window.location.search);
const roleParam = params.get('role') || 'user';

document.addEventListener('DOMContentLoaded', () => {
  const titleEl   = document.getElementById('form-title');
  const toLogin   = document.getElementById('toLogin');
  const toRegister= document.getElementById('toRegister');
  const registerForm = document.getElementById('registerForm');
  const loginForm    = document.getElementById('loginForm');

  // Setup Register page
  if (registerForm) {
    titleEl.textContent = roleParam === 'admin' ? 'Admin Register' : 'User Register';
    document.getElementById('role').value = roleParam;
    toLogin.href = `login.html?role=${roleParam}`;

    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const body = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: roleParam
      };
      const res = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      if (res.ok) {
        window.location = `login.html?role=${roleParam}`;
      } else {
        alert('Registration failed');
      }
    });
  }

  // Setup Login page
  if (loginForm) {
    titleEl.textContent = roleParam === 'admin' ? 'Admin Login' : 'User Login';
    toRegister.href = `register.html?role=${roleParam}`;

    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const body = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      };
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        if (data.role === 'admin') {
          window.location = 'admin.html';
        } else {
          window.location = 'dashboard.html';
        }
      } else {
        alert('Login failed');
      }
    });
  }
});




