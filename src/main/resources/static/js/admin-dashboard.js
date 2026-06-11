import {
  activateVenue,
  createDrink,
  deleteVenue,
  deleteVenueReview,
  getAdminVenues,
  getOwnerVenueDrinks,
  getVenueReviews,
  getDrinks,
  suspendVenue,
  uploadDrinkImage,
  updateDrink,
  deleteDrink
} from './api.js';
import './logout.js';
import {confirmAction, showToast} from './feedback.js';
import {requireAnyRole} from './role-guard.js';
import {escapeHtml} from './utils.js';

// ── DOM refs ─────────────────────────────────────────────────
const container        = document.getElementById('admin-venues');
const venueSearch      = document.getElementById('admin-venue-search');
const statusPills      = document.querySelectorAll('[data-status]');
const reviewHint       = document.getElementById('admin-review-hint');
const reviewVenueName  = document.getElementById('admin-review-venue-name');
const reviewList       = document.getElementById('admin-reviews');
const openCreateDrinkBtn   = document.getElementById('admin-open-create-drink');
const closeCreateDrinkBtn  = document.getElementById('admin-close-create-drink');
const cancelCreateDrinkBtn = document.getElementById('admin-cancel-create-drink');
const createDrinkModal     = document.getElementById('admin-drink-create-modal');
const createDrinkBackdrop  = document.getElementById('admin-drink-create-backdrop');
const drinkForm        = document.getElementById('admin-drink-form');
const drinkMessage     = document.getElementById('admin-drink-message');

const drinkFields = {
    name:        document.getElementById('admin-drink-name'),
    description: document.getElementById('admin-drink-description'),
    category:    document.getElementById('admin-drink-category'),
    abv:         document.getElementById('admin-drink-abv'),
    origin:      document.getElementById('admin-drink-origin'),
    imageUri:    document.getElementById('admin-drink-image-uri')
};

const drinkImageFile     = document.getElementById('admin-drink-image-file');
const drinkImagePreview  = document.getElementById('admin-drink-image-preview');
const drinkImageFilename = document.getElementById('admin-drink-image-filename');
const drinkImageRemove   = document.getElementById('admin-drink-image-remove');

const editDrinkModal       = document.getElementById('admin-drink-edit-modal');
const editDrinkBackdrop    = document.getElementById('admin-drink-edit-backdrop');
const editDrinkForm        = document.getElementById('admin-drink-edit-form');
const editDrinkClose       = document.getElementById('admin-edit-drink-close');
const editDrinkCancel      = document.getElementById('admin-edit-drink-cancel');
const editDrinkMessage     = document.getElementById('admin-drink-edit-message');
const editDrinkFields = {
    id:          document.getElementById('edit-drink-id'),
    name:        document.getElementById('edit-drink-name'),
    description: document.getElementById('edit-drink-description'),
    category:    document.getElementById('edit-drink-category'),
    abv:         document.getElementById('edit-drink-abv'),
    origin:      document.getElementById('edit-drink-origin'),
    imageUri:    document.getElementById('edit-drink-image-uri')
};
const editDrinkImageFile     = document.getElementById('edit-drink-image-file');
const editDrinkImagePreview  = document.getElementById('edit-drink-image-preview');
const editDrinkImageFilename = document.getElementById('edit-drink-image-filename');
const editDrinkImageRemove   = document.getElementById('edit-drink-image-remove');

const DRINK_IMAGE_LABEL = 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)';
const EDIT_DRINK_IMAGE_LABEL = 'Scegli immagine (JPG, PNG, WEBP - max 5 MB)';

// ── Stato ────────────────────────────────────────────────────
let adminVenues   = [];
let activeStatus  = '';        // '' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'
const reviewCache = {};

// ── Drawer ───────────────────────────────────────────────────
function syncBodyLock() {
    const createModalOpen = createDrinkModal && !createDrinkModal.classList.contains('hidden');
    const editModalOpen = editDrinkModal && !editDrinkModal.classList.contains('hidden');
    document.body.style.overflow = createModalOpen || editModalOpen ? 'hidden' : '';
}

function openCreateDrinkModal() {
    createDrinkModal.classList.remove('hidden');
    createDrinkBackdrop.classList.remove('hidden');
    createDrinkBackdrop.setAttribute('aria-hidden', 'false');
    syncBodyLock();
    drinkFields.name.focus();
}

function closeCreateDrinkModal() {
    createDrinkModal.classList.add('hidden');
    createDrinkBackdrop.classList.add('hidden');
    createDrinkBackdrop.setAttribute('aria-hidden', 'true');
    drinkForm.reset();
    resetImageField({
        fileInput: drinkImageFile, preview: drinkImagePreview,
        filename: drinkImageFilename, removeBtn: drinkImageRemove,
        hiddenInput: drinkFields.imageUri, defaultLabel: DRINK_IMAGE_LABEL
    });
    showDrinkMessage('');
    syncBodyLock();
}

openCreateDrinkBtn?.addEventListener('click', openCreateDrinkModal);
closeCreateDrinkBtn?.addEventListener('click', closeCreateDrinkModal);
cancelCreateDrinkBtn?.addEventListener('click', closeCreateDrinkModal);
createDrinkBackdrop?.addEventListener('click', closeCreateDrinkModal);
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (editDrinkModal && !editDrinkModal.classList.contains('hidden')) {
        closeEditDrinkModal();
        return;
    }
    if (createDrinkModal && !createDrinkModal.classList.contains('hidden')) {
        closeCreateDrinkModal();
    }
});

// ── Upload helpers ───────────────────────────────────────────
function setupImageUpload({ fileInput, preview, filename, removeBtn, hiddenInput, defaultLabel }) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        filename.textContent = file.name;
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        removeBtn.classList.remove('hidden');
        hiddenInput.value = '';
    });
    removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        preview.src = '';
        preview.classList.add('hidden');
        removeBtn.classList.add('hidden');
        filename.textContent = defaultLabel;
        hiddenInput.value = '';
    });
}

async function resolveImageUri(fileInput, hiddenInput, uploadFn) {
    if (fileInput.files[0]) return await uploadFn(fileInput.files[0]);
    return hiddenInput.value.trim() || null;
}

function resetImageField({ fileInput, preview, filename, removeBtn, hiddenInput, defaultLabel }) {
    fileInput.value = '';
    preview.src = '';
    preview.classList.add('hidden');
    removeBtn.classList.add('hidden');
    filename.textContent = defaultLabel;
    hiddenInput.value = '';
}

function fillEditDrinkImage(url) {
    editDrinkImageFile.value = '';
    editDrinkFields.imageUri.value = url || '';
    editDrinkFields.imageUri.dataset.cleared = 'false';

    if (url) {
        editDrinkImagePreview.src = url;
        editDrinkImagePreview.classList.remove('hidden');
        editDrinkImageRemove.classList.remove('hidden');
        editDrinkImageFilename.textContent = 'Immagine attuale';
        return;
    }

    editDrinkImagePreview.src = '';
    editDrinkImagePreview.classList.add('hidden');
    editDrinkImageRemove.classList.add('hidden');
    editDrinkImageFilename.textContent = EDIT_DRINK_IMAGE_LABEL;
}

async function resolveEditDrinkImageUri() {
    if (editDrinkImageFile.files[0]) return await uploadDrinkImage(editDrinkImageFile.files[0]);
    if (editDrinkFields.imageUri.dataset.cleared === 'true') return '';
    return editDrinkFields.imageUri.value.trim() || null;
}

function showEditDrinkMessage(text, type = '') {
    editDrinkMessage.textContent = text;
    editDrinkMessage.classList.remove('profile-form-msg--error', 'profile-form-msg--ok');
    if (type) editDrinkMessage.classList.add(type);
}

function openEditDrinkModal(drink) {
    editDrinkFields.id.value = drink.id;
    editDrinkFields.name.value = drink.name || '';
    editDrinkFields.description.value = drink.description || '';
    editDrinkFields.category.value = drink.category || 'IPA';
    editDrinkFields.abv.value = drink.abv != null ? drink.abv : '';
    editDrinkFields.origin.value = drink.origin || '';
    fillEditDrinkImage(drink.imageUri);
    showEditDrinkMessage('');

    editDrinkBackdrop.classList.remove('hidden');
    editDrinkModal.classList.remove('hidden');
    syncBodyLock();
    editDrinkFields.name.focus();
}

function closeEditDrinkModal() {
    editDrinkBackdrop.classList.add('hidden');
    editDrinkModal.classList.add('hidden');
    editDrinkForm.reset();
    fillEditDrinkImage(null);
    showEditDrinkMessage('');
    syncBodyLock();
}

// ── Helpers ──────────────────────────────────────────────────
function statusLabel(status) {
    return { ACTIVE: 'Attivo', PENDING: 'In attesa', SUSPENDED: 'Sospeso' }[status] || status;
}

function starsHtml(avg) {
    const full = Math.round(avg);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fa-solid fa-beer-mug-empty admin-star rating-icon ${i <= full ? 'rating-icon--filled' : 'rating-icon--empty'}"></i>`;
    }
    return html;
}

function reviewBadge(venueId) {
    const r = reviewCache[venueId];
    if (!r) return '';
    if (r.count === 0) return `<span class="admin-review-badge admin-review-badge--empty">Nessuna rec.</span>`;
    return `
        <span class="admin-review-badge">
            ${starsHtml(r.avg)}
            <span class="admin-review-badge-text">${r.avg.toFixed(1)} · ${r.count} rec.</span>
        </span>`;
}

// ── Render locali ─────────────────────────────────────────────
function renderVenues(venues) {
    if (!venues.length) {
        container.innerHTML = '<p class="dashboard-message">Nessun locale trovato.</p>';
        return;
    }

    container.innerHTML = venues.map(venue => {
        const id     = escapeHtml(venue.id);
        const name   = escapeHtml(venue.name);
        const city   = escapeHtml(venue.city);
        const status = escapeHtml(statusLabel(venue.status));
        const owner  = escapeHtml(venue.ownerUsername || '—');

        return `
      <article class="admin-venue-card" data-id="${id}">
        <div class="admin-venue-card-header">
          <span class="dashboard-status status-${escapeHtml(venue.status).toLowerCase()}">${status}</span>
          ${reviewBadge(venue.id)}
        </div>
        <h3 class="admin-venue-name">${name}</h3>
        <p class="admin-venue-meta">
          <i class="fa-solid fa-location-dot"></i> ${city}
          &nbsp;·&nbsp;
          <i class="fa-solid fa-user"></i> ${owner}
        </p>
        <div class="dashboard-actions admin-venue-actions">
          <button type="button" class="activate"      ${venue.status === 'ACTIVE'    ? 'disabled' : ''}>Attiva</button>
          <button type="button" class="suspend"       ${venue.status === 'SUSPENDED' ? 'disabled' : ''}>Sospendi</button>
          <button type="button" class="show-reviews"><i class="fa-solid fa-comments"></i> Recensioni</button>
          <button type="button" class="delete-venue danger-button">Elimina</button>
        </div>
      </article>`;
    }).join('');
}

// ── Caricamento ───────────────────────────────────────────────
async function loadVenues() {
    if (!container) return;
    container.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
    try {
        adminVenues = await getAdminVenues();
    } catch (err) {
        container.innerHTML = `<p class="dashboard-message">Errore caricamento locali: ${escapeHtml(err.message)}</p>`;
        return;
    }

    await Promise.allSettled(adminVenues.map(async v => {
        try {
            const reviews = await getVenueReviews(v.id);
            const count = reviews.length;
            const avg   = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
            reviewCache[v.id] = { count, avg, reviews };
        } catch {
            reviewCache[v.id] = { count: 0, avg: 0, reviews: [] };
        }
    }));

    applyFilters();
}

// ── Filtri ────────────────────────────────────────────────────
function applyFilters() {
    const q = venueSearch.value.trim().toLowerCase();
    let filtered = adminVenues;

    if (activeStatus) {
        filtered = filtered.filter(v => v.status === activeStatus);
    }

    if (q) {
        filtered = filtered.filter(v =>
            v.name.toLowerCase().includes(q) ||
            (v.ownerUsername || '').toLowerCase().includes(q) ||
            (v.city || '').toLowerCase().includes(q)
        );
    }

    renderVenues(filtered);
}

venueSearch.addEventListener('input', applyFilters);

statusPills.forEach(pill => {
    pill.addEventListener('click', () => {
        statusPills.forEach(p => p.classList.remove('admin-status-pill--active'));
        pill.classList.add('admin-status-pill--active');
        activeStatus = pill.dataset.status;
        applyFilters();
    });
});

// ── Pannello recensioni ───────────────────────────────────────
function renderReviews(venue) {
    const { reviews } = reviewCache[venue.id] || { reviews: [] };

    reviewHint.classList.add('hidden');
    reviewVenueName.classList.remove('hidden');
    reviewVenueName.innerHTML = `
        <span class="admin-review-venue-label">
            <i class="fa-solid fa-store"></i> ${escapeHtml(venue.name)}
        </span>`;

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
      </div>
      <div class="dashboard-actions admin-review-actions">
        <button type="button" class="delete-review danger-button" data-id="${escapeHtml(review.id)}">Elimina</button>
      </div>
    </article>`).join('');
}

// ── Drink form ────────────────────────────────────────────────
function showDrinkMessage(text, type = '') {
    drinkMessage.textContent = text;
    drinkMessage.classList.remove('is-error', 'is-success');
    if (type) drinkMessage.classList.add(type);
}

function readDrinkForm() {
    const abv = drinkFields.abv.value;
    return {
        name:        drinkFields.name.value.trim(),
        description: drinkFields.description.value.trim() || null,
        category:    drinkFields.category.value,
        abv:         abv === '' ? null : Number(abv),
        origin:      drinkFields.origin.value.trim() || null
    };
}

// ── Init ──────────────────────────────────────────────────────
const user = await requireAnyRole('ADMIN');

if (user) {
    await loadVenues();

    setupImageUpload({
        fileInput: drinkImageFile, preview: drinkImagePreview,
        filename: drinkImageFilename, removeBtn: drinkImageRemove,
        hiddenInput: drinkFields.imageUri, defaultLabel: DRINK_IMAGE_LABEL
    });

    setupImageUpload({
        fileInput: editDrinkImageFile, preview: editDrinkImagePreview,
        filename: editDrinkImageFilename, removeBtn: editDrinkImageRemove,
        hiddenInput: editDrinkFields.imageUri, defaultLabel: EDIT_DRINK_IMAGE_LABEL
    });
    editDrinkImageFile.addEventListener('change', () => {
        editDrinkFields.imageUri.dataset.cleared = 'false';
    });
    editDrinkImageRemove.addEventListener('click', () => {
        editDrinkFields.imageUri.dataset.cleared = 'true';
    });
    editDrinkClose?.addEventListener('click', closeEditDrinkModal);
    editDrinkCancel?.addEventListener('click', closeEditDrinkModal);
    editDrinkBackdrop?.addEventListener('click', closeEditDrinkModal);

    drinkForm.addEventListener('submit', async event => {
        event.preventDefault();
        showDrinkMessage('Creazione drink...');
        try {
            const imageUri = await resolveImageUri(drinkImageFile, drinkFields.imageUri, uploadDrinkImage);
            await createDrink({ ...readDrinkForm(), imageUri });
            drinkForm.reset();
            resetImageField({
                fileInput: drinkImageFile, preview: drinkImagePreview,
                filename: drinkImageFilename, removeBtn: drinkImageRemove,
                hiddenInput: drinkFields.imageUri, defaultLabel: DRINK_IMAGE_LABEL
            });
            showToast('Drink creato.');
            closeCreateDrinkModal();
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        }
    });

    editDrinkForm.addEventListener('submit', async event => {
        event.preventDefault();
        const id = editDrinkFields.id.value;
        const submitButton = editDrinkForm.querySelector('button[type="submit"]');
        const name = editDrinkFields.name.value.trim();

        if (!name) {
            showEditDrinkMessage('Nome obbligatorio.', 'profile-form-msg--error');
            return;
        }

        submitButton.disabled = true;
        showEditDrinkMessage('Salvataggio...');

        try {
            const imageUri = await resolveEditDrinkImageUri();
            const abv = editDrinkFields.abv.value;
            const updated = await updateDrink(id, {
                name,
                description: editDrinkFields.description.value.trim(),
                category: editDrinkFields.category.value,
                abv: abv !== '' ? Number(abv) : null,
                origin: editDrinkFields.origin.value.trim(),
                imageUri
            });
            const idx = drinksCache.findIndex(d => String(d.id) === String(id));
            if (idx >= 0) drinksCache[idx] = updated;
            showToast('Drink aggiornato.');
            closeEditDrinkModal();
            applyDrinkFilters();
        } catch (error) {
            showEditDrinkMessage(error.message, 'profile-form-msg--error');
            showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    container.addEventListener('click', async event => {
        const card = event.target.closest('.admin-venue-card');
        if (!card) return;
        const button = event.target.closest('button');
        if (!button) return;

        const venue = adminVenues.find(v => String(v.id) === String(card.dataset.id));

        if (button.classList.contains('show-reviews')) {
            document.querySelectorAll('.admin-venue-card').forEach(c => c.classList.remove('admin-venue-card--active'));
            card.classList.add('admin-venue-card--active');
            renderReviews(venue);
            return;
        }

        if (button.classList.contains('suspend')) {
            const confirmed = await confirmAction({
                title: 'Sospendere il locale?',
                message: `${venue?.name || 'Questo locale'} non sarà più visibile pubblicamente.`,
                confirmText: 'Sospendi', danger: true
            });
            if (!confirmed) return;
        }

        if (button.classList.contains('delete-venue')) {
            const confirmed = await confirmAction({
                title: 'Eliminare il locale?',
                message: `${venue?.name || 'Questo locale'} verrà eliminato definitivamente.`,
                confirmText: 'Elimina', danger: true
            });
            if (!confirmed) return;
        }

        button.disabled = true;

        try {
            if (button.classList.contains('activate'))     { await activateVenue(card.dataset.id); showToast('Locale attivato.'); }
            if (button.classList.contains('suspend'))      { await suspendVenue(card.dataset.id);  showToast('Locale sospeso.'); }
            if (button.classList.contains('delete-venue')) { await deleteVenue(card.dataset.id);   showToast('Locale eliminato.'); }
            await loadVenues();
        } catch (error) {
            showToast(error.message, 'error');
            button.disabled = false;
        }
    });

    reviewList.addEventListener('click', async event => {
        const button = event.target.closest('.delete-review');
        if (!button) return;

        const confirmed = await confirmAction({
            title: 'Eliminare la recensione?',
            message: 'La recensione verrà rimossa definitivamente.',
            confirmText: 'Elimina', danger: true
        });
        if (!confirmed) return;

        button.disabled = true;
        try {
            await deleteVenueReview(button.dataset.id);
            showToast('Recensione eliminata.');
            const activeCard = document.querySelector('.admin-venue-card--active');
            if (activeCard) {
                const venue = adminVenues.find(v => String(v.id) === String(activeCard.dataset.id));
                if (venue) {
                    const reviews = await getVenueReviews(venue.id);
                    const count = reviews.length;
                    const avg   = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
                    reviewCache[venue.id] = { count, avg, reviews };
                    renderReviews(venue);
                    applyFilters();
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
            button.disabled = false;
        }
    });
}

// Tab switching
const tabButtons  = document.querySelectorAll('.admin-tab');
const tabPanelMap = { venues: document.getElementById('admin-tab-venues'), drinks: document.getElementById('admin-tab-drinks') };
const drinkToolbar = document.getElementById('admin-drinks-toolbar');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => { b.classList.remove('admin-tab--active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('admin-tab--active');
        btn.setAttribute('aria-selected', 'true');
        const tab = btn.dataset.tab;
        Object.entries(tabPanelMap).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('hidden', key !== tab);
        });
        drinkToolbar?.classList.toggle('hidden', tab !== 'drinks');
        if (tab === 'drinks') renderDrinksTab();
    });
});

// Drinks tab
let drinksCache    = null;
let drinkVenueMap  = null; // Map<drinkId, [{id, name}]>
let activeDrinkCat = '';

const drinksList  = document.getElementById('admin-drinks-list');
const drinkSearch = document.getElementById('admin-drink-search');
const catPills    = document.querySelectorAll('#admin-drinks-toolbar [data-category]');

catPills.forEach(pill => {
    pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('admin-status-pill--active'));
        pill.classList.add('admin-status-pill--active');
        activeDrinkCat = pill.dataset.category;
        applyDrinkFilters();
    });
});

drinkSearch?.addEventListener('input', applyDrinkFilters);

function applyDrinkFilters() {
    if (!drinksCache) return;
    const q   = (drinkSearch?.value || '').toLowerCase().trim();
    const cat = activeDrinkCat;
    const filtered = drinksCache.filter(d => {
        const matchCat  = !cat || (d.category || '').toUpperCase() === cat.toUpperCase();
        const matchText = !q   || [d.name, d.description, d.category].join(' ').toLowerCase().includes(q);
        return matchCat && matchText;
    });
    renderDrinkCards(filtered);
}

function renderDrinkCards(drinks) {
    if (!drinks.length) {
        drinksList.innerHTML = '<p class="dashboard-message">Nessun drink trovato.</p>';
        return;
    }
    drinksList.innerHTML = '<div class="admin-drinks-grid">' + drinks.map(d => {
        const count = (drinkVenueMap && drinkVenueMap.get(String(d.id))) || 0;
        const venueLabel = count === 1 ? '1 locale' : `${count} locali`;
        const abvLabel = d.abv != null ? `${escapeHtml(String(d.abv))}%` : 'N/D';
        return `
        <article class="admin-drink-card" data-id="${escapeHtml(String(d.id))}">
            <div class="admin-drink-card__inner">
                ${d.imageUri ? `<img class="admin-drink-cover" src="${escapeHtml(d.imageUri)}" alt="${escapeHtml(d.name)}">` : '<div class="admin-drink-cover admin-drink-cover--placeholder"><i class="fa-solid fa-beer-mug-empty"></i></div>'}
                <div class="admin-drink-body">
                    <div class="admin-drink-header">
                        <span class="admin-drink-chip admin-drink-category">
                            ${escapeHtml(d.category || '-')}
                            <i class="fa-solid fa-circle-check"></i>
                        </span>
                        <strong>${escapeHtml(d.name)}</strong>
                    </div>
                    <p class="admin-drink-desc">${escapeHtml(d.description || 'Nessuna descrizione disponibile.')}</p>
                    <div class="admin-drink-footer">
                        <div class="admin-drink-stats">
                            <span class="admin-drink-chip">
                                <i class="fa-solid fa-percent"></i>
                                ${abvLabel}
                            </span>
                            <span class="admin-drink-chip">
                                <i class="fa-solid fa-store"></i>
                                ${venueLabel}
                            </span>
                        </div>
                        <div class="admin-drink-actions">
                            <button type="button" class="drink-edit-btn">
                                Modifica
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="drink-delete-btn" aria-label="Elimina ${escapeHtml(d.name)}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>`;
    }).join('') + '</div>';
}

drinksList?.addEventListener('click', async e => {
    const card = e.target.closest('.admin-drink-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.closest('.drink-edit-btn')) {
        const drink = drinksCache.find(d => String(d.id) === String(id));
        if (drink) openEditDrinkModal(drink);
        return;
    }

    if (e.target.closest('.drink-delete-btn')) {
        const confirmed = await confirmAction({ title: 'Eliminare il drink?', message: 'Azione non reversibile.', confirmText: 'Elimina', danger: true });
        if (!confirmed) return;
        try {
            await deleteDrink(id);
            drinksCache = drinksCache.filter(d => String(d.id) !== String(id));
            showToast('Drink eliminato.');
            applyDrinkFilters();
        } catch (err) { showToast(err.message, 'error'); }
    }
});

async function renderDrinksTab() {
    drinksList.innerHTML = '<p class="dashboard-message">Caricamento drink...</p>';
    try {
        if (!drinksCache) {
            // Carica drink globali e tutti i locali admin in parallelo
            const [drinks, venues] = await Promise.all([getDrinks(), getAdminVenues()]);
            drinksCache = drinks;

            // Per ogni locale, carica i suoi drink e costruisce drink->locali
            // VenueDrinkResponse ha campo drinkId che corrisponde a DrinkResponse.id
            const countMap = new Map();
            await Promise.all(venues.map(async v => {
                try {
                    const vd = await getOwnerVenueDrinks(v.id);
                    vd.forEach(d => { const k = String(d.drinkId); countMap.set(k, (countMap.get(k) || 0) + 1); });
                } catch { /* nessun drink */ }
            }));
            drinkVenueMap = countMap;
        }
        applyDrinkFilters();
    } catch (err) {
        drinksList.innerHTML = `<p class="dashboard-message">Errore: ${escapeHtml(err.message)}</p>`;
    }
}
