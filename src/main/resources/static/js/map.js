// Crea la mappa centrata su Milano con uno zoom iniziale cittadino.
export const map = L.map('map', {
  center: [45.4642, 9.1900],
  zoom: 12,
  maxZoom: 18,
  minZoom: 5
});

// Usa una base Carto chiara, leggibile sotto marker e popup.
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);
