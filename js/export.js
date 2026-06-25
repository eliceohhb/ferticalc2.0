/* ============================================================
 * FertiCalc · export.js
 * Exportación: PDF (jsPDF+autotable), Excel (SheetJS),
 * Imagen (html2canvas) y etiquetas imprimibles de sacos.
 * ============================================================ */

const Export = {

  /* ---------- PDF ---------- */
  pdf(state, calc) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const cropName = state.cropName || 'Cultivo';
    const date = new Date().toLocaleDateString('es-CL');

    // Encabezado
    doc.setFillColor(36, 138, 61);
    doc.rect(0, 0, W, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text('FertiCalc · Agrologic', 40, 35);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text('Plan de Fertilización', 40, 54);
    doc.setFontSize(10);
    doc.text(date, W - 40, 35, { align: 'right' });

    // Datos generales
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(`Cultivo: ${cropName}`, 40, 100);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(`Superficie: ${fmt(state.superficie,1)} ha`, 40, 118);
    const soil = SOILS.find((s) => s.id === state.soil);
    if (soil) doc.text(`Suelo: ${soil.name}`, 250, 118);

    // Tabla resumen
    const body = [];
    const addRow = (label, r) => {
      if (r && r.ok) body.push([label, fmt(r.results.kgTot || r.results.kg || 0, 1), fmt(r.results.sacos, 0), fmtMoney(r.results.costo)]);
    };
    addRow('pH (CaCO₃)', calc.ph);
    addRow('P suelo (SFT)', calc.pSuelo);
    calc.npk.forEach((r) => addRow(r.label, r));
    calc.micros.forEach((r) => addRow(r.label, r));

    doc.autoTable({
      startY: 135,
      head: [['Insumo', 'kg totales', 'Sacos', 'Costo']],
      body,
      foot: [['TOTAL', '', fmt(calc.total.sacos, 0), fmtMoney(calc.total.costo)]],
      theme: 'grid',
      headStyles: { fillColor: [36, 138, 61], fontSize: 10 },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 40, right: 40 },
    });

    // Análisis económico
    let y = doc.lastAutoTable.finalY + 24;
    if (calc.economic && calc.economic.porUnidad != null) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('Análisis económico', 40, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(`${calc.economic.label}: ${fmtMoney(calc.economic.porUnidad)}`, 40, y + 18);
      y += 44;
    }

    // Pie
    doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text('FertiCalc · Instituto Profesional Agrario Adolfo Matthei', 40, doc.internal.pageSize.getHeight() - 30);
    doc.text('Metodología Prof. Pedro Moll Medina', 40, doc.internal.pageSize.getHeight() - 18);

    doc.save(`FertiCalc_${cropName.replace(/\s+/g, '_')}.pdf`);
    App.toast('PDF generado');
  },

  /* ---------- Excel ---------- */
  excel(state, calc) {
    const wb = XLSX.utils.book_new();
    const data = [['FertiCalc · Agrologic']];
    data.push(['Plan de Fertilización']);
    data.push(['Fecha', new Date().toLocaleString('es-CL')]);
    data.push([]);
    data.push(['Cultivo', state.cropName || '—']);
    data.push(['Superficie (ha)', state.superficie]);
    const soil = SOILS.find((s) => s.id === state.soil);
    data.push(['Suelo', soil ? soil.name : '—']);
    data.push([]);

    data.push(['Insumo', 'kg totales', 'Sacos', 'Costo']);
    const addRow = (label, r) => {
      if (r && r.ok) data.push([label, Math.round(r.results.kgTot || r.results.kg || 0), r.results.sacos, Math.round(r.results.costo)]);
    };
    addRow('pH (CaCO₃)', calc.ph);
    addRow('P suelo (SFT)', calc.pSuelo);
    calc.npk.forEach((r) => addRow(r.label, r));
    calc.micros.forEach((r) => addRow(r.label, r));
    data.push(['TOTAL', '', calc.total.sacos, calc.total.costo]);
    data.push([]);
    if (calc.economic && calc.economic.porUnidad != null) {
      data.push([calc.economic.label, Math.round(calc.economic.porUnidad)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    const cropName = (state.cropName || 'cultivo').replace(/\s+/g, '_');
    XLSX.writeFile(wb, `FertiCalc_${cropName}.xlsx`);
    App.toast('Excel generado');
  },

  /* ---------- Imagen ---------- */
  async image() {
    const node = document.getElementById('resultsContainer');
    if (!node) return;
    App.toast('Generando imagen…');
    const canvas = await html2canvas(node, { backgroundColor: getComputedStyle(document.body).backgroundColor, scale: 2 });
    const link = document.createElement('a');
    link.download = 'FertiCalc_resultados.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    App.toast('Imagen descargada');
  },

  /* ---------- Etiquetas de sacos (imprimibles) ---------- */
  labels(state, calc) {
    const win = window.open('', '_blank');
    if (!win) { App.toast('Permitir pop-ups'); return; }
    const items = [];
    const add = (label, r) => { if (r && r.ok && r.results.sacos > 0) items.push({ name: label, sacos: r.results.sacos }); };
    add('CaCO₃ (pH)', calc.ph);
    add('SFT (P suelo)', calc.pSuelo);
    calc.npk.forEach((r) => add(r.label, r));
    calc.micros.forEach((r) => add(r.label, r));

    const labelsHtml = items.map((it) =>
      Array.from({ length: Math.min(it.sacos, 200) }, () =>
        `<div class="label-box"><div><strong>${it.name}</strong><br>${it.sacos} sacos · ${state.cropName || ''}<br>FertiCalc · ${SACO_KG} kg</div></div>`
      ).join('')
    ).join('');

    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body{font-family:'Inter',sans-serif;margin:0;padding:1cm;background:#fff;}
        .label-box{width:9cm;height:5.5cm;border:2px solid #248A3D;border-radius:10px;
          display:grid;place-items:center;text-align:center;font-size:14px;margin:0.3cm auto;page-break-after:always;color:#1d1d1f;}
        @media print{.label-box{page-break-after:always;}}
      </style></head><body>${labelsHtml}
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`);
    win.document.close();
    App.toast('Etiquetas abiertas');
  },
};

window.Export = Export;
