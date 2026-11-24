# Design

## Context

El proyecto requiere una aplicación web ligera construida exclusivamente con tecnologías web nativas (HTML5 semántico, CSS3 moderno y JavaScript Vanilla ES Modules), sin frameworks ni empaquetadores. Se conecta a la PokéAPI pública para obtener datos e imágenes oficiales y utiliza `localStorage` para persistir el estado de los favoritos del usuario en el cliente.

## Goals / Non-Goals

**Goals:**
- Presentar una cuadrícula responsiva de 24 tarjetas de Pokémon con nombre, número, tipos y arte oficial.
- Permitir alternar el estado de "me gusta" en cada tarjeta con respuesta táctil y visual instantánea.
- Garantizar que los likes persistan entre recargas del navegador mediante `localStorage`.
- Ofrecer estados de carga (skeletons), error de red (pantalla informativa con botón de reintento) y contenedor vacío.
- Cumplir pautas de accesibilidad WCAG 2.1 AA (`aria-pressed`, navegación por teclado y contraste de color).
- Aplicar principios de Taste Skill, UI UX Pro Max, Frontend-Design e Impeccable para lograr una estética cuidada y diferencial.

**Non-Goals:**
- No implementar paginación, scroll infinito ni carga por lotes sucesivos en esta versión inicial.
- No incluir buscador por texto, filtros por tipo ni selector de solo favoritos (mantener la aplicación simple y modular).
- No implementar autenticación de usuarios ni bases de datos en servidor.

## Decisions

### 1. Consumo de PokéAPI y Manejo de Datos
- **Decisión:** Petición inicial de catálogo `GET /pokemon?limit=24` y resolución concurrente de detalles mediante `Promise.allSettled()`.
- **Alternativa descartada:** Peticiones secuenciales (descartado por latencia elevada y bloqueo de renderizado).
- **Justificación:** `Promise.allSettled()` permite que la interfaz renderice las cartas exitosas incluso si alguna falla puntualmente, garantizando resiliencia.

### 2. Estructura y Formato de Persistencia en localStorage
- **Decisión:** Almacenar un array JSON de identificadores numéricos `[1, 4, 7, 25]` bajo la clave `'pokecards_v1_likes'`. En tiempo de ejecución en memoria se mantiene un `Set<number>`.
- **Alternativa descartada:** Guardar objetos completos de Pokémon con imágenes (descartado por desperdicio de cuota de almacenamiento y riesgo de desincronización).
- **Justificación:** Almacenar sólo IDs numéricos es ultra-ligero (< 1 KB), previene desbordamiento de cuota y el `Set` garantiza comprobaciones `has()` en $\mathcal{O}(1)$.

### 3. Arquitectura Modular en Vanilla ES Modules
- **Decisión:** Cuatro módulos con responsabilidad única:
  - `api.js`: Fetch a PokéAPI, timeout con `AbortController`, normalización de datos y caché en memoria.
  - `storage.js`: Lectura defensiva, escritura segura y manejo de excepciones de `localStorage`.
  - `ui.js`: Creación de elementos DOM, renderizado de cartas, skeletons y estados de error.
  - `app.js`: Punto de entrada, coordinación del flujo y delegación de eventos.
- **Alternativa descartada:** Un único archivo `app.js` monolítico (descartado por violar los principios de diseño modular y mantenibilidad).

### 4. Microinteracción de Like en CSS Puro
- **Decisión:** Animación con `@keyframes like-elastic` con curva `cubic-bezier(0.175, 0.885, 0.32, 1.275)` y destello perimetral mediante pseudo-elemento `::after`.
- **Alternativa descartada:** Inyección de partículas o elementos SVG dinámicos en el DOM mediante JS (descartado por sobrecarga de nodos y complejidad innecesaria).

## Risks / Trade-offs

- [Caída o latencia de PokéAPI] → Timeout de 8 segundos con `AbortController` y renderizado de un estado de error con botón de reintento.
- [Corrupción de datos en localStorage] → Función defensiva `safeReadLikes()` que valida enteros positivos y auto-recupera a un `Set` vacío ante errores de parseo.
- [Modo incógnito o cuota excedida en localStorage] → Bloque `try...catch` que conmuta automáticamente a un almacén en memoria en caso de bloqueo de almacenamiento.
- [Cumulative Layout Shift (CLS)] → Contenedores con `aspect-ratio: 1 / 1`, dimensiones explícitas (220x220) y exactamente 24 skeletons de carga idénticos a las cartas finales.
