// Endpoint pubblico del back-end che restituisce i locali attivi.
const API_URL = 'http://localhost:8080/api/v1/public/venues/active';

// Recupera i locali e adatta i nomi del back-end al formato usato dal front-end.
export async function loadPubs() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error('Impossibile caricare i locali');
  }

  const venues = await response.json();

  return venues
    .filter(venue => venue.latitude != null && venue.longitude != null)
    .map(venue => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      city: venue.city,
      address: venue.address,
      lat: venue.latitude,
      lng: venue.longitude,
      rating: '--',
      beers: venue.type || 'Locale',
      image: venue.imageUri || 'assets/icons/Minimal.png'
    }));
}