/* ============================================================
 * FertiCalc · theme.js
 * Modo claro/oscuro. Respeta preferencia del sistema y
 * guarda la elección del usuario.
 * ============================================================ */

const Theme = {
  init() {
    // 1. Preferencia guardada · 2. Preferencia del sistema
    const saved = localStorage.getItem(Storage.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved || (prefersDark ? 'dark' : 'light'));

    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());

    // Actualizar theme-color del meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.current === 'dark' ? '#000000' : '#f5f5f7');
  },
  apply(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(Storage.THEME_KEY, theme);
  },
  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.current === 'dark' ? '#000000' : '#f5f5f7');
  },
};

window.Theme = Theme;
