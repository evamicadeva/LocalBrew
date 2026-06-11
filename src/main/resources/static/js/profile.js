import { clearToken, updateMe, deleteMe, apiRequest, updateMyReview } from './api.js';
import './logout.js';
import { confirmAction, showToast } from './feedback.js';
import { escapeHtml } from './utils.js';
import { requireAnyRole } from './role-guard.js';
import { ratingIconHtml, starsHtml, setInteractiveStars } from './rating.js';

// ── API ───────────────────────────────────────────────────────
const getMyReviews   = ()      => apiRequest('/api/v1/user/venue-reviews', { auth: true });
const deleteMyReview = id      => apiRequest(`/api/v1/user/venue-reviews/${id}`, { method: 'DELETE', auth: true });

// ── Nav ───────────────────────────────────────────────────────
const content = document.getElementById('profile-content');

// ── Helpers ───────────────────────────────────────────────────
function setActiveNav(section) {
  document.querySelectorAll('.profile-nav-item').forEach(btn =>
    btn.classList.toggle('profile-nav-item--active', btn.dataset.section === section)
  );
}

document.getElementById('profile-nav').addEventListener('click', e => {
  const btn = e.target.closest('.profile-nav-item');
  if (!btn || btn.disabled) return;
  setActiveNav(btn.dataset.section);
  renderSection(btn.dataset.section);
});

function setMsg(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `profile-form-msg ${isError ? 'profile-form-msg--error' : 'profile-form-msg--ok'}`;
}

// ── Sezione: Generalità (tutti) ───────────────────────────────
function renderGeneralita(user) {
  content.innerHTML = `
    <h2 class="profile-section-heading">Generalità</h2>
    <div class="profile-forms-stack">

      <div class="profile-form-block">
        <h3><i class="fa-solid fa-at"></i> Username</h3>
        <p class="profile-current-value">Attuale: <strong id="cur-username">${escapeHtml(user.username)}</strong></p>
        <form class="auth-form" id="form-username">
          <label for="new-username">Nuovo username</label>
          <input id="new-username" type="text" minlength="3" maxlength="50" placeholder="min 3 caratteri" autocomplete="username" required>
          <label for="confirm-username">Conferma username</label>
          <input id="confirm-username" type="text" placeholder="Ripeti il nuovo username" required>
          <button type="submit" class="profile-save-btn"><i class="fa-solid fa-check"></i> Salva</button>
          <p class="profile-form-msg" id="msg-username" aria-live="polite"></p>
        </form>
      </div>

      <div class="profile-form-block">
        <h3><i class="fa-solid fa-envelope"></i> Email</h3>
        <p class="profile-current-value">Attuale: <strong id="cur-email">${escapeHtml(user.email)}</strong></p>
        <form class="auth-form" id="form-email">
          <label for="new-email">Nuova email</label>
          <input id="new-email" type="email" placeholder="nuova@email.it" autocomplete="email" required>
          <label for="confirm-email">Conferma email</label>
          <input id="confirm-email" type="email" placeholder="Ripeti la nuova email" required>
          <button type="submit" class="profile-save-btn"><i class="fa-solid fa-check"></i> Salva</button>
          <p class="profile-form-msg" id="msg-email" aria-live="polite"></p>
        </form>
      </div>

      <div class="profile-form-block">
        <h3><i class="fa-solid fa-lock"></i> Password</h3>
        <form class="auth-form" id="form-password">
          <label for="new-password">Nuova password</label>
          <div class="profile-pw-wrap">
            <input id="new-password" type="password" minlength="8" placeholder="min 8 caratteri" autocomplete="new-password" required>
            <button type="button" class="profile-pw-toggle" data-target="new-password" aria-label="Mostra password"><i class="fa-regular fa-eye"></i></button>
          </div>
          <label for="confirm-password">Conferma password</label>
          <div class="profile-pw-wrap">
            <input id="confirm-password" type="password" placeholder="Ripeti la nuova password" autocomplete="new-password" required>
            <button type="button" class="profile-pw-toggle" data-target="confirm-password" aria-label="Mostra password"><i class="fa-regular fa-eye"></i></button>
          </div>
          <button type="submit" class="profile-save-btn"><i class="fa-solid fa-check"></i> Salva</button>
          <p class="profile-form-msg" id="msg-password" aria-live="polite"></p>
        </form>
      </div>

    </div>`;

  // Toggle visibilità password
  content.querySelectorAll('.profile-pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('i').className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  });

  document.getElementById('form-username').addEventListener('submit', async e => {
    e.preventDefault();
    const val = document.getElementById('new-username').value.trim();
    const cfm = document.getElementById('confirm-username').value.trim();
    if (val !== cfm) { setMsg('msg-username', 'Gli username non corrispondono.', true); return; }
    setMsg('msg-username', 'Salvataggio...');
    try {
      await updateMe({ username: val });
      document.getElementById('cur-username').textContent = val;
      document.getElementById('profile-heading-name').textContent = val;
      setMsg('msg-username', 'Username aggiornato.');
      showToast('Username aggiornato.');
      e.target.reset();
    } catch (err) { setMsg('msg-username', err.message, true); }
  });

  document.getElementById('form-email').addEventListener('submit', async e => {
    e.preventDefault();
    const val = document.getElementById('new-email').value.trim();
    const cfm = document.getElementById('confirm-email').value.trim();
    if (val !== cfm) { setMsg('msg-email', 'Le email non corrispondono.', true); return; }
    setMsg('msg-email', 'Salvataggio...');
    try {
      await updateMe({ email: val });
      document.getElementById('cur-email').textContent = val;
      document.getElementById('profile-heading-email').textContent = val;
      setMsg('msg-email', 'Email aggiornata.');
      showToast('Email aggiornata.');
      e.target.reset();
    } catch (err) { setMsg('msg-email', err.message, true); }
  });

  document.getElementById('form-password').addEventListener('submit', async e => {
    e.preventDefault();
    const val = document.getElementById('new-password').value;
    const cfm = document.getElementById('confirm-password').value;
    if (val !== cfm) { setMsg('msg-password', 'Le password non corrispondono.', true); return; }
    if (val.length < 8) { setMsg('msg-password', 'Minimo 8 caratteri.', true); return; }
    setMsg('msg-password', 'Salvataggio...');
    try {
      await updateMe({ password: val });
      setMsg('msg-password', 'Password aggiornata.');
      showToast('Password aggiornata.');
      e.target.reset();
    } catch (err) { setMsg('msg-password', err.message, true); }
  });
}

// ── Sezione: Le mie recensioni (USER + ADMIN) ─────────────────
async function renderRecensioni() {
  content.innerHTML = '<p class="dashboard-message">Caricamento recensioni...</p>';
  try {
    const reviews = await getMyReviews();
    if (!reviews.length) {
      content.innerHTML = `
        <h2 class="profile-section-heading">Le mie recensioni</h2>
        <p class="dashboard-message">Non hai ancora scritto recensioni.</p>`;
      return;
    }
    content.innerHTML = `
      <h2 class="profile-section-heading">
        Le mie recensioni <span class="profile-count">${reviews.length}</span>
      </h2>
      <div class="profile-reviews-list">
        ${reviews.map(r => `
          <article class="profile-review-card" data-id="${escapeHtml(r.id)}">
            <div class="profile-review-top">
              <div class="detail-stars-row review-stars-display" data-rating="${r.rating}">
                ${starsHtml(r.rating, 'profile-star')}
              </div>
              <span class="profile-review-venue">
                <i class="fa-solid fa-store"></i> ${escapeHtml(r.venueName || '—')}
              </span>
            </div>
            <p class="profile-review-comment review-comment-display">${escapeHtml(r.comment || '')}</p>

            <!-- Form modifica (nascosto di default) -->
            <div class="profile-review-edit hidden" data-id="${escapeHtml(r.id)}">
              <div class="profile-edit-star-picker" role="group" aria-label="Nuovo voto">
                ${editStarsHtml(r.rating, r.id)}
              </div>
              <input type="hidden" class="edit-rating-input" value="${r.rating}">
              <textarea class="profile-edit-comment" maxlength="500" rows="3" placeholder="Commento...">${escapeHtml(r.comment || '')}</textarea>
              <div class="profile-review-edit-actions">
                <button type="button" class="profile-save-btn save-edit-btn" data-id="${escapeHtml(r.id)}">
                  <i class="fa-solid fa-check"></i> Salva
                </button>
                <button type="button" class="secondary-button cancel-edit-btn">Annulla</button>
              </div>
              <p class="profile-form-msg edit-msg" aria-live="polite"></p>
            </div>

            <div class="profile-review-actions">
              <button type="button" class="secondary-button toggle-edit-btn" data-id="${escapeHtml(r.id)}">
                <i class="fa-solid fa-pen"></i> Modifica
              </button>
              <button type="button" class="danger-button profile-delete-review" data-id="${escapeHtml(r.id)}">
                <i class="fa-solid fa-trash"></i> Elimina
              </button>
            </div>
          </article>`).join('')}
      </div>`;

    bindReviewActions();
  } catch (err) {
    content.innerHTML = `<p class="dashboard-message">Errore: ${escapeHtml(err.message)}</p>`;
  }
}

function editStarsHtml(current, reviewId) {
  return Array.from({ length: 5 }, (_, i) =>
    `<button type="button" class="star-btn star-btn--xl edit-star ${i < current ? 'is-filled' : ''}" data-value="${i+1}" data-review="${escapeHtml(reviewId)}" aria-label="Voto ${i+1}">
      ${ratingIconHtml(i < current)}
    </button>`
  ).join('');
}


function bindReviewActions() {
  const list = content.querySelector('.profile-reviews-list');
  if (!list) return;

  // Toggle modifica
  list.addEventListener('click', async e => {
    const card = e.target.closest('.profile-review-card');
    if (!card) return;

    // Apri/chiudi form modifica
    if (e.target.closest('.toggle-edit-btn')) {
      const editDiv  = card.querySelector('.profile-review-edit');
      const isOpen   = !editDiv.classList.contains('hidden');
      editDiv.classList.toggle('hidden', isOpen);
      e.target.closest('.toggle-edit-btn').innerHTML = isOpen
        ? '<i class="fa-solid fa-pen"></i> Modifica'
        : '<i class="fa-solid fa-xmark"></i> Chiudi';
      return;
    }

    // Annulla
    if (e.target.closest('.cancel-edit-btn')) {
      const editDiv = card.querySelector('.profile-review-edit');
      editDiv.classList.add('hidden');
      card.querySelector('.toggle-edit-btn').innerHTML = '<i class="fa-solid fa-pen"></i> Modifica';
      return;
    }

    // Stelle interattive nel form edit
    if (e.target.closest('.edit-star')) {
      const btn    = e.target.closest('.edit-star');
      const val    = Number(btn.dataset.value);
      const editDiv = card.querySelector('.profile-review-edit');
      editDiv.querySelector('.edit-rating-input').value = val;
      setInteractiveStars(editDiv, val);
      return;
    }

    // Salva modifica
    if (e.target.closest('.save-edit-btn')) {
      const btn     = e.target.closest('.save-edit-btn');
      const id      = btn.dataset.id;
      const editDiv = card.querySelector('.profile-review-edit');
      const rating  = Number(editDiv.querySelector('.edit-rating-input').value);
      const comment = editDiv.querySelector('.profile-edit-comment').value.trim();
      const msgEl   = editDiv.querySelector('.edit-msg');

      if (!rating) { msgEl.textContent = 'Seleziona un voto.'; msgEl.className = 'profile-form-msg profile-form-msg--error'; return; }

      msgEl.textContent = 'Salvataggio...'; msgEl.className = 'profile-form-msg';
      btn.disabled = true;
      try {
        await updateMyReview(id, { rating, comment });
        showToast('Recensione aggiornata.');
        renderRecensioni();
      } catch (err) {
        msgEl.textContent = err.message; msgEl.className = 'profile-form-msg profile-form-msg--error';
        btn.disabled = false;
      }
      return;
    }

    // Elimina
    if (e.target.closest('.profile-delete-review')) {
      const btn = e.target.closest('.profile-delete-review');
      const confirmed = await confirmAction({
        title: 'Eliminare la recensione?',
        message: 'Questa azione non è reversibile.',
        confirmText: 'Elimina', danger: true
      });
      if (!confirmed) return;
      try {
        await deleteMyReview(btn.dataset.id);
        showToast('Recensione eliminata.');
        renderRecensioni();
      } catch (err) { showToast(err.message, 'error'); }
    }
  });

  // Hover stelle
  list.querySelectorAll('.profile-review-edit').forEach(editDiv => {
    const stars = editDiv.querySelectorAll('.edit-star');
    const input = editDiv.querySelector('.edit-rating-input');
    stars.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        const v = Number(btn.dataset.value);
        setInteractiveStars(editDiv, v);
      });
      btn.addEventListener('mouseleave', () => {
        const v = Number(input.value);
        setInteractiveStars(editDiv, v);
      });
    });
  });
}

// ── Sezione: I miei locali (OWNER) ────────────────────────────
function renderLocali() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  container.innerHTML = `
        <div class="profile-section">
            <h2 class="profile-section-heading">I miei locali</h2>
            <p class="profile-section-desc">Gestisci i tuoi locali, aggiungi birre e aggiorna le informazioni.</p>
            <a href="owner-dashboard.html" class="auth-submit" style="display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;margin-top:8px;">
                <i class="fa-solid fa-gauge-high"></i> Vai alla dashboard
            </a>
        </div>`;
}
// ── Sezione: Amministrazione (ADMIN) → redirect diretto ───────
function renderAdmin() {
  window.location.href = 'admin-dashboard.html';
}

// ── Sezione: Zona pericolosa (tutti) ──────────────────────────
function renderPericolo() {
  content.innerHTML = `
    <h2 class="profile-section-heading">Zona pericolosa</h2>
    <div class="profile-danger-zone">
      <div>
        <p class="profile-danger-title">
          <i class="fa-solid fa-triangle-exclamation"></i> Elimina account
        </p>
        <p class="profile-danger-desc">
          Tutti i tuoi dati, recensioni e preferiti verranno rimossi definitivamente.
          Questa azione non è reversibile.
        </p>
      </div>
      <button type="button" class="profile-delete-btn" id="btn-delete-account">
        Elimina account
      </button>
    </div>`;

  document.getElementById('btn-delete-account').addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: "Eliminare l'account?",
      message: 'Tutti i tuoi dati verranno rimossi definitivamente.',
      confirmText: 'Elimina account', danger: true
    });
    if (!confirmed) return;
    try {
      await deleteMe();
      clearToken();
      showToast('Account eliminato.');
      window.location.href = '../index.html';
    } catch (err) { showToast(err.message, 'error'); }
  });
}

// ── Dispatcher ────────────────────────────────────────────────
function renderSection(section) {
  const user = window.__profileUser;
  switch (section) {
    case 'generalita':  renderGeneralita(user); break;
    case 'recensioni':  renderRecensioni();      break;
    case 'locali':      renderLocali();          break;
    case 'admin':       renderAdmin();           break;
    case 'pericolo':    renderPericolo();        break;
  }
}

// ── Init ──────────────────────────────────────────────────────
function roleLabel(r) {
  return { ADMIN: 'Amministratore', OWNER: 'Proprietario', USER: 'Utente' }[r] || r;
}

const user = await requireAnyRole(['USER', 'OWNER', 'ADMIN']);

if (user) {
  window.__profileUser = user;

  document.getElementById('profile-heading-name').textContent  = user.username;
  document.getElementById('profile-heading-email').textContent = user.email;
  document.getElementById('profile-heading-role').textContent  = roleLabel(user.role);

  const dashboardLink = document.getElementById('profile-dashboard-link');
  if (dashboardLink && (user.role === 'ADMIN' || user.role === 'OWNER')) {
    dashboardLink.href = user.role === 'ADMIN' ? 'admin-dashboard.html' : 'owner-dashboard.html';
    dashboardLink.classList.remove('hidden');
  }

  // Mostra voci nav in base al ruolo
  if (user.role === 'USER' || user.role === 'ADMIN') {
    document.querySelector('[data-section="recensioni"]').classList.remove('hidden');
  }
  if (user.role === 'OWNER') {
    document.getElementById('nav-locali-link')?.classList.remove('hidden');
  }
  if (user.role === 'ADMIN') {
    document.querySelector('[data-section="admin"]').classList.remove('hidden');
  }

  renderGeneralita(user);
}
