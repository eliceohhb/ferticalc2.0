/* ============================================================
 * FertiCalc · storage.js
 * Persistencia: estado del formulario, historial de planes,
 * import/export JSON. Todo en localStorage.
 * ============================================================ */

const Storage = {
  STATE_KEY: 'ferticalc.state',
  HISTORY_KEY: 'ferticalc.history',
  THEME_KEY: 'ferticalc.theme',

  /* ----- Estado del formulario (autoguardado) ----- */
  saveState(state) {
    try { localStorage.setItem(this.STATE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('No se pudo guardar', e); }
  },
  loadState() {
    try { return JSON.parse(localStorage.getItem(this.STATE_KEY)) || {}; }
    catch (e) { return {}; }
  },
  clearState() { localStorage.removeItem(this.STATE_KEY); },

  /* ----- Historial de planes ----- */
  getHistory() {
    try { return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || []; }
    catch (e) { return []; }
  },
  savePlan(plan) {
    const list = this.getHistory();
    plan.id = plan.id || ('plan_' + Date.now());
    plan.date = plan.date || new Date().toISOString();
    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) list[idx] = plan; else list.unshift(plan);
    // Limitar a 50 planes
    if (list.length > 50) list.length = 50;
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list));
    return plan;
  },
  deletePlan(id) {
    const list = this.getHistory().filter((p) => p.id !== id);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list));
  },
  getPlan(id) { return this.getHistory().find((p) => p.id === id) || null; },

  /* ----- Import / Export completo ----- */
  exportAll() {
    return {
      app: 'FertiCalc',
      version: 1,
      exported: new Date().toISOString(),
      history: this.getHistory(),
    };
  },
  importAll(data) {
    if (!data || !Array.isArray(data.history)) throw new Error('JSON inválido');
    const existing = this.getHistory();
    const existingIds = new Set(existing.map((p) => p.id));
    let added = 0;
    data.history.forEach((p) => {
      if (!existingIds.has(p.id)) { existing.push(p); added++; }
    });
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(existing));
    return added;
  },
};

window.Storage = Storage;
