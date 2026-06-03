import {
  createVenueReview,
  getActiveVenue,
  getCurrentUser,
  getVenueDrinks,
  getVenueReviews
} from './api.js';
import { getFavorites, toggleFavorite } from './favorites.js';
import { showToast } from './feedback.js';
import { escapeHtml } from './utils.js';

const FALLBACK_IMAGE = 'assets/icons/Minimal.png';
const RATING_ICON = 'fa-solid fa-beer-mug-empty';
const REVIEWS_PAGE_SIZE = 5;

function formatPrice(price) {
  if (price == null) return '';
  return ` - ${Number(price).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`;
}

// ── Stelle ────────────────────────────────────────────────────
function ratingIconHtml(filled, extraClass = '') {
  return `<i class="${RATING_ICON} rating-icon ${filled ? 'rating-icon--filled' : 'rating-icon--empty'} ${extraClass}"></i>`;
}

function starsHtml(rating, { interactive = false, size = 'md' } = {}) {
  const full = Math.round(Number(rating) || 0);
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < full;
    if (interactive) {
      return `<button type="button" class="star-btn star-btn--${size} ${filled ? 'is-filled' : ''}" data-value="${i + 1}" aria-label="Voto ${i + 1}">`
           + ratingIconHtml(filled)
           + `</button>`;
    }
    return ratingIconHtml(filled, `detail-star detail-star--${size}`);
  }).join('');
}

function reviewSummaryHtml(reviews) {
  if (!reviews.length) return '';
  const avg = reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length;
  return `
    <div class="detail-review-summary">
      <span class="detail-review-avg">${avg.toFixed(1)}</span>
      <div>
        <div class="detail-stars-row">${starsHtml(avg, { size: 'lg' })}</div>
        <span class="detail-review-count">${reviews.length} recension${reviews.length === 1 ? 'e' : 'i'}</span>
      </div>
    </div>`;
}

// ── Drink ─────────────────────────────────────────────────────
function renderDrinks(drinks) {
  if (!drinks.length) return '<p class="detail-muted">Nessuna birra associata.</p>';
  return `
    <div class="detail-list">
      ${drinks.map(drink => `
        <article class="detail-row">
          <img src="${escapeHtml(drink.imageUri || FALLBACK_IMAGE)}" alt="Foto di ${escapeHtml(drink.drinkName)}">
          <div>
            <h4>${escapeHtml(drink.drinkName)}</h4>
            <p>${escapeHtml(drink.category || 'Birra')}${formatPrice(drink.price)}</p>
            <small>${escapeHtml(drink.drinkDescription || '')}</small>
          </div>
        </article>
      `).join('')}
    </div>`;
}

// ── Recensioni ────────────────────────────────────────────────
function renderReviews(reviews) {
  if (!reviews.length) return '<p class="detail-muted">Nessuna recensione pubblicata.</p>';
  return `
    <div class="detail-reviews-block">
    ${reviewSummaryHtml(reviews)}
    <div class="detail-list detail-reviews-list">
      ${reviews.map((review, index) => `
        <article class="detail-review ${index >= REVIEWS_PAGE_SIZE ? 'is-hidden' : ''}">
          <div class="detail-review-header">
            <div class="detail-stars-row">${starsHtml(review.rating)}</div>
            <span class="detail-review-author">
              <i class="fa-solid fa-user"></i> ${escapeHtml(review.username || 'Utente')}
            </span>
          </div>
          ${review.comment ? `<p class="detail-review-comment">${escapeHtml(review.comment)}</p>` : ''}
        </article>
      `).join('')}
    </div>
    ${reviews.length > REVIEWS_PAGE_SIZE ? '<button type="button" class="detail-load-more">Carica altre recensioni</button>' : ''}
    </div>`;
}

// ── Form recensione con stelle interattive ────────────────────
function renderReviewForm(user, venueId) {
  if (!user || (user.role !== 'USER' && user.role !== 'ADMIN')) return '';
  return `
    <form class="detail-review-form" id="venue-review-form">
      <h3>Lascia una recensione</h3>
      <input type="hidden" name="venueId" value="${escapeHtml(venueId)}">
      <div class="detail-star-picker" id="star-picker" role="group" aria-label="Seleziona voto">
        ${starsHtml(0, { interactive: true, size: 'xl' })}
      </div>
      <input type="hidden" name="rating" id="review-rating" value="" required>
      <p class="detail-star-hint" id="star-hint">Tocca una birra per votare</p>
      <label for="review-comment">Commento</label>
      <textarea id="review-comment" name="comment" maxlength="500" rows="3" placeholder="Racconta la tua esperienza…"></textarea>
      <button type="submit">Invia recensione</button>
      <p class="detail-form-message" id="venue-review-message" aria-live="polite"></p>
    </form>`;
}

function renderAccordionSection(title, content, open = true) {
  return `
    <details class="detail-accordion" ${open ? 'open' : ''}>
      <summary>
        <span>${escapeHtml(title)}</span>
        <i class="fa-solid fa-chevron-down"></i>
      </summary>
      <div class="detail-accordion-body">
        ${content}
      </div>
    </details>`;
}

function renderDetailTabs({ drinks, reviews, user, venueId }) {
  return `
    <div class="detail-tabs" role="tablist" aria-label="Sezioni dettagli locale">
      <button type="button" class="detail-tab is-active" role="tab" aria-selected="true" data-tab="overview">Panoramica</button>
      <button type="button" class="detail-tab" role="tab" aria-selected="false" data-tab="drinks">Birre</button>
      <button type="button" class="detail-tab" role="tab" aria-selected="false" data-tab="reviews">Recensioni</button>
    </div>

    <section class="detail-tab-panel" role="tabpanel" data-panel="overview">
      ${renderAccordionSection('Birre disponibili', renderDrinks(drinks))}
      ${renderAccordionSection('Recensioni', renderReviews(reviews))}
    </section>

    <section class="detail-tab-panel hidden" role="tabpanel" data-panel="drinks">
      <h3>Birre disponibili</h3>
      ${renderDrinks(drinks)}
    </section>

    <section class="detail-tab-panel hidden" role="tabpanel" data-panel="reviews">
      <h3>Recensioni</h3>
      ${renderReviews(reviews)}
      ${renderReviewForm(user, venueId)}
    </section>
  `;
}

// ── Bottoni ───────────────────────────────────────────────────
function renderFavoriteButton(user, venueId, isFavorite) {
  if (!user) return '';
  return `
    <button type="button"
      class="detail-favorite-button ${isFavorite ? 'is-favorite' : ''}"
      data-id="${escapeHtml(venueId)}"
      aria-label="${isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
      <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      <span>${isFavorite ? 'Tra i preferiti' : 'Aggiungi ai preferiti'}</span>
    </button>`;
}

function renderMapButton(venueId) {
  return `
    <button type="button"
      class="detail-map-button"
      data-id="${escapeHtml(venueId)}"
      aria-label="Vai sulla mappa">
      <i class="fa-solid fa-map-location-dot"></i>
      <span>Mappa</span>
    </button>`;
}

// ── Bind preferiti ────────────────────────────────────────────
function updateFavoriteButton(button, isFavorite) {
  const icon  = button.querySelector('i');
  const label = button.querySelector('span');
  button.classList.toggle('is-favorite', isFavorite);
  button.setAttribute('aria-label', isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
  icon?.classList.toggle('fa-regular', !isFavorite);
  icon?.classList.toggle('fa-solid',   isFavorite);
  if (label) label.textContent = isFavorite ? 'Tra i preferiti' : 'Aggiungi ai preferiti';
}

function syncVisibleFavoriteButtons(venueId, isFavorite) {
  document.querySelectorAll('.favorite-button, .detail-favorite-button').forEach(button => {
    if (button.dataset.id === String(venueId)) updateFavoriteButton(button, isFavorite);
  });
}

function bindFavoriteButton(venueId, initialFavorite) {
  const button = document.querySelector('.detail-favorite-button');
  if (!button) return;
  let isFavorite = initialFavorite;
  button.addEventListener('click', async () => {
    try {
      button.disabled = true;
      const favoriteIds = await toggleFavorite(venueId, isFavorite);
      isFavorite = favoriteIds.includes(String(venueId));
      syncVisibleFavoriteButtons(venueId, isFavorite);
      window.dispatchEvent(new CustomEvent('localbrew:favorites-changed', { detail: { favoriteIds } }));
      showToast(isFavorite ? 'Locale aggiunto ai preferiti.' : 'Locale rimosso dai preferiti.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });
}

function bindMapButton(venueId) {
  document.querySelector('.detail-map-button')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('localbrew:focus-venue', { detail: { venueId } }));
  });
}

// ── Bind stelle interattive ───────────────────────────────────
function bindDetailTabs() {
  const tabs = document.querySelectorAll('.detail-tab');
  const panels = document.querySelectorAll('.detail-tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(item => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });

      panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== target);
      });
    });
  });
}

function bindLoadMoreReviews() {
  document.querySelectorAll('.detail-load-more').forEach(button => {
    button.addEventListener('click', () => {
      const block = button.closest('.detail-reviews-block');
      const hiddenReviews = Array.from(block?.querySelectorAll('.detail-review.is-hidden') || []);

      hiddenReviews.slice(0, REVIEWS_PAGE_SIZE).forEach(review => {
        review.classList.remove('is-hidden');
      });

      const remainingReviews = block?.querySelectorAll('.detail-review.is-hidden').length || 0;
      if (!remainingReviews) {
        button.remove();
      }
    });
  });
}

function bindStarPicker() {
  const picker  = document.getElementById('star-picker');
  const input   = document.getElementById('review-rating');
  const hint    = document.getElementById('star-hint');
  if (!picker) return;

  const labels = ['', 'Pessimo', 'Scarso', 'Nella media', 'Buono', 'Eccellente'];

  function setStars(value, commit = false) {
    picker.querySelectorAll('.star-btn').forEach((btn, i) => {
      const position = i + 1;
      const filled = position <= value;
      const icon = btn.querySelector('i');
      icon.className = `${RATING_ICON} rating-icon`;
      btn.classList.toggle('is-filled', filled);
    });
    if (commit && value) {
      input.value = value;
      hint.textContent = labels[value];
      hint.classList.add('detail-star-hint--selected');
    }
  }

  picker.addEventListener('mouseover', e => {
    const btn = e.target.closest('.star-btn');
    if (btn) setStars(Number(btn.dataset.value));
  });

  picker.addEventListener('mouseleave', () => {
    setStars(Number(input.value) || 0);
  });

  picker.addEventListener('click', e => {
    const btn = e.target.closest('.star-btn');
    if (btn) setStars(Number(btn.dataset.value), true);
  });
}

// ── Bind form ─────────────────────────────────────────────────
function bindReviewForm(venueId) {
  const form    = document.getElementById('venue-review-form');
  const message = document.getElementById('venue-review-message');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const rating = Number(form.elements.rating.value);
    if (!rating) {
      message.textContent = 'Seleziona un voto prima di inviare.';
      return;
    }
    message.textContent = 'Invio recensione...';
    try {
      await createVenueReview({ venueId, rating, comment: form.elements.comment.value.trim() });
      showToast('Recensione pubblicata.');
      await openVenueDetails(venueId);
    } catch (error) {
      message.textContent = error.message;
      showToast(error.message, 'error');
    }
  });
}

// ── Export principale ─────────────────────────────────────────
export async function openVenueDetails(id) {
  const panel   = document.getElementById('venue-details');
  const content = document.getElementById('venue-details-content');

  content.textContent = 'Caricamento dettagli...';
  panel.classList.remove('hidden');

  try {
    const [venue, drinks, reviews, user] = await Promise.all([
      getActiveVenue(id),
      getVenueDrinks(id).catch(() => []),
      getVenueReviews(id).catch(() => []),
      getCurrentUser()
    ]);
    const favoriteIds = user ? await getFavorites() : [];
    const isFavorite  = favoriteIds.includes(String(id));

    content.innerHTML = `
      <img class="detail-cover" src="${escapeHtml(venue.imageUri || FALLBACK_IMAGE)}" alt="Foto di ${escapeHtml(venue.name)}">
      <div class="detail-heading">
        <span>${escapeHtml(venue.type || 'Locale')}</span>
        <div class="detail-title-row">
          <h2>${escapeHtml(venue.name)}</h2>
        </div>
        <div class="detail-title-actions">
          ${renderMapButton(id)}
          ${renderFavoriteButton(user, id, isFavorite)}
        </div>
        <p>${escapeHtml(venue.description || '')}</p>
      </div>
      <div class="detail-meta">
        <p><strong>Città:</strong> ${escapeHtml(venue.city)}</p>
        <p><strong>Indirizzo:</strong> ${escapeHtml(venue.address)}</p>
      </div>
      ${renderDetailTabs({ drinks, reviews, user, venueId: id })}
    `;

    bindMapButton(id);
    bindFavoriteButton(id, isFavorite);
    bindDetailTabs();
    bindLoadMoreReviews();
    bindStarPicker();
    bindReviewForm(id);
  } catch (error) {
    content.textContent = error.message || 'Impossibile caricare i dettagli del locale.';
  }
}
