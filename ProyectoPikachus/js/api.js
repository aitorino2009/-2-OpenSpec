/**
 * @file api.js
 * @description Módulo de consumo de PokéAPI con timeouts, resolución concurrente y caché en memoria.
 * Normaliza los datos crudos a un modelo de dominio limpio para la aplicación.
 * CERO manipulación del DOM.
 */

const API_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Caché en memoria para evitar peticiones redundantes durante la sesión.
 * @type {Map<number, PokemonCardData>}
 */
const pokemonCache = new Map();

/**
 * @typedef {Object} PokemonCardData
 * @property {number} id - Identificador numérico único
 * @property {string} formattedId - Identificador Pokédex con formato "#025"
 * @property {string} name - Nombre capitalizado
 * @property {string[]} types - Lista de tipos elementales
 * @property {string} primaryType - Tipo elemental predominante
 * @property {string} imageUrl - URL directa de official-artwork en HD (con fallbacks)
 * @property {{ hp: number, attack: number, defense: number, speed: number }} stats - Métricas de combate
 * @property {string} formattedHeight - Altura normalizada (ej. "0.4 m")
 * @property {string} formattedWeight - Peso normalizado (ej. "6.0 kg")
 */

/**
 * Realiza una petición fetch con límite de tiempo estricto mediante AbortController.
 * @param {string} url URL a consultar
 * @param {number} timeoutMs Tiempo máximo de espera en milisegundos
 * @returns {Promise<any>}
 */
async function fetchWithTimeout(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Respuesta HTTP no exitosa (${response.status}): ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado (${timeoutMs}ms) al consultar PokéAPI en ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Transforma la respuesta cruda de un espécimen en un objeto plano del modelo de dominio.
 * @param {any} rawData Respuesta JSON del endpoint /pokemon/{id}
 * @returns {PokemonCardData}
 */
function normalizePokemonData(rawData) {
  const id = Number(rawData.id);
  const formattedId = `#${String(id).padStart(3, '0')}`;

  // Capitalización de nombre
  const rawName = String(rawData.name || '');
  const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Desconocido';

  // Extracción de tipos elementales
  const types = Array.isArray(rawData.types) && rawData.types.length > 0
    ? rawData.types.map((entry) => entry?.type?.name?.toLowerCase()).filter(Boolean)
    : ['normal'];
  const primaryType = types[0] || 'normal';

  // Cascada de selección de ilustración oficial en alta resolución
  const officialArtwork = rawData.sprites?.other?.['official-artwork']?.front_default;
  const dreamWorld = rawData.sprites?.other?.dream_world?.front_default;
  const standardSprite = rawData.sprites?.front_default;
  const imageUrl = officialArtwork || dreamWorld || standardSprite || '';

  // Extracción normalizada de estadísticas
  const statsMap = {};
  if (Array.isArray(rawData.stats)) {
    for (const statEntry of rawData.stats) {
      const statName = statEntry?.stat?.name;
      if (statName) {
        statsMap[statName] = Number(statEntry.base_stat) || 0;
      }
    }
  }

  const stats = {
    hp: statsMap.hp ?? 0,
    attack: statsMap.attack ?? 0,
    defense: statsMap.defense ?? 0,
    speed: statsMap.speed ?? 0,
  };

  // Altura (decímetros -> metros) y Peso (hectogramos -> kilogramos)
  const heightVal = Number(rawData.height) || 0;
  const weightVal = Number(rawData.weight) || 0;
  const formattedHeight = `${(heightVal / 10).toFixed(1)} m`;
  const formattedWeight = `${(weightVal / 10).toFixed(1)} kg`;

  return {
    id,
    formattedId,
    name,
    types,
    primaryType,
    imageUrl,
    stats,
    formattedHeight,
    formattedWeight,
  };
}

/**
 * Consulta y normaliza el detalle de un Pokémon individual (o lo recupera de la caché).
 * @param {string} detailUrl URL del detalle del Pokémon
 * @returns {Promise<PokemonCardData>}
 */
async function fetchPokemonDetailByUrl(detailUrl) {
  const data = await fetchWithTimeout(detailUrl);
  const normalized = normalizePokemonData(data);
  pokemonCache.set(normalized.id, normalized);
  return normalized;
}

/**
 * Obtiene la lista de Pokémon especificada y consulta sus detalles concurrentemente.
 * @param {number} [limit=24] Cantidad de cartas a obtener
 * @returns {Promise<PokemonCardData[]>} Lista de Pokémon normalizados y listos para renderizar
 */
export async function fetchPokemonList(limit = 24) {
  const endpointUrl = `${API_BASE_URL}?limit=${limit}&offset=0`;
  const listResponse = await fetchWithTimeout(endpointUrl);

  if (!listResponse || !Array.isArray(listResponse.results) || listResponse.results.length === 0) {
    return [];
  }

  // Creación de promesas para los detalles de cada Pokémon
  const detailPromises = listResponse.results.map((item) => {
    // Si la URL contiene un ID que ya está en caché, lo devolvemos directamente
    const match = item.url.match(/\/pokemon\/(\d+)\/?$/);
    if (match) {
      const potentialId = Number(match[1]);
      if (pokemonCache.has(potentialId)) {
        return Promise.resolve(pokemonCache.get(potentialId));
      }
    }
    return fetchPokemonDetailByUrl(item.url);
  });

  // Resolución concurrente y resiliente
  const settledResults = await Promise.allSettled(detailPromises);

  // Filtrado exclusivo de las promesas cumplidas con éxito
  const fulfilledPokemon = settledResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  // Si todas fallaron pero la lista original tenía elementos, reportamos error crítico
  if (fulfilledPokemon.length === 0 && listResponse.results.length > 0) {
    throw new Error('No se pudo obtener el detalle de las cartas Pokémon solicitadas.');
  }

  // Ordenar por ID para consistencia del catálogo
  fulfilledPokemon.sort((a, b) => a.id - b.id);

  return fulfilledPokemon;
}

/**
 * Recupera un Pokémon individual de la caché en memoria si existe.
 * @param {number} id
 * @returns {PokemonCardData|undefined}
 */
export function getCachedPokemon(id) {
  return pokemonCache.get(Number(id));
}
