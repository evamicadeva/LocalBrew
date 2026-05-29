import {
  createVenueReview,
  getActiveVenue,
  getCurrentUser,
  getVenueDrinks,
  getVenueReviews
} from './api.js';
import { escapeHtml } from './utils.js';

const FALLBACK_IMAGE = 'assets/icons/Minimal.png';

function formatPrice(price) {
  if (price == null) return '';
  return ` - ${Number(price).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`;
}

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
    </div>
  `;
}

function renderReviews(reviews) {
  if (!reviews.length) return '<p class="detail-muted">Nessuna recensione pubblicata.</p>';

  return `
    <div class="detail-list">
      ${reviews.map(review => `
        <article class="detail-review">
          <strong>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</strong>
          <p>${escapeHtml(review.comment || '')}</p>
          <small>${escapeHtml(review.username || 'Utente')}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function renderReviewForm(user, venueId) {
  if (!user || (user.role !== 'USER' && user.role !== 'ADMIN')) return '';

  return `
    <form class="detail-review-form" id="venue-review-form">
      <h3>Lascia una recensione</h3>
      <input type="hidden" name="venueId" value="${escapeHtml(venueId)}">
      <label for="review-rating">Voto</label>
      <select id="review-rating" name="rating" required>
        <option value="5">5</option>
        <option value="4">4</option>
        <option value="3">3</option>
        <option value="2">2</option>
        <option value="1">1</option>
      </select>
      <label for="review-comment">Commento</label>
      <textarea id="review-comment" name="comment" maxlength="500" rows="3"></textarea>
      <button type="submit">Invia recensione</button>
      <p class="detail-form-message" id="venue-review-message" aria-live="polite"></p>
    </form>
  `;
}

function bindReviewForm(venueId) {
  const form = document.getElementById('venue-review-form');
  const message = document.getElementById('venue-review-message');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = 'Invio recensione...';

    try {
      await createVenueReview({
        venueId,
        rating: Number(form.elements.rating.value),
        comment: form.elements.comment.value.trim()
      });
      await openVenueDetails(venueId);
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

export async function openVenueDetails(id) {
  const panel = document.getElementById('venue-details');
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

    content.innerHTML = `
      <img class="detail-cover" src="${escapeHtml(venue.imageUri || FALLBACK_IMAGE)}" alt="Foto di ${escapeHtml(venue.name)}">
      <div class="detail-heading">
        <span>${escapeHtml(venue.type || 'Locale')}</span>
        <h2>${escapeHtml(venue.name)}</h2>
        <p>${escapeHtml(venue.description || '')}</p>
      </div>
      <div class="detail-meta">
        <p><strong>Citta:</strong> ${escapeHtml(venue.city)}</p>
        <p><strong>Indirizzo:</strong> ${escapeHtml(venue.address)}</p>
      </div>
      <h3>Birre disponibili</h3>
      ${renderDrinks(drinks)}
      <h3>Recensioni</h3>
      ${renderReviews(reviews)}
      ${renderReviewForm(user, id)}
    `;

    bindReviewForm(id);
  } catch (error) {
    content.textContent = error.message || 'Impossibile caricare i dettagli del locale.';
  }
}
