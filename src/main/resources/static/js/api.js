const API_BASE_URL = '';

/*
  Sostituisci questi percorsi con gli endpoint reali
  definiti nel back-end LocalBrew.
*/
const LOGIN_URL = `${API_BASE_URL}/api/v1/auth/login`;
const REGISTER_URL = `${API_BASE_URL}/api/v1/auth/register`;

async function sendJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Operazione non riuscita.');
  }

  return data;
}

export function loginUser(credentials) {
  return sendJson(LOGIN_URL, credentials);
}

export function registerUser(userData) {
  return sendJson(REGISTER_URL, userData);
}

export async function getCurrentUser() {
  const token = localStorage.getItem('localbrew-token');
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    localStorage.removeItem('localbrew-token');
    return null;
  }

  const text = await response.text();

  if (!text) {
    throw new Error('Il back-end non ha restituito i dati dell utente.');
  }

  return JSON.parse(text);
}

async function authenticatedRequest(path, options = {}) {
  const token = localStorage.getItem('localbrew-token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Operazione non riuscita.');
  }

  return data;
}

export function createVenue(venue) {
  return authenticatedRequest('/api/v1/owner/venues', {
    method: 'POST',
    body: JSON.stringify(venue)
  });
}

export function getAdminVenues() {
  return authenticatedRequest('/api/v1/admin/venues');
}

export function activateVenue(id) {
  return authenticatedRequest(`/api/v1/admin/venues/${id}/activate`, { method: 'PATCH' });
}

export function suspendVenue(id) {
  return authenticatedRequest(`/api/v1/admin/venues/${id}/suspend`, { method: 'PATCH' });
}

export function getVenueById(id) {
  return fetch(`${API_BASE_URL}/api/v1/public/venues/${id}`)
    .then(response => response.json());
}

export function searchVenuesByCity(city) {
  return fetch(`${API_BASE_URL}/api/v1/public/venues/search/city?city=${encodeURIComponent(city)}`)
    .then(response => response.json());
}

export function searchVenuesByName(name) {
  return fetch(`${API_BASE_URL}/api/v1/public/venues/search/name?name=${encodeURIComponent(name)}`)
    .then(response => response.json());
}