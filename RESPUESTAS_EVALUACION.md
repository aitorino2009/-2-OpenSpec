# 📝 Respuestas de Evaluación (Entregable) – Proyecto OpenSpec Pikachus

**Alumno/Desarrollador:** Aitor Portales Crespí  
**Repositorio GitHub:** [https://github.com/aitorino2009/-2-OpenSpec](https://github.com/aitorino2009/-2-OpenSpec)  
**Proyecto:** PokéDeck Neo-Collector (`ProyectoPikachus`)  
**Metodología:** OpenSpec Spec-Driven Development (SDD) & Outcome-Driven Development (ODD)

---

## 1. ¿Qué tarea de `tasks.md` tuviste que modificar a mano antes de pedirle a la IA que la programara y por qué?

### Tarea Modificada:
En el **Bloque 2 (Módulos de Acceso a Datos y Persistencia)**, se modificó manualmente la redacción de las subtareas **2.1** y **2.2**:

- **Borrador inicial generado por la IA en `tasks.md`:**
  ```markdown
  - [ ] 2.1 Implementar el módulo `js/storage.js` para gestionar los likes en `localStorage` (funciones `getLikes()`, `isLiked(id)`, `toggleLike(id)` y `getLikesCount()` con validación defensiva y fallback en memoria) y verificar su funcionamiento mediante consola.
  - [ ] 2.2 Implementar el módulo `js/api.js` para consumir la PokéAPI (`fetchPokemonList(limit)` con `limit=24`, resolución concurrente con `Promise.allSettled`, timeout y normalización a modelo de dominio) y verificar la recepción correcta de datos en consola.
  ```

- **Versión corregida y ajustada manualmente a mano:**
  ```markdown
  - [ ] 2.1 Implementar el módulo `js/storage.js` para gestionar los likes en `localStorage` (funciones `getLikedIds()`, `isLiked(id)`, `toggleLike(id)` y `getLikesCount()` con validación defensiva `safeReadLikes` y fallback en memoria) y verificar su funcionamiento.
  - [ ] 2.2 Implementar el módulo `js/api.js` para consumir la PokéAPI (`fetchPokemonList(limit)` con `limit=24`, resolución concurrente con `Promise.allSettled`, filtrado resiliente de resultados cumplidos, timeout con `AbortController` de 8s y normalización a modelo de dominio plano) y verificar la recepción correcta de datos.
  ```

### Justificación Técnica y Motivos:
1. **Ambigüedad en el tipo de retorno (`getLikes()` vs `getLikedIds()`):**  
   Nombrar la función como `getLikes()` sugería equívocamente que el almacenamiento devolvía objetos completos de Pokémon o estructuras complejas. Nuestra arquitectura en `design.md` estipulaba expresamente guardar exclusivamente identificadores numéricos en un `Set<number>` para garantizar operaciones en tiempo constante $\mathcal{O}(1)$ y un consumo ínfimo de cuota (< 1 KB). Renombrarla a `getLikedIds()` forzó al subagente desarrollador a no inventar estructuras redundantes y devolver una copia defensiva (`new Set(...)`).
2. **Resiliencia ante fallos parciales de red (`Promise.allSettled`):**  
   La tarea original no especificaba qué hacer si 2 de las 24 peticiones fallaban. Al añadir explícitamente *"filtrado resiliente de resultados cumplidos"*, se garantizó que `api.js` utilizara `.filter(r => r.status === 'fulfilled').map(r => r.value)`, evitando que un timeout individual provocara una pantalla en blanco y permitiendo que la interfaz renderice todos los especímenes que sí respondieron correctamente.
3. **Poda previa de sobreingeniería (Ejercicio A):**  
   Durante la fase de exploración y propuesta, la IA intentó desglosar tareas para construir un buscador reactivo con debounce, selector desplegable de tipos y switch de "Solo Favoritos". Dichas tareas fueron **borradas a mano en su totalidad** para respetar de forma estricta la consigna del ejercicio: *"¿Paginación, búsqueda o filtros? -> (No, todo sencillo y por módulos para empezar)"*.

---

## 2. En la ejecución tarea por tarea, ¿hubo algún momento en el que el código propuesto por la IA no te convenciera? ¿Cómo lo corregiste?

### Momentos Críticos Detectados y Corregidos:

### A. Antipatrón Grave de Accesibilidad (`tabindex="0"` en `<article>`)
- **Problema Detectado:**  
  Durante la fase inicial de exploración y diseño de la interfaz, el subagente desarrollador propuso estructurar la tarjeta como:
  ```html
  <article class="pokemon-card" data-id="${id}" tabindex="0">
    ...
    <button class="btn-like" aria-label="...">...</button>
  </article>
  ```
- **Por qué no convenció:**  
  Colocar `tabindex="0"` en un elemento contenedor `<article>` que a su vez contiene un control interactivo hijo (`<button class="btn-like">`) es un antipatrón severo según las directrices WCAG 2.1 AA. Crea una trampa de tabulación doble y confusa: el usuario ciego o de teclado tiene que hacer dos paradas por cada Pokémon (una en la tarjeta muda y otra en el botón).
- **Cómo se corrigió:**  
  El subagente auditor (`qa-auditor`) emitió una llamada de atención inmediata. Se ordenó la **retirada inmediata de `tabindex="0"`** en `<article>`. De este modo, al pulsar `Tab`, el foco salta de forma limpia, rítmica y predecible únicamente entre los botones de like, los cuales cuentan con `:focus-visible` resaltado en cian (`#38BDF8`).

### B. Sobreingeniería en la Animación del Like (Inyección de Nodos en el DOM)
- **Problema Detectado:**  
  La IA propuso generar un efecto de "partículas explosivas" inyectando y destruyendo dinámicamente elementos `<span>` o nodos SVG en el árbol DOM cada vez que el usuario pulsaba el corazón.
- **Por qué no convenció:**  
  La creación y destrucción continua de nodos en el DOM en Vanilla JS provoca *garbage collection*, riesgo de fugas de memoria y desorden visual si el usuario pulsa repetidamente el botón.
- **Cómo se corrigió:**  
  Se exigió que la microinteracción fuera **100% en CSS puro**. Se diseñó una animación elástica con `@keyframes like-elastic` con curva física `cubic-bezier(0.175, 0.885, 0.32, 1.275)` y un destello perimetral expansivo mediante el pseudo-elemento `::after` (`@keyframes ring-pulse`). El resultado es ultra-fluido (60 fps), no ensucia el DOM y respeta de inmediato la directiva `@media (prefers-reduced-motion: reduce)`.

### C. Desacoplamiento Estricto entre Capas
- **Problema Detectado:**  
  En un primer borrador, la IA intentaba invocar `localStorage.setItem()` directamente dentro de una función de renderizado en `ui.js`.
- **Cómo se corrigió:**  
  Se impuso una separación estricta de responsabilidades:
  - `storage.js`: Solo gestiona lectura/escritura y el `Set` en memoria. Cero DOM.
  - `ui.js`: Solo genera y actualiza elementos del DOM. Cero red y cero storage.
  - `app.js`: Actúa como director de orquesta que escucha el evento delegado, consulta a `storage.js` y ordena la actualización visual a `ui.js`.

---

## 3. ¿Por qué es importante revisar y editar los artefactos (`.md`) manualmente en lugar de confiar ciegamente en lo que genera la IA con `/opsx:propose`?

1. **La IA tiende al sesgo de complacencia y a la sobreingeniería (*Feature Creep*):**  
   Cuando un modelo de IA genera una propuesta inicial mediante `/opsx:propose`, tiende a añadir características "deseables" que nadie ha solicitado (como filtros avanzados, búsquedas complejas, persistencias sobrediseñadas o múltiples archivos CSS fragmentados). Si el desarrollador no interviene manualmente podando el archivo `proposal.md` y `tasks.md`, el proyecto se infla artificialmente, multiplicando los puntos de fallo y alargando los tiempos de desarrollo innecesariamente.

2. **Los artefactos (`.md`) constituyen el contrato vinculante del sistema:**  
   En OpenSpec y en la metodología SDD (*Spec-Driven Development*), los archivos markdown no son mera documentación pasiva o decorativa: **son la especificación ejecutable**. Si `spec.md` o `design.md` contienen una contradicción (por ejemplo, definir simultáneamente "aplicación minimalista sin filtros" y al mismo tiempo incluir "buscador en tiempo real"), la IA programará ambas cosas de forma incoherente. Revisar los artefactos a mano garantiza que los cimientos lógicos sean sólidos antes de picar una sola línea de código.

3. **Prevención proactiva de deuda técnica y antipatrones:**  
   Revisar manualmente permite aplicar criterios de calidad sénior que los prompts automáticos pueden pasar por alto: directrices de accesibilidad (WCAG 2.1 AA), prevención de saltos de diseño (*Cumulative Layout Shift* = 0 mediante reserva geométrica idéntica en los skeletons), y principios de diseño anti-slop (*Taste Skill* y *Frontend-Design*). Modificar a mano los archivos `.md` es el mecanismo más económico y eficaz para erradicar defectos arquitectónicos antes de que se conviertan en código defectuoso.

4. **El criterio del programador humano siempre prevalece:**  
   Como establece la propia guía de OpenSpec: *"Tu criterio técnico como programador siempre prevalece sobre el borrador generado por la IA"*. La IA es un ejecutor veloz y prolífico, pero carece de la visión de contexto, sentido común de producto y responsabilidad final que aporta el criterio humano.
