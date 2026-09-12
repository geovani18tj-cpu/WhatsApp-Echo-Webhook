# CLAUDE.md

Instructions for Claude Code working in this repository. Keep this file short:
every line should be something Claude would actually get wrong without it —
delete anything that's just restating good defaults.

## Project

WhatsApp Echo Webhook — a webhook service that receives WhatsApp messages
(via the WhatsApp Business/Cloud API) and echoes them back. The codebase is
not yet scaffolded.

<!--
Once code exists, fill these in with real, verified commands (don't leave
placeholders — a wrong command is worse than no command):

## Setup
- Install deps: `<fill in>`
- Env vars needed (webhook verify token, WhatsApp access token, phone number
  ID, etc.): document in `.env.example`, never commit real secrets.

## Commands
- Run locally: `<fill in>`
- Run tests: `<fill in>`
- Lint/format: `<fill in>`

## Architecture
- Webhook verification (GET, hub.challenge handshake) vs. message handling
  (POST) — note where each lives once implemented.
- Where outbound WhatsApp API calls are made and how the access token is
  loaded.
-->

## Conventions

- Never commit secrets (WhatsApp tokens, verify tokens, `.env` files). Use
  `.env.example` for documenting required variables.
- Validate/verify incoming webhook requests (signature or verify-token check)
  before trusting payload contents — this is a public HTTP endpoint.
- Keep commit messages focused on *why*, not a restatement of the diff.

## Working in this repo

- This file should stay small. When adding a section, ask whether Claude
  would produce a worse result without it — if not, leave it out.
- Prefer editing this file incrementally as real structure (build tooling,
  test framework, deployment target) is added, rather than pre-writing
  speculative instructions for tooling that doesn't exist yet.
