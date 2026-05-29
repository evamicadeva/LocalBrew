import { applyFilters } from './filters.js';
import { map } from './map.js';
import { markers, markersCluster } from './markers.js';
import { escapeHtml } from './utils.js';
import { getFavorites, toggleFavorite } from './favorites.js';
import { openVenueDetails } from './details.js';

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

          <button type="button" class="card-map-button" data-index="${index}">
            <i class="fa-solid fa-map-location-dot"></i>
              Mostra sulla mappa
          </button>

          <button type="button" class="card-details-button" data-id="${safeId}">
            <i class="fa-solid fa-circle-info"></i>
              Dettagli
          </button>
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

// Mostra il badge personalizzato con la localizazione 
function updateLocationBadge(text) {
  const badge = document.getElementById('location-badge');
  const badgeText = document.getElementById('location-badge-text');

  if (!badge || !badgeText) return;

  if (!text) {
    badge.classList.add('hidden');
    badgeText.textContent = '';
    return;
  }

  badgeText.textContent = text;
  badge.classList.remove('hidden');
}


export async function initUI(pubs) {
  const favorites = await getFavorites();

  renderCards(pubs, favorites);
  updateCardsVisibility();

  // Riferimenti agli elementi principali controllati dalla UI.
  const searchInput = document.getElementById('searchInput');
  const searchPanel = document.getElementById('search-panel');
  const beerCheckboxes = document.querySelectorAll('.filter-option input');
  const locationBadgeClose = document.getElementById('location-badge-close');
  const mapOverlay = document.querySelector('.map-overlay');
  const mapOverlayClose = document.getElementById('map-overlay-close');
  const detailsPanel = document.getElementById('venue-details');
  const detailsClose = document.getElementById('details-close');

  if (detailsPanel && detailsClose) {
    detailsClose.addEventListener('click', () => {
      detailsPanel.classList.add('hidden');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters(pubs));
  }

  // per chiudere il badge più grosso (Overlay)
  if (mapOverlayClose && mapOverlay) {
    mapOverlayClose.addEventListener('click', () => {
      mapOverlay.classList.add('hidden');
    });
  }

  // Ogni cambio dei filtri aggiorna insieme card e marker.
  beerCheckboxes.forEach(box => {
    box.addEventListener('change', () => applyFilters(pubs));
  });

  let userMarker = null;

  document.getElementById('btn-user').addEventListener('click', () => {
    // Usa la geolocalizzazione del browser per centrare la mappa sull'utente.
    if (!navigator.geolocation) {
      alert('Geolocalizzazione non supportata dal browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);
        updateLocationBadge('Vicino a te');

        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup('&#128205; Sei qui').openPopup();
      },
      () => alert('Impossibile ottenere la posizione')
    );
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    // Torna alla vista iniziale di Milano e pulisce tutti i filtri.
    map.setView([45.4642, 9.1900], 12);
    searchInput.value = '';
    beerCheckboxes.forEach(box => box.checked = false);

    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }

    applyFilters(pubs);
    updateLocationBadge('');
  });

  document.getElementById('btn-pub').addEventListener('click', () => {
    // Scorciatoia: porta al primo locale della lista.
    focusMarker(0);
  });

  document.addEventListener('click', async event => {
    const favoriteButton = event.target.closest('.favorite-button');

    if (favoriteButton) {
      const pubId = favoriteButton.dataset.id;
      const wasFavorite = favoriteButton.classList.contains('is-favorite');

      try {
        favoriteButton.disabled = true;
        const favorites = await toggleFavorite(pubId, wasFavorite);
        const isFavorite = favorites.includes(String(pubId));
        const icon = favoriteButton.querySelector('i');

        favoriteButton.classList.toggle('is-favorite', isFavorite);
        icon.classList.toggle('fa-regular', !isFavorite);
        icon.classList.toggle('fa-solid', isFavorite);

        favoriteButton.setAttribute(
          'aria-label',
          isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'
        );
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

  // Permette all'utente di nascondere manualmente il badge sopra la mappa.
  if (locationBadgeClose) {
    locationBadgeClose.addEventListener('click', () => {
      updateLocationBadge('');
    });
  }

  // aggiorna le card per aagiungerne altre
  document.querySelector('.all-btn').addEventListener('click', () => {
    showAllVenues = !showAllVenues;
    updateCardsVisibility();
  });

  //questo in futuro quano cerchi una citta
  //updateLocationBadge(`Ricerca: ${cityName}`);
}
