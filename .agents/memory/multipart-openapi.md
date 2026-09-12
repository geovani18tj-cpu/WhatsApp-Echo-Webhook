---
name: Multipart OpenAPI clients
description: How to handle binary multipart uploads when shared generated libraries are checked in a Node-only TypeScript environment.
---

Do not add a binary `multipart/form-data` body to the shared OpenAPI contract when its generated Zod and TypeScript libraries are compiled without DOM types. Keep that upload on a native browser `FormData` request unless the shared library toolchain is intentionally updated to support `File` and `Blob`.

**Why:** The generator emits `z.instanceof(File)` and a `Blob` field type, which fails the shared Node library typecheck because those DOM globals are not available there.

**How to apply:** Use generated hooks for JSON endpoints. For an existing binary upload endpoint, use native `FormData` in the frontend and document why that endpoint is excluded from shared code generation.