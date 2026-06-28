/* ============================================================
 * FertiCalc · theme.js
 * Modo claro/oscuro + 5 paletas de color.
 * Guarda la preferencia del usuario en localStorage.
 * ============================================================ */

const Theme = {
  current: 'light',
  accent: 'green',

  init() {
    // Cargar preferencias guardadas
    const savedTheme = localStorage.getItem(Storage.THEME_KEY + '.mode') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const savedAccent = localStorage.getItem(Storage.THEME_KEY + '.accent') || 'green';

    this.applyTheme(savedTheme);
    this.applyAccent(savedAccent);
    this.bind();

    // theme-color del meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.current === 'dark' ? '#000000' : '#f5f5f7');
  },

  bind() {
    // Toggle claro/oscuro
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // Menú de paletas
    const paletteBtn = document.getElementById('paletteBtn');
    const paletteMenu = document.getElementById('paletteMenu');
    if (paletteBtn && paletteMenu) {
      paletteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        paletteMenu.classList.toggle('open');
      });
      // Cerrar al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!paletteMenu.contains(e.target) && e.target !== paletteBtn) {
          paletteMenu.classList.remove('open');
        }
      });
    }
    // Seleccionar paleta
    document.querySelectorAll('.palette-row').forEach((row) => {
      row.addEventListener('click', () => {
        this.applyAccent(row.dataset.accentVal);
        paletteMenu.classList.remove('open');
      });
    });
  },

  applyTheme(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(Storage.THEME_KEY + '.mode', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#f5f5f7');
  },

  toggleTheme() {
    this.applyTheme(this.current === 'dark' ? 'light' : 'dark');
    setTimeout(() => Charts.refresh(), 100);
  },

  applyAccent(accent) {
    this.accent = accent;
    if (accent === 'green') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', accent);
    }
    localStorage.setItem(Storage.THEME_KEY + '.accent', accent);
    // Marcar fila activa
    document.querySelectorAll('.palette-row').forEach((row) => {
      row.classList.toggle('active', row.dataset.accentVal === accent);
    });
    // Actualizar meta theme-color
    const colors = {
      green: '#248A3D', purple: '#AF52DE', terra: '#C0392B', blue: '#0A84FF',
      cyan: '#00C7BE', orange: '#FF9500', pink: '#FF2D55',
      indigo: '#5856D6', lime: '#84CC16', sky: '#0EA5E9',
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[accent] || '#248A3D');
    setTimeout(() => Charts.refresh(), 100);
  },
};

window.Theme = Theme;
