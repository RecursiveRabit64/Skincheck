---
name: Orval Zod/Types re-export conflict
description: How to fix TS2308 when Orval generates same name as both Zod const (api.ts) and TS interface (types/)
---

## The Rule

Do NOT use `export * from "./generated/types"` in `lib/api-zod/src/index.ts`. Instead, selectively re-export only types that have no corresponding Zod schema in `api.ts`, using `export type *` per-file.

## Why

When an OpenAPI component schema (e.g. `CreateChildProfileBody`) is used as a request body, Orval generates:
1. A Zod `const CreateChildProfileBody = zod.object({...})` in `api.ts`
2. A TypeScript `interface CreateChildProfileBody` in `types/createChildProfileBody.ts`

Re-exporting `*` from both files in the barrel causes TS2308 ("re-exported binding of ambiguous name"). `export type *` from the types barrel does NOT resolve it because TypeScript still sees the name conflict.

## How to Apply

In `lib/api-zod/src/index.ts`:
- Keep `export * from "./generated/api"` (Zod schemas, covers both values and their inferred types)
- Replace `export * from "./generated/types"` with per-file `export type *` for ONLY types not already exported as Zod schemas (e.g. `AuthUser`, `ChildProfile`, envelope types)
- After running codegen, check if new component schemas that are also request body schemas appear in both `api.ts` AND `types/`; if so, add them to the excluded list or import selectively
