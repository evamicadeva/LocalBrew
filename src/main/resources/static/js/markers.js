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

// Crea un marker per ciascun locale ricevuto dal back-end.
export function initMarkers(pubs) {
  // Consente di richiamare la funzione senza duplicare i marker esistenti.
  markers.length = 0;
  markersCluster.clearLayers();

  pubs.forEach((pub, index) => {
    const name = escapeHtml(pub.name);
    const rating = escapeHtml(pub.rating);
    const beers = escapeHtml(pub.beers);
    const marker = L.marker([pub.lat, pub.lng], { icon: beerIcon });

    // data-index collega il pulsante nel popup alla card dello stesso locale.
    marker.bindPopup(`
      <div class="venue-popup">
        <h3>${name}</h3>
        <p class="venue-popup-meta">&#11088; ${rating}</p>
        <p class="venue-popup-beers">&#127866; ${beers}</p>
        <button type="button" class="popup-card-link" data-index="${index}">
          <i class="fa-solid fa-arrow-down"></i>
          Vai alla card
        </button>
      </div>
    `);

    // Salva lo stesso marker sia per la UI sia per la visualizzazione in cluster.
    markers.push(marker);
    markersCluster.addLayer(marker);
  });
}
