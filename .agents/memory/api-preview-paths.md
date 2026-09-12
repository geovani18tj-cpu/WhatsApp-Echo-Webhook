---
name: API preview path aliases
description: How the API artifact preview base affects routes used by admin pages.
---

When a frontend owns a public page such as `/admin`, the API artifact must not claim that public path in its service routing. Keep an equivalent `/api/admin` endpoint only as a redirect to the frontend page.

**Why:** Artifact service paths are routed before client-side routes. If the API claims `/admin`, the frontend can never render its `/admin` page; removing only the Express handler leaves an API-served 404.

**How to apply:** Register non-API public pages only on the frontend's root service. If legacy API callers need an alias, expose it under `/api/*` and redirect to the frontend route.