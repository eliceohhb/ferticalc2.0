/* ============================================================
 * FertiCalc · results.js
 * Render del Paso 4: métricas, paso a paso, tabla resumen,
 * gráficos, recomendaciones y análisis económico.
 * ============================================================ */

const Results = {

  /* Renderiza un bloque de detalle con los pasos intermedios */
  renderDetail(calcResult, icon = '') {
    if (!calcResult.ok) return '';
    const steps = calcResult.steps.map((s) => {
      const real = s.real !== null && s.real !== undefined ? fmt(s.real, (String(s.real).includes('.') ? 2 : 0)) : '';
      const arrow = s.rounded !== null && s.rounded !== undefined ? ` <span class="arrow">→</span> <span class="final">${fmt(s.rounded, 0)}</span> <span style="opacity:.6">${s.unit || ''}</span>` : ` <span style="opacity:.6">${s.unit || ''}</span>`;
      const tag = s.note ? ` <span class="tag">${s.note.replace(/[()]/g, '')}</span>` : '';
      return `<div class="step-line">${s.text} = ${real}${arrow}${tag}</div>`;
    }).join('');
    const cost = calcResult.results.costo;
    return `
      <div class="detail-block">
        <div class="detail-block__head">
          <span class="detail-block__title">${icon} ${calcResult.label}</span>
          <span class="detail-block__cost">${cost ? fmtMoney(cost) : ''}</span>
        </div>
        ${steps}
      </div>`;
  },

  /* Genera la recomendación según balance NPK */
  buildRec(state, calc) {
    const recs = [];
    const npk = state.npk || {};
    // Balance aplicado vs requerido
    const applied = { n: 0, p: 0, k: 0 };
    calc.npk.forEach((r) => {
      const nut = r.nutrient.toLowerCase();
      if (applied[nut] !== undefined) applied[nut] += r.results.kNut;
    });
    const req = { n: +(npk.n || 0), p: +(npk.p || 0), k: +(npk.k || 0) };
    ['n', 'p', 'k'].forEach((nut) => {
      if (req[nut] > 0) {
        const ratio = applied[nut] / req[nut];
        if (ratio < 0.9) recs.push(`Déficit de <strong>${nut.toUpperCase()}</strong>: aplicado ${fmt(applied[nut],0)} u vs ${fmt(req[nut],0)} u requeridas. Considera ajustar la dosis.`);
        else if (ratio > 1.1) recs.push(`Excedente de <strong>${nut.toUpperCase()}</strong>: aplicado ${fmt(applied[nut],0)} u supera las ${fmt(req[nut],0)} u requeridas.`);
      }
    });
    if (!recs.length) recs.push('✅ <strong>Balance NPK adecuado</strong>: las dosis aplicadas coinciden con los requerimientos del cultivo.');
    return recs;
  },

  /* Render completo del paso de resultados */
  render(state, calc) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;

    // --- Métricas resumen ---
    const metrics = `
      <div class="metrics">
        <div class="metric"><div class="metric__value accent">${fmt(calc.total.sacos, 0)}</div><div class="metric__label">Total sacos</div></div>
        <div class="metric"><div class="metric__value accent">${fmtMoney(calc.total.costo)}</div><div class="metric__label">Costo total fertilización</div></div>
      </div>`;

    // --- Análisis económico ---
    let ecoHtml = '';
    if (calc.economic && calc.economic.porUnidad != null) {
      const eco = calc.economic;
      // Métrica principal
      const mainVal = eco.porPaquete != null ? eco.porPaquete : eco.porUnidad;
      ecoHtml = `
        <div class="metric"><div class="metric__value">${fmtMoneyDec(mainVal, 2)}</div><div class="metric__label">${eco.label}</div></div>`;
    }
    const ecoBlock = ecoHtml ? `<div class="metrics">${ecoHtml}</div>` : '';

    // --- Desglose económico paso a paso ---
    let ecoDetailHtml = '';
    if (calc.economic && calc.economic.steps && calc.economic.steps.length) {
      const stepLines = calc.economic.steps.map((s, i) => {
        const isLast = i === calc.economic.steps.length - 1;
        return `<div class="step-line${isLast ? ' step-line--highlight' : ''}">${s.text} <span style="opacity:.6">${s.unit || ''}</span></div>`;
      }).join('');
      ecoDetailHtml = `
        <div class="detail-block">
          <div class="detail-block__head">
            <span class="detail-block__title">💰 Economía por cosecha</span>
          </div>
          ${stepLines}
        </div>`;
    }

    // --- Paso a paso ---
    let details = '';
    if (calc.ph && calc.ph.ok) details += this.renderDetail(calc.ph, '🔧');
    if (calc.pSuelo && calc.pSuelo.ok) details += this.renderDetail(calc.pSuelo, '🧪');
    const icons = { 'Nitrógeno base': '🟢', 'Cobertera (N adicional)': '🌿', 'Fósforo (P₂O₅)': '🔵', 'Potasio (K₂O)': '🟣' };
    calc.npk.forEach((r) => { details += this.renderDetail(r, icons[r.label] || '•'); });
    calc.micros.forEach((r) => { details += this.renderDetail(r, '➕'); });

    // --- Tabla resumen ---
    const rows = [];
    const addRow = (label, r) => {
      if (r && r.ok) rows.push(`<tr><td>${label}</td><td>${fmt(r.results.kgTot || r.results.kg || 0, 1)}</td><td>${fmt(r.results.sacos, 0)}</td><td style="text-align:right">${fmtMoney(r.results.costo)}</td></tr>`);
    };
    addRow('pH (CaCO₃)', calc.ph);
    addRow('P suelo (SFT)', calc.pSuelo);
    calc.npk.forEach((r) => addRow(r.label, r));
    calc.micros.forEach((r) => addRow(r.label, r));

    const table = `
      <div class="card">
        <h3 class="card__title">📋 Resumen</h3>
        <table class="summary-table">
          <thead><tr><th>Insumo</th><th>kg totales</th><th>Sacos</th><th style="text-align:right">Costo</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
          <tfoot><tr><td colspan="2">TOTAL</td><td>${fmt(calc.total.sacos, 0)}</td><td style="text-align:right">${fmtMoney(calc.total.costo)}</td></tr></tfoot>
        </table>
      </div>`;

    // --- Recomendaciones ---
    const recs = this.buildRec(state, calc);
    const recHtml = `<div class="rec">${recs.map((r) => `<div>${r}</div>`).join('')}</div>`;

    // --- Placeholder de gráficos ---
    const chartsHtml = `
      <div class="chart-box"><canvas id="costChart"></canvas></div>
      <div class="chart-box"><canvas id="npkChart"></canvas></div>`;

    // --- Barra de exportación ---
    const exportBar = `
      <h3 class="card__title" style="margin:16px 4px 8px">📥 Descargar informe</h3>
      <div class="export-bar">
        <button class="btn btn--primary" id="exportPdf">📄 PDF</button>
        <button class="btn btn--ghost" id="exportWord">📝 Word</button>
        <button class="btn btn--ghost" id="exportXls">📊 Excel</button>
        <button class="btn btn--ghost" id="exportImg">🖼️ Imagen</button>
        <button class="btn btn--ghost" id="exportLabels">🏷️ Etiquetas</button>
        <button class="btn btn--ghost" id="savePlan">💾 Guardar</button>
      </div>`;

    container.innerHTML = metrics + ecoBlock + table + ecoDetailHtml + `<h3 class="card__title" style="margin:8px 4px">📝 Paso a paso</h3>` + details + chartsHtml + recHtml + exportBar;

    // --- Renderizar gráficos ---
    const items = [];
    if (calc.ph && calc.ph.ok) items.push({ label: 'pH (CaCO₃)', costo: calc.ph.results.costo });
    if (calc.pSuelo && calc.pSuelo.ok) items.push({ label: 'P suelo', costo: calc.pSuelo.results.costo });
    calc.npk.forEach((r) => items.push({ label: r.label, costo: r.results.costo }));
    calc.micros.forEach((r) => items.push({ label: r.label, costo: r.results.costo }));
    const pieEl = document.getElementById('costChart');
    if (pieEl && items.length) Charts.renderPie(pieEl, items);

    // NPK requerido vs aplicado
    const applied = { n: 0, p: 0, k: 0 };
    calc.npk.forEach((r) => { const nut = r.nutrient.toLowerCase(); if (applied[nut] !== undefined) applied[nut] += r.results.kNut; });
    const npk = state.npk || {};
    const barEl = document.getElementById('npkChart');
    if (barEl) Charts.renderBar(barEl, { n: +(npk.n||0), p: +(npk.p||0), k: +(npk.k||0) }, applied);

    // --- Listeners export ---
    document.getElementById('exportPdf').addEventListener('click', () => Export.pdf(state, calc));
    document.getElementById('exportWord').addEventListener('click', () => Export.word(state, calc));
    document.getElementById('exportXls').addEventListener('click', () => Export.excel(state, calc));
    document.getElementById('exportImg').addEventListener('click', () => Export.image());
    document.getElementById('exportLabels').addEventListener('click', () => Export.labels(state, calc));
    document.getElementById('savePlan').addEventListener('click', () => App.promptSavePlan());
  },
};

window.Results = Results;
