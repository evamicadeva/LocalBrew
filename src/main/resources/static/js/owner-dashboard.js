import {
  addDrinkToVenue,
  createDrink,
  createVenue,
  deleteVenue,
  getDrinks,
  getOwnerVenues,
  getOwnerVenueDrinks,
  removeDrinkFromVenue,
  updateDrinkInVenue,
  updateVenue,
  uploadDrinkImage,
  uploadVenueImage
} from './api.js';
import './logout.js';
import {confirmAction, showToast} from './feedback.js';
import {requireAnyRole} from './role-guard.js';
import {escapeHtml} from './utils.js';

const form = document.getElementById('venue-form');
const list = document.getElementById('owner-venues');
const message = document.getElementById('owner-message');
const submitButton = document.getElementById('venue-submit');
const cancelButton = document.getElementById('venue-cancel');
const formColLabel = document.getElementById('form-col-label');
const venueModal = document.getElementById('venue-modal');
const venueModalBackdrop = document.getElementById('venue-modal-backdrop');
const openVenueModalButton = document.getElementById('venue-modal-open');
const closeVenueModalButton = document.getElementById('venue-modal-close');
const drinkMessage = document.getElementById('drink-message');
const venueSelect = document.getElementById('drink-venue-select');
const existingDrinkForm = document.getElementById('existing-drink-form');
const existingDrinkSelect = document.getElementById('existing-drink-id');
const existingDrinkPrice = document.getElementById('existing-drink-price');
const existingDrinkSubmit = existingDrinkForm.querySelector('button');
const newDrinkForm = document.getElementById('new-drink-form');
const newDrinkSubmit = newDrinkForm.querySelector('button');
const venueDrinksContainer = document.getElementById('venue-drinks');

// Upload immagine — venue
const venueImageFile = document.getElementById('venue-image-file');
const venueImagePreview = document.getElementById('venue-image-preview');
const venueImageFilename = document.getElementById('venue-image-filename');
const venueImageRemove = document.getElementById('venue-image-remove');

// Upload immagine — drink
const drinkImageFile = document.getElementById('new-drink-image-file');
const drinkImagePreview = document.getElementById('new-drink-image-preview');
const drinkImageFilename = document.getElementById('new-drink-image-filename');
const drinkImageRemove = document.getElementById('new-drink-image-remove');
const drinkAccordionPanel = document.getElementById('drink-accordion-panel');
const drinkModalBackdrop = document.getElementById('drink-modal-backdrop');
const drinkPanelTitle = document.getElementById('drink-panel-title');
const drinkPanelSub = document.getElementById('drink-panel-sub');
const drinkPanelClose = document.getElementById('drink-panel-close');

// ── Accordion form birre ─────────────────────────────────────────────────
document.querySelectorAll('.drink-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const bodyId = trigger.getAttribute('aria-controls');
        const body = document.getElementById(bodyId);
        if (!body) return;
        const isOpen = !body.classList.contains('hidden');
        // Chiudi tutti gli altri
        document.querySelectorAll('.drink-accordion-body').forEach(b => b.classList.add('hidden'));
        document.querySelectorAll('.drink-accordion-trigger').forEach(t => {
            t.setAttribute('aria-expanded', 'false');
            t.querySelector('.drink-chevron')?.classList.remove('drink-chevron--open');
        });
        if (!isOpen) {
            body.classList.remove('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            trigger.querySelector('.drink-chevron')?.classList.add('drink-chevron--open');
        }
    });
});



const fields = {
    id: document.getElementById('venue-id'),
    name: document.getElementById('venue-name'),
    description: document.getElementById('venue-description'),
    city: document.getElementById('venue-city'),
    address: document.getElementById('venue-address'),
    type: document.getElementById('venue-type'),
    imageUri: document.getElementById('venue-image-uri')
};

const newDrinkFields = {
    name: document.getElementById('new-drink-name'),
    description: document.getElementById('new-drink-description'),
    category: document.getElementById('new-drink-category'),
    abv: document.getElementById('new-drink-abv'),
    origin: document.getElementById('new-drink-origin'),
    imageUri: document.getElementById('new-drink-image-uri'),
    price: document.getElementById('new-drink-price')
};

let ownerVenues = [];
let allDrinks = [];
let selectedVenueDrinks = [];
let editingVenueDrinkId = null;

function showMessage(text, type = '') {
    showToast(text, type === 'is-error' ? 'error' : undefined);
}

function showDrinkMessage(text, type = '') {
    drinkMessage.textContent = text;
    drinkMessage.classList.remove('is-error', 'is-success');
    if (type) drinkMessage.classList.add(type);
}

function statusLabel(status) {
    const labels = {ACTIVE: 'Attivo', PENDING: 'In attesa', SUSPENDED: 'Sospeso'};
    return labels[status] || status;
}

function formatPrice(price) {
    if (price == null || price === '') return '-';
    return Number(price).toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
}

function setupImageUpload({fileInput, preview, filename, removeBtn, hiddenInput, defaultLabel}) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        filename.textContent = file.name;
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        removeBtn.classList.remove('hidden');
        hiddenInput.value = '';
    });

    removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        preview.src = '';
        preview.classList.add('hidden');
        removeBtn.classList.add('hidden');
        filename.textContent = defaultLabel;
        hiddenInput.value = '';
    });
}

async function resolveImageUri(fileInput, hiddenInput, uploadFn) {
    if (fileInput.files[0]) {
        return await uploadFn(fileInput.files[0]);
    }
    return hiddenInput.value || null;
}

function resetImageField({fileInput, preview, filename, removeBtn, hiddenInput, defaultLabel}) {
    fileInput.value = '';
    preview.src = '';
    preview.classList.add('hidden');
    removeBtn.classList.add('hidden');
    filename.textContent = defaultLabel;
    hiddenInput.value = '';
}

function fillImageField({preview, filename, removeBtn, hiddenInput, url}) {
    if (url) {
        preview.src = url;
        preview.classList.remove('hidden');
        removeBtn.classList.remove('hidden');
        filename.textContent = url.split('/').pop();
        hiddenInput.value = url;
    }
}

function readVenueForm() {
    const imageUri = fields.imageUri.value.trim();
    return {
        name: fields.name.value.trim(),
        description: fields.description.value.trim() || null,
        city: fields.city.value.trim(),
        address: fields.address.value.trim(),
        type: fields.type.value,
        imageUri: imageUri || null
    };
}

function readNewDrinkForm() {
    const imageUri = newDrinkFields.imageUri.value.trim();
    const abv = newDrinkFields.abv.value;
    return {
        name: newDrinkFields.name.value.trim(),
        description: newDrinkFields.description.value.trim() || null,
        category: newDrinkFields.category.value,
        abv: abv === '' ? null : Number(abv),
        origin: newDrinkFields.origin.value.trim() || null,
        imageUri: imageUri || null
    };
}

function selectedVenueId() {
    return venueSelect.value;
}

function openVenueModal() {
    venueModal.classList.remove('hidden');
    venueModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
    fields.name.focus();
}

function closeVenueModal() {
    venueModal.classList.add('hidden');
    venueModalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    resetForm();
}

function openCreateVenueModal() {
    resetForm();
    openVenueModal();
}

function openEditVenueModal(venue) {
    fillForm(venue);
    openVenueModal();
}

function resetForm() {
    form.reset();
    fields.id.value = '';
    submitButton.textContent = 'Crea locale';
    formColLabel.textContent = 'Nuovo locale';
    resetImageField({
        fileInput: venueImageFile, preview: venueImagePreview,
        filename: venueImageFilename, removeBtn: venueImageRemove,
        hiddenInput: fields.imageUri,
        defaultLabel: 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)'
    });
}

function fillForm(venue) {
    fields.id.value = venue.id;
    fields.name.value = venue.name || '';
    fields.description.value = venue.description || '';
    fields.city.value = venue.city || '';
    fields.address.value = venue.address || '';
    fields.type.value = venue.type || 'PUB';
    fields.imageUri.value = venue.imageUri || '';
    submitButton.textContent = 'Aggiorna locale';
    formColLabel.textContent = 'Modifica locale';
    fillImageField({
        preview: venueImagePreview, filename: venueImageFilename,
        removeBtn: venueImageRemove, hiddenInput: fields.imageUri,
        url: venue.imageUri
    });
}

function openDrinkPanel(venue) {
    venueSelect.value = venue.id;
    drinkPanelTitle.innerHTML = `<i class="fa-solid fa-beer-mug-empty"></i> Birre — ${escapeHtml(venue.name)}`;
    drinkPanelSub.textContent = `${escapeHtml(venue.city)} · ${escapeHtml(statusLabel(venue.status))}`;
    drinkAccordionPanel.classList.remove('hidden');
    drinkModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
    syncDrinkControls();
    loadSelectedVenueDrinks();
    drinkPanelClose.focus();
}

function closeDrinkPanel() {
    drinkAccordionPanel.classList.add('hidden');
    drinkModalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    venueSelect.value = '';
    selectedVenueDrinks = [];
    editingVenueDrinkId = null;
    venueDrinksContainer.innerHTML = '<p class="dashboard-message">Seleziona un locale.</p>';
}

function renderVenues() {
    if (!ownerVenues.length) {
        list.innerHTML = '<p class="dashboard-message">Non hai ancora creato locali.</p>';
        return;
    }

    list.innerHTML = ownerVenues.map(venue => `
    <article class="dashboard-item" data-id="${escapeHtml(venue.id)}">
      <img src="${escapeHtml(venue.imageUri || '../assets/icons/pin.png')}" alt="Foto di ${escapeHtml(venue.name)}">
      <div>
        <span class="dashboard-status status-${escapeHtml(venue.status).toLowerCase()}">${escapeHtml(statusLabel(venue.status))}</span>
        <h3>${escapeHtml(venue.name)}</h3>
        <p>${escapeHtml(venue.city)} · ${escapeHtml(venue.address)}</p>
      </div>
      <div class="dashboard-actions">
        <button type="button" class="edit-venue">Modifica</button>
        <button type="button" class="manage-drinks secondary-button">
          <i class="fa-solid fa-beer-mug-empty"></i> Birre
        </button>
        <button type="button" class="delete-venue danger-button">Elimina</button>
      </div>
    </article>
  `).join('');
}

function renderVenueSelect() {
    if (!ownerVenues.length) {
        venueSelect.innerHTML = '<option value="">Crea prima un locale</option>';
        syncDrinkControls();
        return;
    }

    const previousValue = venueSelect.value;
    venueSelect.innerHTML = ownerVenues.map(venue => `
    <option value="${escapeHtml(venue.id)}">${escapeHtml(venue.name)}</option>
  `).join('');

    if (ownerVenues.some(venue => String(venue.id) === previousValue)) {
        venueSelect.value = previousValue;
    }

    syncDrinkControls();
}

function renderDrinkOptions() {
    if (!allDrinks.length) {
        existingDrinkSelect.innerHTML = '<option value="">Nessun drink disponibile</option>';
        syncDrinkControls();
        return;
    }

    existingDrinkSelect.innerHTML = allDrinks.map(drink => `
    <option value="${escapeHtml(drink.id)}">${escapeHtml(drink.name)} - ${escapeHtml(drink.category)}</option>
  `).join('');

    syncDrinkControls();
}

function syncDrinkControls() {
    const hasVenue = ownerVenues.length > 0;
    const hasExistingDrinks = allDrinks.length > 0;
    existingDrinkSelect.disabled = !hasVenue || !hasExistingDrinks;
    existingDrinkSubmit.disabled = !hasVenue || !hasExistingDrinks;
    newDrinkSubmit.disabled = !hasVenue;
}

function renderVenueDrinks() {
    if (!selectedVenueId()) {
        venueDrinksContainer.innerHTML = '<p class="dashboard-message">Seleziona un locale.</p>';
        return;
    }

    if (!selectedVenueDrinks.length) {
        venueDrinksContainer.innerHTML = '<p class="dashboard-message">Nessun drink nel menu di questo locale.</p>';
        return;
    }

    venueDrinksContainer.innerHTML = selectedVenueDrinks.map(item => {
        const drinkId = String(item.drinkId);
        const isEditing = editingVenueDrinkId === drinkId;
        const price = item.price == null || item.price === '' ? '' : Number(item.price);

        return `
      <article class="dashboard-item drink-menu-item" data-drink-id="${escapeHtml(drinkId)}">
        <img src="${escapeHtml(item.imageUri || '../assets/icons/pin.png')}" alt="Foto di ${escapeHtml(item.drinkName)}">
        <div>
          <span class="dashboard-status">${escapeHtml(item.category || 'Drink')}</span>
          <h3>${escapeHtml(item.drinkName)}</h3>
          <p>${formatPrice(item.price)} ${item.abv != null ? `· ${escapeHtml(item.abv)}%` : ''}</p>
          ${isEditing ? `
            <label class="dashboard-label compact-price-label" for="price-${escapeHtml(drinkId)}">Nuovo prezzo</label>
            <input
              class="dashboard-control compact-price-input"
              id="price-${escapeHtml(drinkId)}"
              type="number" step="0.01" min="0"
              value="${escapeHtml(price)}" required>
          ` : ''}
        </div>
        <div class="dashboard-actions">
          ${isEditing ? `
            <button type="button" class="save-venue-drink">Salva</button>
            <button type="button" class="cancel-venue-drink secondary-button">Annulla</button>
          ` : `
            <button type="button" class="edit-venue-drink">Modifica prezzo</button>
            <button type="button" class="remove-venue-drink danger-button">Rimuovi</button>
          `}
        </div>
      </article>
    `;
    }).join('');
}

async function loadOwnerVenues() {
    list.innerHTML = '<p class="dashboard-message">Caricamento locali...</p>';
    ownerVenues = await getOwnerVenues();
    renderVenues();
    renderVenueSelect();
}

async function loadAllDrinks() {
    allDrinks = await getDrinks();
    renderDrinkOptions();
}

async function loadSelectedVenueDrinks() {
    if (!selectedVenueId()) {
        selectedVenueDrinks = [];
        renderVenueDrinks();
        return;
    }

    try {
        venueDrinksContainer.innerHTML = '<p class="dashboard-message">Caricamento menu...</p>';
        selectedVenueDrinks = await getOwnerVenueDrinks(selectedVenueId());
        renderVenueDrinks();
    } catch (error) {
        selectedVenueDrinks = [];
        venueDrinksContainer.innerHTML = '<p class="dashboard-message">Menu non disponibile per questo locale.</p>';
        showDrinkMessage(error.message, 'is-error');
    }
}

async function refreshDrinkArea() {
    await Promise.all([loadAllDrinks(), loadSelectedVenueDrinks()]);
}

const user = await requireAnyRole('OWNER');

if (user) {
    await loadOwnerVenues();
    await loadAllDrinks();

    // Inizializza upload fields
    setupImageUpload({
        fileInput: venueImageFile, preview: venueImagePreview,
        filename: venueImageFilename, removeBtn: venueImageRemove,
        hiddenInput: fields.imageUri,
        defaultLabel: 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)'
    });

    setupImageUpload({
        fileInput: drinkImageFile, preview: drinkImagePreview,
        filename: drinkImageFilename, removeBtn: drinkImageRemove,
        hiddenInput: newDrinkFields.imageUri,
        defaultLabel: 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)'
    });

    openVenueModalButton.addEventListener('click', openCreateVenueModal);
    cancelButton.addEventListener('click', closeVenueModal);
    closeVenueModalButton.addEventListener('click', closeVenueModal);
    venueModalBackdrop.addEventListener('click', closeVenueModal);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !venueModal.classList.contains('hidden')) {
            closeVenueModal();
            return;
        }

        if (event.key === 'Escape' && !drinkAccordionPanel.classList.contains('hidden')) {
            closeDrinkPanel();
        }
    });

    drinkPanelClose.addEventListener('click', closeDrinkPanel);
    drinkModalBackdrop.addEventListener('click', closeDrinkPanel);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitButton.disabled = true;
        showMessage(fields.id.value ? 'Aggiornamento locale...' : 'Creazione locale...');

        try {
            const imageUri = await resolveImageUri(venueImageFile, fields.imageUri, uploadVenueImage);
            const payload = {...readVenueForm(), imageUri};

            if (fields.id.value) {
                await updateVenue(fields.id.value, payload);
                showMessage('Locale aggiornato.', 'is-success');
                showToast('Locale aggiornato.');
            } else {
                await createVenue(payload);
                showMessage('Locale creato e inviato in approvazione.', 'is-success');
                showToast('Locale creato.');
            }

            closeVenueModal();
            await loadOwnerVenues();
            if (selectedVenueId()) await loadSelectedVenueDrinks();
        } catch (error) {
            showMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    existingDrinkForm.addEventListener('submit', async event => {
        event.preventDefault();
        showDrinkMessage('Aggiunta drink al locale...');

        try {
            await addDrinkToVenue(selectedVenueId(), {
                drinkId: existingDrinkSelect.value,
                price: Number(existingDrinkPrice.value)
            });
            existingDrinkForm.reset();
            showDrinkMessage('Drink aggiunto al locale.', 'is-success');
            showToast('Drink aggiunto al locale.');
            await loadSelectedVenueDrinks();
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        }
    });

    newDrinkForm.addEventListener('submit', async event => {
        event.preventDefault();
        showDrinkMessage('Creazione drink...');

        try {
            const drinkImageUri = await resolveImageUri(drinkImageFile, newDrinkFields.imageUri, uploadDrinkImage);
            const drink = await createDrink({...readNewDrinkForm(), imageUri: drinkImageUri});
            await addDrinkToVenue(selectedVenueId(), {
                drinkId: drink.id,
                price: Number(newDrinkFields.price.value)
            });
            newDrinkForm.reset();
            resetImageField({
                fileInput: drinkImageFile, preview: drinkImagePreview,
                filename: drinkImageFilename, removeBtn: drinkImageRemove,
                hiddenInput: newDrinkFields.imageUri,
                defaultLabel: 'Scegli immagine (JPG, PNG, WEBP · max 5 MB)'
            });
            showDrinkMessage('Drink creato e aggiunto al locale.', 'is-success');
            showToast('Drink creato e aggiunto al locale.');
            await refreshDrinkArea();
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        }
    });

    venueDrinksContainer.addEventListener('click', async event => {
        const item = event.target.closest('.drink-menu-item');
        if (!item) return;
        const drinkId = item.dataset.drinkId;

        if (event.target.closest('.edit-venue-drink')) {
            editingVenueDrinkId = drinkId;
            renderVenueDrinks();
            venueDrinksContainer.querySelector('.compact-price-input')?.focus();
            return;
        }

        if (event.target.closest('.cancel-venue-drink')) {
            editingVenueDrinkId = null;
            renderVenueDrinks();
            return;
        }

        if (event.target.closest('.save-venue-drink')) {
            const priceInput = item.querySelector('.compact-price-input');
            const price = Number(priceInput.value);

            if (priceInput.value === '' || Number.isNaN(price) || price < 0) {
                showDrinkMessage('Inserisci un prezzo valido.', 'is-error');
                return;
            }

            try {
                await updateDrinkInVenue(selectedVenueId(), drinkId, {drinkId, price});
                editingVenueDrinkId = null;
                showDrinkMessage('Prezzo del drink aggiornato.', 'is-success');
                showToast('Prezzo aggiornato.');
                await loadSelectedVenueDrinks();
            } catch (error) {
                showDrinkMessage(error.message, 'is-error');
                showToast(error.message, 'error');
            }
            return;
        }

        const button = event.target.closest('.remove-venue-drink');
        if (!button) return;

        const drink = selectedVenueDrinks.find(item => String(item.drinkId) === String(drinkId));
        const confirmed = await confirmAction({
            title: 'Rimuovere il drink?',
            message: `${drink?.drinkName || 'Questo drink'} verrà rimosso dal menu del locale.`,
            confirmText: 'Rimuovi',
            danger: true
        });
        if (!confirmed) return;

        try {
            await removeDrinkFromVenue(selectedVenueId(), drinkId);
            showDrinkMessage('Drink rimosso dal locale.', 'is-success');
            showToast('Drink rimosso dal locale.');
            await loadSelectedVenueDrinks();
        } catch (error) {
            showDrinkMessage(error.message, 'is-error');
            showToast(error.message, 'error');
        }
    });

    list.addEventListener('click', async event => {
        const card = event.target.closest('.dashboard-item');
        if (!card) return;

        const venue = ownerVenues.find(item => String(item.id) === String(card.dataset.id));
        if (!venue) return;

        if (event.target.closest('.edit-venue')) {
            openEditVenueModal(venue);
            return;
        }

        if (event.target.closest('.manage-drinks')) {
            openDrinkPanel(venue);
            return;
        }

        if (event.target.closest('.delete-venue')) {
            const confirmed = await confirmAction({
                title: 'Eliminare il locale?',
                message: `${venue.name} verrà eliminato definitivamente.`,
                confirmText: 'Elimina',
                danger: true
            });
            if (!confirmed) return;

            try {
                await deleteVenue(venue.id);
                showMessage('Locale eliminato.', 'is-success');
                showToast('Locale eliminato.');
                if (selectedVenueId() === String(venue.id)) closeDrinkPanel();
                await loadOwnerVenues();
            } catch (error) {
                showMessage(error.message, 'is-error');
                showToast(error.message, 'error');
            }
        }
    });
}
