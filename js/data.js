/* ============================================================
 * FertiCalc · data.js
 * Tablas oficiales: fertilizantes, suelos y cultivos preset.
 * Fuente: Prof. Pedro Moll Medina · Cátedra Suelos y Fertilizantes
 * Instituto Profesional Agrario Adolfo Matthei
 * ============================================================ */

/**
 * Tabla oficial de fertilizantes.
 * n, p, k, cao  => porcentaje del nutriente en el fertilizante comercial.
 * reaction      => efecto sobre el pH del suelo ("0" neutro, "★★" básico, etc.)
 */
const FERTILIZERS = [
  { id: 'nitromag',       name: 'Nitromag',         n: 27,  p: 0,  k: 0,    cao: 26, reaction: '—'  },
  { id: 'urea',           name: 'Urea',             n: 46,  p: 0,  k: 0,    cao: 0,  reaction: '★★' },
  { id: 'sft',            name: 'SFT (Super Fosfato Triple)', n: 0, p: 46, k: 0, cao: 20, reaction: '0' },
  { id: 'mop',            name: 'Muriato de K (MOP)', n: 0, p: 0,  k: 60,   cao: 0,  reaction: '0'  },
  { id: 'super_nitro',    name: 'Super Nitro',      n: 25,  p: 0,  k: 0,    cao: 18, reaction: '0..' },
  { id: 'salitre_sodico', name: 'Salitre Sódico',   n: 16,  p: 0,  k: 0,    cao: 26, reaction: '★★' },
  { id: 'salitre_potasico', name: 'Salitre Potásico', n: 15, p: 0, k: 0.5, cao: 18, reaction: '★★' },
  { id: 'sulfato_amonio', name: 'Sulfato de Amonio', n: 21, p: 0, k: 0,   cao: 0,  reaction: '★'  },
  { id: 'dap',            name: 'DAP (Fosfato Diamónico)', n: 18, p: 46, k: 0, cao: 0, reaction: '★' },
  { id: 'sulfato_potasio', name: 'Sulfato de Potasio', n: 0, p: 0, k: 50, cao: 18, reaction: '0' },
  { id: 'borax',          name: 'Borax (Micronutr.)', n: 0, p: 0, k: 0,   cao: 0,  reaction: '0',  micro: true },
  { id: 'sulfato_zinc',   name: 'Sulfato de Zinc (Micronutr.)', n: 0, p: 0, k: 0, cao: 0, reaction: '0', micro: true },
];

/**
 * Tabla de suelos de referencia.
 * ca       => porcentaje de calcio del suelo (para corrección de pH).
 * buffer   => poder tampón (para corrección de fósforo). null si no aplica.
 */
const SOILS = [
  { id: 'arcilloso',   name: 'Arcilloso',  ca: 0.15,  buffer: 19, zone: 'La Unión' },
  { id: 'trumao',      name: 'Trumao',     ca: 0.11,  buffer: 25, zone: 'Osorno' },
  { id: 'transicion',  name: 'Transición', ca: 0.12,  buffer: null, zone: 'Zona intermedia' },
  { id: 'nadi',        name: 'Ñadi',       ca: 0.096, buffer: 27, zone: 'Zonas con napa freática' },
];

/**
 * Eficiencia de absorción estándar por nutriente.
 */
const EFFICIENCY = { n: 65, p: 60, k: 90 };

/**
 * Cultivos preset (acceso rápido). Valores típicos de requerimiento en u/ha.
 * npk: { n, p, k } en unidades (1 u = 1 kg nutriente puro / ha)
 * cover: unidades de N de cobertera (0 si no aplica)
 */
const CROPS = [
  { id: 'trigo',    name: 'Trigo',    npk: { n: 102, p: 135, k: 117 }, cover: 0,  yield: { type: 'qq',  value: 60 } },
  { id: 'avena',    name: 'Avena',    npk: { n: 80,  p: 90,  k: 90  }, cover: 0,  yield: { type: 'qq',  value: 55 } },
  { id: 'nabo',     name: 'Nabo',     npk: { n: 100, p: 100, k: 120 }, cover: 90, yield: { type: 'qq',  value: 700 } },
  { id: 'lupino',   name: 'Lupino',   npk: { n: 0,   p: 80,  k: 80  }, cover: 0,  yield: { type: 'qq',  value: 40 } },
  { id: 'pradera',  name: 'Pradera',  npk: { n: 120, p: 90,  k: 90  }, cover: 0,  yield: { type: 'ms',  value: 9000 } },
  { id: 'silo_maiz', name: 'Silo Maíz', npk: { n: 150, p: 100, k: 150 }, cover: 0, yield: { type: 'ton', value: 50 } },
  { id: 'papa',     name: 'Papa',     npk: { n: 130, p: 150, k: 160 }, cover: 0,  yield: { type: 'qq',  value: 500 } },
  { id: 'custom',   name: 'Personalizado', npk: { n: 0, p: 0, k: 0 }, cover: 0, yield: { type: 'qq', value: 0 } },
];

/** Unidades de cosecha soportadas en el análisis económico. */
const YIELD_TYPES = {
  qq:  { label: 'Quintales (qq)',       unit: 'qq' },
  ton: { label: 'Toneladas (ton)',       unit: 'ton' },
  ms:  { label: 'Kg de Materia Seca',    unit: 'kg MS' },
  unidad: { label: 'Unidades (plantas)', unit: 'unidad' },
  paquete: { label: 'Paquetes',          unit: 'paquete' },
};

/** Peso estándar del saco (kg). */
const SACO_KG = 25;

/** Atajo del 40: 1 tonelada = 1000 kg = 40 sacos de 25 kg. */
const SACOS_POR_TON = 40;

// Exponer en ventana para uso en otros módulos (sin bundler).
window.FERTILIZERS = FERTILIZERS;
window.SOILS = SOILS;
window.EFFICIENCY = EFFICIENCY;
window.CROPS = CROPS;
window.YIELD_TYPES = YIELD_TYPES;
window.SACO_KG = SACO_KG;
window.SACOS_POR_TON = SACOS_POR_TON;
