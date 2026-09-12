# Likkle Table WhatsApp + Instagram command centre

Protected multi-business inbox automation with FAQ and private media replies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Supabase setup: run `supabase/schema.sql` in the Supabase SQL editor, then optionally run `supabase/demo_seed.sql` for fake walkthrough data. The app uses the Replit Supabase connector; do not configure database URL or service-role credentials in app code.
- Configure `ADMIN_TOKEN`, `WHATSAPP_VERIFY_TOKEN` (or the legacy `VERIFY_TOKEN`), and optionally `WHATSAPP_API_VERSION` / `META_APP_SECRET` as Replit Secrets. Open `/admin` and enter the admin token for the current browser session.
- In Meta, connect WhatsApp and Instagram to the same webhook path `/webhook` and subscribe to messages. Instagram requires a Professional (Business or Creator) account linked to a Facebook Page. Add each business's per-channel credentials through `/admin`; they are never returned by list/read APIs or persisted in the browser.
- Complete Meta's webhook verification and external subscription steps before treating traffic as live. `/demo` remains the sample command-centre experience.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
