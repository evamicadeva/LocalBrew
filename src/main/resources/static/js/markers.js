import { map } from './map.js';
import { escapeHtml } from './utils.js';

// Collezione esportata: la UI la usa per raggiungere un marker dalla sua card.
export const markers = [];

// Raggruppa i locali vicini per mantenere la mappa leggibile.
export const markersCluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 50
});

map.addLayer(markersCluster);

// Icona comune a tutti i locali presenti sulla mappa.
const beerIcon = L.icon({
  iconUrl: 'assets/icons/Minimal.png',
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -42]
});

function shortText(text, maxLength = 110) {
  const value = String(text || '').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

// Crea un marker per ciascun locale ricevuto dal back-end.
export function initMarkers(pubs) {
  // Consente di richiamare la funzione senza duplicare i marker esistenti.
  markers.length = 0;
  markersCluster.clearLayers();

  pubs.forEach(pub => {
    const id = escapeHtml(pub.id);
    const name = escapeHtml(pub.name);
    const rating = escapeHtml(pub.rating);
    const beers = escapeHtml(pub.beers);
    const city = escapeHtml(pub.city);
    const address = escapeHtml(pub.address);
    const description = escapeHtml(shortText(pub.description));
    const marker = L.marker([pub.lat, pub.lng], { icon: beerIcon });

    marker.on('click', () => {
      map.panTo(marker.getLatLng(), { animate: true });
    });

    // Il popup mostra gia le informazioni principali senza rimandare alla card.
    marker.bindPopup(`
      <div class="venue-popup">
        <h3>${name}</h3>
        <p class="venue-popup-meta"><i class="fa-solid fa-beer-mug-empty popup-star rating-icon rating-icon--filled"></i> ${rating} - ${city}</p>
        <p class="venue-popup-address">${address}</p>
        ${description ? `<p class="venue-popup-description">${description}</p>` : ''}
        <p class="venue-popup-beers">&#127866; ${beers}</p>
        <button type="button" class="popup-details-link" data-id="${id}">
          <i class="fa-solid fa-circle-info"></i>
          Dettagli
        </button>
      </div>
    `, { autoPan: false });

    // Salva lo stesso marker sia per la UI sia per la visualizzazione in cluster.
    markers.push(marker);
    markersCluster.addLayer(marker);
  });
}
