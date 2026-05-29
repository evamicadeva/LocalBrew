import { addFavoriteVenue, getFavoriteVenues, removeFavoriteVenue } from './api.js';

export async function getFavorites() {
  try {
    const favorites = await getFavoriteVenues();
    return favorites.map(favorite => String(favorite.venueId));
  } catch {
    return [];
  }
}

export async function toggleFavorite(venueId, isFavorite) {
  if (isFavorite) {
    await removeFavoriteVenue(venueId);
  } else {
    await addFavoriteVenue(venueId);
  }

  return getFavorites();
}
