/* ============================================================
 * FertiCalc · calc.js
 * Motor matemático. Replica los redondeos EXACTOS del
 * Prof. Pedro Moll Medina. Cada cálculo devuelve el resultado
 * final + un arreglo de pasos intermedios para mostrar en
 * formato "real → redondeado".
 * ============================================================ */

/* ---------- Utilidades de redondeo ---------- */

/** Redondeo estándar: ≥0.5 sube, <0.5 baja (a entero). */
function roundStd(v) {
  return Math.round(v);
}

/** Redondeo a n decimales. */
function roundDec(v, n) {
  const f = Math.pow(10, n);
  return Math.round((v + Number.EPSILON) * f) / f;
}

/** Redondeo al alza (ceil) — solo para cobertera, paso 1. */
function ceilRound(v) {
  return Math.ceil(v);
}

/** Formatea un número con separador de miles (es-CL). */
function fmt(n, dec = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);
}

/** Formatea moneda en pesos chilenos. */
function fmtMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '$' + fmt(Math.round(n), 0);
}

/* ============================================================
 * PROCESO NPK (5 pasos)
 * Aplica a N base, cobertera, P y K.
 * isCover = true  => paso 1 con ceil (redondeo al alza)
 * ============================================================ */
function calcNPK({ label, units, fertPct, efficiency, sup, precioTon, isCover = false, nutrient = 'N' }) {
  const steps = [];
  if (!units || !fertPct || !efficiency || !sup) {
    return { ok: false, steps, results: {} };
  }

  // Paso 1 – Ajuste por eficiencia
  const real1 = (units * 100) / efficiency;
  const kgNut = isCover ? ceilRound(real1) : roundStd(roundDec(real1, 1));
  steps.push({
    text: `${fmt(units, 0)} u ${nutrient} × 100 ÷ ${efficiency} = ${fmt(roundDec(real1, 1), 1)}`,
    real: roundDec(real1, 1),
    rounded: kgNut,
    unit: `kg ${nutrient}/ha`,
    note: isCover ? '(ceil · cobertera)' : '',
  });

  // Paso 2 – Convertir a fertilizante comercial
  const real2 = (kgNut * 100) / fertPct;
  const kgFert = roundStd(roundDec(real2, 1));
  steps.push({
    text: `${kgNut} × 100 ÷ ${fertPct} = ${fmt(roundDec(real2, 1), 1)}`,
    real: roundDec(real2, 1),
    rounded: kgFert,
    unit: `kg fert./ha`,
  });

  // Paso 3 – Ajuste por superficie
  const kgTot = kgFert * sup;
  steps.push({
    text: `${kgFert} × ${fmt(sup, 0)} ha = ${fmt(kgTot, 0)}`,
    real: kgTot,
    rounded: kgTot,
    unit: 'kg totales',
  });

  // Paso 4 – Sacos
  const realSacos = kgTot / SACO_KG;
  const sacos = roundStd(realSacos);
  steps.push({
    text: `${fmt(kgTot, 0)} ÷ ${SACO_KG} = ${fmt(roundDec(realSacos, 2), 2)}`,
    real: roundDec(realSacos, 2),
    rounded: sacos,
    unit: 'sacos',
  });

  // Paso 5 – Costo (atajo del 40)
  const precioSaco = precioTon / SACOS_POR_TON;
  const costoReal = sacos * precioSaco;
  const costo = roundStd(costoReal);
  steps.push({
    text: `Valor saco = ${fmt(precioTon, 0)} ÷ ${SACOS_POR_TON} = ${fmt(precioSaco, 2)}`,
    real: precioSaco,
    rounded: null,
    unit: '$/saco',
  });
  steps.push({
    text: `${sacos} × ${fmt(precioSaco, 2)} = ${fmt(costoReal, 1)}`,
    real: costoReal,
    rounded: costo,
    unit: 'costo total',
  });

  return {
    ok: true,
    label,
    nutrient,
    steps,
    results: { kgNut, kgFert, kgTot, sacos, precioSaco, costo },
  };
}

/* ============================================================
 * Corrección de pH (Carbonato de calcio)
 * ton CaCO₃/ha = (pH deseado − pH inicial) ÷ Calcio del suelo (%)
 * ============================================================ */
function calcPH({ phIni, phDes, ca, sup, precioTon }) {
  const steps = [];
  if (phIni == null || phDes == null || !ca || !sup) {
    return { ok: false, steps, results: {} };
  }

  const diff = phDes - phIni;
  const realHa = diff / ca;
  const tonHa = roundDec(realHa, 2);
  steps.push({
    text: `${fmt(phDes, 2)} − ${fmt(phIni, 2)} = ${fmt(diff, 2)}`,
    real: diff,
    rounded: diff,
    unit: 'ΔpH',
  });
  steps.push({
    text: `${fmt(diff, 2)} ÷ ${ca} (Ca) = ${fmt(realHa, 4)}`,
    real: realHa,
    rounded: tonHa,
    unit: 'ton CaCO₃/ha',
  });

  const tonTot = roundDec(tonHa * sup, 1);
  steps.push({
    text: `${fmt(tonHa, 2)} × ${fmt(sup, 0)} ha = ${fmt(tonHa * sup, 4)}`,
    real: tonHa * sup,
    rounded: tonTot,
    unit: 'ton totales',
  });

  const kg = tonTot * 1000;
  steps.push({
    text: `${fmt(tonTot, 1)} × 1000 = ${fmt(kg, 0)}`,
    real: kg,
    rounded: kg,
    unit: 'kg',
  });

  const realSacos = kg / SACO_KG;
  const sacos = roundStd(realSacos);
  steps.push({
    text: `${fmt(kg, 0)} ÷ ${SACO_KG} = ${fmt(roundDec(realSacos, 2), 2)}`,
    real: roundDec(realSacos, 2),
    rounded: sacos,
    unit: 'sacos',
  });

  const precioSaco = precioTon / SACOS_POR_TON;
  const costoReal = sacos * precioSaco;
  const costo = roundStd(costoReal);
  steps.push({
    text: `Valor saco = ${fmt(precioTon, 0)} ÷ ${SACOS_POR_TON} = ${fmt(precioSaco, 0)}`,
    real: precioSaco,
    rounded: null,
    unit: '$/saco',
  });
  steps.push({
    text: `${sacos} × ${fmt(precioSaco, 0)} = ${fmt(costoReal, 0)}`,
    real: costoReal,
    rounded: costo,
    unit: 'costo total',
  });

  return {
    ok: true,
    label: 'Corrección de pH (CaCO₃)',
    steps,
    results: { tonHa, tonTot, kg, sacos, precioSaco, costo },
  };
}

/* ============================================================
 * Corrección de Fósforo del suelo (ppm)
 * kg P₂O₅/ha = (ppm des − ppm ini) × 2.29 × poder tampón
 * Conversión a SFT (46%): kg SFT/ha = kg P₂O₅/ha × 100 ÷ 46
 * ============================================================ */
function calcPSuelo({ ppmIni, ppmDes, buffer, sup, precioTon }) {
  const steps = [];
  if (ppmIni == null || ppmDes == null || !buffer || !sup) {
    return { ok: false, steps, results: {} };
  }

  const diff = ppmDes - ppmIni;
  steps.push({
    text: `${fmt(ppmDes, 1)} − ${fmt(ppmIni, 1)} = ${fmt(diff, 1)}`,
    real: diff,
    rounded: diff,
    unit: 'ppm',
  });

  const realP = diff * 2.29 * buffer;
  const kgP = roundDec(realP, 1);
  steps.push({
    text: `${fmt(diff, 1)} × 2.29 × ${buffer} (tampón) = ${fmt(realP, 4)}`,
    real: realP,
    rounded: kgP,
    unit: 'kg P₂O₅/ha',
  });

  const realSFT = (kgP * 100) / 46;
  const kgSFT = roundDec(realSFT, 1);
  steps.push({
    text: `${fmt(kgP, 1)} × 100 ÷ 46 = ${fmt(realSFT, 4)}`,
    real: realSFT,
    rounded: kgSFT,
    unit: 'kg SFT/ha',
  });

  const kgTot = roundDec(kgSFT * sup, 1);
  steps.push({
    text: `${fmt(kgSFT, 1)} × ${fmt(sup, 0)} ha = ${fmt(kgSFT * sup, 4)}`,
    real: kgSFT * sup,
    rounded: kgTot,
    unit: 'kg totales',
  });

  const realSacos = kgTot / SACO_KG;
  const sacos = roundStd(realSacos);
  steps.push({
    text: `${fmt(kgTot, 1)} ÷ ${SACO_KG} = ${fmt(roundDec(realSacos, 2), 2)}`,
    real: roundDec(realSacos, 2),
    rounded: sacos,
    unit: 'sacos',
  });

  const precioSaco = precioTon / SACOS_POR_TON;
  const costoReal = sacos * precioSaco;
  const costo = roundStd(costoReal);
  steps.push({
    text: `Valor saco = ${fmt(precioTon, 0)} ÷ ${SACOS_POR_TON} = ${fmt(precioSaco, 0)}`,
    real: precioSaco,
    rounded: null,
    unit: '$/saco',
  });
  steps.push({
    text: `${sacos} × ${fmt(precioSaco, 0)} = ${fmt(costoReal, 0)}`,
    real: costoReal,
    rounded: costo,
    unit: 'costo total',
  });

  return {
    ok: true,
    label: 'Corrección de Fósforo del suelo',
    steps,
    results: { kgP, kgSFT, kgTot, sacos, precioSaco, costo },
  };
}

/* ============================================================
 * Micronutrientes / fertilizantes adicionales
 * Dosis DIRECTA (sin eficiencia): kg totales = dosis × sup
 * ============================================================ */
function calcMicro({ label, dosis, sup, precioTon }) {
  const steps = [];
  if (!dosis || !sup) return { ok: false, steps, results: {} };

  const kgTot = dosis * sup;
  steps.push({
    text: `${fmt(dosis, 1)} kg/ha × ${fmt(sup, 0)} ha = ${fmt(kgTot, 1)}`,
    real: kgTot,
    rounded: kgTot,
    unit: 'kg totales',
  });

  const realSacos = kgTot / SACO_KG;
  const sacos = roundStd(realSacos);
  steps.push({
    text: `${fmt(kgTot, 1)} ÷ ${SACO_KG} = ${fmt(roundDec(realSacos, 2), 2)}`,
    real: roundDec(realSacos, 2),
    rounded: sacos,
    unit: 'sacos',
  });

  const precioSaco = precioTon / SACOS_POR_TON;
  const costoReal = sacos * precioSaco;
  const costo = roundStd(costoReal);
  steps.push({
    text: `Valor saco = ${fmt(precioTon, 0)} ÷ ${SACOS_POR_TON} = ${fmt(precioSaco, 2)}`,
    real: precioSaco,
    rounded: null,
    unit: '$/saco',
  });
  steps.push({
    text: `${sacos} × ${fmt(precioSaco, 2)} = ${fmt(costoReal, 1)}`,
    real: costoReal,
    rounded: costo,
    unit: 'costo total',
  });

  return {
    ok: true,
    label: label || 'Micronutriente',
    steps,
    results: { kgTot, sacos, precioSaco, costo },
  };
}

/* ============================================================
 * Análisis económico por unidad de cosecha
 * ============================================================ */
function calcEconomic({ costoTotal, unitsPlanted, perdida, yieldType, yieldValue, sup }) {
  const out = { costoTotal, porUnidad: null, unidadesVendidas: null, label: '' };

  // Unidades (plantas): aplica pérdida poblacional
  if (yieldType === 'unidad' || yieldType === 'paquete') {
    if (unitsPlanted) {
      out.unidadesVendidas = unitsPlanted * (1 - (perdida || 0) / 100);
      out.porUnidad = out.unidadesVendidas ? costoTotal / out.unidadesVendidas : null;
      out.label = `Costo por ${YIELD_TYPES[yieldType].unit}`;
    }
  } else if (yieldType === 'qq') {
    const qq = (yieldValue || 0) * sup;
    out.unidadesVendidas = qq;
    out.porUnidad = qq ? costoTotal / qq : null;
    out.label = 'Costo por quintal (qq)';
  } else if (yieldType === 'ton') {
    const ton = ((yieldValue || 0) * sup * 1000) / 1000; // kg cosechados / 1000
    out.unidadesVendidas = (yieldValue || 0) * sup;
    out.porUnidad = out.unidadesVendidas ? costoTotal / out.unidadesVendidas : null;
    out.label = 'Costo por tonelada';
  } else if (yieldType === 'ms') {
    const kgMs = (yieldValue || 0) * sup;
    out.unidadesVendidas = kgMs;
    out.porUnidad = kgMs ? costoTotal / kgMs : null;
    out.label = 'Costo por kg Materia Seca';
  }
  return out;
}

/* ============================================================
 * Orquestador: recibe el estado completo y devuelve TODO
 * ============================================================ */
function calcPlan(state) {
  const sup = +state.superficie || 0;
  const npk = state.npk || {};
  const out = { ph: null, pSuelo: null, npk: [], micros: [], total: { sacos: 0, costo: 0 }, economic: null };

  // pH
  if (state.usePH && state.phIni != null && state.phDes != null && state.soil) {
    const soil = SOILS.find((s) => s.id === state.soil);
    if (soil) {
      out.ph = calcPH({
        phIni: +state.phIni,
        phDes: +state.phDes,
        ca: soil.ca,
        sup,
        precioTon: +state.phPrecio || 0,
      });
      if (out.ph.ok) {
        out.total.sacos += out.ph.results.sacos;
        out.total.costo += out.ph.results.costo;
      }
    }
  }

  // P suelo
  if (state.usePSuelo && state.ppmIni != null && state.ppmDes != null) {
    const soil = SOILS.find((s) => s.id === state.soil);
    const buffer = state.pBuffer ? +state.pBuffer : soil ? soil.buffer : null;
    if (buffer) {
      out.pSuelo = calcPSuelo({
        ppmIni: +state.ppmIni,
        ppmDes: +state.ppmDes,
        buffer,
        sup,
        precioTon: +state.pSueloPrecio || 0,
      });
      if (out.pSuelo.ok) {
        out.total.sacos += out.pSuelo.results.sacos;
        out.total.costo += out.pSuelo.results.costo;
      }
    }
  }

  // N base
  if (npk.n) {
    const fert = FERTILIZERS.find((f) => f.id === state.nFert);
    const r = calcNPK({
      label: 'Nitrógeno base',
      nutrient: 'N',
      units: +npk.n,
      fertPct: fert ? fert.n : +state.nPct,
      efficiency: EFFICIENCY.n,
      sup,
      precioTon: +state.nPrecio || 0,
    });
    if (r.ok) {
      out.npk.push(r);
      out.total.sacos += r.results.sacos;
      out.total.costo += r.results.costo;
    }
  }

  // Cobertera (N adicional, NO se resta del N base)
  if (npk.cover) {
    const fert = FERTILIZERS.find((f) => f.id === state.coverFert);
    const r = calcNPK({
      label: 'Cobertera (N adicional)',
      nutrient: 'N',
      units: +npk.cover,
      fertPct: fert ? fert.n : +state.coverPct,
      efficiency: EFFICIENCY.n,
      sup,
      precioTon: +state.coverPrecio || 0,
      isCover: true,
    });
    if (r.ok) {
      out.npk.push(r);
      out.total.sacos += r.results.sacos;
      out.total.costo += r.results.costo;
    }
  }

  // P
  if (npk.p) {
    const fert = FERTILIZERS.find((f) => f.id === state.pFert);
    const r = calcNPK({
      label: 'Fósforo (P₂O₅)',
      nutrient: 'P',
      units: +npk.p,
      fertPct: fert ? fert.p : +state.pPct,
      efficiency: EFFICIENCY.p,
      sup,
      precioTon: +state.pPrecio || 0,
    });
    if (r.ok) {
      out.npk.push(r);
      out.total.sacos += r.results.sacos;
      out.total.costo += r.results.costo;
    }
  }

  // K
  if (npk.k) {
    const fert = FERTILIZERS.find((f) => f.id === state.kFert);
    const r = calcNPK({
      label: 'Potasio (K₂O)',
      nutrient: 'K',
      units: +npk.k,
      fertPct: fert ? fert.k : +state.kPct,
      efficiency: EFFICIENCY.k,
      sup,
      precioTon: +state.kPrecio || 0,
    });
    if (r.ok) {
      out.npk.push(r);
      out.total.sacos += r.results.sacos;
      out.total.costo += r.results.costo;
    }
  }

  // Micronutrientes / adicionales
  (state.micros || []).forEach((m) => {
    if (m.dosis && m.precio) {
      const r = calcMicro({
        label: m.name || 'Adicional',
        dosis: +m.dosis,
        sup,
        precioTon: +m.precio,
      });
      if (r.ok) {
        out.micros.push(r);
        out.total.sacos += r.results.sacos;
        out.total.costo += r.results.costo;
      }
    }
  });

  out.total.sacos = roundStd(out.total.sacos);
  out.total.costo = roundStd(out.total.costo);

  // Análisis económico
  out.economic = calcEconomic({
    costoTotal: out.total.costo,
    unitsPlanted: +state.unitsPlanted || 0,
    perdida: +state.perdida || 0,
    yieldType: state.yieldType || 'qq',
    yieldValue: +state.yieldValue || 0,
    sup,
  });

  return out;
}

// Exponer
window.roundStd = roundStd;
window.roundDec = roundDec;
window.ceilRound = ceilRound;
window.fmt = fmt;
window.fmtMoney = fmtMoney;
window.calcPH = calcPH;
window.calcPSuelo = calcPSuelo;
window.calcNPK = calcNPK;
window.calcMicro = calcMicro;
window.calcEconomic = calcEconomic;
window.calcPlan = calcPlan;
