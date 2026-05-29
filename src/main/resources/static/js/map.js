const WORLD_BOUNDS = L.latLngBounds(
    [-85, -180],
    [85, 180]
);

// Crea la mappa centrata su Milano con uno zoom iniziale cittadino.
export const map = L.map('map', {
    center: [45.4642, 9.1900],
    zoom: 12,
    maxZoom: 18,
    minZoom: 6,
    maxBounds: WORLD_BOUNDS,
    maxBoundsViscosity: 1,
    worldCopyJump: false,
    dragging: false,
    scrollWheelZoom: false
});

// Usa una base Carto chiara, leggibile sotto marker e popup.
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
}).addTo(map);

function setMouseMapInteraction(isEnabled) {
    if (isEnabled) {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        return;
    }

    map.dragging.disable();
    map.scrollWheelZoom.disable();
}

document.addEventListener('keydown', event => {
    if (event.key === 'Control') setMouseMapInteraction(true);
});

document.addEventListener('keyup', event => {
    if (event.key === 'Control') setMouseMapInteraction(false);
});

window.addEventListener('blur', () => setMouseMapInteraction(false));
