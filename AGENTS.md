# AGENTS.md — Donver Project

This file provides guidance for AI coding agents (Codex, Copilot, Claude, etc.) working in the Donver repository. Read this before making any changes.

---

## What is Donver?

Donver is a **Costa Rica pet-care marketplace** where pet owners can find and book verified caregivers who offer lodging, walks, or hourly care for pets. The product language is **Spanish**. The visual theme is **"Tropical Pet Paradise"**.

---

## Repository layout

```
/                        ← Frontend (React + Vite + TypeScript + Tailwind v3)
  src/
    App.tsx              ← Composition root + routing
    pages/               ← One file per page/route
    components/          ← Feature and shared components
    components/ui/       ← shadcn-style primitives
    hooks/               ← Custom React hooks
    services/api.ts      ← Centralised HTTP client (ALL API calls go here)
    types/               ← Shared TypeScript types
    lib/utils.ts         ← cn() and other pure helpers
    index.css            ← Semantic HSL design tokens
  tailwind.config.ts     ← Mirrors tokens from index.css

aws/                     ← AWS CDK stack + Lambda handlers
  lib/                   ← CDK stack definitions
  lambda/handlers/       ← One folder per Lambda function
  lambda/shared/         ← Shared Lambda utilities
```

---

## Absolute rules for agents

### Never do any of these without explicit user permission:
- `cdk deploy` or any AWS deployment
- `git push --force` or amending published commits
- Dropping DynamoDB tables or S3 buckets
- Installing npm packages (`npm install <pkg>`)
- Modifying environment variables or secrets files
- Running `rm -rf` on any directory

### Safe to do freely:
- Reading files, searching code, running `npm run build` or `cdk synth`
- Creating or editing files in `src/`, `aws/lib/`, `aws/lambda/`
- Creating documentation or instruction files

---

## Before implementing any change

1. **Summarise** the probable root cause in one paragraph.
2. **List** every file you plan to touch.
3. **Confirm scope** — do not expand the scope without asking.

## During implementation

- Make the **minimum change** that solves the problem.
- Do not touch files outside the agreed scope.
- Do not mix unrelated fixes in the same diff.

## After implementation

Report:
- Root cause identified
- Files modified (with brief reason)
- Commands run (build, synth, etc.) and their results
- Any remaining open issues or follow-up tasks

---

## Detailed rule sets

Detailed instructions for each domain are in `.github/instructions/`:

| File | Scope |
|------|-------|
| `donver-product.instructions.md` | Business rules, roles, booking states |
| `react-ui.instructions.md` | Frontend React/Vite/TanStack Query patterns |
| `aws-serverless.instructions.md` | CDK, Lambda, DynamoDB, Cognito, S3, IAM |
| `ux-debugging.instructions.md` | Chrome DevTools MCP debugging checklist |

Global Copilot rules live in `.github/copilot-instructions.md`.

---

## Build verification

After any frontend change:
```bash
npm run build
```

After any CDK/infra change:
```bash
cd aws && npx cdk synth
```

Both commands must exit with code 0 before the task is considered done.

---

## Design tokens

- Define new visual tokens in `src/index.css` (HSL variables).
- Mirror them in `tailwind.config.ts`.
- Never use hardcoded hex/rgb colors or Tailwind utilities when a semantic token should exist.

## Import aliases

Use `@/...` imports (mapped to `src/`). Never use long relative `../../` paths.

## Notifications

Two systems coexist — use whichever one a feature already uses:
- `useToast()` + `<Toaster />` (shadcn, `TOAST_LIMIT = 1`)
- Sonner `<Sonner />`

Do not mix both systems within the same user interaction.
