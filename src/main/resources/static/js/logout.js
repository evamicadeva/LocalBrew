import { clearToken } from './api.js';

document.querySelectorAll('[data-logout-button]').forEach(button => {
  button.addEventListener('click', () => {
    clearToken();
    window.location.href = new URL('../index.html', window.location.href).href;
  });
});
