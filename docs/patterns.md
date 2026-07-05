# Patrones de diseño

Los patrones se usan **declarados y reutilizables**, nunca implícitos ni especulativos. La regla de oro para abstraer: **dos consumidores reales** antes de crear un `shared` (nada de abstracción anticipada por si acaso).

## En uso

| Patrón | Dónde | Para qué |
|---|---|---|
| **Chain of Responsibility** | `bootstrap/middlewares/errors/` | La cadena de handlers de error (`bodyParse → zod → emmett → mongo → fallback`). |
| **Template Method** | `ErrorHandler` (base de la cadena) | `setNext`/`delegate`/`respond` comunes; cada eslabón implementa su reconocimiento. |
| **Adapter** | `core/adapters/` · `external-services/` | Escudo frontera: el dominio conoce un contrato propio; el adapter habla con la librería externa (Clerk, S3, time, logger). |
| **Factory Method** | modelos por `Connection` · `build()` de la cadena | Crear el modelo Mongoose sobre una conexión concreta; construir la cadena de errores. |
| **Facade** | `DatabaseConnector` | Fachada estática sobre la conexión de Mongoose (`initialize`, `getPortfolioDb`). |
| **Data Mapper** | `BaseRepository` + `toDomain()` | El documento de Mongoose se mapea a entidad de dominio; el documento no sale del repositorio. |
| **Command/Query separados** | slices (CQRS lite con Emmett) | Separación de escritura y lectura; vocabulario de errores de dominio. |

*Futuros* (al activar event sourcing selectivo): **Observer** (eventos/proyecciones), **State** (deciders).

## Abstracciones compartidas

Extraídas **solo** cuando hubo dos consumidores reales:

- **`BaseEntity<TProps>`** (`domain/shared/entities`): `toEntity()`/`toEntityMap()` heredados por las 9 entidades. Solo se sobrescribe `toEntity()` en las que tienen arrays (blog `tags`, project `tech`, experience `tasks`).
- **`BaseRepository<TDoc, TEntity, TCreate>`**: CRUD + paginación + conteo. `toDomain()` es concreto (normaliza `_id` una vez) y delega en la factory abstracta `buildEntity(props)` que cada repo implementa en una línea.
  - **`LocaleSingletonRepository`** → `findByLocale()`.
  - **`PublishedByLocaleRepository`** → `findPublished()`.
- **DTOs compartidos** (`domain/dtos/shared`): `LocaleDto`, `OptionalLocaleDto`, `SlugLocaleDto`. `slugSchema` (con `slugify`) rechaza slugs no canónicos con `400` en la frontera.
- **`buildListBody`** (`domain/shared/pagination`): única fuente del array plano vs envelope `{ data, meta }`.

## Helper vs Adapter

Distinción **arquitectónica** (hacia dónde apuntan las dependencias), no de tamaño:

- **Adapter** = escudo/frontera (DIP + OCP). `negocio → interfaz propia ← adapter → librería externa`. Protege el núcleo de un sistema externo transformando su interfaz. Si el proveedor cambia, solo cambia el adapter.
- **Helper** = utilitario (DRY). `negocio → helper genérico`. Tarea técnica pequeña y repetida; el negocio lo llama directamente. Se mantiene trivial y puro.

> Un helper que empieza a conocer estructuras de un proveedor está pidiendo ser adapter.

## Cuándo NO aplicar un patrón

- **No** metas un use-case si el service solo delega 1:1 (passthrough). El use-case es **solo** para workflows multi-paso.
- **No** crees un `shared` con un único consumidor.
- **No** actives event sourcing donde un CRUD basta: Emmett es hoy CQRS lite; el event store llega **selectivamente**.
- **No** dejes carpetas vacías ni specs especulativas: el código muerto se elimina.

## Auditoría

El agente `patterns-auditor` (read-only) revisa la fidelidad de los patrones declarados, la regla de los dos consumidores, SOLID/KISS y el código muerto. Ver el skill `design-patterns` para el catálogo completo mapeado a este backend.
