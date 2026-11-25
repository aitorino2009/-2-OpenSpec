/**
 * @file ui.js
 * @description Módulo de presentación y renderizado puro del DOM para Pokémon Cards.
 * Genera elementos accesibles, skeletons, tarjetas y estados de error/vacío.
 * CERO llamadas directas a PokéAPI o localStorage.
 */

/**
 * Mapeo de resplandores temáticos según el tipo elemental primario.
 * @type {Record<string, string>}
 */
const TYPE_GLOW_MAP = {
  electric: 'var(--glow-electric)',
  fire: 'var(--glow-fire)',
  water: 'var(--glow-water)',
  grass: 'var(--glow-grass)',
  psychic: 'var(--glow-psychic)',
};

/**
 * Mapeo de nombres en español para tipos elementales en los badges.
 * @type {Record<string, string>}
 */
const TYPE_TRANSLATIONS = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  steel: 'Acero',
  fairy: 'Hada',
  dark: 'Siniestro',
};

/**
 * Crea el elemento HTML accesible de una tarjeta Pokémon.
 * CERO tabindex="0" en el contenedor article.
 * @param {import('./api.js').PokemonCardData} pokemon Datos normalizados del Pokémon
 * @param {boolean} isLiked Indica si el Pokémon está marcado con like
 * @returns {HTMLElement} Elemento <article class="pokemon-card">
 */
export function createCard(pokemon, isLiked) {
  const card = document.createElement('article');
  card.className = 'pokemon-card';
  card.dataset.pokemonId = String(pokemon.id);

  // Inyección de tokens temáticos inline para personalización elemental
  const themeColor = `var(--type-${pokemon.primaryType}, var(--type-normal))`;
  const glowColor = TYPE_GLOW_MAP[pokemon.primaryType] || 'var(--glow-default)';
  card.style.setProperty('--card-theme-color', themeColor);
  card.style.setProperty('--card-glow-color', glowColor);

  // Cabecera: Nombre e ID
  const header = document.createElement('header');
  header.className = 'card-header';

  const nameEl = document.createElement('h3');
  nameEl.className = 'pokemon-name';
  nameEl.textContent = pokemon.name;

  const idEl = document.createElement('span');
  idEl.className = 'pokemon-id';
  idEl.textContent = pokemon.formattedId;

  header.appendChild(nameEl);
  header.appendChild(idEl);

  // Media: Ilustración en alta definición con aspect-ratio 1:1
  const media = document.createElement('figure');
  media.className = 'card-media';

  const img = document.createElement('img');
  img.className = 'pokemon-artwork';
  img.src = pokemon.imageUrl || '';
  img.alt = `Ilustración oficial de ${pokemon.name}`;
  img.width = 220;
  img.height = 220;
  img.loading = 'lazy';
  img.decoding = 'async';
  // Primera fila con prioridad para optimizar LCP
  if (pokemon.id <= 4) {
    img.setAttribute('fetchpriority', 'high');
  }

  media.appendChild(img);

  // Tipos elementales
  const typesContainer = document.createElement('div');
  typesContainer.className = 'card-types';
  for (const type of pokemon.types) {
    const badge = document.createElement('span');
    badge.className = `type-badge type-${type}`;
    badge.textContent = TYPE_TRANSLATIONS[type] || type.toUpperCase();
    typesContainer.appendChild(badge);
  }

  // Estadísticas de combate
  const statsList = document.createElement('dl');
  statsList.className = 'card-stats';

  const statsConfig = [
    { label: 'PS', value: pokemon.stats.hp },
    { label: 'Ataque', value: pokemon.stats.attack },
    { label: 'Defensa', value: pokemon.stats.defense },
    { label: 'Velocidad', value: pokemon.stats.speed },
  ];

  for (const stat of statsConfig) {
    const statItem = document.createElement('div');
    statItem.className = 'stat-item';

    const statName = document.createElement('dt');
    statName.className = 'stat-name';
    statName.textContent = stat.label;

    const statValue = document.createElement('dd');
    statValue.className = 'stat-value';
    statValue.textContent = String(stat.value);

    statItem.appendChild(statName);
    statItem.appendChild(statValue);
    statsList.appendChild(statItem);
  }

  // Pie de tarjeta y botón de like accesible
  const footer = document.createElement('footer');
  footer.className = 'card-footer';

  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'btn-like';
  likeBtn.dataset.pokemonId = String(pokemon.id);
  likeBtn.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
  likeBtn.setAttribute('aria-label', isLiked ? `Quitar me gusta a ${pokemon.name}` : `Dar me gusta a ${pokemon.name}`);

  // Icono SVG de corazón accesible
  likeBtn.innerHTML = `
    <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;

  footer.appendChild(likeBtn);

  // Ensamblar tarjeta completa
  card.appendChild(header);
  card.appendChild(media);
  card.appendChild(typesContainer);
  card.appendChild(statsList);
  card.appendChild(footer);

  return card;
}

/**
 * Renderiza 24 esqueletos animados para mantener el espacio visual durante la carga y garantizar CLS = 0.
 * @param {HTMLElement} container Contenedor donde inyectar los esqueletos
 * @param {number} [count=24] Cantidad de esqueletos a renderizar
 */
export function renderSkeletons(container, count = 24) {
  if (!container) return;
  container.innerHTML = '';
  container.setAttribute('aria-busy', 'true');

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'card-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');

    skeleton.innerHTML = `
      <div class="skeleton-header">
        <div class="skeleton-block skeleton-title"></div>
        <div class="skeleton-block skeleton-id"></div>
      </div>
      <div class="skeleton-block skeleton-media"></div>
      <div class="skeleton-types">
        <div class="skeleton-block skeleton-badge"></div>
        <div class="skeleton-block skeleton-badge"></div>
      </div>
      <div class="skeleton-stats">
        <div class="skeleton-block skeleton-stat-line"></div>
        <div class="skeleton-block skeleton-stat-line"></div>
        <div class="skeleton-block skeleton-stat-line"></div>
        <div class="skeleton-block skeleton-stat-line"></div>
      </div>
      <div class="skeleton-footer">
        <div class="skeleton-block skeleton-button"></div>
      </div>
    `;

    fragment.appendChild(skeleton);
  }

  container.appendChild(fragment);
}

/**
 * Renderiza la lista de tarjetas de Pokémon en el contenedor principal.
 * Conmuta aria-busy a 'false'.
 * @param {HTMLElement} container Contenedor de destino (#cards-container)
 * @param {import('./api.js').PokemonCardData[]} pokemonList Lista de Pokémon normalizados
 * @param {Set<number>} likedSet Conjunto de IDs que tienen like activo
 */
export function renderCards(container, pokemonList, likedSet) {
  if (!container) return;
  container.innerHTML = '';

  if (!pokemonList || pokemonList.length === 0) {
    renderEmpty(container);
    container.setAttribute('aria-busy', 'false');
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const pokemon of pokemonList) {
    const isLiked = likedSet ? likedSet.has(pokemon.id) : false;
    const cardEl = createCard(pokemon, isLiked);
    fragment.appendChild(cardEl);
  }

  container.appendChild(fragment);
  container.setAttribute('aria-busy', 'false');
}

/**
 * Actualiza el estado visual y los atributos de accesibilidad del botón de like.
 * @param {HTMLButtonElement} buttonElement Botón a actualizar
 * @param {boolean} isLiked Nuevo estado de like
 * @param {string} pokemonName Nombre del Pokémon para el aria-label descriptivo
 */
export function updateLikeButton(buttonElement, isLiked, pokemonName) {
  if (!buttonElement) return;

  buttonElement.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
  buttonElement.setAttribute(
    'aria-label',
    isLiked ? `Quitar me gusta a ${pokemonName}` : `Dar me gusta a ${pokemonName}`
  );
}

/**
 * Actualiza el contador numérico global de likes en la cabecera.
 * @param {HTMLElement} counterElement Elemento span (#total-likes-count)
 * @param {number} count Total de likes actual
 */
export function updateLikesCounter(counterElement, count) {
  if (!counterElement) return;
  counterElement.textContent = String(count);
}

/**
 * Anuncia discretamente un mensaje a lectores de pantalla mediante la región viva accesible.
 * @param {HTMLElement} announcerElement Contenedor con aria-live="polite" (#live-announcer)
 * @param {string} message Mensaje a comunicar
 */
export function announceToScreenReader(announcerElement, message) {
  if (!announcerElement) return;
  announcerElement.textContent = '';
  // Timeout mínimo para asegurar que el cambio de texto active la lectura del lector de pantalla
  setTimeout(() => {
    announcerElement.textContent = message;
  }, 50);
}

/**
 * Renderiza una vista de error amigable con botón de reintento.
 * @param {HTMLElement} container Contenedor (#cards-container)
 * @param {string} message Mensaje de error para el usuario
 * @param {Function} onRetryCallback Función a ejecutar al pulsar "Reintentar"
 */
export function renderError(container, message, onRetryCallback) {
  if (!container) return;
  container.innerHTML = '';
  container.setAttribute('aria-busy', 'false');

  const errorWrapper = document.createElement('div');
  errorWrapper.className = 'state-container error-state';

  errorWrapper.innerHTML = `
    <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <h3 class="state-title">Error de Conexión</h3>
    <p class="state-description">${message || 'No fue posible sintonizar con la PokéAPI. Comprueba tu conexión a internet.'}</p>
  `;

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'btn-retry';
  retryBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
    <span>Reintentar conexión</span>
  `;

  if (typeof onRetryCallback === 'function') {
    retryBtn.addEventListener('click', onRetryCallback);
  }

  errorWrapper.appendChild(retryBtn);
  container.appendChild(errorWrapper);
}

/**
 * Renderiza un estado de catálogo vacío en caso de que la API devuelva una lista vacía.
 * @param {HTMLElement} container Contenedor (#cards-container)
 */
export function renderEmpty(container) {
  if (!container) return;
  container.innerHTML = '';
  container.setAttribute('aria-busy', 'false');

  const emptyWrapper = document.createElement('div');
  emptyWrapper.className = 'state-container empty-state';

  emptyWrapper.innerHTML = `
    <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <h3 class="state-title">Colección Vacía</h3>
    <p class="state-description">No se encontraron cartas de Pokémon disponibles en la colección actualmente.</p>
  `;

  container.appendChild(emptyWrapper);
}
