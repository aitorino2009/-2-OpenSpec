# Spec Delta

## Purpose

Proporcionar una interfaz web interactiva que permita explorar una colección de 24 Pokémon con sus ilustraciones oficiales y marcar favoritos persistentes mediante un sistema de likes gestionado localmente en el navegador.

## ADDED Requirements

### Requirement: Carga y Visualización del Catálogo Pokémon
El sistema SHALL obtener y presentar una colección de 24 tarjetas de Pokémon de la primera generación desde la PokéAPI con sus datos básicos e ilustraciones oficiales.

#### Scenario: Carga exitosa del catálogo
- **WHEN** el usuario accede a la aplicación
- **THEN** se muestra un estado de carga con 24 esqueletos animados (skeletons) y posteriormente se renderizan las 24 tarjetas con imagen oficial, nombre capitalizado, número (#XXX) y etiquetas de tipo elemental.

#### Scenario: Fallo de conexión o respuesta errónea
- **WHEN** la petición a la PokéAPI falla o supera el tiempo límite de espera
- **THEN** se ocultan los esqueletos y se muestra un estado de error visual con mensaje amigable y un botón para reintentar la carga.

### Requirement: Interacción y Conmutación de Likes
El sistema SHALL permitir a los usuarios marcar y desmarcar cada Pokémon con un "me gusta" de manera instantánea e intuitiva.

#### Scenario: Marcar un Pokémon con like
- **WHEN** el usuario pulsa el botón de like en una ficha no marcada
- **THEN** el icono del corazón se transforma a color carmesí activo mediante una animación elástica, el atributo `aria-pressed` cambia a `true`, y el contador general de likes de la cabecera se incrementa en 1.

#### Scenario: Desmarcar un Pokémon con like
- **WHEN** el usuario pulsa el botón de like en una ficha ya marcada
- **THEN** el icono del corazón regresa a su estado inactivo neutral, el atributo `aria-pressed` cambia a `false`, y el contador general de likes de la cabecera se decrementa en 1.

### Requirement: Persistencia Local en Navegador
El sistema SHALL guardar y recuperar el conjunto de likes en `localStorage` para garantizar su continuidad entre sesiones.

#### Scenario: Persistencia entre recargas de página
- **WHEN** el usuario ha marcado varios Pokémon y recarga la página
- **THEN** los Pokémon marcados previamente conservan su estado de like activo y el contador general refleja la suma correcta de favoritos guardados.

#### Scenario: Manejo de almacenamiento corrupto o inaccesible
- **WHEN** el dato almacenado en `localStorage` contiene JSON inválido o el almacenamiento está bloqueado
- **THEN** la aplicación captura la excepción, restablece un conjunto vacío en memoria y continúa funcionando sin interrumpir la experiencia de usuario.
