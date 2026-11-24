# Tasks

## 1. Estructura Base y Maquetación Semántica

- [ ] 1.1 Crear el archivo `index.html` con estructura semántica completa (header con contador de likes, contenedor principal para la cuadrícula y live announcer para a11y) y verificar su correcta sintaxis en navegador.
- [ ] 1.2 Crear el archivo `styles.css` con el sistema de diseño *Pokédex Neo-Collector* (variables CSS de paleta y tipos elementales, grid responsivo, skeletons con shimmer y microinteracción del botón de like con @keyframes) y verificar su carga visual sin errores.

## 2. Módulos de Acceso a Datos y Persistencia

- [ ] 2.1 Implementar el módulo `js/storage.js` para gestionar los likes en `localStorage` (funciones `getLikes()`, `isLiked(id)`, `toggleLike(id)` y `getLikesCount()` con validación defensiva y fallback en memoria) y verificar su funcionamiento mediante consola.
- [ ] 2.2 Implementar el módulo `js/api.js` para consumir la PokéAPI (`fetchPokemonList(limit)` con `limit=24`, resolución concurrente con `Promise.allSettled`, timeout y normalización a modelo de dominio) y verificar la recepción correcta de datos en consola.

## 3. Renderizado de Interfaz y Microinteracciones

- [ ] 3.1 Implementar el módulo `js/ui.js` con las funciones de renderizado (`renderPokemonCards(pokemonList, likedSet)`, `renderSkeletons(count)`, `renderError(message, onRetry)` y actualización del contador) asegurando accesibilidad WCAG AA (`aria-pressed`, `aria-label`) y verificar el renderizado en DOM.
- [ ] 3.2 Implementar el orquestador `js/app.js` para inicializar la aplicación, cargar datos de la API, sincronizar el estado inicial de likes y manejar la delegación de eventos del botón de like y reintento.

## 4. Verificación Integral y Pruebas en Navegador

- [ ] 4.1 Verificar la carga completa de las 24 tarjetas con ilustraciones en alta resolución y ausencia de saltos de diseño (CLS = 0).
- [ ] 4.2 Probar la marcación y desmarcación de likes, comprobando la animación visual y la actualización del contador en la cabecera.
- [ ] 4.3 Comprobar la persistencia recargando la página y verificando que los likes se mantienen activos gracias a `localStorage`.
- [ ] 4.4 Simular fallo de red (modo offline) para verificar que el estado de error y el botón de reintento funcionan adecuadamente.
