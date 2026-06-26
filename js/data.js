/* ============================================================
 * FertiCalc · data.js
 * Tablas oficiales: fertilizantes, suelos y cultivos preset.
 * Fuente: Prof. Pedro Moll Medina · Cátedra Suelos y Fertilizantes
 * Instituto Profesional Agrario Adolfo Matthei
 * ============================================================ */

/**
 * Tabla oficial completa de fertilizantes.
 * Valores exactos según la tabla del Prof. Pedro Moll Medina.
 * n, p, k     => N, P₂O₅, K₂O (%)
 * mgo, s, cao, na => MgO, S, CaO, Na (%)
 * reaction    => efecto sobre el pH (· neutro, * básico, ··/★★ fuertemente básico, — neutro)
 */
const FERTILIZERS = [
  // ---- Nitrogenados ----
  { id: 'urea',            name: 'Urea',                    n: 46,    p: 0,  k: 0,     mgo: 0,   s: 0,  cao: 0,    na: 0,  reaction: '············' },
  { id: 'salitre_sodico',  name: 'Salitre Sódico',           n: 16,    p: 0,  k: 0,     mgo: 0,   s: 0,  cao: 0,    na: 26, reaction: '**' },
  { id: 'salitre_potasico', name: 'Salitre Potásico',         n: 15,    p: 0,  k: 14,    mgo: 0,   s: 0,  cao: 0,    na: 18, reaction: '**' },
  { id: 'super_nitro',     name: 'Super Nitro',              n: 15,    p: 0,  k: 0.5,   mgo: 5.5, s: 0,  cao: 0,    na: 24, reaction: '0..' },
  { id: 'super_mag',       name: 'Super Mag',                n: 25,    p: 0,  k: 0.4,   mgo: 4,   s: 0,  cao: 0,    na: 18, reaction: '0*' },
  { id: 'nitrocal',        name: 'Nitrocal',                 n: 25,    p: 0,  k: 0.4,   mgo: 0,   s: 0,  cao: 26,   na: 17, reaction: '*' },
  { id: 'nitromag',        name: 'Nitromag',                 n: 15.5,  p: 0,  k: 0,     mgo: 0,   s: 0,  cao: 0,    na: 0,  reaction: '--' },
  { id: 'nitro_plus',      name: 'Nitro Plus',              n: 27,    p: 0,  k: 0,     mgo: 5,   s: 0,  cao: 7,    na: 0,  reaction: '0*' },
  { id: 'nitropotas',       name: 'Nitropotas',              n: 22,    p: 0,  k: 0,     mgo: 7.5, s: 0,  cao: 11,   na: 0,  reaction: '.' },
  { id: 'nitrato_pot',      name: 'Nitrato Pot',             n: 13,    p: 0,  k: 43,    mgo: 0,   s: 0,  cao: 0,    na: 0,  reaction: '**' },

  // ---- Fosforados ----
  { id: 'sft',             name: 'Super F. Triple (SFT)',     n: 0,     p: 46, k: 0,     mgo: 0,   s: 1,  cao: 20,   na: 0,  reaction: '0' },
  { id: 'super_fos',       name: 'Super Fos',                n: 0,     p: 40, k: 0,     mgo: 0,   s: 2,  cao: 35.4, na: 1,  reaction: '0' },
  { id: 'dap',             name: 'Fosfato Diamónico (DAP)',   n: 18,    p: 46, k: 0,     mgo: 0,   s: 0,  cao: 0,    na: 0,  reaction: '----' },
  { id: 'roca_fosforica',  name: 'Roca Fosfórica',          n: 0,     p: 30.5, k: 0,    mgo: 0.6, s: 1.2, cao: 48.7, na: 1, reaction: '0*' },
  { id: 'guano_rojo',      name: 'Guano Rojo',               n: 5,     p: 22, k: 12,    mgo: 1,   s: 0,  cao: 11,   na: 0,  reaction: '0..' },

  // ---- Potásicos ----
  { id: 'mop',             name: 'Muriato de Potasio (MOP)',  n: 0,     p: 0,  k: 60,    mgo: 0,   s: 0,  cao: 0,    na: 0,  reaction: '0' },
  { id: 'sulfato_potasio', name: 'Sulfato de Potasio',       n: 0,     p: 0,  k: 50,    mgo: 18,  s: 22, cao: 0,    na: 0,  reaction: '0' },
  { id: 'sulpomag',        name: 'Sulpomag',                 n: 0,     p: 0,  k: 22,    mgo: 18,  s: 22, cao: 0,    na: 0,  reaction: '0' },

  // ---- Mezclas ----
  { id: 'mezcla_212',      name: 'Mezcla 212',              n: 7,     p: 26, k: 6,     mgo: 7,   s: 3,  cao: 4,    na: 9,  reaction: '0*' },
  { id: 'mezcla_215',      name: 'Mezcla 215',              n: 6,     p: 21, k: 6,     mgo: 7,   s: 3,  cao: 4,    na: 9,  reaction: '0*' },

  // ---- Correctivos (pH / suelo) ----
  { id: 'magneal',         name: 'Magnecal',                 n: 0,     p: 0,  k: 0,     mgo: 17,  s: 0,  cao: 32,   na: 0,  reaction: '******' },
  { id: 'cal_soprocal',    name: 'Cal Soprocal',             n: 0,     p: 0,  k: 0,     mgo: 0.6, s: 0,  cao: 48,   na: 0,  reaction: '****' },
  { id: 'fango_cal',       name: 'Fango Cal IANSA',         n: 0,     p: 1,  k: 0,     mgo: 1,   s: 0,  cao: 27,   na: 0,  reaction: '***' },
  { id: 'fertiyeso',       name: 'Fertiyeso',                n: 0,     p: 0,  k: 0,     mgo: 0,   s: 18, cao: 32,   na: 0,  reaction: '0' },
];

/**
 * Tabla de suelos de referencia.
 * ca       => porcentaje de calcio del suelo (para corrección de pH).
 * buffer   => poder tampón (para corrección de fósforo). null si no aplica.
 */
const SOILS = [
  { id: 'arcilloso',  name: 'Arcillosos',  ca: 0.15,  buffer: 19, zone: 'La Unión' },
  { id: 'trumao',     name: 'Trumaos',     ca: 0.11,  buffer: 25, zone: 'Osorno' },
  { id: 'transicion', name: 'Transición', ca: 0.12,  buffer: null, zone: 'Zona intermedia' },
  { id: 'nadi',       name: 'Ñadi',       ca: 0.096, buffer: 27, zone: 'Zonas con napa freática' },
];

/**
 * Eficiencia de absorción estándar por nutriente.
 * MgO, S, CaO, Na → sin eficiencia (aplican directa)
 */
const EFFICIENCY = { n: 65, p: 60, k: 90 };

/**
 * Cultivos preset (acceso rápido). Valores típicos de requerimiento en u/ha.
 * npk: { n, p, k } en unidades (1 u = 1 kg nutriente puro / ha)
 * cover: unidades de N de cobertera (0 si no aplica)
 */
const CROPS = [
  { id: 'trigo',      name: 'Trigo',       npk: { n: 102, p: 135, k: 117 }, cover: 0,  yield: { type: 'qq',  value: 60 } },
  { id: 'avena',      name: 'Avena',       npk: { n: 80,  p: 90,  k: 90  }, cover: 0,  yield: { type: 'qq',  value: 55 } },
  { id: 'nabo',       name: 'Nabo',        npk: { n: 100, p: 100, k: 120 }, cover: 90, yield: { type: 'qq',  value: 700 } },
  { id: 'lupino',     name: 'Lupino',      npk: { n: 0,   p: 80,  k: 80  }, cover: 0,  yield: { type: 'qq',  value: 40 } },
  { id: 'pradera',    name: 'Pradera',     npk: { n: 120, p: 90,  k: 90  }, cover: 0,  yield: { type: 'ms',  value: 9000 } },
  { id: 'silo_maiz',  name: 'Silo Maíz',   npk: { n: 150, p: 100, k: 150 }, cover: 0,  yield: { type: 'ton', value: 50 } },
  { id: 'papa',       name: 'Papa',        npk: { n: 130, p: 150, k: 160 }, cover: 0,  yield: { type: 'qq',  value: 500 } },
  { id: 'custom',     name: 'Personalizado', npk: { n: 0, p: 0, k: 0 }, cover: 0,  yield: { type: 'qq', value: 0 } },
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
