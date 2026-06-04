// Punto di ingresso: prepara la mappa e importa le funzioni dell'app.
import { initTheme, setThemeChangeCallback } from './theme.js';
import { syncMapTheme } from './map.js';

setThemeChangeCallback(syncMapTheme);
initTheme();
syncMapTheme();
import { loadPubs } from './data.js';
import { initMarkers } from './markers.js';
import { initUI } from './ui.js';
import { clearToken, getCurrentUser } from './api.js';
import { escapeHtml } from './utils.js';

function updateStatus(message) {
  const status = document.getElementById('venues-status');
  if (status) status.textContent = message;
}

async function updateHeaderAuth() {
  const headerButtons = document.querySelector('.header-buttons');
  if (!headerButtons) return;

  // Recupera l'utente collegato usando il token salvato al login.
  const user = await getCurrentUser();
  if (!user) return;
  const username = escapeHtml(user.username);

  // Mostra la dashboard solo per amministratori e proprietari.
  const dashboardLink = user.role === 'ADMIN'
    ? 'pages/admin-dashboard.html'
    : user.role === 'OWNER'
      ? 'pages/owner-dashboard.html'
      : '';
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = currentTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  const themeLabel = currentTheme === 'dark' ? 'Passa alla modalita giorno' : 'Passa alla modalita notte';

  headerButtons.innerHTML = `
    <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-label="${themeLabel}">
      <i class="${themeIcon}"></i>
    </button>
    <span class="logged-user">Benvenuto, ${username}</span>
    <a class="btn profile-btn" href="pages/profile.html">
      <i class="fa-solid fa-user"></i> Profilo
    </a>
    ${dashboardLink ? `<a class="btn register" href="${dashboardLink}">Dashboard</a>` : ''}
    <button type="button" class="btn login" id="logout-button">Esci</button>
  `;

  document.getElementById('logout-button').addEventListener('click', () => {
    clearToken();
    window.location.reload();
  });
}

// Avvia l'app appena il modulo principale viene caricato dal browser.
async function initApp() {
  try {
    // Se l'utente e autenticato, aggiorna subito i pulsanti dell'header.
    await updateHeaderAuth();

    updateStatus('Caricamento locali...');

    const pubs = await loadPubs();

    if (pubs.length === 0) {
      updateStatus('Nessun locale disponibile.');
      return;
    }

    updateStatus('');
    initMarkers(pubs);
    await initUI(pubs);
  } catch (error) {
    console.error(error);
    updateStatus('Impossibile caricare i locali. Riprova piu tardi.');
  }
}

initApp();
