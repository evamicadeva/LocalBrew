import { createVenue } from './api.js';
import { requireRole } from './role-guard.js';

const user = await requireRole('OWNER');

if (user) {
  document.getElementById('venue-form').addEventListener('submit', async event => {
    event.preventDefault();

    const venue = {
      name: document.getElementById('venue-name').value.trim(),
      description: document.getElementById('venue-description').value.trim(),
      city: document.getElementById('venue-city').value.trim(),
      address: document.getElementById('venue-address').value.trim(),
      type: document.getElementById('venue-type').value,
      latitude: Number(document.getElementById('venue-latitude').value),
      longitude: Number(document.getElementById('venue-longitude').value),
      imageUri: document.getElementById('venue-image-uri').value.trim()
    };

    await createVenue(venue);
    alert('Locale inviato correttamente.');
  });
}