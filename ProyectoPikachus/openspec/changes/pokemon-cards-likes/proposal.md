# Proposal

## Why

Los entusiastas de Pokémon y coleccionistas necesitan una interfaz web moderna, visualmente atractiva y ágil para visualizar fichas de Pokémon de la primera generación y marcar sus especímenes favoritos. Actualmente no existe una aplicación ligera y modular en JavaScript Vanilla que ofrezca esta experiencia con ilustraciones oficiales en alta resolución y persistencia en el navegador sin dependencias de backend.

## What Changes

- Visualización de un catálogo de 24 cartas de Pokémon obtenidas de la PokéAPI con ilustraciones oficiales en alta definición (`official-artwork`).
- Sistema interactivo de marcado y desmarcado de "me gusta" (Like) en cada ficha mediante una microinteracción fluida.
- Persistencia local automática e inmediata de los likes en `localStorage`.
- Estados visuales completos: carga mediante esqueletos animados (Skeletons con CLS = 0), estado de error de conexión con reintento y estado de catálogo vacío.
- Contador de likes en la cabecera actualizado en tiempo real.
- Diseño visual moderno y distintivo bajo la estética *Pokédex Neo-Collector* (evitando AI-slop).

## Capabilities

### New Capabilities
- `pokemon-cards-likes`: Catálogo visual modular de fichas Pokémon de PokéAPI con interacción y persistencia de likes en localStorage.

### Modified Capabilities

## Impact

- Creación de interfaz frontend estática: `index.html`, `styles.css`.
- Creación de módulos JavaScript Vanilla (ES Modules): `js/api.js`, `js/storage.js`, `js/ui.js`, `js/app.js`.
- Integración con PokéAPI externa (`https://pokeapi.co/api/v2/pokemon`).
- Uso del almacenamiento web estándar (`localStorage`).
