# Copilot instructions for Donver App

> **Detailed rule sets** live in `.github/instructions/`. This file is the global entry point.
> Copilot will automatically apply instruction files whose `applyTo` glob matches the file being edited.

---

## Build commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build  (must exit 0 before task is done)
npm run preview    # preview production build locally
```

```bash
cd aws && npx cdk synth   # validate CDK changes (must exit 0 before task is done)
```

There is currently **no** `test`, `lint`, or `typecheck` standalone script.

---

## Repository layout

```
/                        ← Frontend (React 18 + Vite + TypeScript + Tailwind v3)
  src/
    App.tsx              ← Composition root + BrowserRouter + providers
    pages/               ← One file per route
    components/          ← Feature and shared components
    components/ui/       ← shadcn-style primitives (Radix UI)
    hooks/               ← Custom React hooks
    services/api.ts      ← ALL HTTP calls centralised here
    types/               ← Shared TypeScript types
    lib/utils.ts         ← cn() and pure helpers
    index.css            ← Semantic HSL design tokens
  tailwind.config.ts     ← Mirrors tokens from index.css

aws/                     ← AWS CDK infrastructure + Lambda handlers
  lib/                   ← CDK stack definitions (auth, data, api, shared)
  lambda/handlers/       ← One folder per Lambda
  lambda/shared/         ← Shared Lambda utilities
```

---

## Global rules (all files)

### Never do without explicit user permission
- `cdk deploy` or any AWS deployment
- `git push --force`, amending published commits
- Dropping DynamoDB tables or S3 buckets
- `npm install <pkg>` (installing new packages)
- Modifying `.env` files or secrets
- Running `rm -rf` on any directory

### Always do after changes
- Frontend: run `npm run build` — must exit 0.
- CDK/infra: run `cd aws && npx cdk synth` — must exit 0.

### Minimum-change discipline
- Make only the change requested. Do not refactor, add features, or improve unrelated code.
- Do not add comments, docstrings, or type annotations to code you did not change.
- Do not mix unrelated fixes in the same diff.

---

## Product context

- **Donver** is a Costa Rica pet-care marketplace.
- Product-facing copy is in **Spanish**. Theme: "Tropical Pet Paradise".
- Roles: `owner`, `caregiver`, `both`. See `.github/instructions/donver-product.instructions.md`.
- Booking states (MVP): `pending` → `confirmed` or `cancelled`.
- Never expose internal IDs, Cognito subs, or DynamoDB keys to the end user.

---

## Frontend conventions

- Import alias: `@/...` → `src/`. Never use `../../..` relative paths.
- All HTTP calls via `src/services/api.ts` — no inline `fetch`/axios in components.
- Styling: tokens in `src/index.css`, mirrored in `tailwind.config.ts`. No hardcoded colors.
- shadcn components: `forwardRef` + `cva` + `cn()`.
- Two notification systems — use whichever the surrounding feature uses:
  - `useToast()` + `<Toaster />` (`TOAST_LIMIT = 1`)
  - Sonner `toast()` + `<Sonner />`
- TanStack Query: invalidate keys after mutations. Never sync cache with local state manually.
- Always handle `isLoading`, `isError`, empty, and success states. Never show empty state while loading.

---

## AWS / CDK conventions

- All infrastructure via CDK — no manual Console resource creation.
- IAM least privilege: each Lambda gets only the DynamoDB operations it needs for its specific table.
- Lambda must validate role/ownership (not just the frontend).
- Check CloudWatch logs before guessing the cause of a 500 error.
- API Gateway must return CORS headers on both success and error responses.
- Use pre-signed S3 URLs for client uploads.

---

## Agent workflow (before / during / after)

**Before implementing:**
1. Summarise probable root cause.
2. List every file to be touched.
3. Confirm scope with user if unclear.

**During:**
- Minimum change only.
- Do not touch out-of-scope files.
- Do not mix phases.

**After:**
- Report: root cause, files modified, commands run, build/synth result, open items.

---

## Detailed instruction files

| File | Scope |
|------|-------|
| `.github/instructions/donver-product.instructions.md` | Business rules, roles, booking states, data display |
| `.github/instructions/react-ui.instructions.md` | React, Vite, TanStack Query, components, routing |
| `.github/instructions/aws-serverless.instructions.md` | CDK, Lambda, DynamoDB, Cognito, S3, IAM, CORS |
| `.github/instructions/ux-debugging.instructions.md` | Chrome DevTools MCP debugging checklist |

---

## MCP configuration

- `.mcp.json` at repo root configures Claude MCP servers (AWS profile `default`).
- `.vscode/mcp.json.example` is a template for VS Code MCP — copy and fill in locally; never commit with real credentials.
- `tsconfig.app.json` strict mode excludes `*.test.*` and `*.spec.*` from the production build.
- `vite.config.ts` dedupes `react`, `react-dom`, and `react/jsx-runtime` — keep this dedupe when editing Vite config.
