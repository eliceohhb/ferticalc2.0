/* ============================================================
 * FertiCalc · export.js
 * Exportación profesional: PDF, Word (DOCX), Excel (con estilo),
 * Imagen y etiquetas de sacos.
 * Todo se genera en el navegador (sin servidor, 100% seguro).
 * ============================================================ */

const Export = {

  /* Genera el nombre de archivo basado en el cultivo */
  fileName(state, ext) {
    const name = (state.cropName || 'Cultivo').replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    const d = new Date();
    const ds = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
    return `FertiCalc_${name}_${ds}.${ext}`;
  },

  /* Helper: arma la lista de insumos para tablas */
  buildItems(calc) {
    const items = [];
    const add = (label, r, emoji = '') => {
      if (r && r.ok) items.push({ label: `${emoji} ${label}`.trim(), ...r.results });
    };
    add('pH (CaCO₃)', calc.ph, '🔧');
    add('P suelo (SFT)', calc.pSuelo, '🧪');
    calc.npk.forEach((r) => add(r.label, r));
    calc.micros.forEach((r) => add(r.label, r, '➕'));
    return items;
  },

  /* ============================================================
   * PDF PROFESIONAL
   * ============================================================ */
  pdf(state, calc) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const cropName = state.cropName || 'Cultivo';
    const date = new Date().toLocaleDateString('es-CL');
    const items = this.buildItems(calc);
    let y = 0;

    // ---- Banda superior ----
    doc.setFillColor(36, 138, 61);
    doc.rect(0, 0, W, 90, 'F');
    doc.setFillColor(28, 110, 48);
    doc.rect(0, 80, W, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    doc.text('FertiCalc', 40, 42);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text('Agrologic · Plan de Fertilización', 40, 62);
    doc.setFontSize(10);
    doc.text(`Generado: ${date}`, W - 40, 42, { align: 'right' });

    // ---- Título del cultivo ----
    y = 130;
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text(`Cultivo: ${cropName}`, 40, y);
    y += 22;

    // ---- Ficha de datos ----
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const soil = SOILS.find((s) => s.id === state.soil);
    const ficha = [
      `Superficie: ${fmt(state.superficie, 1)} ha`,
      soil ? `Suelo: ${soil.name}` : '',
      `Requerimiento NPK: ${fmt(state.npk.n,0)} / ${fmt(state.npk.p,0)} / ${fmt(state.npk.k,0)} u/ha`,
      state.npk.cover ? `Cobertera: ${fmt(state.npk.cover,0)} u N` : '',
    ].filter(Boolean);
    ficha.forEach((f) => { doc.text(f, 40, y); y += 16; });

    // ---- Tabla resumen ----
    y += 8;
    doc.autoTable({
      startY: y,
      head: [['Insumo', 'kg/ha', 'kg totales', 'Sacos', 'Costo']],
      body: items.map((it) => [
        it.label,
        fmt(it.kgNut || it.kgP || it.kgSFT || it.dosis || 0, 1),
        fmt(it.kgTot || it.kg || 0, 1),
        fmt(it.sacos, 0),
        fmtMoney(it.costo),
      ]),
      foot: [['TOTAL', '', '', fmt(calc.total.sacos, 0), fmtMoney(calc.total.costo)]],
      theme: 'striped',
      headStyles: { fillColor: [36, 138, 61], fontSize: 11, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' },
        3: { halign: 'right' }, 4: { halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 24;

    // ---- Análisis económico ----
    if (calc.economic && calc.economic.porUnidad != null) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.setTextColor(36, 138, 61);
      doc.text('📊 Análisis Económico', 40, y); y += 18;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`${calc.economic.label}: ${fmtMoney(calc.economic.porUnidad)}`, 40, y); y += 24;
    }

    // ---- Paso a paso ----
    doc.addPage();
    doc.setFillColor(36, 138, 61);
    doc.rect(0, 0, W, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('📝 Detalle Paso a Paso', 40, 32);

    y = 80;
    const renderDetail = (r, emoji = '') => {
      if (!r || !r.ok) return;
      if (y > H - 80) { doc.addPage(); y = 50; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.setTextColor(36, 138, 61);
      doc.text(`${emoji} ${r.label}`, 40, y); y += 16;
      doc.setFont('courier', 'normal'); doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      r.steps.forEach((s) => {
        if (y > H - 60) { doc.addPage(); y = 50; }
        const real = s.real !== null && s.real !== undefined ? fmt(s.real, (String(s.real).includes('.') ? 1 : 0)) : '';
        const arr = s.rounded !== null && s.rounded !== undefined ? `  →  ${fmt(s.rounded, 0)} ${s.unit || ''}` : `  ${s.unit || ''}`;
        doc.text(`${s.text} = ${real}${arr}`, 44, y);
        y += 13;
      });
      y += 12;
    };
    renderDetail(calc.ph, '🔧');
    renderDetail(calc.pSuelo, '🧪');
    const icons = { 'Nitrógeno base': '🟢', 'Cobertera (N adicional)': '🌿', 'Fósforo (P₂O₅)': '🔵', 'Potasio (K₂O)': '🟣' };
    calc.npk.forEach((r) => renderDetail(r, icons[r.label] || '•'));
    calc.micros.forEach((r) => renderDetail(r, '➕'));

    // ---- Pie de página (todas las páginas) ----
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('FertiCalc · Instituto Profesional Agrario Adolfo Matthei', 40, H - 24);
      doc.text('Metodología Prof. Pedro Moll Medina', 40, H - 14);
      doc.text(`Página ${i} de ${pages}`, W - 40, H - 14, { align: 'right' });
    }

    doc.save(this.fileName(state, 'pdf'));
    App.toast('📄 PDF descargado');
  },

  /* ============================================================
   * WORD / DOCX (informe profesional)
   * Generado como HTML con cabeceras Word — abre en Word/Google Docs
   * ============================================================ */
  word(state, calc) {
    const cropName = state.cropName || 'Cultivo';
    const date = new Date().toLocaleDateString('es-CL');
    const soil = SOILS.find((s) => s.id === state.soil);
    const items = this.buildItems(calc);

    // Construir filas del paso a paso
    const detailHtml = [];
    const addDetail = (r) => {
      if (!r || !r.ok) return;
      detailHtml.push(`<h3 style="color:#248A3D;margin:18pt 0 6pt">${r.label}</h3>`);
      r.steps.forEach((s) => {
        const real = s.real !== null && s.real !== undefined ? fmt(s.real, (String(s.real).includes('.') ? 1 : 0)) : '';
        const arr = s.rounded !== null && s.rounded !== undefined ? ` → <b>${fmt(s.rounded, 0)} ${s.unit || ''}</b>` : ` <i>${s.unit || ''}</i>`;
        detailHtml.push(`<p style="font-family:Consolas,monospace;margin:2pt 0 2pt 18pt;font-size:10pt">${s.text} = ${real}${arr}</p>`);
      });
    };
    addDetail(calc.ph); addDetail(calc.pSuelo);
    calc.npk.forEach(addDetail); calc.micros.forEach(addDetail);

    // Tabla resumen
    const tableRows = items.map((it) => `
      <tr>
        <td style="border:1px solid #ccc;padding:6pt">${it.label}</td>
        <td style="border:1px solid #ccc;padding:6pt;text-align:right">${fmt(it.kgTot || it.kg || 0, 1)}</td>
        <td style="border:1px solid #ccc;padding:6pt;text-align:right">${fmt(it.sacos, 0)}</td>
        <td style="border:1px solid #ccc;padding:6pt;text-align:right">${fmtMoney(it.costo)}</td>
      </tr>`).join('');

    const ecoHtml = (calc.economic && calc.economic.porUnidad != null)
      ? `<p style="font-size:12pt;margin:12pt 0 4pt"><b style="color:#248A3D">${calc.economic.label}:</b> ${fmtMoney(calc.economic.porUnidad)}</p>` : '';

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Informe FertiCalc</title>
<style>
  @page { margin: 2cm; }
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; color: #222; }
  h1 { color: #fff; background: #248A3D; padding: 12pt; margin: 0 0 16pt; font-size: 20pt; }
  h2 { color: #248A3D; border-bottom: 2px solid #248A3D; padding-bottom: 4pt; margin-top: 20pt; }
  .meta { color: #666; font-size: 10pt; margin-bottom: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  th { background: #248A3D; color: #fff; padding: 8pt; border: 1px solid #1c6e30; text-align: left; }
  tr:nth-child(even) td { background: #f0f7f1; }
  .total { font-weight: bold; background: #e8f5e9 !important; }
  .footer { margin-top: 30pt; font-size: 9pt; color: #999; border-top: 1px solid #ccc; padding-top: 8pt; }
</style></head>
<body>
<h1>FertiCalc · Agrologic</h1>
<p class="meta">Informe de Plan de Fertilización · ${date}<br>
Instituto Profesional Agrario Adolfo Matthei · Cátedra Suelos y Fertilizantes · Prof. Pedro Moll Medina</p>

<h2>1. Datos del Cultivo</h2>
<p><b>Cultivo:</b> ${this.escHtml(cropName)}<br>
<b>Superficie:</b> ${fmt(state.superficie, 1)} ha<br>
<b>Suelo:</b> ${soil ? this.escHtml(soil.name) : '—'}<br>
<b>Requerimiento NPK:</b> ${fmt(state.npk.n,0)} / ${fmt(state.npk.p,0)} / ${fmt(state.npk.k,0)} u/ha
${state.npk.cover ? `<br><b>Cobertera:</b> ${fmt(state.npk.cover,0)} u N` : ''}</p>

<h2>2. Resumen de Fertilización</h2>
<table>
<thead><tr><th>Insumo</th><th style="text-align:right">kg totales</th><th style="text-align:right">Sacos</th><th style="text-align:right">Costo</th></tr></thead>
<tbody>
${tableRows}
<tr class="total"><td>TOTAL</td><td style="text-align:right"></td><td style="text-align:right">${fmt(calc.total.sacos,0)}</td><td style="text-align:right">${fmtMoney(calc.total.costo)}</td></tr>
</tbody></table>
${ecoHtml}

<h2>3. Detalle del Cálculo Paso a Paso</h2>
${detailHtml.join('')}

<div class="footer">FertiCalc · Generado automáticamente · ${date}<br>
Aplicación de cálculo de fertilización agrícola · Eliceo Hernández</div>
</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = this.fileName(state, 'doc');
    a.click(); URL.revokeObjectURL(url);
    App.toast('📝 Word descargado');
  },

  /* ============================================================
   * EXCEL PROFESIONAL (con colores, bordes y formato)
   * ============================================================ */
  excel(state, calc) {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'FertiCalc · Plan de Fertilización',
      Author: 'FertiCalc Agrologic',
      Company: 'Instituto Adolfo Matthei',
    };
    const cropName = state.cropName || 'Cultivo';
    const date = new Date().toLocaleDateString('es-CL');
    const soil = SOILS.find((s) => s.id === state.soil);
    const items = this.buildItems(calc);

    // Hoja 1: Resumen
    const data = [];
    data.push([{ v: 'FertiCalc · Agrologic', s: this.sTitle() }]);
    data.push([{ v: 'Plan de Fertilización', s: this.sSub() }]);
    data.push([{ v: `Generado: ${date}`, s: this.sMuted() }]);
    data.push([]);
    data.push([{ v: 'CULTIVO', s: this.sHeader() }, { v: cropName, s: this.sCell() }]);
    data.push([{ v: 'SUPERFICIE', s: this.sHeader() }, { v: `${fmt(state.superficie,1)} ha`, s: this.sCell() }]);
    data.push([{ v: 'SUELO', s: this.sHeader() }, { v: soil ? soil.name : '—', s: this.sCell() }]);
    data.push([{ v: 'NPK REQUERIDO', s: this.sHeader() }, { v: `${fmt(state.npk.n,0)} / ${fmt(state.npk.p,0)} / ${fmt(state.npk.k,0)} u/ha`, s: this.sCell() }]);
    if (state.npk.cover) data.push([{ v: 'COBERTERA', s: this.sHeader() }, { v: `${fmt(state.npk.cover,0)} u N`, s: this.sCell() }]);
    data.push([]);

    // Tabla
    data.push([
      { v: 'INSUMO', s: this.sTableHeader() },
      { v: 'kg/ha', s: this.sTableHeader() },
      { v: 'kg TOTALES', s: this.sTableHeader() },
      { v: 'SACOS', s: this.sTableHeader() },
      { v: 'COSTO', s: this.sTableHeader() },
    ]);
    items.forEach((it, i) => {
      const s = i % 2 ? this.sAltCell() : this.sCell();
      const sm = i % 2 ? this.sAltMoney() : this.sMoney();
      data.push([
        { v: it.label, s },
        { v: fmt(it.kgNut || it.kgP || it.kgSFT || it.dosis || 0, 1), s: { ...s, alignment: { horizontal: 'right' } } },
        { v: fmt(it.kgTot || it.kg || 0, 1), s: { ...s, alignment: { horizontal: 'right' } } },
        { v: fmt(it.sacos, 0), s: { ...s, alignment: { horizontal: 'right' } } },
        { v: it.costo, s: sm },
      ]);
    });
    data.push([
      { v: 'TOTAL', s: this.sTotal() },
      { v: '', s: this.sTotal() },
      { v: '', s: this.sTotal() },
      { v: calc.total.sacos, s: { ...this.sTotal(), alignment: { horizontal: 'right' } } },
      { v: calc.total.costo, s: { ...this.sTotal(), alignment: { horizontal: 'right' } } },
    ]);
    data.push([]);
    if (calc.economic && calc.economic.porUnidad != null) {
      data.push([{ v: calc.economic.label.toUpperCase(), s: this.sHeader() }, { v: Math.round(calc.economic.porUnidad), s: this.sMoney() }]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data.map(row => row.map(cell => cell && cell.v !== undefined ? cell : '')));
    // Aplicar estilos (SheetJS community soporta .s con xlsx-style; acó usamos formato base)
    ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 16 }];
    ws['!rows'] = [{ hpt: 28 }, { hpt: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');

    // Hoja 2: Paso a paso
    const stepsData = [[{ v: 'DETALLE PASO A PASO', s: this.sTitle() }], []];
    const addSteps = (r) => {
      if (!r || !r.ok) return;
      stepsData.push([{ v: r.label, s: this.sSub() }]);
      r.steps.forEach((s) => {
        const real = s.real !== null && s.real !== undefined ? fmt(s.real, (String(s.real).includes('.') ? 1 : 0)) : '';
        const arr = s.rounded !== null && s.rounded !== undefined ? ` → ${fmt(s.rounded, 0)} ${s.unit || ''}` : ` ${s.unit || ''}`;
        stepsData.push([{ v: `${s.text} = ${real}${arr}`, s: this.sCell() }]);
      });
      stepsData.push([]);
    };
    addSteps(calc.ph); addSteps(calc.pSuelo);
    calc.npk.forEach(addSteps); calc.micros.forEach(addSteps);
    const ws2 = XLSX.utils.aoa_to_sheet(stepsData.map(row => row.map(cell => cell && cell.v !== undefined ? cell : '')));
    ws2['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle');

    XLSX.writeFile(wb, this.fileName(state, 'xlsx'));
    App.toast('📊 Excel descargado');
  },

  /* ---- Estilos para Excel ---- */
  sTitle()    { return { font: { bold: true, sz: 18, color: { rgb: '248A3D' } } }; },
  sSub()      { return { font: { bold: true, sz: 13, color: { rgb: '248A3D' } } }; },
  sMuted()    { return { font: { italic: true, sz: 10, color: { rgb: '888888' } } }; },
  sHeader()   { return { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '248A3D' } }, alignment: { horizontal: 'left' }, border: this.bdr() }; },
  sTableHeader() { return { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1C6E30' } }, alignment: { horizontal: 'center' }, border: this.bdr() }; },
  sCell()     { return { font: { sz: 10 }, border: this.bdr() }; },
  sAltCell()  { return { font: { sz: 10 }, fill: { fgColor: { rgb: 'F0F7F1' } }, border: this.bdr() }; },
  sMoney()    { return { font: { sz: 10 }, numFmt: '"$"#,##0', border: this.bdr(), alignment: { horizontal: 'right' } }; },
  sAltMoney() { return { font: { sz: 10 }, numFmt: '"$"#,##0', fill: { fgColor: { rgb: 'F0F7F1' } }, border: this.bdr(), alignment: { horizontal: 'right' } }; },
  sTotal()    { return { font: { bold: true, sz: 11 }, fill: { fgColor: { rgb: 'E8F5E9' } }, border: this.bdr() }; },
  bdr()       { return { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } }; },

  /* ============================================================
   * IMAGEN (captura del resumen)
   * ============================================================ */
  async image() {
    const node = document.getElementById('resultsContainer');
    if (!node) return;
    App.toast('Generando imagen…');
    const canvas = await html2canvas(node, {
      backgroundColor: getComputedStyle(document.body).backgroundColor, scale: 2,
    });
    const link = document.createElement('a');
    link.download = this.fileName(App.state, 'png');
    link.href = canvas.toDataURL('image/png');
    link.click();
    App.toast('🖼️ Imagen descargada');
  },

  /* ============================================================
   * ETIQUETAS DE SACOS (imprimibles)
   * ============================================================ */
  labels(state, calc) {
    const win = window.open('', '_blank');
    if (!win) { App.toast('Permitir pop-ups'); return; }
    const items = this.buildItems(calc).filter((it) => it.sacos > 0);
    const labelsHtml = items.flatMap((it) =>
      Array.from({ length: Math.min(it.sacos, 200) }, () =>
        `<div class="label-box"><div><strong>${it.label}</strong><br>${it.sacos} sacos · ${this.escHtml(state.cropName || '')}<br>FertiCalc · ${SACO_KG} kg</div></div>`
      )
    ).join('');

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Inter',sans-serif;margin:0;padding:1cm;background:#fff;}
.label-box{width:9cm;height:5.5cm;border:2px solid #248A3D;border-radius:10px;
display:grid;place-items:center;text-align:center;font-size:14px;margin:0.3cm auto;page-break-after:always;color:#1d1d1f;}
@media print{.label-box{page-break-after:always;}}
</style></head><body>${labelsHtml}
<script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
    App.toast('🏷️ Etiquetas abiertas');
  },

  /* ---- Helpers de escape ---- */
  esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; },
  escHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); },
};

window.Export = Export;
