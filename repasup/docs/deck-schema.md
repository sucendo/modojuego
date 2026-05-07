# Deck schema (normalizado) — Fase 3

Este proyecto mantiene **compatibilidad retroactiva** con decks antiguos mediante una capa de normalización en `engine/deck-utils.js`.

## Estructura del deck

```json
{
  "id": "string",
  "title": "string",
  "subject": "string",
  "level": "string",
  "topics": [{ "id": "t1", "name": "Tema 1" }],
  "modes": ["quiz", "flashcards"],
  "items": [ ... ]
}
```

## Campos comunes por item (normalizados)

- `id: string` (si falta se genera `auto_N`)
- `type: string` (soportados: `pair`, `mcq`, `type`, `tf`, `timeline`, `classify`, `verb`, `vocab`, `grammar_fix`, `sentence_builder`)
- `difficulty: number` (1..3, por defecto 1)
- `units: string[]` (derivado de `units`, `topics`, `topic`)
- `topic: string|null` (primer valor de `units` si no viene definido)
- `category: string|null` (derivado de `category|cat|block|bloque|tag`)
- `tags: string[]` (derivado de `tags` o de `tag/category/cat`)
- `langs: string[]` (derivado de `langs` o `lang`)

## Requisitos mínimos por tipo

- `pair`: `front`, `back`
- `mcq`: `question`, `choices[]`, `answer`
- `type`: `prompt`, `answer`
- `tf`: `statement`, `answer:boolean`
- `timeline`: `prompt`, `events[]`
- `classify`: `prompt`, `groups:{...}`
- `verb`: `base`, `past`, `pp`
- `vocab`: `en`, `es`
- `grammar_fix`: `wrong`, `right`
- `sentence_builder`: `words[]`, `answer`

## Compatibilidad legacy

El motor **adapta automáticamente** decks antiguos:

- `topic|topics|u|units` -> `units`
- `cat|category|tag|block|bloque` -> `category`
- `lang|langs` -> `langs`
- inferencia ligera de `type` cuando falta (`mcq`, `type`, `tf`, `pair`)

## Validación

Se realiza validación interna ligera (sin dependencias externas):

- IDs faltantes/duplicados
- tipos no soportados
- campos mínimos ausentes según tipo
- arrays/estructuras vacías en `timeline` y `classify`

Los avisos se registran en consola (`console.warn`) pero no bloquean la carga, para mantener compatibilidad.
