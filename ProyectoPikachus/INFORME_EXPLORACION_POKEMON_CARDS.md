# 📑 Informe de Exploración Técnica y Diseño UI/UX: Pokémon Cards + Likes

> **Proyecto:** Pokémon Cards + Likes Application  
> **Fase:** Paso 1 – Exploración Técnica y Visual (`/opsx:explore`) – **Revisión Post-Auditoría QA**  
> **Autor:** Desarrollador Frontend Worker  
> **Destinatario:** Antigravity Coordinator (Project Manager) & QA Auditor  
> **Fecha:** 24 de noviembre de 2026  
> **Estado:** Aprobado para Especificación (Sin sobreingeniería, Accesible, Modular)

---

## 🎯 1. Resumen Ejecutivo y Alcance Estricto

El presente informe establece las bases arquitectónicas, técnicas y visuales depuradas para la aplicación web **Pokémon Cards + Likes**. 

Atendiendo a las directrices de diseño (**Taste Skill**, **UI UX Pro Max**, **Frontend-Design de Anthropic** e **Impeccable**) y aplicando con rigor la corrección de **sobreingeniería** dictada por QA:
- **Alcance Simple y Fiel al Ejercicio:** Se eliminan tajantemente búsquedas, filtros por tipo, paginaciones complejas y toggles de solo favoritos ("*¿Paginación, búsqueda o filtros? -> No, todo sencillo y por módulos para empezar*").
- **Foco Central:** Una cuadrícula fija de 24 cartas coleccionables de Pokémon cargadas desde PokéAPI, cada una con un botón de "Like" persistido en `localStorage` y un contador global de likes en la cabecera.
- **Calidad de Artesanía Frontend:** Código en **JavaScript Vanilla puro (ES Modules)**, HTML5 semántico sin trampas de foco, animaciones puramente en CSS, accesibilidad WCAG 2.1 AA real y un layout inmune al Cumulative Layout Shift (CLS = 0).

---

## 🌐 2. Fuente de Datos: PokéAPI

### 2.1 Endpoints Seleccionados
PokéAPI se consume mediante dos endpoints canónicos estructurados para una carga directa y contenida:

1. **Endpoint de Colección Fija (24 Pokémon):**
   - **URL:** `GET https://pokeapi.co/api/v2/pokemon?limit=24&offset=0`
   - **Propósito:** Recuperar la tanda fija inicial de 24 especímenes de la Generación 1.
2. **Endpoint de Detalle Individual:**
   - **URL:** `GET https://pokeapi.co/api/v2/pokemon/{id_or_name}`
   - **Propósito:** Extraer la ficha técnica de cada carta (stats, tipos, dimensiones e ilustraciones HD).

### 2.2 Estrategia de Fetching y Resiliencia
- **Fetch Concurrente Controlado:** Se orquesta la consulta de los 24 detalles en paralelo con `Promise.allSettled()`. Si una carta individual sufre un corte de red, las 23 restantes se renderizan de forma autónoma.
- **Control de Tiempos de Espera (Timeout):** Integración de `AbortController` calibrado a 8.000 ms para evitar estados de carga infinitos en conexiones inestables.
- **Caché en Memoria (`Map<number, PokemonCardData>`):** Almacena en memoria las 24 entidades transformadas dentro de `api.js` para asegurar acceso inmediato durante el ciclo de vida de la página.

### 2.3 Formato de Imágenes HD (Official Artwork) y Prevención de CLS
- **Fuente de Imagen Primaria:**  
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`  
  *(Propiedad: `sprites.other['official-artwork'].front_default`)*.
- **Cascada de Respaldo (Fallback):**  
  `official-artwork` $\rightarrow$ `sprites.other['dream_world'].front_default` $\rightarrow$ `sprites.front_default` $\rightarrow$ SVG placeholder local embebido.
- **Zero Cumulative Layout Shift (CLS = 0):**  
  Todas las imágenes declaran `width="220"`, `height="220"`, `decoding="async"`, `loading="lazy"` (excepto las 4 primeras que llevan `fetchpriority="high"` para optimizar LCP), alojadas en contenedores CSS con regla explícita `aspect-ratio: 1 / 1`.

### 2.4 Modelo de Datos Normalizado (Domain Model)
El módulo `api.js` entrega objetos planos, higienizados y estrictamente tipados al DOM:

```javascript
/**
 * @typedef {Object} PokemonCardData
 * @property {number} id - Identificador numérico único (ej. 25)
 * @property {string} formattedId - Número de catálogo Pokédex (ej. "#025")
 * @property {string} name - Nombre capitalizado (ej. "Pikachu")
 * @property {string[]} types - Array de tipos en minúsculas (ej. ["electric"])
 * @property {string} primaryType - Tipo primario para inyección de tokens de color
 * @property {string} imageUrl - URL directa de la ilustración official-artwork en HD
 * @property {{ hp: number, attack: number, defense: number, speed: number }} stats - Métricas principales
 * @property {string} formattedHeight - Altura normalizada (ej. "0.4 m")
 * @property {string} formattedWeight - Peso normalizado (ej. "6.0 kg")
 */
```

---

## 🏗️ 3. Arquitectura Técnica: Modular, Semántica y Sin Sobreingeniería

### 3.1 Estructura Limpia de Ficheros (ES Modules Nativos)
Sin compiladores, sin dependencias externas, sin librerías de estado. Módulos puros del navegador (`<script type="module" src="js/app.js">`):

```
ProyectoPikachus/
├── index.html              # HTML5 semántico, accesibilidad y layout base
├── css/
│   ├── tokens.css          # Design tokens: paletas de tipos, sombras y espaciados
│   ├── base.css            # Reset moderno, estilos globales y grid intrínseco
│   ├── components.css      # Tarjeta Pokémon, microinteracción botón like y header
│   └── states.css          # Skeletons (24 slots), feedback de error y empty state
└── js/
    ├── api.js              # Cliente PokéAPI, timeouts, caché y normalización
    ├── storage.js          # Persistencia blindada de Likes en localStorage
    ├── ui.js               # Renderizado puro del DOM y mutación de estados
    └── app.js              # Orquestador del flujo principal y delegación de eventos
```

### 3.2 Responsabilidad Modular Estricta

| Módulo | Responsabilidad Exclusiva | Métodos Clave |
|---|---|---|
| `api.js` | Conexión con PokéAPI, normalización de datos y caché en memoria | `getPokemonList(limit, offset)`, `getPokemonDetail(id)` |
| `storage.js` | Persistencia en `localStorage`, validación defensiva y despacho de eventos | `getLikedIds(): Set<number>`, `toggleLike(id): boolean`, `isLiked(id): boolean`, `getLikesCount(): number` |
| `ui.js` | Renderizado del DOM, actualización de botones y vistas de estado | `renderCards(pokemonList, likesSet)`, `createCard(pokemon, isLiked)`, `updateLikeButton(btn, isLiked)`, `renderSkeletons(24)`, `renderError(container, msg, onRetry)`, `renderEmpty(container, msg)` |
| `app.js` | Orquestador de inicio, enlace entre módulos y delegación de clics en Likes | `init()`, `handleLikeToggle(id, btnElement)` |

*Nota:* Se eliminan de `app.js` y `ui.js` todos los manejadores de búsqueda (`handleSearch`), filtros por tipo (`handleFilterType`) y toggles de solo favoritos (`handleToggleLikedOnly`).

### 3.3 HTML5 Semántico y Accesibilidad Sin Antipatrones
- **Header Semántico:**
  `<header class="app-header">` con el título/branding principal de la colección y un indicador numérico de likes en vivo:
  ```html
  <div class="likes-counter" aria-live="polite">
    <span class="likes-label">Likes totales:</span>
    <span id="total-likes-count" class="likes-badge">0</span>
  </div>
  ```
- **Contenedor Principal:** `<main id="main-content" class="app-main">`.
- **Región de Cartas:** `<section id="cards-container" class="cards-grid" role="region" aria-label="Colección de cartas Pokémon" aria-busy="false">`.
- **Estructura de Tarjeta Accesible (Eliminación de trampas de foco):**
  - **No usar `tabindex="0"` en `<article class="pokemon-card">`:** Las tarjetas son contenedores informativos, no controles accionables. Añadirles tabulación satura innecesariamente la navegación por teclado.
  - El único elemento interactivo con foco dentro de cada tarjeta es el botón `<button class="btn-like">`:
  ```html
  <article class="pokemon-card" data-pokemon-id="25" style="--card-type-color: var(--type-electric);">
    <header class="card-header">
      <span class="pokemon-id">#025</span>
      <h2 class="pokemon-name">Pikachu</h2>
    </header>
    <figure class="card-media">
      <img src=".../official-artwork/25.png" alt="Ilustración oficial de Pikachu" width="220" height="220" loading="lazy">
    </figure>
    <div class="card-types">
      <span class="type-badge type-electric">Eléctrico</span>
    </div>
    <dl class="card-stats">
      <div class="stat-row"><dt>HP</dt><dd>35</dd></div>
      <div class="stat-row"><dt>Ataque</dt><dd>55</dd></div>
      <div class="stat-row"><dt>Defensa</dt><dd>40</dd></div>
      <div class="stat-row"><dt>Velocidad</dt><dd>90</dd></div>
    </dl>
    <footer class="card-footer">
      <button type="button" class="btn-like" data-pokemon-id="25" aria-pressed="false" aria-label="Dar me gusta a Pikachu">
        <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    </footer>
  </article>
  ```
- **Región de Anuncio en Vivo:**
  `<div id="live-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>` que notifica cambios dinámicos a lectores de pantalla (*"Pikachu añadido a favoritos. Total de likes: 1"*).

### 3.4 CSS Moderno: Custom Properties y Grid Responsivo Intrínseco
```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: var(--space-6);
  padding: var(--space-6) 0;
}
```
Adaptabilidad automática fluida en todas las resoluciones (móvil, tablet, escritorio) sin hacks ni saltos de contenido.

---

## 💾 4. Persistencia de Likes: Formato y Gestión en localStorage

### 4.1 Formato y Estructura en Memoria
- **Clave de Storage:** `'pokecards_v1_likes'`.
- **Formato Serializado (JSON en `localStorage`):** Array plano de IDs numéricos: `[4, 7, 25]`.
- **Formato en Ejecución (JavaScript):** `Set<number>`.
  - Consultas instantáneas: `likesSet.has(id)` en $\mathcal{O}(1)$.
  - Inserción y eliminación en $\mathcal{O}(1)$ sin duplicidades.

### 4.2 Validación Defensiva y Tolerancia a Fallos
1. **Detección y Auto-Recuperación de Datos Inválidos:**
   `safeReadLikes()` analiza defensivamente el contenido recuperado de `localStorage`:
   - Verifica `Array.isArray(parsed)`.
   - Limpia y valida cada elemento con `Number.isInteger(n) && n > 0`.
   - Ante valores no reconocibles o corruptos, resetea a un `Set` vacío y avisa en la consola, evitando cualquier detención en la ejecución del código.
2. **Mitigación de `QuotaExceededError` y Almacenamiento Restringido:**
   - Si el navegador opera en modo privado estricto o si la cuota local está colapsada, se intercepta la excepción `DOMException` / `QuotaExceededError`.
   - La aplicación activa un almacenamiento de respaldo en memoria (`inMemoryLikesStore`), asegurando que los likes funcionen durante la sesión del usuario.
3. **Sincronización Reactiva Multi-Pestaña:**
   - Escucha nativa del evento `window.addEventListener('storage', ...)`.
   - Al recibir una mutación externa, sincroniza el `Set` y emite el evento interno `CustomEvent('pokemon:likes-updated')`, refrescando el estado visual de los botones y el contador de likes en todas las pestañas activas.

---

## 🎨 5. Directrices de Diseño y UI/UX: Identidad, Accesibilidad y Rendimiento

Bajo el marco de **Taste Skill**, **UI UX Pro Max**, **Frontend-Design** e **Impeccable**, la experiencia destaca por una estética pulida y un comportamiento sin fisuras:

### 5.1 Cero "AI Slop"
- ❌ Prohibidas las tarjetas blancas genéricas con sombras estándar `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`.
- ❌ Prohibidos los fondos crema/terracota (`#F4F1EA` y `#D97757`) propios de plantillas autogeneradas.
- ❌ Prohibido el uso de emojis crudos (❤️, 🔥, ⚡); se emplean únicamente **iconos vectoriales SVG limpios y optimizados**.

### 5.2 Identidad Visual: Pokédex Neo-Collector
- **Fondo General (`--bg-canvas`):** `#090D1A` (Azul medianoche profundo de baja fatiga visual).
- **Superficie de Tarjeta (`--bg-surface`):** `#111827` con micro-borde `1px solid rgba(255, 255, 255, 0.08)`.
- **Tipografía y Contraste:**
  - Títulos y números Pokédex en fuentes display geométricas de alta legibilidad (`Chakra Petch` o system font moderno).
  - Texto principal `#F9FAFB` (ratio de contraste superior a 13:1 con el fondo).
  - Texto secundario y stats `#94A3B8` (ratio 5.5:1, cumpliendo holgadamente WCAG AA).
- **Iluminación Elemental de Tarjeta:** Cada carta proyecta un sutil resplandor perimetral de acuerdo a su tipo elemental primario (`box-shadow: 0 10px 25px -5px var(--card-glow);`), intensificado suavemente al hacer `:hover` o `:focus-within`.

### 5.3 Microinteracción de Like (100% CSS Puro, Sin Inyección de Partículas DOM)
- **Área Táctil:** $44 \times 44\text{ px}$ reales para total confort en dispositivos táctiles.
- **Icono Vectorial SVG:**
  - *Inactivo (`aria-pressed="false"`):* Contorno limpio `stroke: #94A3B8; fill: transparent; transition: stroke 0.2s, fill 0.2s;`.
  - *Activo (`aria-pressed="true"`):* Relleno rojo carmesí `fill: #F43F5E; stroke: #F43F5E; filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.6));`.
- **Efecto de Explosión Elástica en CSS:**
  La animación se delega íntegramente a `@keyframes like-elastic` con curva elástica física y un anillo de resplandor expansivo resuelto mediante el pseudo-elemento `::after`, sin inyectar ni un solo nodo de partículas al árbol DOM:
  ```css
  .btn-like[aria-pressed="true"] .heart-icon {
    animation: like-elastic 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes like-elastic {
    0% { transform: scale(1); }
    25% { transform: scale(0.75); }
    50% { transform: scale(1.35); }
    75% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .btn-like::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 2px solid #F43F5E;
    opacity: 0;
    pointer-events: none;
  }

  .btn-like[aria-pressed="true"]::after {
    animation: ring-pulse 0.4s ease-out;
  }

  @keyframes ring-pulse {
    0% { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  ```
- **Modo de Movimiento Reducido:** `@media (prefers-reduced-motion: reduce)` suprime las transformaciones de escala y aplica una transición directa de color, respetando las preferencias del usuario.

### 5.4 Los Tres Estados de la Interfaz (Zero Blank Screen)

1. **Skeleton Loaders (Exactamente 24 Elementos para CLS = 0):**
   - Durante la carga inicial, se generan exactamente **24 esqueletos** estructurados con las mismas proporciones de las tarjetas definitivas (avatar circular central, badges y filas de estadísticas).
   - Animación de brillo (*shimmer*) horizontal mediante gradiente CSS:
     `background: linear-gradient(90deg, #131C31 0%, #1E2B4A 50%, #131C31 100%);`
   - Al reemplazar los 24 esqueletos por las 24 cartas reales, el espacio en pantalla no varía en un solo píxel (**CLS = 0**).

2. **Estado de Error con Reintento Funcional:**
   - Si la petición de red falla o expira por timeout, se presenta un panel limpio en el contenedor principal:
     - Icono SVG de Pokéball con indicación de desconexión.
     - Mensaje empático: *"No fue posible conectar con la PokéAPI. Verifica tu conexión a internet."*
     - Botón accesible *"Reintentar carga"*, el cual reinicia el ciclo de obtención sin necesidad de refrescar la ventana del navegador.

3. **Estado Vacío Real (Empty State de Catálogo):**
   - Diseñado para responder a situaciones reales en las que la API devuelva una colección vacía (`results.length === 0`):
     - Ilustración SVG sutil de Pokéball abierta.
     - Mensaje claro: *"No se encontraron cartas de Pokémon disponibles en la colección."*
     - Botón secundario para volver a comprobar la disponibilidad del catálogo.

### 5.5 Accesibilidad Completa (WCAG 2.1 AA)
- **Unificación de Etiquetas ARIA:**
  - Sin like: `aria-pressed="false"` y `aria-label="Dar me gusta a [Nombre]"`.
  - Con like: `aria-pressed="true"` y `aria-label="Quitar me gusta a [Nombre]"`.
- **Foco Visible Inequívoco:**  
  `button:focus-visible { outline: 2px solid #38BDF8; outline-offset: 3px; }` garantizando que los usuarios que naveguen con tabulador localicen el foco al instante.
- **Navegación Óptima:** El usuario salta directamente de botón de like en botón de like sin paradas intermedias en contenedores no interactivos.

---

## 📋 6. Conclusión y Conformidad Técnica

Esta propuesta exploratoria revisada atiende punto por punto las exigencias del informe de QA:
1. ✅ **Cero sobreingeniería:** Sin buscador, sin filtros, sin paginación compleja ni toggles innecesarios.
2. ✅ **Arquitectura modular limpia:** `api.js`, `storage.js`, `ui.js` y `app.js` con responsabilidades estrictas.
3. ✅ **Accesibilidad corregida:** Retirado `tabindex="0"` de los artículos; etiquetas ARIA consistentes y foco visible.
4. ✅ **24 Skeletons precisos:** Prevención absoluta de CLS.
5. ✅ **Empty State real:** Orientado a catálogos sin datos devueltos por la API.
6. ✅ **Microinteracción puramente CSS:** Animación `@keyframes` elástica y destello perimetral con pseudo-elementos, sin inyección de elementos en el DOM.

Queda presentada para la validación definitiva del Encargado/Coordinador y del QA Auditor.
