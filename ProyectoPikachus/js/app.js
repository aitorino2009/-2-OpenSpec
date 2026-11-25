/**
 * @file app.js
 * @description Orquestador principal y punto de entrada de PokéDeck Neo-Collector.
 * Coordina la carga de datos, persistencia de likes, renderizado y delegación de eventos.
 */

import { fetchPokemonList } from './api.js';
import { getLikedIds, isLiked, toggleLike, getLikesCount } from './storage.js';
import {
  renderSkeletons,
  renderCards,
  updateLikeButton,
  updateLikesCounter,
  announceToScreenReader,
  renderError,
} from './ui.js';

/**
 * Cantidad estándar de cartas a solicitar y mostrar.
 * @type {number}
 */
const POKEMON_COUNT = 24;

// Referencias a los nodos principales del DOM
let cardsContainer = null;
let totalLikesCountEl = null;
let liveAnnouncerEl = null;

/**
 * Carga el catálogo de Pokémon desde PokéAPI y actualiza la interfaz.
 */
async function loadPokemonCollection() {
  if (!cardsContainer) return;

  // Renderizar exactamente 24 skeletons para CLS = 0
  renderSkeletons(cardsContainer, POKEMON_COUNT);

  try {
    const pokemonList = await fetchPokemonList(POKEMON_COUNT);
    const currentLikedIds = getLikedIds();
    renderCards(cardsContainer, pokemonList, currentLikedIds);
    announceToScreenReader(
      liveAnnouncerEl,
      `Catálogo cargado con éxito. Se muestran ${pokemonList.length} cartas de Pokémon.`
    );
  } catch (error) {
    console.error('[App] Error al obtener el catálogo de Pokémon:', error);
    renderError(
      cardsContainer,
      'No fue posible cargar las cartas de Pokémon desde PokéAPI. Comprueba tu conexión a internet.',
      () => loadPokemonCollection()
    );
    announceToScreenReader(
      liveAnnouncerEl,
      'Error de conexión al cargar las cartas de Pokémon. Puedes usar el botón de reintento.'
    );
  }
}

/**
 * Manejador centralizado mediante delegación de eventos para clics en botones de Like.
 * @param {MouseEvent} event
 */
function handleContainerClick(event) {
  const target = event.target;
  if (!target) return;

  // Localizar el botón de like más cercano al elemento clickeado
  const likeBtn = target.closest('.btn-like');
  if (!likeBtn) return;

  const pokemonId = Number(likeBtn.dataset.pokemonId);
  if (!pokemonId) return;

  // Localizar el nombre del Pokémon para el anuncio accesible
  const card = likeBtn.closest('.pokemon-card');
  const pokemonName = card ? card.querySelector('.pokemon-name')?.textContent || 'Pokémon' : 'Pokémon';

  // Conmutar el like en el módulo de almacenamiento
  const newLikedState = toggleLike(pokemonId);

  // Actualizar la interfaz visual del botón
  updateLikeButton(likeBtn, newLikedState, pokemonName);

  // Actualizar el contador global de likes en la cabecera
  const newTotalLikes = getLikesCount();
  updateLikesCounter(totalLikesCountEl, newTotalLikes);

  // Anunciar el cambio a usuarios de lectores de pantalla
  const actionText = newLikedState ? 'añadido a favoritos' : 'eliminado de favoritos';
  announceToScreenReader(
    liveAnnouncerEl,
    `${pokemonName} ${actionText}. Total de favoritos: ${newTotalLikes}.`
  );
}

/**
 * Sincroniza el contador y el estado de los botones cuando se detecta un cambio en otra pestaña.
 */
function handleCrossTabSync() {
  const currentTotal = getLikesCount();
  updateLikesCounter(totalLikesCountEl, currentTotal);

  if (!cardsContainer) return;

  const currentLikedIds = getLikedIds();
  const allButtons = cardsContainer.querySelectorAll('.btn-like');
  allButtons.forEach((btn) => {
    const id = Number(btn.dataset.pokemonId);
    const card = btn.closest('.pokemon-card');
    const pokemonName = card ? card.querySelector('.pokemon-name')?.textContent || 'Pokémon' : 'Pokémon';
    updateLikeButton(btn, currentLikedIds.has(id), pokemonName);
  });
}

/**
 * Inicialización de la aplicación.
 */
export function init() {
  // Captura de elementos de la interfaz
  cardsContainer = document.getElementById('cards-container');
  totalLikesCountEl = document.getElementById('total-likes-count');
  liveAnnouncerEl = document.getElementById('live-announcer');

  if (!cardsContainer) {
    console.error('[App] No se encontró el contenedor #cards-container en el DOM.');
    return;
  }

  // Establecer el contador inicial de likes persistidos
  updateLikesCounter(totalLikesCountEl, getLikesCount());

  // Registrar la delegación de eventos para el botón de like
  cardsContainer.addEventListener('click', handleContainerClick);

  // Escuchar sincronización multi-pestaña
  window.addEventListener('pokemon:likes-synced', handleCrossTabSync);

  // Disparar la carga del catálogo
  loadPokemonCollection();
}

// Arranque automático al estar listo el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
