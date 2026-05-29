import {
  addDrinkToVenue,
  createDrink,
  createVenue,
  deleteVenue,
  getDrinks,
  getOwnerVenues,
  getVenueDrinks,
  removeDrinkFromVenue,
  updateDrinkInVenue,
  updateVenue
} from './api.js';
import { confirmAction, showToast } from './feedback.js';
import { requireRole } from './role-guard.js';
import { escapeHtml } from './utils.js';

const form = document.getElementById('venue-form');
const list = document.getElementById('owner-venues');
const message = document.getElementById('owner-message');
const submitButton = document.getElementById('venue-submit');
const cancelButton = document.getElementById('venue-cancel');
const drinkMessage = document.getElementById('drink-message');
const venueSelect = document.getElementById('drink-venue-select');
const existingDrinkForm = document.getElementById('existing-drink-form');
const existingDrinkSelect = document.getElementById('existing-drink-id');
const existingDrinkPrice = document.getElementById('existing-drink-price');
const existingDrinkSubmit = existingDrinkForm.querySelector('button');
const newDrinkForm = document.getElementById('new-drink-form');
const newDrinkSubmit = newDrinkForm.querySelector('button');
const venueDrinksContainer = document.getElementById('venue-drinks');

const fields = {
  id: document.getElementById('venue-id'),
  name: document.getElementById('venue-name'),
  description: document.getElementById('venue-description'),
  city: document.getElementById('venue-city'),
  address: document.getElementById('venue-address'),
  type: document.getElementById('venue-type'),
  imageUri: document.getElementById('venue-image-uri')
};

const newDrinkFields = {
  name: document.getElementById('new-drink-name'),
  description: document.getElementById('new-drink-description'),
  category: document.getElementById('new-drink-category'),
  abv: document.getElementById('new-drink-abv'),
  origin: document.getElementById('new-drink-origin'),
  imageUri: document.getElementById('new-drink-image-uri'),
  price: document.getElementById('new-drink-price')
};

let ownerVenues = [];
let allDrinks = [];
let selectedVenueDrinks = [];
let editingVenueDrinkId = null;

function showMessage(text, type = '') {
  message.textContent = text;
  message.classList.remove('is-error', 'is-success');
  if (type) message.classList.add(type);
}

function showDrinkMessage(text, type = '') {
  drinkMessage.textContent = text;
  drinkMessage.classList.remove('is-error', 'is-success');
  if (type) drinkMessage.classList.add(type);
}

function statusLabel(status) {
  const labels = {
    ACTIVE: 'Attivo',
    PENDING: 'In attesa',
    SUSPENDED: 'Sospeso'
  };

  return labels[status] || status;
}

function formatPrice(price) {
  if (price == null || price === '') return '-';
  return Number(price).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function readVenueForm() {
  const imageUri = fields.imageUri.value.trim();

  return {
    name: fields.name.value.trim(),
    description: fields.description.value.trim() || null,
    city: fields.city.value.trim(),
    address: fields.address.value.trim(),
    type: fields.type.value,
    imageUri: imageUri || null
  };
}

function readNewDrinkForm() {
  const imageUri = newDrinkFields.imageUri.value.trim();
  const abv = newDrinkFields.abv.value;

  return {
    name: newDrinkFields.name.value.trim(),
    description: newDrinkFields.description.value.trim() || null,
    category: newDrinkFields.category.value,
    abv: abv === '' ? null : Number(abv),
    origin: newDrinkFields.origin.value.trim() || null,
    imageUri: imageUri || null
  };
}

function selectedVenueId() {
  return venueSelect.value;
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

function renderVenueSelect() {
  if (!ownerVenues.length) {
    venueSelect.innerHTML = '<option value="">Crea prima un locale</option>';
    syncDrinkControls();
    return;
  }

  const previousValue = venueSelect.value;
  venueSelect.innerHTML = ownerVenues.map(venue => `
    <option value="${escapeHtml(venue.id)}">${escapeHtml(venue.name)} - ${escapeHtml(statusLabel(venue.status))}</option>
  `).join('');

  if (ownerVenues.some(venue => String(venue.id) === previousValue)) {
    venueSelect.value = previousValue;
  }

  syncDrinkControls();
}

function renderDrinkOptions() {
  if (!allDrinks.length) {
    existingDrinkSelect.innerHTML = '<option value="">Nessun drink disponibile</option>';
    syncDrinkControls();
    return;
  }

  existingDrinkSelect.innerHTML = allDrinks.map(drink => `
    <option value="${escapeHtml(drink.id)}">${escapeHtml(drink.name)} - ${escapeHtml(drink.category)}</option>
  `).join('');

  syncDrinkControls();
}

function syncDrinkControls() {
  const hasVenue = ownerVenues.length > 0;
  const hasExistingDrinks = allDrinks.length > 0;

  venueSelect.disabled = !hasVenue;
  existingDrinkSelect.disabled = !hasVenue || !hasExistingDrinks;
  existingDrinkSubmit.disabled = !hasVenue || !hasExistingDrinks;
  newDrinkSubmit.disabled = !hasVenue;
}

function renderVenueDrinks() {
  if (!selectedVenueId()) {
    venueDrinksContainer.innerHTML = '<p class="dashboard-message">Seleziona un locale.</p>';
    return;
  }

  if (!selectedVenueDrinks.length) {
    venueDrinksContainer.innerHTML = '<p class="dashboard-message">Nessun drink nel menu di questo locale.</p>';
    return;
  }

  venueDrinksContainer.innerHTML = selectedVenueDrinks.map(item => {
    const drinkId = String(item.drinkId);
    const isEditing = editingVenueDrinkId === drinkId;
    const price = item.price == null || item.price === '' ? '' : Number(item.price);

    return `
      <article class="dashboard-item drink-menu-item" data-drink-id="${escapeHtml(drinkId)}">
        <img src="${escapeHtml(item.imageUri || '../assets/icons/Minimal.png')}" alt="Foto di ${escapeHtml(item.drinkName)}">
        <div>
          <span class="dashboard-status">${escapeHtml(item.category || 'Drink')}</span>
          <h3>${escapeHtml(item.drinkName)}</h3>
          <p>${formatPrice(item.price)} ${item.abv != null ? `- ${escapeHtml(item.abv)}%` : ''}</p>
          ${isEditing ? `
            <label class="dashboard-label compact-price-label" for="price-${escapeHtml(drinkId)}">Nuovo prezzo</label>
            <input
              class="dashboard-control compact-price-input"
              id="price-${escapeHtml(drinkId)}"
              type="number"
              step="0.01"
              min="0"
              value="${escapeHtml(price)}"
              required>
          ` : ''}
        </div>
        <div class="dashboard-actions">
          ${isEditing ? `
            <button type="button" class="save-venue-drink">Salva</button>
            <button type="button" class="cancel-venue-drink secondary-button">Annulla</button>
          ` : `
            <button type="button" class="edit-venue-drink">Modifica prezzo</button>
            <button type="button" class="remove-venue-drink danger-button">Rimuovi</button>
          `}
        </div>
      </article>
    `;
  }).join('');
}

async function loadOwnerVenues() {
  list.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
  ownerVenues = await getOwnerVenues();
  renderVenues();
  renderVenueSelect();
}

async function loadAllDrinks() {
  allDrinks = await getDrinks();
  renderDrinkOptions();
}

async function loadSelectedVenueDrinks() {
  if (!selectedVenueId()) {
    selectedVenueDrinks = [];
    renderVenueDrinks();
    return;
  }

  venueDrinksContainer.innerHTML = '<p class="dashboard-message">Caricamento menu...</p>';
  selectedVenueDrinks = await getVenueDrinks(selectedVenueId());
  renderVenueDrinks();
}

async function refreshDrinkArea() {
  await Promise.all([loadAllDrinks(), loadSelectedVenueDrinks()]);
}

const user = await requireRole('OWNER');

if (user) {
  await loadOwnerVenues();
  await refreshDrinkArea();

  cancelButton.addEventListener('click', resetForm);

  venueSelect.addEventListener('change', () => {
    editingVenueDrinkId = null;
    loadSelectedVenueDrinks();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;
    showMessage(fields.id.value ? 'Aggiornamento locale...' : 'Creazione locale...');

    try {
      const payload = readVenueForm();

      if (fields.id.value) {
        await updateVenue(fields.id.value, payload);
        showMessage('Locale aggiornato.', 'is-success');
        showToast('Locale aggiornato.');
      } else {
        await createVenue(payload);
        showMessage('Locale creato e inviato in approvazione.', 'is-success');
        showToast('Locale creato.');
      }

      resetForm();
      await loadOwnerVenues();
      await loadSelectedVenueDrinks();
    } catch (error) {
      showMessage(error.message, 'is-error');
      showToast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  existingDrinkForm.addEventListener('submit', async event => {
    event.preventDefault();
    showDrinkMessage('Aggiunta drink al locale...');

    try {
      await addDrinkToVenue(selectedVenueId(), {
        drinkId: existingDrinkSelect.value,
        price: Number(existingDrinkPrice.value)
      });
      existingDrinkForm.reset();
      showDrinkMessage('Drink aggiunto al locale.', 'is-success');
      showToast('Drink aggiunto al locale.');
      await loadSelectedVenueDrinks();
    } catch (error) {
      showDrinkMessage(error.message, 'is-error');
      showToast(error.message, 'error');
    }
  });

  newDrinkForm.addEventListener('submit', async event => {
    event.preventDefault();
    showDrinkMessage('Creazione drink...');

    try {
      const drink = await createDrink(readNewDrinkForm());

      await addDrinkToVenue(selectedVenueId(), {
        drinkId: drink.id,
        price: Number(newDrinkFields.price.value)
      });

      newDrinkForm.reset();
      showDrinkMessage('Drink creato e aggiunto al locale.', 'is-success');
      showToast('Drink creato e aggiunto al locale.');
      await refreshDrinkArea();
    } catch (error) {
      showDrinkMessage(error.message, 'is-error');
      showToast(error.message, 'error');
    }
  });

  venueDrinksContainer.addEventListener('click', async event => {
    const item = event.target.closest('.drink-menu-item');
    if (!item) return;
    const drinkId = item.dataset.drinkId;

    if (event.target.closest('.edit-venue-drink')) {
      editingVenueDrinkId = drinkId;
      renderVenueDrinks();
      venueDrinksContainer.querySelector('.compact-price-input')?.focus();
      return;
    }

    if (event.target.closest('.cancel-venue-drink')) {
      editingVenueDrinkId = null;
      renderVenueDrinks();
      return;
    }

    if (event.target.closest('.save-venue-drink')) {
      const priceInput = item.querySelector('.compact-price-input');
      const price = Number(priceInput.value);

      if (priceInput.value === '' || Number.isNaN(price) || price < 0) {
        showDrinkMessage('Inserisci un prezzo valido.', 'is-error');
        return;
      }

      try {
        await updateDrinkInVenue(selectedVenueId(), drinkId, { drinkId, price });
        editingVenueDrinkId = null;
        showDrinkMessage('Prezzo del drink aggiornato.', 'is-success');
        showToast('Prezzo aggiornato.');
        await loadSelectedVenueDrinks();
      } catch (error) {
        showDrinkMessage(error.message, 'is-error');
        showToast(error.message, 'error');
      }
      return;
    }

    const button = event.target.closest('.remove-venue-drink');
    if (!button) return;

    const drink = selectedVenueDrinks.find(item => String(item.drinkId) === String(drinkId));
    const confirmed = await confirmAction({
      title: 'Rimuovere il drink?',
      message: `${drink?.drinkName || 'Questo drink'} verra rimosso dal menu del locale.`,
      confirmText: 'Rimuovi',
      danger: true
    });
    if (!confirmed) return;

    try {
      await removeDrinkFromVenue(selectedVenueId(), drinkId);
      showDrinkMessage('Drink rimosso dal locale.', 'is-success');
      showToast('Drink rimosso dal locale.');
      await loadSelectedVenueDrinks();
    } catch (error) {
      showDrinkMessage(error.message, 'is-error');
      showToast(error.message, 'error');
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
      const confirmed = await confirmAction({
        title: 'Eliminare il locale?',
        message: `${venue.name} verra eliminato definitivamente.`,
        confirmText: 'Elimina',
        danger: true
      });
      if (!confirmed) return;

      try {
        await deleteVenue(venue.id);
        showMessage('Locale eliminato.', 'is-success');
        showToast('Locale eliminato.');
        await loadOwnerVenues();
        await loadSelectedVenueDrinks();
      } catch (error) {
        showMessage(error.message, 'is-error');
        showToast(error.message, 'error');
      }
    }
  });
}
