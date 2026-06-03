import { loginUser, registerUser, setToken } from './api.js';

function redirectByRole(role) {
  if (role === 'ADMIN') return 'admin-dashboard.html';
  if (role === 'OWNER') return 'owner-dashboard.html';
  return '../index.html';
}

function showMessage(message, type = '') {
  const element = document.getElementById('auth-message');
  if (!element) return;

  element.textContent = message;
  element.classList.remove('is-error', 'is-success');

  if (type) {
    element.classList.add(type);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    showMessage('Accesso in corso...');

    const result = await loginUser({ email, password });

    if (!result.token || !result.user) {
      throw new Error(result.message || 'Risposta di login non valida.');
    }

    setToken(result.token);

    showMessage(result.message || 'Accesso effettuato.', 'is-success');

    window.setTimeout(() => {
      window.location.href = redirectByRole(result.user.role);
    }, 500);
  } catch (error) {
    showMessage(error.message, 'is-error');
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  if (password !== confirmPassword) {
    showMessage('Le password non coincidono.', 'is-error');
    return;
  }

  try {
    showMessage('Registrazione in corso...');

    const result = await registerUser({
      username,
      email,
      password,
      confirmPassword
    });

    if (!result.token || !result.user) {
      throw new Error(result.message || 'Risposta di registrazione non valida.');
    }

    setToken(result.token);

    showMessage('Account creato. Vai alla pagina di accesso.', 'is-success');

    window.setTimeout(() => {
      window.location.href = redirectByRole(result.user.role);
    }, 700);
  } catch (error) {
    showMessage(error.message, 'is-error');
  }
}

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

// ── Toggle visibilità password ─────────────────────────────────
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.pw-field').querySelector('input');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('i').className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    btn.setAttribute('aria-label', isHidden ? 'Nascondi password' : 'Mostra password');
  });
});
