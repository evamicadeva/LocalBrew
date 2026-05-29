import { activateVenue, getAdminVenues, suspendVenue } from './api.js';
import { requireRole } from './role-guard.js';
import { escapeHtml } from './utils.js';

const container = document.getElementById('admin-venues');

function statusLabel(status) {
  const labels = {
    ACTIVE: 'Attivo',
    PENDING: 'In attesa',
    SUSPENDED: 'Sospeso'
  };

  return labels[status] || status;
}

function renderVenues(venues) {
  if (!venues.length) {
    container.innerHTML = '<p class="dashboard-message">Nessun locale registrato.</p>';
    return;
  }

  container.innerHTML = venues.map(venue => {
    const id = escapeHtml(venue.id);
    const name = escapeHtml(venue.name);
    const city = escapeHtml(venue.city);
    const status = escapeHtml(statusLabel(venue.status));
    const owner = escapeHtml(venue.ownerUsername || 'Owner non disponibile');

    return `
      <article class="dashboard-item dashboard-item-wide" data-id="${id}">
        <div>
          <span class="dashboard-status status-${escapeHtml(venue.status).toLowerCase()}">${status}</span>
          <h2>${name}</h2>
          <p>${city} - ${owner}</p>
        </div>
        <div class="dashboard-actions">
          <button type="button" class="activate" ${venue.status === 'ACTIVE' ? 'disabled' : ''}>Attiva</button>
          <button type="button" class="suspend" ${venue.status === 'SUSPENDED' ? 'disabled' : ''}>Sospendi</button>
        </div>
      </article>
    `;
  }).join('');
}

async function loadVenues() {
  container.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
  const venues = await getAdminVenues();
  renderVenues(venues);
}

const user = await requireRole('ADMIN');

if (user) {
  await loadVenues();

  container.addEventListener('click', async event => {
    const card = event.target.closest('.dashboard-item');
    if (!card) return;

    const button = event.target.closest('button');
    if (!button) return;

    button.disabled = true;

    try {
      if (button.classList.contains('activate')) {
        await activateVenue(card.dataset.id);
      }

      if (button.classList.contains('suspend')) {
        await suspendVenue(card.dataset.id);
      }

      await loadVenues();
    } catch (error) {
      alert(error.message);
      button.disabled = false;
    }
  });
}
