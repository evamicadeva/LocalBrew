export const API_BASE_URL = window.LOCALBREW_API_BASE_URL || 'http://localhost:8080';
export const TOKEN_KEY = 'localbrew-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value);
  });

  return url;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const {
    auth = false,
    body,
    headers = {},
    params,
    ...fetchOptions
  } = options;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (!token) throw new Error('Accedi per continuare.');
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, params), {
    ...fetchOptions,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `Errore ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function loginUser(credentials) {
  return apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: credentials
  });
}

export function registerUser(userData) {
  return apiRequest('/api/v1/auth/register', {
    method: 'POST',
    body: userData
  });
}

export async function getCurrentUser() {
  if (!getToken()) return null;

  try {
    return await apiRequest('/api/v1/user/me', { auth: true });
  } catch {
    clearToken();
    return null;
  }
}

export function getActiveVenues() {
  return apiRequest('/api/v1/public/venues/active');
}

export function getActiveVenue(id) {
  return apiRequest(`/api/v1/public/venues/${id}`);
}

export function getVenueDrinks(venueId) {
  return apiRequest(`/api/v1/public/venues/${venueId}/drinks`);
}

export function getVenueReviews(venueId) {
  return apiRequest(`/api/v1/public/venues/${venueId}/reviews`);
}

export function getDrinks({ categories, name } = {}) {
  return apiRequest('/api/v1/public/drinks', {
    params: { categories, name }
  });
}

export function getFavoriteVenues() {
  return apiRequest('/api/v1/user/favorite-venues', { auth: true });
}

export function addFavoriteVenue(venueId) {
  return apiRequest('/api/v1/user/favorite-venues', {
    method: 'POST',
    auth: true,
    params: { venueId }
  });
}

export function removeFavoriteVenue(venueId) {
  return apiRequest(`/api/v1/user/favorite-venues/${venueId}`, {
    method: 'DELETE',
    auth: true
  });
}

export function createVenueReview(review) {
  return apiRequest('/api/v1/user/venue-reviews', {
    method: 'POST',
    auth: true,
    body: review
  });
}

export function getOwnerVenues() {
  return apiRequest('/api/v1/owner/venues', { auth: true });
}

export function createVenue(venue) {
  return apiRequest('/api/v1/owner/venues', {
    method: 'POST',
    auth: true,
    body: venue
  });
}

export function updateVenue(id, venue) {
  return apiRequest(`/api/v1/owner/venues/${id}`, {
    method: 'PUT',
    auth: true,
    body: venue
  });
}

export function deleteVenue(id) {
  return apiRequest(`/api/v1/owner/venues/${id}`, {
    method: 'DELETE',
    auth: true
  });
}

export function createDrink(drink) {
  return apiRequest('/api/v1/owner/drinks', {
    method: 'POST',
    auth: true,
    body: drink
  });
}

export function addDrinkToVenue(venueId, venueDrink) {
  return apiRequest(`/api/v1/owner/venues/${venueId}/drinks`, {
    method: 'POST',
    auth: true,
    body: venueDrink
  });
}

export function removeDrinkFromVenue(venueId, drinkId) {
  return apiRequest(`/api/v1/owner/venues/${venueId}/drinks/${drinkId}`, {
    method: 'DELETE',
    auth: true
  });
}

export function getAdminVenues() {
  return apiRequest('/api/v1/admin/venues', { auth: true });
}

export function activateVenue(id) {
  return apiRequest(`/api/v1/admin/venues/${id}/activate`, {
    method: 'PATCH',
    auth: true
  });
}

export function suspendVenue(id) {
  return apiRequest(`/api/v1/admin/venues/${id}/suspend`, {
    method: 'PATCH',
    auth: true
  });
}
