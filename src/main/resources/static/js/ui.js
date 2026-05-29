import { applyFilters } from './filters.js';
import { map } from './map.js';
import { markers, markersCluster } from './markers.js';
import { escapeHtml } from './utils.js';
import { getFavorites, toggleFavorite } from './favorites.js';
import { openVenueDetails } from './details.js';
import { getToken } from './api.js';

// Genera le card partendo dai dati in data.js.
const INITIAL_VISIBLE_CARDS = 3;
let showAllVenues = false;

function updateCardsVisibility() {
  const container = document.getElementById('venue-container');
  const allButton = document.querySelector('.all-btn');

  if (!container || !allButton) return;

  const hasExtraCards = container.querySelectorAll('.card').length > INITIAL_VISIBLE_CARDS;

  container.classList.toggle('is-expanded', showAllVenues);
  allButton.classList.toggle('hidden', !hasExtraCards);
  allButton.textContent = showAllVenues ? 'Mostra meno locali' : 'Vedi tutti i locali';
}

function renderCards(pubs, favorites) {
  const container = document.getElementById('venue-container');
  if (!container) return;

  container.innerHTML = pubs.map((pub, index) => {
    // I dati della singola card vanno preparati dentro il ciclo.
    const id = String(pub.id);
    const safeId = escapeHtml(id);
    const name = escapeHtml(pub.name);
    const image = escapeHtml(pub.image);
    const rating = escapeHtml(pub.rating);
    const isFavorite = favorites.includes(id);

    // Le card dopo la terza vengono nascoste finche l'utente non apre la lista.
    const extraClass = index >= INITIAL_VISIBLE_CARDS ? 'card-extra' : '';

    const tags = String(pub.beers ?? '')
      .split(',')
      .map(beer => `<span>${escapeHtml(beer.trim())}</span>`)
      .join('');

    return `
      <article class="card ${extraClass}" data-index="${index}">
        <div class="card-img">
          <img src="${image}" alt="Foto di ${name}">
          <h3>${name}</h3>
          <span class="rating">&#11088; ${rating}</span>
        </div>

        <div class="card-body">
          <div class="card-top">
            <h3>${name}</h3>

            <div class="card-actions">
              <span class="rating">&#11088; ${rating}</span>

              <button
                type="button"
                class="favorite-button ${isFavorite ? 'is-favorite' : ''}"
                data-id="${safeId}"
                aria-label="${isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
          </div>

          <div class="tags">${tags}</div>

          <div class="card-buttons">
            <button type="button" class="card-map-button" data-index="${index}">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Mappa</span>
            </button>

            <button type="button" class="card-details-button" data-id="${safeId}">
              <i class="fa-solid fa-circle-info"></i>
              <span>Dettagli</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function highlightCard(card) {
  // Mantiene evidenziata una sola card alla volta dopo il salto dal popup.
  document.querySelectorAll('.card.is-focused').forEach(item => item.classList.remove('is-focused'));
  card.classList.add('is-focused');
  window.setTimeout(() => card.classList.remove('is-focused'), 1800);
}

function focusCard(index) {
  // Scorre fino alla card corrispondente al marker selezionato.
  const card = document.querySelector(`.card[data-index="${index}"]`);
  if (!card) return;

  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  highlightCard(card);
}

function focusMarker(index) {
  // Apre il marker anche quando è dentro un cluster, poi mostra il suo popup.
  const marker = markers[index];
  if (!marker) return;

  markersCluster.zoomToShowLayer(marker, () => {
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
  });
}

export async function initUI(pubs) {
  let favoriteIds = await getFavorites();
  let showFavoritesOnly = false;

  function applyCurrentFilters() {
    applyFilters(pubs, showFavoritesOnly ? favoriteIds : null);
  }

  renderCards(pubs, favoriteIds);
  updateCardsVisibility();

  // Riferimenti agli elementi principali controllati dalla UI.
  const searchInput = document.getElementById('searchInput');
  const searchPanel = document.getElementById('search-panel');
  const beerCheckboxes = document.querySelectorAll('.filter-option input');
  const favoritesButton = document.getElementById('btn-favorites');
  const detailsPanel = document.getElementById('venue-details');
  const detailsClose = document.getElementById('details-close');

  if (detailsPanel && detailsClose) {
    detailsClose.addEventListener('click', () => {
      detailsPanel.classList.add('hidden');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyCurrentFilters);
  }

  if (favoritesButton && getToken()) {
    favoritesButton.classList.remove('hidden');
    favoritesButton.addEventListener('click', () => {
      showFavoritesOnly = !showFavoritesOnly;
      favoritesButton.classList.toggle('active', showFavoritesOnly);
      favoritesButton.setAttribute(
        'aria-label',
        showFavoritesOnly ? 'Mostra tutti i locali' : 'Mostra preferiti'
      );
      applyCurrentFilters();
    });
  }

  // Ogni cambio dei filtri aggiorna insieme card e marker.
  beerCheckboxes.forEach(box => {
    box.addEventListener('change', applyCurrentFilters);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    // Torna alla vista iniziale di Milano e pulisce tutti i filtri.
    map.setView([45.4642, 9.1900], 12);
    searchInput.value = '';
    beerCheckboxes.forEach(box => box.checked = false);
    showFavoritesOnly = false;
    favoritesButton?.classList.remove('active');
    favoritesButton?.setAttribute('aria-label', 'Mostra preferiti');

    applyCurrentFilters();
  });

  document.addEventListener('click', async event => {
    const favoriteButton = event.target.closest('.favorite-button');

    if (favoriteButton) {
      const pubId = favoriteButton.dataset.id;
      const wasFavorite = favoriteButton.classList.contains('is-favorite');

      try {
        favoriteButton.disabled = true;
        favoriteIds = await toggleFavorite(pubId, wasFavorite);
        const isFavorite = favoriteIds.includes(String(pubId));
        const icon = favoriteButton.querySelector('i');

        favoriteButton.classList.toggle('is-favorite', isFavorite);
        icon.classList.toggle('fa-regular', !isFavorite);
        icon.classList.toggle('fa-solid', isFavorite);

        favoriteButton.setAttribute(
          'aria-label',
          isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'
        );
        applyCurrentFilters();
      } catch (error) {
        alert(error.message);
      } finally {
        favoriteButton.disabled = false;
      }

      return;
    }

    const detailsButton = event.target.closest('.card-details-button');

    if (detailsButton) {
      openVenueDetails(detailsButton.dataset.id);
      return;
    }

    const mapButton = event.target.closest('.card-map-button');
    if (mapButton) {
      focusMarker(Number(mapButton.dataset.index));
      return;
    }

    const cardButton = event.target.closest('.popup-card-link');
    if (cardButton) {
      focusCard(Number(cardButton.dataset.index));
    }
  });

  document.getElementById('btn-search').addEventListener('click', () => {
    // Mostra o nasconde il pannello di ricerca sopra la mappa.
    searchPanel.classList.toggle('hidden');
  });

  // aggiorna le card per aagiungerne altre
  document.querySelector('.all-btn').addEventListener('click', () => {
    showAllVenues = !showAllVenues;
    updateCardsVisibility();
  });
}
