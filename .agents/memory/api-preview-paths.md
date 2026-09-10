---
name: API preview path aliases
description: How the API artifact preview base affects routes used by admin pages.
---

When an API artifact is previewed under `/api`, a page that is required at `/admin` should also expose an equivalent `/api/admin` route for the artifact preview.

**Why:** Replit's artifact preview resolves paths relative to the artifact's configured preview path, while the service can still receive the public path directly.

**How to apply:** Keep the required public route and add a preview-base alias when presenting an admin or other non-API page from the API artifact.