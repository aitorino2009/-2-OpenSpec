/**
 * @file storage.js
 * @description Módulo de persistencia local para favoritos de Pokémon Cards.
 * Gestiona el almacenamiento en localStorage de forma defensiva con Set en memoria.
 * CERO manipulación del DOM.
 */

const STORAGE_KEY = 'pokecards_v1_likes';

/**
 * Fallback en memoria por si el almacenamiento local está deshabilitado o colapsado.
 * @type {Set<number>}
 */
let memoryStore = new Set();

/**
 * Indicador de disponibilidad de localStorage en el entorno actual.
 * @type {boolean}
 */
const isStorageAvailable = checkLocalStorageAvailability();

/**
 * Inicialización del estado en memoria cargando los datos persistidos o inicializando vacío.
 * @type {Set<number>}
 */
let likesSet = safeReadLikes();

/**
 * Verifica de forma segura si localStorage está disponible y accesible para lectura/escritura.
 * @returns {boolean}
 */
function checkLocalStorageAvailability() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const probeKey = '__storage_probe__';
    window.localStorage.setItem(probeKey, probeKey);
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    console.warn('[Storage] localStorage no disponible o bloqueado por políticas del navegador:', error);
    return false;
  }
}

/**
 * Lee y valida defensivamente los datos de likes almacenados.
 * Recupera el estado ante JSON corrupto o tipos de datos inesperados.
 * @returns {Set<number>} Conjunto de IDs numéricos válidos.
 */
function safeReadLikes() {
  if (!isStorageAvailable) {
    return new Set(memoryStore);
  }

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return new Set();
    }

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) {
      console.warn('[Storage] Formato corrupto detectado en localStorage (se esperaba Array). Reiniciando estado.');
      safeWriteLikes(new Set());
      return new Set();
    }

    // Filtrar estrictamente solo números enteros positivos válidos
    const validIds = parsed.filter((id) => typeof id === 'number' && Number.isInteger(id) && id > 0);
    return new Set(validIds);
  } catch (error) {
    console.error('[Storage] Error al leer/parsear localStorage. Restableciendo conjunto seguro:', error);
    return new Set();
  }
}

/**
 * Guarda defensivamente el conjunto de likes en localStorage serializándolo como Array JSON.
 * Atrapa y gestiona excepciones como QuotaExceededError o restricciones de modo incógnito.
 * @param {Set<number>} set Conjunto a persistir.
 */
function safeWriteLikes(set) {
  memoryStore = new Set(set);

  if (!isStorageAvailable) {
    return;
  }

  try {
    const arrayToSerialize = Array.from(set);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arrayToSerialize));
  } catch (error) {
    console.warn('[Storage] Error al escribir en localStorage (¿cuota excedida o modo privado?):', error);
  }
}

/**
 * Devuelve una copia del conjunto de identificadores numéricos marcados con like.
 * @returns {Set<number>}
 */
export function getLikedIds() {
  return new Set(likesSet);
}

/**
 * Comprueba si un Pokémon específico está marcado con like en O(1).
 * @param {number|string} id Identificador numérico del Pokémon.
 * @returns {boolean}
 */
export function isLiked(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return false;
  }
  return likesSet.has(numericId);
}

/**
 * Alterna el estado de like de un Pokémon (lo añade si no estaba, o lo retira si ya estaba).
 * Persiste inmediatamente el cambio.
 * @param {number|string} id Identificador numérico del Pokémon.
 * @returns {boolean} Nuevo estado del like (true = marcado, false = desmarcado).
 */
export function toggleLike(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    console.warn('[Storage] Intento de toggleLike con ID no válido:', id);
    return false;
  }

  let isNowLiked = false;
  if (likesSet.has(numericId)) {
    likesSet.delete(numericId);
    isNowLiked = false;
  } else {
    likesSet.add(numericId);
    isNowLiked = true;
  }

  safeWriteLikes(likesSet);
  return isNowLiked;
}

/**
 * Devuelve el número total de Pokémon marcados con like.
 * @returns {number}
 */
export function getLikesCount() {
  return likesSet.size;
}

// Sincronización multi-pestaña para consistencia entre ventanas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      likesSet = safeReadLikes();
      window.dispatchEvent(new CustomEvent('pokemon:likes-synced', {
        detail: { count: likesSet.size }
      }));
    }
  });
}
