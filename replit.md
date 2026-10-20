# DJIBY’S BUSINESS INTERNATIONAL

Site institutionnel bilingue présentant les solutions automobiles, projets de mobilité, demandes commerciales et partenariats de DBI au Sénégal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/dbi-mobility run dev` — run the DBI website
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — managed PostgreSQL connection
- Required for admin access: `DBI_ADMIN_EMAILS` — comma-separated list of verified Clerk email addresses authorized to administer DBI
- Clerk environment variables are provisioned by Replit-managed Clerk; do not hardcode them.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dbi-mobility` — bilingual DBI website and administration interface
- `artifacts/api-server` — shared API, inquiry handling, article management, Clerk middleware
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/dbi.ts` — inquiry and news persistence

## Architecture decisions

- Clerk handles authentication; server-side authorization checks a verified email against `DBI_ADMIN_EMAILS`.
- Public inquiries are persisted and protected by a honeypot plus per-IP submission limits.
- News content is admin-managed; no sample stories, testimonials, partner names, or logos are seeded.
- Article images use an HTTPS image URL field; uploaded-file storage is not part of the initial site.

## Product

Public visitors can explore DBI's vehicle and mobility solutions, developing automotive centre, partnership opportunities, and confirmed contact details in French or English. Authorized administrators can manage inquiries and news articles.

## User preferences

- French is the primary language; English is provided for international partners.
- Use DBI's institutional navy, blue, restrained gold, white, and light grey palette.
- Present 5,000 vehicles as a first-phase objective and up to 35,000 over ten years as a conditional strategic ambition.
- Present the integrated automotive centre as a project in development.

## Gotchas

- Admin access is disabled until `DBI_ADMIN_EMAILS` includes a verified email for the intended administrator.
- Production and development Clerk identities are separate; the administrator must sign in in each environment.
- Do not publish partner logos or claim stock, pricing, delivery timelines, operational facilities, or other unconfirmed facts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
