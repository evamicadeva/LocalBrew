import { markers, markersCluster } from './markers.js';

// Applica la stessa ricerca alle card e ai marker creati dagli stessi dati API.
export function applyFilters(pubs, favoriteIds = null) {
  // Legge il testo cercato e gli stili di birra selezionati.
  const searchInput = document.getElementById('searchInput');
  const beerCheckboxes = document.querySelectorAll('.filter-option input');
  const favoriteSet = favoriteIds
    ? new Set(favoriteIds.map(id => String(id)))
    : null;

  const text = (searchInput?.value || '').toLowerCase().trim();
  const selectedBeers = Array.from(beerCheckboxes)
    .filter(box => box.checked)
    .map(box => box.value.toLowerCase());

  // Durante una ricerca mostra anche i risultati oltre le prime tre card.
  const container = document.getElementById('venue-container');
  const hasActiveFilters = Boolean(text) || selectedBeers.length > 0 || Boolean(favoriteSet);

  if (container) {
    container.classList.toggle('is-filtering', hasActiveFilters);
  }

  // Ricostruisce il gruppo mappa includendo solo i marker compatibili.
  markersCluster.clearLayers();
  let visibleCount = 0;

  markers.forEach((marker, index) => {
    const pub = pubs[index];
    if (!pub) return;

    const searchArea = [
      pub.name,
      pub.city,
      pub.address,
      pub.description,
      pub.beers,
      pub.type
    ].join(' ').toLowerCase();
    const beers = String(pub.beers || '').toLowerCase();
    const matchText = !text || searchArea.includes(text);
    const matchBeer = selectedBeers.length === 0
      || selectedBeers.some(type => beers.includes(type));
    const matchFavorite = !favoriteSet || favoriteSet.has(String(pub.id));
    const match = matchText && matchBeer && matchFavorite;

    if (match) {
      markersCluster.addLayer(marker);
      visibleCount += 1;
    }

    // Card e marker condividono data-index, quindi restano sincronizzati.
    const card = document.querySelector(`.card[data-index="${index}"]`);
    if (card) {
      card.classList.toggle('is-filtered-out', !match);
    }
  });

  // Mostra un messaggio solo quando nessun locale soddisfa i filtri.
  const status = document.getElementById('venues-status');
  if (status) {
    if (visibleCount > 0) {
      status.textContent = '';
    } else if (favoriteSet) {
      status.textContent = 'Nessun locale preferito trovato.';
    } else {
      status.textContent = 'Nessun locale trovato con questi filtri.';
    }
  }
}
