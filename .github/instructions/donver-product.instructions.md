# Donver — Product & Business Rules

<!-- applyTo: "**/*.{ts,tsx}" -->

These rules define the Donver domain model. Every agent or developer must follow them when touching product logic, UI copy, routing, or data flows.

---

## What is Donver

Donver is a **Costa Rica pet-care marketplace**. Pet owners can discover and book verified caregivers who offer lodging, walks, or hourly care. All product-facing copy is in **Spanish**. The visual theme is **"Tropical Pet Paradise"**.

---

## User roles

| Role | Description |
|------|-------------|
| `owner` | Can register pets, search/book spaces, view own bookings, manage favourites. |
| `caregiver` | Can create/edit spaces, manage availability, view received bookings, accept/reject/cancel bookings. |
| `both` | Has both capabilities and can switch active view between `owner` and `caregiver`. |

### Role enforcement rules

- A user with role `owner` only must **never** see the caregiver dashboard or caregiver-specific UI.
- A user with role `caregiver` only must **never** see owner booking flows or be able to make reservations.
- Only a user with role `both` can switch between owner and caregiver views.
- A caregiver-only user may browse the spaces listing for discovery, but must not be able to initiate a booking.
- **Nobody can book their own space** — enforce this check in both frontend and backend.
- If a caregiver wants to make a booking, they must first activate an owner profile.
- If an owner wants to publish a space, they must complete caregiver onboarding first.

---

## Booking states (MVP)

| State | Display label (ES) | Meaning |
|-------|--------------------|---------|
| `pending` | Pendiente | Awaiting caregiver approval |
| `confirmed` | Confirmada | Accepted by caregiver |
| `cancelled` | Cancelada | Cancelled or rejected (by either party) |

- `completed` is out of MVP scope unless explicitly requested.
- Never expose raw state strings to the user — always map to the Spanish display label.

---

## Booking logic constraints

- `maxPets` on a space means the maximum number of pets within **a single booking**, not a global cap.
- Multiple pets from the **same owner** can be included in one booking, provided the total does not exceed `maxPets`.
- **No overlapping bookings**: a confirmed or pending booking for a date range blocks that space for other owners. Do not allow two different owners to book the same space for overlapping dates.

---

## Data display rules

- **Never show** Cognito sub IDs, DynamoDB partition/sort keys, UUIDs, or other internal identifiers to the end user.
- Always display human-readable labels: user name, space title, email, or a sensible fallback.
- Error messages shown in the UI must describe the real user-facing problem, not technical details:
  - "No tienes perfil de dueño activo" — not "role mismatch"
  - "No tienes mascotas registradas" — not "pets array empty"
  - "Este espacio es tuyo" — not "owner ID match"
  - "Mascota incompatible con este espacio" — not "pet type not in allowed list"
  - "No tienes permisos para esta acción" — not "403 Forbidden"
  - "No se encontró el recurso" — not "404"

---

## `experienceMode` values (frontend hook)

The `useAuthSessionUser` hook exposes `experienceMode`. Known values:

| Value | Meaning |
|-------|---------|
| `owner` | User is owner only |
| `caregiver` | User is caregiver only |
| `caregiver_pending` | Caregiver onboarding not yet complete |
| `both` | User has both roles |
| `unauthenticated` | Not logged in |

CTAs and navigation must reflect the real `experienceMode`. Never hardcode role assumptions.

---

## Navigation & routing

- `/` — Home (HeroSection + marketing content)
- `/spaces` — Search and browse spaces
- `/spaces/:id` — Space detail + booking
- `/profile` — User profile
- `/become-caregiver` — Caregiver onboarding
- `/caregiver/dashboard` — Caregiver-only dashboard
- `/bookings/:id` — Booking detail (owner view)
- `/messages` — Messaging centre
- `/login`, `/register`, `/verify-email` — Auth flows

Do not add routes without also registering them in `src/App.tsx`.

---

## Content language

- All user-visible strings must be in **Spanish**.
- Internal code (variable names, file names, function names) can be in English.
- Do not translate or change existing Spanish copy unless the task explicitly requires it.
