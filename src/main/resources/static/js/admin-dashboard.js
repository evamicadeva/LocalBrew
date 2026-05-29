import { activateVenue, getAdminVenues, suspendVenue } from './api.js';
import { requireRole } from './role-guard.js';
import { escapeHtml } from './utils.js';

const user = await requireRole('ADMIN');

if (user) {
  const venues = await getAdminVenues();
  const container = document.getElementById('admin-venues');

  container.innerHTML = venues.map(venue => {
    const id = escapeHtml(venue.id);
    const name = escapeHtml(venue.name);
    const city = escapeHtml(venue.city);
    const status = escapeHtml(venue.status);
    return 
    `<article data-id="${venue.id}">
      <h2>${venue.name}</h2>
      <p>${venue.city} - ${venue.status}</p>
      <button class="activate">Attiva</button>
      <button class="suspend">Sospendi</button>
    </article>`
  }).join('');

  container.addEventListener('click', async event => {
    const card = event.target.closest('article');
    if (!card) return;

    if (event.target.classList.contains('activate')) {
      await activateVenue(card.dataset.id);
    }

    if (event.target.classList.contains('suspend')) {
      await suspendVenue(card.dataset.id);
    }

    window.location.reload();
  });
}