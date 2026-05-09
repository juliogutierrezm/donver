# Donver — React / UI / Frontend Rules

<!-- applyTo: "src/**/*.{ts,tsx}" -->

Rules for all frontend work in `src/`. These apply to components, pages, hooks, services, and styling.

---

## Stack

| Tool | Version / Notes |
|------|----------------|
| React | 18, with JSX transform |
| TypeScript | Strict mode (`tsconfig.app.json`) |
| Vite | 7, `@` alias → `src/` |
| Tailwind CSS | v3, semantic HSL tokens |
| React Router DOM | v6 — `BrowserRouter` in `App.tsx` |
| TanStack Query | Data fetching, caching, invalidation |
| shadcn-style components | Radix UI wrapped, in `src/components/ui/` |
| Notifications | `useToast()` + Sonner (see below) |

---

## File organisation

- **Pages** → `src/pages/` (one file per route)
- **Feature components** → `src/components/`
- **Primitive/UI components** → `src/components/ui/`
- **Custom hooks** → `src/hooks/`
- **All HTTP calls** → `src/services/api.ts` — never inline `fetch`/axios inside components
- **Shared types** → `src/types/`
- **Pure helpers** → `src/lib/`
- **Design tokens** → `src/index.css` + `tailwind.config.ts`

---

## Routing rules

- Register every new page in `src/App.tsx`.
- Do not hard-code paths in components — derive them from existing route constants or import from a shared location.
- Never break existing routes. Run `npm run build` to verify.

---

## Data fetching with TanStack Query

```tsx
// ✅ Correct pattern
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['spaces', filters],
  queryFn: () => api.listSpaces(filters),
});
```

- Use `queryKey` arrays that include all parameters affecting the result.
- After a mutation, **invalidate** the relevant query keys so the UI refetches fresh data.
- Never manually sync query cache with local state — let TanStack Query be the single source of truth.
- Avoid duplicating API logic inside components. Call `src/services/api.ts` functions.

---

## Loading / empty / error / success states

Every data-driven view must handle all four states explicitly:

```tsx
if (isLoading) return <LoadingSpinner />;        // spinner or skeleton
if (isError)   return <ErrorMessage error={error} />;  // human-readable
if (!data || data.length === 0) return <EmptyState />; // no data
return <SuccessView data={data} />;
```

Rules:
- **Never** render an empty state while a query is still loading — check `isLoading` first.
- Avoid flash of "no results found" before the request completes.
- Error messages must be user-friendly Spanish strings, not raw error objects or HTTP status codes.

---

## Component patterns (shadcn style)

```tsx
const MyComponent = React.forwardRef<HTMLDivElement, MyProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(variants({ variant }), className)} {...props} />
  )
);
MyComponent.displayName = 'MyComponent';
```

- Use `forwardRef` for DOM-exposed components.
- Use `class-variance-authority` (`cva`) for multi-variant components.
- Use `cn()` from `@/lib/utils` for class composition — never string concatenation.
- Use existing components from `src/components/ui/` before creating new ones.
- Do not perform large visual refactors unless the task explicitly requires it.

---

## Styling rules

- All colors and visual tokens live in `src/index.css` as CSS HSL variables.
- They are surfaced in `tailwind.config.ts` — add new semantic tokens there, not as arbitrary Tailwind values.
- Avoid hardcoded hex/rgb/hsl literals in className strings.
- Use `@/...` import aliases. Never use `../../..` relative paths.

---

## Notification systems

Two systems coexist — **do not mix them** within the same user interaction:

| System | When to use |
|--------|-------------|
| `useToast()` + `<Toaster />` | shadcn-style toasts; `TOAST_LIMIT = 1` enforced in `src/hooks/use-toast.ts` |
| Sonner `toast()` + `<Sonner />` | Richer notifications |

Use whichever system is already used in the surrounding feature.

---

## TypeScript rules

- Strict mode is on — no `any` unless absolutely unavoidable and commented.
- Keep shared types in `src/types/index.ts` or `src/types/messaging.ts`.
- Do not redefine types that already exist in `src/types/`.
- Test files (`*.test.*`, `*.spec.*`) are excluded from the production build by `tsconfig.app.json`.

---

## CTAs and buttons

- Every visible button must have a real action, be `disabled`, or be visually labelled as "próximamente".
- CTAs must match the user's real `experienceMode` — never show "Ir a mi dashboard" to an owner-only user.
- Never leave a button with an empty `onClick` handler without a `disabled` prop.

---

## Build verification

Run after every frontend change:
```bash
npm run build
```

The command must exit 0. Do not mark a task complete if the build is broken.
