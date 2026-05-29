import { getActiveVenues, getVenueDrinks, getVenueReviews } from './api.js';

const FALLBACK_IMAGE = 'assets/icons/Minimal.png';

const VENUE_TYPE_LABELS = {
  BAR: 'Bar',
  PUB: 'Pub',
  BREWERY: 'Birrificio',
  RESTAURANT: 'Ristorante',
  BEER_STORE: 'Beer store'
};

function averageRating(reviews) {
  if (!reviews.length) return '--';
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return (total / reviews.length).toFixed(1);
}

function ratingValue(pub) {
  const rating = Number(pub.rating);
  return Number.isNaN(rating) ? 0 : rating;
}

function uniqueTags(drinks, type) {
  const categories = drinks
    .map(drink => drink.category || drink.drinkName)
    .filter(Boolean);

  const tags = [...new Set(categories)];
  return tags.length ? tags.join(', ') : (VENUE_TYPE_LABELS[type] || type || 'Locale');
}

async function safeLoad(loader) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

async function enrichVenue(venue) {
  const [drinks, reviews] = await Promise.all([
    safeLoad(() => getVenueDrinks(venue.id)),
    safeLoad(() => getVenueReviews(venue.id))
  ]);

  return {
    id: venue.id,
    name: venue.name,
    description: venue.description || '',
    city: venue.city,
    address: venue.address,
    lat: Number(venue.latitude),
    lng: Number(venue.longitude),
    rating: averageRating(reviews),
    reviewCount: reviews.length,
    beers: uniqueTags(drinks, venue.type),
    type: venue.type,
    image: venue.imageUri || FALLBACK_IMAGE,
    drinks,
    reviews
  };
}

export async function loadPubs() {
  const venues = await getActiveVenues();
  const withCoordinates = venues.filter(venue => venue.latitude != null && venue.longitude != null);
  const pubs = await Promise.all(withCoordinates.map(enrichVenue));

  return pubs.sort((a, b) =>
    ratingValue(b) - ratingValue(a)
    || b.reviewCount - a.reviewCount
    || a.name.localeCompare(b.name, 'it')
  );
}
