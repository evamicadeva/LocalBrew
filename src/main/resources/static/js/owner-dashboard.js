import { createVenue, deleteVenue, getOwnerVenues, updateVenue } from './api.js';
import { requireRole } from './role-guard.js';
import { escapeHtml } from './utils.js';

const form = document.getElementById('venue-form');
const list = document.getElementById('owner-venues');
const message = document.getElementById('owner-message');
const submitButton = document.getElementById('venue-submit');
const cancelButton = document.getElementById('venue-cancel');

const fields = {
  id: document.getElementById('venue-id'),
  name: document.getElementById('venue-name'),
  description: document.getElementById('venue-description'),
  city: document.getElementById('venue-city'),
  address: document.getElementById('venue-address'),
  type: document.getElementById('venue-type'),
  imageUri: document.getElementById('venue-image-uri'),
  latitude: document.getElementById('venue-latitude'),
  longitude: document.getElementById('venue-longitude')
};

let ownerVenues = [];

function showMessage(text, type = '') {
  message.textContent = text;
  message.classList.remove('is-error', 'is-success');
  if (type) message.classList.add(type);
}

function statusLabel(status) {
  const labels = {
    ACTIVE: 'Attivo',
    PENDING: 'In attesa',
    SUSPENDED: 'Sospeso'
  };

  return labels[status] || status;
}

function readVenueForm() {
  const imageUri = fields.imageUri.value.trim();

  return {
    name: fields.name.value.trim(),
    description: fields.description.value.trim() || null,
    city: fields.city.value.trim(),
    address: fields.address.value.trim(),
    type: fields.type.value,
    imageUri: imageUri || null,
    latitude: Number(fields.latitude.value),
    longitude: Number(fields.longitude.value)
  };
}

function resetForm() {
  form.reset();
  fields.id.value = '';
  submitButton.textContent = 'Crea locale';
  cancelButton.classList.add('hidden');
}

function fillForm(venue) {
  fields.id.value = venue.id;
  fields.name.value = venue.name || '';
  fields.description.value = venue.description || '';
  fields.city.value = venue.city || '';
  fields.address.value = venue.address || '';
  fields.type.value = venue.type || 'PUB';
  fields.imageUri.value = venue.imageUri || '';
  fields.latitude.value = venue.latitude ?? '';
  fields.longitude.value = venue.longitude ?? '';
  submitButton.textContent = 'Aggiorna locale';
  cancelButton.classList.remove('hidden');
  fields.name.focus();
}

function renderVenues() {
  if (!ownerVenues.length) {
    list.innerHTML = '<p class="dashboard-message">Non hai ancora creato locali.</p>';
    return;
  }

  list.innerHTML = ownerVenues.map(venue => `
    <article class="dashboard-item" data-id="${escapeHtml(venue.id)}">
      <img src="${escapeHtml(venue.imageUri || '../assets/icons/Minimal.png')}" alt="Foto di ${escapeHtml(venue.name)}">
      <div>
        <span class="dashboard-status status-${escapeHtml(venue.status).toLowerCase()}">${escapeHtml(statusLabel(venue.status))}</span>
        <h3>${escapeHtml(venue.name)}</h3>
        <p>${escapeHtml(venue.city)} - ${escapeHtml(venue.address)}</p>
      </div>
      <div class="dashboard-actions">
        <button type="button" class="edit-venue">Modifica</button>
        <button type="button" class="delete-venue danger-button">Elimina</button>
      </div>
    </article>
  `).join('');
}

async function loadOwnerVenues() {
  list.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
  ownerVenues = await getOwnerVenues();
  renderVenues();
}

const user = await requireRole('OWNER');

if (user) {
  await loadOwnerVenues();

  cancelButton.addEventListener('click', resetForm);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;
    showMessage(fields.id.value ? 'Aggiornamento locale...' : 'Creazione locale...');

    try {
      const payload = readVenueForm();

      if (fields.id.value) {
        await updateVenue(fields.id.value, payload);
        showMessage('Locale aggiornato.', 'is-success');
      } else {
        await createVenue(payload);
        showMessage('Locale creato e inviato in approvazione.', 'is-success');
      }

      resetForm();
      await loadOwnerVenues();
    } catch (error) {
      showMessage(error.message, 'is-error');
    } finally {
      submitButton.disabled = false;
    }
  });

  list.addEventListener('click', async event => {
    const card = event.target.closest('.dashboard-item');
    if (!card) return;

    const venue = ownerVenues.find(item => String(item.id) === String(card.dataset.id));
    if (!venue) return;

    if (event.target.closest('.edit-venue')) {
      fillForm(venue);
      return;
    }

    if (event.target.closest('.delete-venue')) {
      const confirmed = window.confirm(`Eliminare ${venue.name}?`);
      if (!confirmed) return;

      try {
        await deleteVenue(venue.id);
        showMessage('Locale eliminato.', 'is-success');
        await loadOwnerVenues();
      } catch (error) {
        showMessage(error.message, 'is-error');
      }
    }
  });
}
