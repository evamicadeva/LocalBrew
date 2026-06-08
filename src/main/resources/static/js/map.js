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

const DARK_STYLE = 'dark';

const mapLayers = {
    [SIMPLIFIED_STYLE]: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 20
    }),
    [SATELLITE_STYLE]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19
    }),
    [DARK_STYLE]: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 20
    })
};

// Sincronizza il tile layer con il tema UI (chiamata da theme.js via callback).
let lastNonSatStyle = SIMPLIFIED_STYLE;

export function syncMapTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const target = isDark ? DARK_STYLE : SIMPLIFIED_STYLE;

    // Aggiorna sempre lastNonSatStyle (anche se siamo su satellite)
    const prev = lastNonSatStyle;
    lastNonSatStyle = target;

    // Se siamo su satellite non cambiare il layer visibile, solo memorizza
    if (currentMapStyle === SATELLITE_STYLE) return;

    // Nessun cambio visivo necessario
    if (target === prev && map.hasLayer(mapLayers[target])) return;

    // Rimuovi il vecchio layer tema e aggiungi il nuovo
    if (map.hasLayer(mapLayers[prev])) map.removeLayer(mapLayers[prev]);
    mapLayers[target].addTo(map);
    currentMapStyle = target;
}

let currentMapStyle = localStorage.getItem(MAP_STYLE_STORAGE_KEY) === SATELLITE_STYLE
    ? SATELLITE_STYLE
    : SIMPLIFIED_STYLE;

mapLayers[currentMapStyle].addTo(map);

function updateMapStyleButton(button) {
    const isSatellite = currentMapStyle === SATELLITE_STYLE;
    const icon = button.querySelector('i');
    const label = button.querySelector('span');

    button.classList.remove('active');
    button.setAttribute('aria-pressed', String(isSatellite));
    button.setAttribute(
        'aria-label',
        isSatellite ? 'Passa alla mappa semplificata' : 'Passa alla mappa satellitare'
    );

    if (icon) {
        icon.className = isSatellite ? 'fa-solid fa-map' : 'fa-solid fa-mountain-sun';
    }

    if (label) {
        label.textContent = isSatellite ? 'Mappa' : 'Satellite';
    }
}

function setMapStyle(nextStyle) {
    if (nextStyle === currentMapStyle || !mapLayers[nextStyle]) return;

    map.removeLayer(mapLayers[currentMapStyle]);

    // Se stiamo uscendo dal satellite, ripristina il layer tema corretto
    // (dark o simplified) invece di tornare sempre a simplified
    const actualTarget = (nextStyle === SIMPLIFIED_STYLE)
        ? lastNonSatStyle
        : nextStyle;

    mapLayers[actualTarget].addTo(map);
    currentMapStyle = actualTarget;
    // In localStorage salviamo solo se satellite, altrimenti puliamo
    if (actualTarget === SATELLITE_STYLE) {
        localStorage.setItem(MAP_STYLE_STORAGE_KEY, SATELLITE_STYLE);
    } else {
        localStorage.removeItem(MAP_STYLE_STORAGE_KEY);
    }
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


// Restituisce i bounds attuali della mappa (usato per filtrare le card).
export function getMapBounds() {
    return map.getBounds();
}

// Registra un listener sul moveend per aggiornare le card quando la mappa si sposta.
export function onMapMoveEnd(callback) {
    map.on('moveend', callback);
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
