const WORLD_BOUNDS = L.latLngBounds(
    [-85, -180],
    [85, 180]
);

export const ITALY_BOUNDS = L.latLngBounds(
    [35.2, 5.8],
    [47.6, 19.0]
);

const ITALY_CENTER = [42.7, 12.4];
const ITALY_ZOOM = 6;
const USER_AREA_ZOOM = 10;
const MAP_STYLE_STORAGE_KEY = 'localbrew:map-style';
const SIMPLIFIED_STYLE = 'simplified';
const SATELLITE_STYLE = 'satellite';

// Crea la mappa con una vista iniziale ampia sull'Italia.
export const map = L.map('map', {
    center: ITALY_CENTER,
    zoom: ITALY_ZOOM,
    maxZoom: 18,
    minZoom: 5,
    maxBounds: WORLD_BOUNDS,
    maxBoundsViscosity: 1,
    worldCopyJump: false,
    dragging: false,
    scrollWheelZoom: false
});

const mapLayers = {
    [SIMPLIFIED_STYLE]: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }),
    [SATELLITE_STYLE]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19
    })
};

let currentMapStyle = localStorage.getItem(MAP_STYLE_STORAGE_KEY) === SATELLITE_STYLE
    ? SATELLITE_STYLE
    : SIMPLIFIED_STYLE;

mapLayers[currentMapStyle].addTo(map);

function updateMapStyleButton(button) {
    const isSatellite = currentMapStyle === SATELLITE_STYLE;
    const icon = button.querySelector('i');
    const label = button.querySelector('span');

    button.classList.toggle('active', isSatellite);
    button.setAttribute('aria-pressed', String(isSatellite));
    button.setAttribute(
        'aria-label',
        isSatellite ? 'Passa alla mappa semplificata' : 'Passa alla mappa satellitare'
    );

    if (icon) {
        icon.className = isSatellite ? 'fa-solid fa-map' : 'fa-solid fa-mountain-sun';
    }

    if (label) {
        label.textContent = isSatellite ? 'Semplice' : 'Satellite';
    }
}

function setMapStyle(nextStyle) {
    if (nextStyle === currentMapStyle || !mapLayers[nextStyle]) return;

    map.removeLayer(mapLayers[currentMapStyle]);
    mapLayers[nextStyle].addTo(map);
    currentMapStyle = nextStyle;
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, currentMapStyle);
}

function initMapStyleToggle() {
    const button = document.getElementById('btn-map-style');
    if (!button) return;

    updateMapStyleButton(button);

    button.addEventListener('click', () => {
        setMapStyle(currentMapStyle === SATELLITE_STYLE ? SIMPLIFIED_STYLE : SATELLITE_STYLE);
        updateMapStyleButton(button);
    });
}

export function fitItaly(options = {}) {
    map.setView(ITALY_CENTER, ITALY_ZOOM, {animate: false, ...options});
}

function focusUserArea(position) {
    const lat = Number(position.coords.latitude.toFixed(1));
    const lng = Number(position.coords.longitude.toFixed(1));

    map.setView([lat, lng], USER_AREA_ZOOM, {animate: true});
}

function requestUserPosition() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(focusUserArea, () => {
    }, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
    });
}

fitItaly();
requestUserPosition();
initMapStyleToggle();

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
