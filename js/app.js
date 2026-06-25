/* ============================================================
 * FertiCalc · app.js
 * Controlador principal: estado, navegación entre pasos,
 * guardado automático, historial y modal de guardar plan.
 * ============================================================ */

const App = {
  currentStep: 0,
  totalSteps: 6,
  state: {},

  /* ---------- Init ---------- */
  init() {
    Theme.init();
    UI.init();
    this.bindNav();
    this.bindHeader();
    this.bindHistoryActions();
    this.restore();         // restaurar estado guardado
    this.goToStep(0);
    this.renderHistory();
  },

  /* ---------- Lectura del formulario a objeto estado ---------- */
  readForm() {
    const v = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const b = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const n = (id) => { const el = document.getElementById(id); return el ? (+el.value || 0) : 0; };
    return {
      cropName: v('cropName'),
      cropSelect: v('cropSelect'),
      superficie: n('superficie'),
      soil: v('soilSelect'),
      npk: { n: n('reqN'), p: n('reqP'), k: n('reqK'), cover: n('reqCover') },
      yieldType: v('yieldType'),
      yieldValue: n('yieldValue'),
      unitsPlanted: n('unitsPlanted'),
      perdida: n('perdida'),
      // Correcciones
      usePH: b('usePH'),
      phIni: v('phIni') === '' ? null : +v('phIni'),
      phDes: v('phDes') === '' ? null : +v('phDes'),
      phPrecio: n('phPrecio'),
      usePSuelo: b('usePSuelo'),
      ppmIni: v('ppmIni') === '' ? null : +v('ppmIni'),
      ppmDes: v('ppmDes') === '' ? null : +v('ppmDes'),
      pBuffer: v('pBuffer') === '' ? null : +v('pBuffer'),
      pSueloPrecio: n('pSueloPrecio'),
      // NPK fertilizantes
      nFert: v('nFert'), nPct: n('nPct'), nPrecio: n('nPrecio'),
      coverFert: v('coverFert'), coverPct: n('coverPct'), coverPrecio: n('coverPrecio'),
      pFert: v('pFert'), pPct: n('pPct'), pPrecio: n('pPrecio'),
      kFert: v('kFert'), kPct: n('kPct'), kPrecio: n('kPrecio'),
      // Micros
      micros: UI.getMicros(),
    };
  },

  /* Guarda el estado actual desde el formulario */
  saveFromForm() {
    this.state = this.readForm();
    Storage.saveState(this.state);
  },

  /* ---------- Restaurar estado ---------- */
  restore() {
    const s = Storage.loadState();
    if (!Object.keys(s).length) return;
    this.state = s;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
    const check = (id, val) => { const el = document.getElementById(id); if (el && val) el.checked = true; };
    set('cropName', s.cropName);
    set('cropSelect', s.cropSelect);
    set('superficie', s.superficie);
    set('soilSelect', s.soil);
    const npk = s.npk || {};
    set('reqN', npk.n); set('reqP', npk.p); set('reqK', npk.k); set('reqCover', npk.cover);
    set('yieldType', s.yieldType); set('yieldValue', s.yieldValue);
    set('unitsPlanted', s.unitsPlanted); set('perdida', s.perdida);
    check('usePH', s.usePH); if (s.usePH) document.getElementById('phGroup').classList.add('open');
    set('phIni', s.phIni); set('phDes', s.phDes); set('phPrecio', s.phPrecio);
    check('usePSuelo', s.usePSuelo); if (s.usePSuelo) document.getElementById('pSueloGroup').classList.add('open');
    set('ppmIni', s.ppmIni); set('ppmDes', s.ppmDes); set('pBuffer', s.pBuffer); set('pSueloPrecio', s.pSueloPrecio);
    set('nFert', s.nFert); set('nPct', s.nPct); set('nPrecio', s.nPrecio);
    set('coverFert', s.coverFert); set('coverPct', s.coverPct); set('coverPrecio', s.coverPrecio);
    set('pFert', s.pFert); set('pPct', s.pPct); set('pPrecio', s.pPrecio);
    set('kFert', s.kFert); set('kPct', s.kPct); set('kPrecio', s.kPrecio);
    // Micros
    UI.clearMicros();
    if (Array.isArray(s.micros) && s.micros.length) {
      s.micros.forEach((m) => { if (m.dosis || m.precio) UI.addMicroRow(m); });
    }
    if (!document.querySelector('.micro-row')) UI.addMicroRow();
    // Estado colapsable poblacional
    if (['unidad','paquete'].includes(s.yieldType)) document.getElementById('poblacionalGroup').classList.add('open');
    // Info Ca
    const soil = SOILS.find((x) => x.id === s.soil);
    if (soil) document.getElementById('phCaInfo').textContent = `Suelo ${soil.name}: Calcio ${soil.ca} · Tampón ${soil.buffer || '—'}`;
  },

  /* ---------- Navegación ---------- */
  bindNav() {
    document.getElementById('prevBtn').addEventListener('click', () => this.goToStep(this.currentStep - 1));
    document.getElementById('nextBtn').addEventListener('click', () => this.goToStep(this.currentStep + 1));
    // Teclado: flechas izq/der
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this.goToStep(this.currentStep - 1);
      if (e.key === 'ArrowRight') this.goToStep(this.currentStep + 1);
    });
  },

  goToStep(step) {
    if (step < 0 || step >= this.totalSteps) return;
    this.currentStep = step;
    // Guardar antes de mostrar resultados
    this.saveFromForm();

    // Mostrar/ocultar secciones
    document.querySelectorAll('.step').forEach((s) => {
      s.hidden = (+s.dataset.step !== step);
    });

    // Si llegamos a resultados (4), calcular y renderizar
    if (step === 4) {
      const calc = calcPlan(this.state);
      Results.render(this.state, calc);
      this._lastCalc = calc;
    }
    // Si llegamos a historial (5), refrescar
    if (step === 5) this.renderHistory();

    this.updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateNav() {
    const step = this.currentStep;
    document.getElementById('prevBtn').disabled = (step === 0);
    const nextBtn = document.getElementById('nextBtn');
    if (step === this.totalSteps - 1) {
      nextBtn.textContent = '✓ Listo';
    } else if (step === 4) {
      nextBtn.textContent = 'Mis planes ›';
    } else {
      nextBtn.textContent = 'Siguiente ›';
    }
    document.getElementById('navLabel').textContent = `Paso ${step + 1} de ${this.totalSteps}`;

    // Stepper
    const pct = (step / (this.totalSteps - 1)) * 100;
    document.getElementById('stepperBar').style.width = pct + '%';

    const dots = document.getElementById('stepperDots');
    if (!dots.children.length) {
      ['Datos','Correcciones','NPK','Extras','Resultados','Historial'].forEach((label, i) => {
        const d = document.createElement('span');
        d.className = 'stepper__dot'; d.textContent = label;
        d.style.cursor = 'pointer';
        d.addEventListener('click', () => this.goToStep(i));
        dots.appendChild(d);
      });
    }
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('active', i === step));
  },

  /* ---------- Header: tema + instalar PWA ---------- */
  bindHeader() {
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferredPrompt = e;
      document.getElementById('installBtn').hidden = false;
    });
    document.getElementById('installBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('installBtn').hidden = true;
      }
    });
  },

  /* ---------- Guardar plan (modal) ---------- */
  promptSavePlan() {
    const name = this.state.cropName || 'Plan';
    const date = new Date().toLocaleDateString('es-CL');
    this.showModal({
      title: 'Guardar plan',
      sub: 'Asigna un nombre a este plan de fertilización.',
      input: true, value: `${name} · ${date}`,
      okText: 'Guardar',
      onOk: (val) => {
        if (!val) return;
        const plan = {
          name: val,
          state: this.state,
          total: this._lastCalc ? this._lastCalc.total : { sacos: 0, costo: 0 },
        };
        Storage.savePlan(plan);
        this.toast('Plan guardado ✓');
        this.renderHistory();
      },
    });
  },

  /* ---------- Modal genérico ---------- */
  showModal({ title, sub, input, value, okText, onOk }) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay'; overlay.id = 'modalOverlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__title">${title}</div>
        <div class="modal__sub">${sub}</div>
        ${input ? `<input type="text" class="input" id="modalInput" value="${(value||'').replace(/"/g,'&quot;')}" />` : ''}
        <div class="row-between" style="margin-top:16px">
          <button class="btn btn--ghost" id="modalCancel">Cancelar</button>
          <button class="btn btn--primary" id="modalOk">${okText || 'OK'}</button>
        </div>
      </div>`;
    overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');
    document.getElementById('modalCancel').onclick = close;
    document.getElementById('modalOk').onclick = () => {
      const val = input ? document.getElementById('modalInput').value : true;
      close();
      if (onOk) onOk(val);
    };
    if (input) setTimeout(() => { const inp = document.getElementById('modalInput'); inp.focus(); inp.select(); }, 50);
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
  },

  /* ---------- Historial ---------- */
  renderHistory() {
    const container = document.getElementById('historyContainer');
    const list = Storage.getHistory();
    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><p>No hay planes guardados aún.<br>Genera un plan y guárdalo desde Resultados.</p></div>`;
      return;
    }
    container.innerHTML = list.map((p) => `
      <div class="history-item history-item--col">
        <div class="history-item__row">
          <div class="history-item__main">
            <div class="history-item__name">${this.esc(p.name)}</div>
            <div class="history-item__meta">${new Date(p.date).toLocaleString('es-CL')} · ${fmt(p.total?.sacos || 0, 0)} sacos · ${fmtMoney(p.total?.costo || 0)}</div>
          </div>
          <div class="history-item__actions">
            <button class="btn btn--sm btn--ghost" data-load="${p.id}">📂 Cargar</button>
            <button class="btn btn--sm btn--danger" data-del="${p.id}">✕</button>
          </div>
        </div>
        <div class="history-item__dl">
          <button class="btn btn--sm btn--primary" data-pdf="${p.id}">📄 PDF</button>
          <button class="btn btn--sm btn--ghost" data-word="${p.id}">📝 Word</button>
          <button class="btn btn--sm btn--ghost" data-xls="${p.id}">📊 Excel</button>
        </div>
      </div>`).join('');

    container.querySelectorAll('[data-load]').forEach((btn) => {
      btn.onclick = () => this.loadPlan(btn.dataset.load);
    });
    container.querySelectorAll('[data-del]').forEach((btn) => {
      btn.onclick = () => {
        this.showModal({
          title: 'Eliminar plan', sub: 'Esta acción no se puede deshacer.',
          okText: 'Eliminar',
          onOk: () => { Storage.deletePlan(btn.dataset.del); this.renderHistory(); this.toast('Plan eliminado'); },
        });
      };
    });
    // Descargas desde historial
    const exportPlan = (id, fmt) => {
      const plan = Storage.getPlan(id);
      if (!plan) return;
      const calc = calcPlan(plan.state || {});
      if (fmt === 'pdf') Export.pdf(plan.state, calc);
      if (fmt === 'word') Export.word(plan.state, calc);
      if (fmt === 'xls') Export.excel(plan.state, calc);
    };
    container.querySelectorAll('[data-pdf]').forEach((btn) => btn.onclick = () => exportPlan(btn.dataset.pdf, 'pdf'));
    container.querySelectorAll('[data-word]').forEach((btn) => btn.onclick = () => exportPlan(btn.dataset.word, 'word'));
    container.querySelectorAll('[data-xls]').forEach((btn) => btn.onclick = () => exportPlan(btn.dataset.xls, 'xls'));
  },

  loadPlan(id) {
    const plan = Storage.getPlan(id);
    if (!plan) return;
    this.state = plan.state || {};
    Storage.saveState(this.state);
    // Recargar la página para que restore() tome el estado
    location.reload();
  },

  bindHistoryActions() {
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      this.showModal({
        title: 'Borrar historial', sub: 'Se eliminarán todos los planes guardados. Esta acción no se puede deshacer.',
        okText: 'Borrar todo',
        onOk: () => {
          localStorage.removeItem(Storage.HISTORY_KEY);
          this.renderHistory();
          this.toast('Historial borrado');
        },
      });
    });
    document.getElementById('importJsonInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const added = Storage.importAll(data);
          this.renderHistory();
          this.toast(`${added} plan(es) importado(s)`);
        } catch (err) { this.toast('JSON inválido'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  },

  /* ---------- Toast ---------- */
  toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), 2500);
  },

  esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
};

// Arrancar
document.addEventListener('DOMContentLoaded', () => App.init());

// Escuchar cambios de tema para refrescar gráficos
const _origToggle = Theme.toggle ? Theme.toggle.bind(Theme) : null;
if (_origToggle) {
  Theme.toggle = function () { _origToggle(); setTimeout(() => Charts.refresh(), 100); };
}

window.App = App;
