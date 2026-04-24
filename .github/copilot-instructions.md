# Copilot instructions for Donver App

## Build, test, and lint

```bash
npm run dev
npm run build
npm run preview
```

- `npm run build` runs `tsc -b && vite build`.
- There is currently **no** `test`, `lint`, or `typecheck` script in `package.json`.
- There is currently **no** configured single-test command because the repo does not include an app test runner yet.

## High-level architecture

- This repository is currently a **frontend bootstrap** for Donver, built with **Vite + React 18 + TypeScript + Tailwind v3**.
- `src\main.tsx` is the browser entrypoint. It mounts `App` and imports the global theme from `src\index.css`.
- `src\App.tsx` is the composition root. It wraps the app with:
  - `QueryClientProvider` from TanStack Query
  - `TooltipProvider`
  - `BrowserRouter`
  - the shadcn toast renderer (`<Toaster />`)
  - Sonner (`<Sonner />`)
- Routing is minimal right now: `/` renders `src\pages\Index.tsx`. Add new pages in `src\pages` and register them in `App.tsx`.
- The current UI layer is mostly shadcn-style primitives in `src\components\ui`. Shared class merging lives in `src\lib\utils.ts` via `cn(...)`.
- Styling is driven by **semantic HSL design tokens** defined in `src\index.css`, then surfaced in `tailwind.config.ts` as Tailwind colors, shadows, gradients, fonts, and animations.
- `components.json` shows this repo is set up like a shadcn/ui project with aliases such as `@/components`, `@/lib`, and `@/hooks`.
- `vite.config.ts` defines the `@` alias to `src` and also dedupes `react`, `react-dom`, and `react/jsx-runtime`. Keep that dedupe in place when editing Vite config.
- `donver-app-rebuild-prompt.md` is the closest thing to a product/architecture roadmap. It describes the intended evolution from this single-page bootstrap into a multi-page pet-care marketplace frontend plus an AWS backend. Treat it as planning context, not as implemented functionality.

## Key conventions

- Use the `@/...` import aliases instead of long relative paths.
- Keep **all product styling token-based**:
  - define or update colors, gradients, shadows, and radii in `src\index.css`
  - mirror new semantic tokens in `tailwind.config.ts`
  - avoid hardcoded color utility classes when a semantic token should exist
- Follow the existing shadcn component pattern for reusable UI:
  - `forwardRef`
  - `class-variance-authority` for variants where needed
  - `cn(...)` for class composition
- There are **two notification systems** in the app:
  - `useToast()` / `<Toaster />` for the shadcn toast flow
  - `<Sonner />` for Sonner notifications
  Keep whichever one a feature starts with instead of mixing patterns within the same interaction.
- `src\hooks\use-toast.ts` keeps toast state in module memory and enforces `TOAST_LIMIT = 1`. If you change toast behavior, account for that centralized state model.
- Product-facing copy in the existing page is **Spanish** and the theme is **"Tropical Pet Paradise"** for a Costa Rica pet-care marketplace. Preserve that tone unless a task clearly changes product content.
- `tsconfig.app.json` runs in strict mode and excludes `src/**/*.test.*` and `src/**/*.spec.*` from the app build. If tests are added later, remember they are not part of the production TypeScript build path by default.
- The repository already includes project MCP context for AWS in `.mcp.json`, and Claude local settings enable project MCP servers with `AWS_PROFILE=default`.
