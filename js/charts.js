/* ============================================================
 * FertiCalc · charts.js
 * Gráficos con Chart.js: torta de costos y barras NPK.
 * ============================================================ */

const Charts = {
  pieChart: null,
  barChart: null,
  isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; },
  textColor() { return this.isDark() ? '#98989d' : '#6e6e73'; },
  gridColor() { return this.isDark() ? 'rgba(84,84,88,0.4)' : 'rgba(60,60,67,0.12)'; },

  /* Torta de distribución de costos por fertilizante */
  renderPie(container, items) {
    const labels = items.map((i) => i.label);
    const data = items.map((i) => i.costo);
    const colors = ['#34C759', '#0A84FF', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00', '#64D2FF'];
    if (this.pieChart) this.pieChart.destroy();
    this.pieChart = new Chart(container, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: this.isDark() ? '#1c1c1e' : '#fff',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: this.textColor(), font: { size: 12, family: 'Inter' }, padding: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${fmt(ctx.parsed, 0)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  },

  /* Barras: requerimiento vs aplicado (NPK) */
  renderBar(container, req, applied) {
    if (this.barChart) this.barChart.destroy();
    this.barChart = new Chart(container, {
      type: 'bar',
      data: {
        labels: ['Nitrógeno (N)', 'Fósforo (P₂O₅)', 'Potasio (K₂O)'],
        datasets: [
          {
            label: 'Requerido (u)',
            data: [req.n, req.p, req.k],
            backgroundColor: 'rgba(120,120,128,0.4)',
            borderRadius: 6,
          },
          {
            label: 'Aplicado (u/ha)',
            data: [applied.n, applied.p, applied.k],
            backgroundColor: '#34C759',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: this.textColor(), font: { family: 'Inter' } } } },
        scales: {
          x: { ticks: { color: this.textColor() }, grid: { display: false } },
          y: { ticks: { color: this.textColor() }, grid: { color: this.gridColor() }, beginAtZero: true },
        },
      },
    });
  },

  /* Recalcular colores al cambiar tema */
  refresh() {
    if (this.pieChart) {
      this.pieChart.data.datasets[0].borderColor = this.isDark() ? '#1c1c1e' : '#fff';
      this.pieChart.options.plugins.legend.labels.color = this.textColor();
      this.pieChart.update();
    }
    if (this.barChart) {
      this.barChart.options.plugins.legend.labels.color = this.textColor();
      this.barChart.options.scales.x.ticks.color = this.textColor();
      this.barChart.options.scales.y.ticks.color = this.textColor();
      this.barChart.options.scales.y.grid.color = this.gridColor();
      this.barChart.update();
    }
  },
};

window.Charts = Charts;
