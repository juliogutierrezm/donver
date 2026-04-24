# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

- **Dev server**: `npm run dev` (runs Vite in watch mode)
- **Build**: `npm run build` (runs `tsc -b && vite build` for type checking + bundling)
- **Preview**: `npm run preview` (preview the built output locally)

> **Note**: There is currently no `test`, `lint`, or `typecheck` standalone script. Testing infrastructure has not been added yet.

## Architecture Overview

This is a **frontend-only bootstrap** for Donver, a Costa Rica pet-care marketplace. The tech stack is:

- **Framework**: React 18 + TypeScript (strict mode)
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v3 + semantic HSL design tokens
- **Routing**: React Router DOM v6
- **Data Fetching**: TanStack Query (React Query)
- **Components**: shadcn-style primitives (Radix UI wrapped)
- **Notifications**: shadcn toast (`useToast` + `<Toaster />`) and Sonner (`<Sonner />`)

### Entry Points & App Setup

- **Browser entry**: `src/main.tsx` → mounts `<App />` and imports global theme from `src/index.css`
- **App composition root**: `src/App.tsx` wraps the entire app with:
  - `QueryClientProvider` (TanStack Query)
  - `TooltipProvider` (Radix)
  - `BrowserRouter` (React Router)
  - `<Toaster />` (shadcn toast renderer)
  - `<Sonner />` (Sonner notifications)

### Folder Structure

```
src/
├── components/ui/   # Shadcn-style reusable primitives (Button, Dialog, etc.)
├── components/      # Feature-level components (use when not in ui/)
├── hooks/           # Custom React hooks (e.g., use-toast.ts)
├── lib/             # Utilities (cn() for class merging, etc.)
├── pages/           # Page components (register new pages in App.tsx)
└── index.css        # Semantic design tokens (colors, gradients, shadows, fonts, animations)
```

### Routing

Minimal routing currently: `/` renders `src/pages/Index.tsx`. To add new pages:
1. Create component in `src/pages/`
2. Register route in `src/App.tsx`

### Styling & Design Tokens

**All product styling is token-based**. Colors, gradients, shadows, radii, and animations are:
1. Defined as semantic HSL variables in `src/index.css`
2. Surfaced in `tailwind.config.ts` as Tailwind config (colors, gradients, shadows, animations)
3. Applied via Tailwind utilities and `cn()` helper

When adding new visual styling:
- Define the semantic token in `src/index.css` (not inline Tailwind classes)
- Mirror it in `tailwind.config.ts`
- Use the token instead of hardcoded color utilities

### Component Patterns

Follow the existing shadcn component pattern for reusable UI:
- Use `forwardRef` for DOM access
- Use `class-variance-authority` for variants where needed
- Use `cn()` from `src/lib/utils.ts` for class composition

### Notifications

Two notification systems are available; **use whichever one your feature starts with**—don't mix within the same interaction:
- **shadcn toast**: `useToast()` hook + `<Toaster />` (enforces `TOAST_LIMIT = 1`, kept in module memory in `src/hooks/use-toast.ts`)
- **Sonner**: Direct `<Sonner />` component integration

### Project Context & Product

- **Language**: Spanish (product-facing copy)
- **Theme**: "Tropical Pet Paradise" (Costa Rica pet-care marketplace tone)
- **Roadmap reference**: `donver-app-rebuild-prompt.md` describes the intended evolution from this single-page bootstrap into a multi-page marketplace frontend + AWS backend; treat as planning context, not implemented functionality

## Key Conventions

- **Import aliases**: Use `@/...` paths instead of relative imports (e.g., `@/components`, `@/lib`, `@/hooks`)
- **TypeScript**: Strict mode enabled in `tsconfig.app.json`; test files (`src/**/*.test.*`, `src/**/*.spec.*`) are excluded from the app build
- **Vite config**: React, react-dom, and react/jsx-runtime are deduped; keep this dedupe if editing `vite.config.ts`
- **MCP context**: Project MCP for AWS is configured in `.mcp.json` with `AWS_PROFILE=default`
- **Component aliases**: shadcn-style aliases are already set up in `components.json` (`@/components`, `@/lib`, `@/hooks`)

## Design Principles

Apply **SOLID principles** where applicable (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), **DRY** (Don't Repeat Yourself), and **KISS** (Keep It Simple). Favor composition over inheritance. Prioritize maintainability—refactor only when necessary, not preemptively.

## Development Workflow

- Create feature branches: `feat/<description>` or `fix/<issue>`
- Follow Conventional Commits (e.g., `feat: add pet search filter`)
- Ensure build succeeds (`npm run build`) before committing
- PRs for UI changes should include screenshots/GIFs and risk assessment
