// Helper condivisi per la visualizzazione e l'interazione con le stelle di valutazione.
const RATING_ICON = 'fa-solid fa-beer-mug-empty';

/**
 * Restituisce l'HTML di una singola icona stella (riempita o vuota).
 * @param {boolean} filled
 * @param {string}  extraClass  Classi CSS aggiuntive
 */
export function ratingIconHtml(filled, extraClass = '') {
  return `<i class="${RATING_ICON} rating-icon ${filled ? 'rating-icon--filled' : 'rating-icon--empty'} ${extraClass}"></i>`;
}

/**
 * Restituisce l'HTML di una riga di stelle statiche (solo visualizzazione).
 * @param {number} rating  Valore 0-5
 * @param {string} starClass  Classe CSS per ogni stella (es. 'profile-star')
 */
export function starsHtml(rating, starClass = '') {
  return Array.from({ length: 5 }, (_, i) =>
    ratingIconHtml(i < Math.round(Number(rating) || 0), starClass)
  ).join('');
}

/**
 * Aggiorna visivamente le stelle di un picker interattivo.
 * @param {HTMLElement} container  Elemento che contiene i .star-btn
 * @param {number}      value      Valore attivo (0-5)
 */
export function setInteractiveStars(container, value) {
  container.querySelectorAll('.star-btn').forEach((btn, i) => {
    const filled = i + 1 <= value;
    const icon = btn.querySelector('i');
    icon.className = `${RATING_ICON} rating-icon ${filled ? 'rating-icon--filled' : 'rating-icon--empty'}`;
    btn.classList.toggle('is-filled', filled);
  });
}
