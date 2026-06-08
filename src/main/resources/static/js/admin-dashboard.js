import {
  activateVenue,
  createDrink,
  deleteVenue,
  deleteVenueReview,
  getAdminVenues,
  getVenueDrinks,
  getVenueReviews,
  getDrinks,
  suspendVenue,
  uploadDrinkImage,
  updateDrink,
  deleteDrink
} from './api.js';
import './logout.js';
import {confirmAction, showToast} from './feedback.js';
import {requireRole} from './role-guard.js';
import {escapeHtml} from './utils.js';

// ── DOM refs ─────────────────────────────────────────────────
const container        = document.getElementById('admin-venues');
const venueSearch      = document.getElementById('admin-venue-search');
const statusPills      = document.querySelectorAll('.admin-status-pill');
const reviewHint       = document.getElementById('admin-review-hint');
const reviewVenueName  = document.getElementById('admin-review-venue-name');
const reviewList       = document.getElementById('admin-reviews');
const openDrawerBtn    = document.getElementById('admin-open-drawer');
const closeDrawerBtn   = document.getElementById('admin-close-drawer');
const drawer           = document.getElementById('admin-drink-drawer');
const overlay          = document.getElementById('admin-drawer-overlay');
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

const DRINK_IMAGE_LABEL = 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)';

// ── Stato ────────────────────────────────────────────────────
let adminVenues   = [];
let activeStatus  = '';        // '' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'
const reviewCache = {};

// ── Drawer ───────────────────────────────────────────────────
function openDrawer()  {
    drawer.classList.add('admin-drawer--open');
    overlay.classList.add('admin-drawer-overlay--visible');
    document.body.style.overflow = 'hidden';
    drinkFields.name.focus();
}

function closeDrawer() {
    drawer.classList.remove('admin-drawer--open');
    overlay.classList.remove('admin-drawer-overlay--visible');
    document.body.style.overflow = '';
}

openDrawerBtn?.addEventListener('click', openDrawer);
closeDrawerBtn?.addEventListener('click', closeDrawer);
overlay?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

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
const user = await requireRole('ADMIN');

if (user) {
    await loadVenues();

    setupImageUpload({
        fileInput: drinkImageFile, preview: drinkImagePreview,
        filename: drinkImageFilename, removeBtn: drinkImageRemove,
        hiddenInput: drinkFields.imageUri, defaultLabel: DRINK_IMAGE_LABEL
    });

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
            showDrinkMessage('Drink creato.', 'is-success');
            showToast('Drink creato.');
            closeDrawer();
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
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

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => { b.classList.remove('admin-tab--active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('admin-tab--active');
        btn.setAttribute('aria-selected', 'true');
        const tab = btn.dataset.tab;
        Object.entries(tabPanelMap).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('hidden', key !== tab);
        });
        if (tab === 'drinks') renderDrinksTab();
    });
});

// Drinks tab
let drinksCache    = null;
let drinkVenueMap  = null; // Map<drinkId, [{id, name}]>
let activeDrinkCat = '';

const drinksList  = document.getElementById('admin-drinks-list');
const drinkSearch = document.getElementById('admin-drink-search');
const catPills    = document.querySelectorAll('[data-category]');

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
        const venueLabel = count === 0 ? 'Nessun locale' : `Presente in ${count} locale${count === 1 ? '' : 'i'}`;
        return `
        <article class="admin-drink-card" data-id="${escapeHtml(String(d.id))}">
            ${d.imageUri ? `<img class="admin-drink-img" src="${escapeHtml(d.imageUri)}" alt="${escapeHtml(d.name)}">` : '<div class="admin-drink-img admin-drink-img--placeholder"><i class="fa-solid fa-beer-mug-empty"></i></div>'}
            <div class="admin-drink-body">
                <div class="admin-drink-header">
                    <strong>${escapeHtml(d.name)}</strong>
                    <span class="admin-drink-badge">${escapeHtml(d.category || '-')}</span>
                </div>
                ${d.description ? `<p class="admin-drink-desc">${escapeHtml(d.description)}</p>` : ''}
                <div class="admin-drink-meta">
                    ${d.abv != null ? `<span><i class="fa-solid fa-percent"></i> ${escapeHtml(String(d.abv))} ABV</span>` : ''}
                    <span class="admin-drink-venue-count"><i class="fa-solid fa-store"></i> ${venueLabel}</span>
                </div>
                <div class="admin-drink-actions">
                    <button type="button" class="secondary-button drink-edit-btn"><i class="fa-solid fa-pen"></i> Modifica</button>
                    <button type="button" class="danger-button drink-delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="admin-drink-edit-form hidden">
                    <label class="admin-edit-label">Nome</label>
                    <input class="edit-drink-name admin-search-input" type="text" value="${escapeHtml(d.name)}" maxlength="100">
                    <label class="admin-edit-label">Descrizione</label>
                    <textarea class="edit-drink-description admin-search-input" rows="2" maxlength="300">${escapeHtml(d.description || '')}</textarea>
                    <label class="admin-edit-label">Categoria</label>
                    <select class="edit-drink-category admin-search-input">
                        ${['IPA','LAGER','STOUT','ALE','WHEAT','SOUR'].map(cat =>
                            `<option value="${cat}"${d.category === cat ? ' selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                    <label class="admin-edit-label">ABV</label>
                    <input class="edit-drink-abv admin-search-input" type="number" step="0.1" min="0" max="100" value="${d.abv != null ? escapeHtml(String(d.abv)) : ''}">
                    <div class="admin-drink-edit-actions">
                        <button type="button" class="profile-save-btn drink-save-btn"><i class="fa-solid fa-check"></i> Salva</button>
                        <button type="button" class="secondary-button drink-cancel-btn">Annulla</button>
                    </div>
                    <p class="profile-form-msg drink-edit-msg" aria-live="polite"></p>
                </div>
            </div>
        </article>`;
    }).join('') + '</div>';
}

drinksList?.addEventListener('click', async e => {
    const card = e.target.closest('.admin-drink-card');
    if (!card) return;
    const id = card.dataset.id;
    const form = card.querySelector('.admin-drink-edit-form');
    const editBtn = card.querySelector('.drink-edit-btn');

    if (e.target.closest('.drink-edit-btn')) {
        const isOpen = !form.classList.contains('hidden');
        form.classList.toggle('hidden', isOpen);
        editBtn.innerHTML = isOpen ? '<i class="fa-solid fa-pen"></i> Modifica' : '<i class="fa-solid fa-xmark"></i> Chiudi';
        return;
    }
    if (e.target.closest('.drink-cancel-btn')) {
        form.classList.add('hidden');
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Modifica';
        return;
    }
    if (e.target.closest('.drink-save-btn')) {
        const msgEl = form.querySelector('.drink-edit-msg');
        const name  = form.querySelector('.edit-drink-name').value.trim();
        const desc  = form.querySelector('.edit-drink-description').value.trim();
        const cat   = form.querySelector('.edit-drink-category').value;
        const abv   = form.querySelector('.edit-drink-abv').value;
        if (!name) { msgEl.textContent = 'Nome obbligatorio.'; return; }
        msgEl.textContent = 'Salvataggio...';
        try {
            const updated = await updateDrink(id, { name, description: desc || null, category: cat, abv: abv !== '' ? Number(abv) : null });
            const idx = drinksCache.findIndex(d => String(d.id) === String(id));
            if (idx >= 0) drinksCache[idx] = updated;
            showToast('Drink aggiornato.');
            applyDrinkFilters();
        } catch (err) { msgEl.textContent = err.message; }
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
                    const vd = await getVenueDrinks(v.id);
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
