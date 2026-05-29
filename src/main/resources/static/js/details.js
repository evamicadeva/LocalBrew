import { escapeHtml } from './utils.js';

const API_URL = 'http://localhost:8080/api/v1/public/venues';

export async function openVenueDetails(id) {
  const panel = document.getElementById('venue-details');
  const content = document.getElementById('venue-details-content');

  content.textContent = 'Caricamento dettagli...';
  panel.classList.remove('hidden');

  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    content.textContent = 'Impossibile caricare i dettagli del locale.';
    return;
  }
  
  const pub = await response.json();

  content.innerHTML = `
    <h2>${escapeHtml(pub.name)}</h2>
    <p>${escapeHtml(pub.description)}</p>
    <p><strong>Indirizzo:</strong> ${escapeHtml(pub.address)}</p>
    <p><strong>Orari:</strong> ${escapeHtml(pub.openingHours)}</p>
  `;
}