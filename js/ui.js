/* ============================================================
 * FertiCalc · ui.js
 * Renderizado de selectores, toggles, cultivos rápidos,
 * micronutrientes. Lee/escribe el objeto State global.
 * ============================================================ */

const UI = {
  /* Llenar selects de cultivos y suelos al iniciar */
  initSelects() {
    // Cultivos rápidos
    const cropSel = document.getElementById('cropSelect');
    CROPS.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name;
      cropSel.appendChild(opt);
    });

    // Suelos
    const soilSel = document.getElementById('soilSelect');
    SOILS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = `${s.name} · ${s.zone}`;
      soilSel.appendChild(opt);
    });

    // Selectores de fertilizantes (por nutriente)
    // Mostrar TODOS los fertilizantes con sus % reales, ordenados por relevancia
    document.querySelectorAll('.fert-select').forEach((sel) => {
      const nutrient = sel.dataset.nutrient;
      sel.appendChild(new Option('— Personalizado —', ''));
      // Ordenar: primero los que tienen más del nutriente solicitado
      const sorted = [...FERTILIZERS].sort((a, b) => (b[nutrient] || 0) - (a[nutrient] || 0));
      sorted.forEach((f) => {
        const val = f[nutrient] || 0;
        // Etiqueta con el % principal y los nutrientes secundarios
        let label = `${f.name} (${val}%)`;
        sel.appendChild(new Option(label, f.id));
      });
    });
  },

  /* Al elegir un fertilizante, autocompletar el % */
  initFertAutoFill() {
    document.querySelectorAll('.fert-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const nutrient = sel.dataset.nutrient;
        const fert = FERTILIZERS.find((f) => f.id === sel.value);
        // El input de % hermano está en la misma card
        const card = sel.closest('.card');
        const pctInput = card.querySelector('.fert-pct');
        if (fert && pctInput) {
          pctInput.value = fert[nutrient];
          pctInput.dispatchEvent(new Event('input'));
        }
      });
    });
  },

  /* Toggles de pH / P suelo / campos poblacionales */
  initToggles() {
    // pH
    const usePH = document.getElementById('usePH');
    const phGroup = document.getElementById('phGroup');
    usePH.addEventListener('change', () => {
      phGroup.classList.toggle('open', usePH.checked);
    });
    // P suelo
    const useP = document.getElementById('usePSuelo');
    const pGroup = document.getElementById('pSueloGroup');
    useP.addEventListener('change', () => {
      pGroup.classList.toggle('open', useP.checked);
    });
    // Mostrar info de Ca del suelo seleccionado
    const soilSel = document.getElementById('soilSelect');
    const phCaInfo = document.getElementById('phCaInfo');
    const updateCaInfo = () => {
      const soil = SOILS.find((s) => s.id === soilSel.value);
      if (soil && phCaInfo) {
        phCaInfo.textContent = `Suelo ${soil.name}: Calcio ${soil.ca} · Tampón ${soil.buffer || '—'}`;
      }
    };
    soilSel.addEventListener('change', updateCaInfo);
    // Auto-rellenar tampón al elegir suelo
    const pBuffer = document.getElementById('pBuffer');
    soilSel.addEventListener('change', () => {
      const soil = SOILS.find((s) => s.id === soilSel.value);
      if (soil && soil.buffer && !pBuffer.value) {
        pBuffer.value = soil.buffer;
        pBuffer.dispatchEvent(new Event('input'));
      }
      updateCaInfo();
    });

    // Campos poblacionales (solo unidad/paquete)
    const yieldType = document.getElementById('yieldType');
    const popGroup = document.getElementById('poblacionalGroup');
    const updatePop = () => {
      const show = ['unidad', 'paquete'].includes(yieldType.value);
      popGroup.classList.toggle('open', show);
    };
    yieldType.addEventListener('change', updatePop);
    updatePop();
  },

  /* Cultivos rápidos: rellenar campos al elegir */
  initCropPresets() {
    document.getElementById('cropSelect').addEventListener('change', (e) => {
      const crop = CROPS.find((c) => c.id === e.target.value);
      if (!crop || crop.id === 'custom') return;
      const set = (id, val) => {
        const el = document.getElementById(id);
        el.value = val;
        el.dispatchEvent(new Event('input'));
      };
      set('cropName', crop.name);
      set('reqN', crop.npk.n);
      set('reqP', crop.npk.p);
      set('reqK', crop.npk.k);
      set('reqCover', crop.cover);
      set('yieldType', crop.yield.type);
      set('yieldValue', crop.yield.value);
      App.toast(`Cultivo "${crop.name}" cargado`);
    });
  },

  /* Micronutrientes dinámicos */
  microId: 0,
  initMicros() {
    const addBtn = document.getElementById('addMicro');
    addBtn.addEventListener('click', () => this.addMicroRow());
    // Agregar uno vacío inicial
    if (!document.querySelector('.micro-row')) this.addMicroRow();
  },
  addMicroRow(data = {}) {
    const container = document.getElementById('microsContainer');
    const row = document.createElement('div');
    row.className = 'micro-row';
    const idx = this.microId++;
    row.innerHTML = `
      <label class="field">
        <span class="field__label">Fertilizante</span>
        <select class="select micro-name" data-idx="${idx}">
          <option value="">— Personalizado —</option>
          ${FERTILIZERS.map((f) => `<option value="${f.name}" ${f.micro ? 'selected' : ''}>${f.name}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span class="field__label">Dosis kg/ha</span>
        <input type="number" class="input micro-dosis" data-idx="${idx}" placeholder="2" step="0.1" min="0" />
      </label>
      <label class="field">
        <span class="field__label">Precio ton $</span>
        <input type="number" class="input micro-precio" data-idx="${idx}" placeholder="1500000" step="1" />
      </label>
      <button class="micro-del" title="Eliminar">✕</button>
    `;
    // Prellenar si data
    if (data.name) row.querySelector('.micro-name').value = data.name;
    if (data.dosis) row.querySelector('.micro-dosis').value = data.dosis;
    if (data.precio) row.querySelector('.micro-precio').value = data.precio;
    row.querySelector('.micro-del').addEventListener('click', () => {
      row.remove();
      App.saveFromForm();
    });
    container.appendChild(row);
    // Escuchar cambios
    row.querySelectorAll('input,select').forEach((el) => {
      el.addEventListener('input', () => App.saveFromForm());
    });
  },
  getMicros() {
    const micros = [];
    document.querySelectorAll('.micro-row').forEach((row) => {
      micros.push({
        name: row.querySelector('.micro-name').value || 'Adicional',
        dosis: +row.querySelector('.micro-dosis').value || 0,
        precio: +row.querySelector('.micro-precio').value || 0,
      });
    });
    return micros;
  },
  clearMicros() {
    document.getElementById('microsContainer').innerHTML = '';
    this.microId = 0;
  },

  init() {
    this.initSelects();
    this.initFertAutoFill();
    this.initToggles();
    this.initCropPresets();
    this.initMicros();
  },
};

window.UI = UI;
