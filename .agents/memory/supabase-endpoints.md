---
name: Supabase endpoint validation
description: Detecting a Supabase dashboard URL or incorrectly targeted connector before relying on PostgREST.
---

Before treating a Supabase connection as ready, verify that its REST target resolves to a project-ref host ending in `.supabase.co`. A valid URL alone is insufficient.

**Why:** A connector or `SUPABASE_URL` can point to the Supabase dashboard. Requests to `/rest/v1/...` then return an HTML 404 page instead of a PostgREST response, which can be mistaken for a missing table.

**How to apply:** Check only the hostname shape without printing the configured URL. Distinguish an HTML dashboard 404 from a PostgREST JSON schema error, and ask for the Project URL from Supabase Project Settings → API when needed.