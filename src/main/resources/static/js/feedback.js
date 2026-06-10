const TOAST_TIMEOUT = 3200;

let confirmElements;
let toastRoot;

function ensureToastRoot() {
  if (toastRoot) return toastRoot;

  toastRoot = document.createElement('div');
  toastRoot.className = 'toast-stack';
  toastRoot.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastRoot);

  return toastRoot;
}

function ensureConfirmModal() {
  if (confirmElements) return confirmElements;

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay hidden';
  overlay.innerHTML = `
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <p class="confirm-kicker">Conferma azione</p>
      <h2 id="confirm-title"></h2>
      <p class="confirm-message"></p>
      <div class="confirm-actions">
        <button type="button" class="confirm-cancel">Annulla</button>
        <button type="button" class="confirm-submit">Conferma</button>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  confirmElements = {
    overlay,
    dialog: overlay.querySelector('.confirm-dialog'),
    title: overlay.querySelector('#confirm-title'),
    message: overlay.querySelector('.confirm-message'),
    cancel: overlay.querySelector('.confirm-cancel'),
    submit: overlay.querySelector('.confirm-submit')
  };

  return confirmElements;
}

function dismissToast(toast) {
  if (toast.dataset.hiding === 'true') return;

  toast.dataset.hiding = 'true';
  toast.classList.add('is-hiding');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

export function showToast(message, type = 'success') {
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.tabIndex = 0;
  toast.textContent = message;
  toast.addEventListener('click', () => dismissToast(toast));
  toast.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dismissToast(toast);
    }
  });
  root.appendChild(toast);

  window.setTimeout(() => dismissToast(toast), TOAST_TIMEOUT);
}

export function confirmAction({
  title = 'Confermare questa azione?',
  message = 'Questa operazione non puo essere annullata.',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  danger = false
} = {}) {
  const elements = ensureConfirmModal();

  elements.title.textContent = title;
  elements.message.textContent = message;
  elements.cancel.textContent = cancelText;
  elements.submit.textContent = confirmText;
  elements.submit.classList.toggle('is-danger', danger);
  elements.overlay.classList.remove('hidden');
  elements.submit.focus();

  return new Promise(resolve => {
    function close(result) {
      elements.overlay.classList.add('hidden');
      elements.cancel.removeEventListener('click', onCancel);
      elements.submit.removeEventListener('click', onSubmit);
      elements.overlay.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onKeyDown);
      resolve(result);
    }

    function onCancel() {
      close(false);
    }

    function onSubmit() {
      close(true);
    }

    function onOverlayClick(event) {
      if (event.target === elements.overlay) close(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') close(false);
    }

    elements.cancel.addEventListener('click', onCancel);
    elements.submit.addEventListener('click', onSubmit);
    elements.overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKeyDown);
  });
}
