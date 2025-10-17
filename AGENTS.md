# Repository Guidelines

## Project Structure & Module Organization
The application is split into `front/` (React + TypeScript, Vite) and `back/` (Express + Drizzle ORM). Postgres tooling—Compose file, init SQL, TSV seeds, helper scripts—lives under `docker/postgres/dev/`. Static assets produced by the Vite build are served from `back/dist/` after the backend build. Keep feature work scoped to its module: UI concerns in `front/src/`, API routes, data adapters, and schema updates in `back/src/`. Tests belong beside the code they cover, using `__tests__` folders when necessary.

## Build, Test, and Development Commands
Run `./start.sh` for a production-like stack (builds both apps, boots PostgreSQL, launches Express on port 3001). For iterative work, use `npm run dev` inside `front/` and `back/` (the latter seeds `DATABASE_URL` for local Docker). Build front-end artifacts with `npm run build` in each package; backend uses `tsc` while the front-end runs the Vite pipeline. Lint React code with `npm run lint` from `front/`.

## Coding Style & Naming Conventions
Both packages target modern TypeScript with ECMAScript modules. Favor 2-space indentation, single quotes, and explicit return types on exported utilities. Front-end components use PascalCase file names, hooks stay in `useThing.ts`, and backend route handlers should match their HTTP verb (`getRequests.ts`). Run ESLint before sending patches; align with existing React hook rules and Drizzle schema typing.

## Testing Guidelines
Automated tests are not yet in place—add them when touching complex logic. Prefer Vitest for React components and Jest or supertest for Express endpoints. Name test files `<module>.test.ts[x]`. Always run `npm run build` (both apps) and exercise critical flows manually, especially request creation and admin approvals.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects ("add dev script", "rename AGENT > AGENTS"). Keep bodies focused on rationale or follow-up steps. Pull requests should include: concise summary, linked issue or ticket, local verification notes, and UI screenshots for visible changes. Call out schema migrations, new environment variables, and manual remediation steps so other agents can follow without surprises.
