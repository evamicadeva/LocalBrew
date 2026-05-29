const API_BASE_URL = 'http://localhost:8080/api/v1'

function getToken(){
  return localStorage.getItem('localbrew-token');
}
// Recupera dal browser la lista dei locali salvati come preferiti.
export async function getFavorites() {
  const token = getToken();
  if(!token) return [];

  const response = await fetch(`${API_BASE_URL}/user/favorite-venues`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if(!response.ok) return [];

  const favorite = await response.json();

  return 
}

export async function toggleFavorite(pubId, isFavorite) {
  const token = getToken();
  if (!token) {
    alert('Accedi per salvare i preferiti.');
    return [];
  }

  const method = isFavorite ? 'DELETE' : 'POST';

  await fetch(`${API_BASE_URL}/user/favorite-venues/${pubId}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return getFavorites();
}