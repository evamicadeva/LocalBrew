import {
  activateVenue,
  createDrink,
  deleteVenue,
  deleteVenueReview,
  getAdminVenues,
  getVenueReviews,
  suspendVenue
} from './api.js';
import {confirmAction, showToast} from './feedback.js';
import {requireRole} from './role-guard.js';
import {escapeHtml} from './utils.js';

const container = document.getElementById('admin-venues');
const drinkForm = document.getElementById('admin-drink-form');
const drinkMessage = document.getElementById('admin-drink-message');
const dashboardGrid = document.querySelector('.admin-dashboard-grid');

const drinkFields = {
    name: document.getElementById('admin-drink-name'),
    description: document.getElementById('admin-drink-description'),
    category: document.getElementById('admin-drink-category'),
    abv: document.getElementById('admin-drink-abv'),
    origin: document.getElementById('admin-drink-origin'),
    imageUri: document.getElementById('admin-drink-image-uri')
};

let adminVenues = [];
let reviewPanel;
let reviewVenueSelect;
let reviewList;

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
          <button type="button" class="delete-venue danger-button">Elimina</button>
        </div>
      </article>
    `;
    }).join('');
}

async function loadVenues() {
    container.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
    adminVenues = await getAdminVenues();
    renderVenues(adminVenues);
    renderReviewVenueOptions();
    await loadSelectedVenueReviews();
}

function showDrinkMessage(text, type = '') {
    drinkMessage.textContent = text;
    drinkMessage.classList.remove('is-error', 'is-success');
    if (type) drinkMessage.classList.add(type);
}

function readDrinkForm() {
    const imageUri = drinkFields.imageUri.value.trim();
    const abv = drinkFields.abv.value;

    return {
        name: drinkFields.name.value.trim(),
        description: drinkFields.description.value.trim() || null,
        category: drinkFields.category.value,
        abv: abv === '' ? null : Number(abv),
        origin: drinkFields.origin.value.trim() || null,
        imageUri: imageUri || null
    };
}

function ensureReviewPanel() {
    if (reviewPanel) return;

    reviewPanel = document.createElement('section');
    reviewPanel.className = 'dashboard-list admin-review-panel';
    reviewPanel.innerHTML = `
    <div class="admin-review-heading">
      <div>
        <h2>Commenti locali</h2>
        <p class="dashboard-message">Seleziona un locale per vedere e moderare le recensioni.</p>
      </div>
    </div>
    <label class="admin-review-label" for="admin-review-venue-select">Locale</label>
    <select class="admin-review-select" id="admin-review-venue-select"></select>
    <div class="admin-review-list" id="admin-reviews" aria-live="polite"></div>
  `;

    dashboardGrid.appendChild(reviewPanel);
    reviewVenueSelect = document.getElementById('admin-review-venue-select');
    reviewList = document.getElementById('admin-reviews');

    reviewVenueSelect.addEventListener('change', loadSelectedVenueReviews);

    reviewList.addEventListener('click', async event => {
        const button = event.target.closest('.delete-review');
        if (!button) return;

        const confirmed = await confirmAction({
            title: 'Eliminare la recensione?',
            message: 'La recensione verrà rimossa definitivamente.',
            confirmText: 'Elimina',
            danger: true
        });
        if (!confirmed) return;

        button.disabled = true;

        try {
            await deleteVenueReview(button.dataset.id);
            showToast('Recensione eliminata.');
            await loadSelectedVenueReviews();
        } catch (error) {
            showToast(error.message, 'error');
            button.disabled = false;
        }
    });
}

function renderReviewVenueOptions() {
    ensureReviewPanel();

    if (!adminVenues.length) {
        reviewVenueSelect.innerHTML = '<option value="">Nessun locale disponibile</option>';
        reviewVenueSelect.disabled = true;
        reviewList.innerHTML = '<p class="dashboard-message">Nessun locale disponibile.</p>';
        return;
    }

    const previousValue = reviewVenueSelect.value;
    reviewVenueSelect.disabled = false;
    reviewVenueSelect.innerHTML = adminVenues.map(venue => `
    <option value="${escapeHtml(venue.id)}">${escapeHtml(venue.name)} - ${escapeHtml(statusLabel(venue.status))}</option>
  `).join('');

    if (adminVenues.some(venue => String(venue.id) === previousValue)) {
        reviewVenueSelect.value = previousValue;
    }
}

function renderReviews(reviews) {
    if (!reviews.length) {
        reviewList.innerHTML = '<p class="dashboard-message">Nessuna recensione per questo locale.</p>';
        return;
    }

    reviewList.innerHTML = reviews.map(review => `
    <article class="admin-review-card" data-id="${escapeHtml(review.id)}">
      <div class="admin-review-score">
        <span>${escapeHtml(String(review.rating))}</span>
        <small>/5</small>
      </div>
      <div class="admin-review-content">
        <h3>${escapeHtml(review.username || 'Utente')}</h3>
        <p>${escapeHtml(review.comment || 'Nessun commento')}</p>
        <small>${escapeHtml(review.venueName || '')}</small>
      </div>
      <div class="dashboard-actions admin-review-actions">
        <button type="button" class="delete-review danger-button" data-id="${escapeHtml(review.id)}">Elimina</button>
      </div>
    </article>
  `).join('');
}

async function loadSelectedVenueReviews() {
    ensureReviewPanel();

    if (!reviewVenueSelect.value) return;

    reviewList.innerHTML = '<p class="dashboard-message">Caricamento recensioni...</p>';

    try {
        const reviews = await getVenueReviews(reviewVenueSelect.value);
        renderReviews(reviews);
    } catch (error) {
        reviewList.innerHTML = `<p class="dashboard-message">${escapeHtml(error.message)}</p>`;
    }
}

const user = await requireRole('ADMIN');

if (user) {
    await loadVenues();

    drinkForm.addEventListener('submit', async event => {
        event.preventDefault();
        showDrinkMessage('Creazione drink...');

        try {
            await createDrink(readDrinkForm());
            drinkForm.reset();
            showDrinkMessage('Drink creato.', 'is-success');
            showToast('Drink creato.');
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        }
    });

    container.addEventListener('click', async event => {
        const card = event.target.closest('.dashboard-item');
        if (!card) return;

        const button = event.target.closest('button');
        if (!button) return;

        const venue = adminVenues.find(item => String(item.id) === String(card.dataset.id));

        if (button.classList.contains('suspend')) {
            const confirmed = await confirmAction({
                title: 'Sospendere il locale?',
                message: `${venue?.name || 'Questo locale'} non sarà piu visibile pubblicamente.`,
                confirmText: 'Sospendi',
                danger: true
            });
            if (!confirmed) return;
        }

        if (button.classList.contains('delete-venue')) {
            const confirmed = await confirmAction({
                title: 'Eliminare il locale?',
                message: `${venue?.name || 'Questo locale'} verrà eliminato definitivamente.`,
                confirmText: 'Elimina',
                danger: true
            });
            if (!confirmed) return;
        }

        button.disabled = true;

        try {
            if (button.classList.contains('activate')) {
                await activateVenue(card.dataset.id);
                showToast('Locale attivato.');
            }

            if (button.classList.contains('suspend')) {
                await suspendVenue(card.dataset.id);
                showToast('Locale sospeso.');
            }

            if (button.classList.contains('delete-venue')) {
                await deleteVenue(card.dataset.id);
                showToast('Locale eliminato.');
            }

            await loadVenues();
        } catch (error) {
            showToast(error.message, 'error');
            button.disabled = false;
        }
    });
}
