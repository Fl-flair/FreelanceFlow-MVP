# FreelanceFlow

A private, niche-neutral workbench for solo freelancers to manage clients, proposals, invoices, payment status, and editable reminder drafts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/freelanceflow run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, Clerk-managed server/client keys, and `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, Wouter, TanStack Query, Clerk
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Web app: `artifacts/freelanceflow/`
- API routes: `artifacts/api-server/src/routes/freelance.ts`
- API contract: `lib/api-spec/openapi.yaml`
- Database schema: `lib/db/src/schema/`
- Generated API hooks and validators: `lib/api-client-react/` and `lib/api-zod/`
- Theme and pages: `artifacts/freelanceflow/src/index.css` and `src/App.tsx`

## Architecture decisions

- Clerk cookie-based sessions protect freelance API routes; every data query is scoped to the authenticated user.
- OpenAPI is the API source of truth; regenerate client hooks and Zod validators after contract changes.
- Invoice and proposal amounts are stored as integer cents; invoices export through the browser print dialog.
- Payment reminders are editable text drafts, never sent automatically; users copy the message and mark it sent manually.

## Product

- Client records with search and edit/delete actions.
- Manually written proposals with status tracking and conversion to invoices after acceptance.
- Invoice creation, PDF printing, due-date tracking, and manual paid/unpaid status updates.
- Editable before-due, due-date, and late reminder templates; sending is always controlled by the freelancer.
- AI proposal drafting is not available; users can write and edit proposal content manually.

## User preferences

- Keep the first release niche-neutral.
- Do not add automatic reminder emails or represent payment collection as built in.

## Gotchas

- `pnpm --filter @workspace/db run push` updates the development database only. Apply the production schema separately before publishing data-backed features.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
