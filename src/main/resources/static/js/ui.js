import { applyFilters } from './filters.js';
import { fitItaly, map } from './map.js';
import { markers, markersCluster } from './markers.js';
import { escapeHtml } from './utils.js';
import { getFavorites, toggleFavorite } from './favorites.js';
import { openVenueDetails } from './details.js';
import { getToken } from './api.js';
import { showToast } from './feedback.js';

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

function googleMapsUrl(pub) {
  const lat = Number(pub.lat);
  const lng = Number(pub.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const query = [pub.name, pub.address, pub.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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
    const city = escapeHtml(pub.city || 'Citta non disponibile');
    const mapsUrl = escapeHtml(googleMapsUrl(pub));
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
          <span class="rating"><i class="fa-solid fa-beer-mug-empty card-star rating-icon rating-icon--filled"></i> ${rating}</span>
        </div>

        <div class="card-body">
          <div class="card-top">
            <h3>${name}</h3>

            <div class="card-actions">
              <span class="rating"><i class="fa-solid fa-beer-mug-empty card-star rating-icon rating-icon--filled"></i> ${rating}</span>

              <button
                type="button"
                class="favorite-button ${isFavorite ? 'is-favorite' : ''}"
                data-id="${safeId}"
                aria-label="${isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
          </div>

          <p class="card-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${city}</span>
          </p>

          <div class="tags">${tags}</div>

          <div class="card-buttons">
            <button type="button" class="card-map-button" data-index="${index}">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Mappa</span>
            </button>

            <a class="card-google-button" href="${mapsUrl}" target="_blank" rel="noopener noreferrer" aria-label="Apri ${name} su Google Maps">
              <i class="fa-solid fa-location-arrow"></i>
              <span>Maps</span>
            </a>

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

function focusMarker(index) {
  // Apre il marker anche quando è dentro un cluster, poi mostra il suo popup.
  const marker = markers[index];
  if (!marker) return;

  if (!markersCluster.hasLayer(marker)) {
    markersCluster.addLayer(marker);
  }

  document.querySelector('.map-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  markersCluster.zoomToShowLayer(marker, () => {
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
  });
}

function updateFavoriteButtons(favoriteIds) {
  const favorites = new Set(favoriteIds.map(id => String(id)));

  document.querySelectorAll('.favorite-button').forEach(button => {
    const isFavorite = favorites.has(String(button.dataset.id));
    const icon = button.querySelector('i');

    button.classList.toggle('is-favorite', isFavorite);
    icon?.classList.toggle('fa-regular', !isFavorite);
    icon?.classList.toggle('fa-solid', isFavorite);
    button.setAttribute(
      'aria-label',
      isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'
    );
  });
}

function renderFavoritesList(pubs, favoriteIds) {
  const list = document.getElementById('favorites-list');
  if (!list) return;

  const favorites = new Set(favoriteIds.map(id => String(id)));
  const favoritePubs = pubs.filter(pub => favorites.has(String(pub.id)));

  if (!favoritePubs.length) {
    list.innerHTML = '<p class="favorites-empty">Non hai ancora salvato locali preferiti.</p>';
    return;
  }

  list.innerHTML = favoritePubs.map(pub => `
    <article class="favorite-panel-card">
      <img src="${escapeHtml(pub.image)}" alt="Foto di ${escapeHtml(pub.name)}">
      <div class="favorite-panel-main">
        <strong>${escapeHtml(pub.name)}</strong>
        <small>${escapeHtml(pub.city || '')} &middot; <i class="fa-solid fa-beer-mug-empty card-star rating-icon rating-icon--filled"></i> ${escapeHtml(pub.rating)}</small>
      </div>
      <div class="favorite-panel-actions">
        <button type="button" class="favorite-panel-map-button" data-id="${escapeHtml(pub.id)}" aria-label="Vai sulla mappa">
          <i class="fa-solid fa-map-location-dot"></i>
        </button>
        <button type="button" class="favorite-panel-details-button" data-id="${escapeHtml(pub.id)}" aria-label="Apri dettagli">
          <i class="fa-solid fa-circle-info"></i>
        </button>
      </div>
    </article>
  `).join('');
}


export async function initUI(pubs) {
  let favoriteIds = await getFavorites();
  let showFavoritesOnly = false;

  function applyCurrentFilters() {
    applyFilters(pubs, showFavoritesOnly ? favoriteIds : null);
  }

  renderCards(pubs, favoriteIds);
  updateCardsVisibility();

  const searchInput     = document.getElementById('searchInput');
  const searchPanel     = document.getElementById('search-panel');
  const searchButton    = document.getElementById('btn-search');
  const favoritesPanel  = document.getElementById('favorites-panel');
  const beerCheckboxes  = document.querySelectorAll('.filter-option input');
  const favoritesButton = document.getElementById('btn-favorites');
  const detailsPanel    = document.getElementById('venue-details');
  const detailsClose    = document.getElementById('details-close');
  const detailsOverlay  = document.getElementById('details-overlay');

  function closeFavoritesPanel() {
    favoritesPanel?.classList.add('hidden');
    favoritesButton?.classList.remove('active');
    favoritesButton?.setAttribute('aria-label', 'Mostra preferiti');
  }

  function closeDetailsPanel() {
    detailsPanel?.classList.add('hidden');
    detailsOverlay?.classList.add('hidden');
    map.closePopup();
  }

  function openDetailsPanel() {
    detailsPanel?.classList.remove('hidden');
    detailsOverlay?.classList.remove('hidden');
  }

  function focusVenueById(venueId) {
    const index = pubs.findIndex(pub => String(pub.id) === String(venueId));

    if (index >= 0) {
      focusMarker(index);
    }
  }

  if (detailsPanel && detailsClose) {
    detailsClose.addEventListener('click', closeDetailsPanel);
    detailsOverlay?.addEventListener('click', closeDetailsPanel);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !detailsPanel.classList.contains('hidden')) {
        closeDetailsPanel();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyCurrentFilters);
  }

  if (favoritesButton && getToken()) {
    favoritesButton.classList.remove('hidden');
    favoritesButton.addEventListener('click', () => {
      const shouldOpen = favoritesPanel?.classList.contains('hidden');

      searchPanel?.classList.add('hidden');
      searchButton?.classList.remove('active');
      favoritesPanel?.classList.toggle('hidden', !shouldOpen);
      favoritesButton.classList.toggle('active', shouldOpen);
      favoritesButton.setAttribute(
        'aria-label',
        shouldOpen ? 'Nascondi preferiti' : 'Mostra preferiti'
      );

      if (shouldOpen) {
        renderFavoritesList(pubs, favoriteIds);
      }
    });
  }

  window.addEventListener('localbrew:favorites-changed', event => {
    favoriteIds = event.detail?.favoriteIds || [];
    updateFavoriteButtons(favoriteIds);

    if (favoritesPanel && !favoritesPanel.classList.contains('hidden')) {
      renderFavoritesList(pubs, favoriteIds);
    }

    if (showFavoritesOnly) {
      applyCurrentFilters();
    }
  });

  window.addEventListener('localbrew:focus-venue', event => {
    closeDetailsPanel();
    focusVenueById(event.detail?.venueId);
  });

  // Ogni cambio dei filtri aggiorna insieme card e marker.
  beerCheckboxes.forEach(box => {
    box.addEventListener('change', applyCurrentFilters);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    fitItaly({ animate: true });
    searchInput.value = '';
    beerCheckboxes.forEach(box => box.checked = false);
    showFavoritesOnly = false;
    closeFavoritesPanel();
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
        window.dispatchEvent(new CustomEvent('localbrew:favorites-changed', {
          detail: { favoriteIds }
        }));
        showToast(isFavorite ? 'Locale aggiunto ai preferiti.' : 'Locale rimosso dai preferiti.');
        applyCurrentFilters();
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        favoriteButton.disabled = false;
      }

      return;
    }

    const favoritePanelMapButton = event.target.closest('.favorite-panel-map-button');
    if (favoritePanelMapButton) {
      closeFavoritesPanel();
      focusVenueById(favoritePanelMapButton.dataset.id);
      return;
    }

    const favoritePanelDetailsButton = event.target.closest('.favorite-panel-details-button');
    if (favoritePanelDetailsButton) {
      closeFavoritesPanel();
      openDetailsPanel();
      openVenueDetails(favoritePanelDetailsButton.dataset.id);
      return;
    }

    const detailsButton = event.target.closest('.card-details-button');

    if (detailsButton) {
      closeFavoritesPanel();
      openDetailsPanel();
      openVenueDetails(detailsButton.dataset.id);
      return;
    }

    const mapButton = event.target.closest('.card-map-button');
    if (mapButton) {
      focusMarker(Number(mapButton.dataset.index));
      return;
    }

    const popupDetailsButton = event.target.closest('.popup-details-link');
    if (popupDetailsButton) {
      closeFavoritesPanel();
      openDetailsPanel();
      openVenueDetails(popupDetailsButton.dataset.id);
    }
  });

  searchButton?.addEventListener('click', () => {
    const shouldOpen = searchPanel.classList.contains('hidden');

    searchPanel.classList.toggle('hidden', !shouldOpen);
    searchButton.classList.toggle('active', shouldOpen);
    closeFavoritesPanel();
  });

  document.addEventListener('click', event => {
    if (!searchPanel || searchPanel.classList.contains('hidden')) return;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.contains(event.target)) {
      const query = searchInput?.value.trim() || '';
      if (!query) {
        searchPanel.classList.add('hidden');
        searchButton?.classList.remove('active');
      }
    }
  });

  document.addEventListener('click', event => {
    if (!favoritesPanel || favoritesPanel.classList.contains('hidden')) return;
    const clickedFavoritesPanel = favoritesPanel.contains(event.target);
    const clickedFavoritesButton = favoritesButton?.contains(event.target);

    if (!clickedFavoritesPanel && !clickedFavoritesButton) {
      closeFavoritesPanel();
    }
  });

  // aggiorna le card per aagiungerne altre
  document.querySelector('.all-btn').addEventListener('click', () => {
    showAllVenues = !showAllVenues;
    updateCardsVisibility();
  });
}
