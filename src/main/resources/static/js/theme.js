// Gestione dark/light mode con persistenza in localStorage.

const STORAGE_KEY = 'localbrew-theme';

let onThemeChange = null;
export function setThemeChangeCallback(fn) { onThemeChange = fn; }

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('.theme-toggle-btn, .theme-toggle-floating').forEach(btn => {
        const icon = btn.querySelector('i');
        if (!icon) return;
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            btn.setAttribute('aria-label', 'Passa alla modalità giorno');
        } else {
            icon.className = 'fa-solid fa-moon';
            btn.setAttribute('aria-label', 'Passa alla modalità notte');
        }
    });

    onThemeChange?.(theme);
}

export function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    applyTheme(theme);

    document.addEventListener('click', e => {
        const btn = e.target.closest('.theme-toggle-btn, .theme-toggle-floating');
        if (!btn) return;
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    });
}
