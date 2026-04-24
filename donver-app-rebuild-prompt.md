# 🐾 Donver App — Prompt Maestro de Reconstrucción

> Este documento es un prompt completo y autocontenido para reconstruir **Donver App** desde cero con frontend en React y backend en AWS. Cada **Fase** está diseñada para ejecutarse en orden secuencial. Las instrucciones están redactadas en imperativo dirigido a la IA.

---

## 🎯 Visión del producto

Donver App es un **MVP multitenant tipo Airbnb para mascotas en Costa Rica**. Conecta **dueños de mascotas** con **cuidadores** que ofrecen espacios de hospedaje y cuidado por hora o por noche.

- **Idioma**: 100% en español (es-CR).
- **Moneda**: Colones costarricenses (₡ / CRC).
- **Roles de usuario**: `owner`, `caregiver`, `both`.
- **Geografía**: 7 provincias de Costa Rica con sus cantones.
- **Modelo de negocio**: comisión de servicio del **10%** sobre cada reserva.

---

## 🧱 Stack técnico obligatorio

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v3
- **UI Kit**: shadcn/ui (todos los componentes), Lucide Icons
- **Routing**: react-router-dom v6
- **Data fetching**: @tanstack/react-query
- **Mapas**: `react-leaflet@4.2.1` + `@react-leaflet/core@2.1.0` + `leaflet` + OpenStreetMap tiles
- **Geocoding**: Nominatim (OpenStreetMap) — sin API key, con debounce y `accept-language=es`
- **Fechas**: `date-fns` con `import { es } from 'date-fns/locale'`
- **Backend**: AWS (`Cognito`, `API Gateway`, `Lambda`, `RDS PostgreSQL`, `RDS Proxy`, `S3`)
- **Infraestructura**: AWS CDK + TypeScript
- **Pagos**: Stripe (vía Lambda)
- **Notificaciones UI**: `sonner` + `useToast` de shadcn

> ⚠️ **Crítico**: en `vite.config.ts` añade `resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]` para que React Leaflet no falle en runtime.

---

## 🎨 Sistema de diseño

Define **todos los colores en HSL** dentro de `src/index.css` como tokens semánticos. Nunca uses colores hardcodeados (`text-white`, `bg-black`) en componentes.

- Importa fuentes Google: `Nunito` (body) y `Poppins` (headings).
- Tema **"Tropical Pet Paradise"**: primary verde tropical (~`hsl(142 71% 45%)`), tokens de gradient/shadow/glass.
- Tokens obligatorios: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--card`, `--border`, `--ring`, `--sidebar-*`.
- Define `--gradient-primary`, `--gradient-hero`, `--shadow-elegant`, `--shadow-soft`.
- Soporta modo oscuro vía `.dark { ... }`.
- Clases de utilidad: `.hero-gradient`, `.card-gradient`, `.text-gradient-hero`, `.glass`, `.hover-lift`, animaciones `.animate-float`, `.animate-pulse-soft`.
- Extiende `tailwind.config.ts` para mapear todos los tokens HSL.

---

# Fases de implementación

---

## Fase 1 — Bootstrap del proyecto y design system

**Objetivo**: Levantar el esqueleto con design system y routing vacío.

**Acciones**:
1. Crea un proyecto Vite + React + TS y agrega Tailwind + shadcn/ui completo.
2. Escribe `src/index.css` con todos los tokens HSL del tema tropical (light + dark) y las fuentes de Google.
3. Escribe `tailwind.config.ts` extendiendo `colors`, `borderRadius`, `fontFamily`, `keyframes` y `animation`.
4. Crea `vite.config.ts` con el alias `@` → `src` y `resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]`.
5. Configura `src/App.tsx` con `QueryClientProvider`, `TooltipProvider`, `<Toaster />`, `<Sonner />` y `<BrowserRouter>` con un placeholder `/` → `Index`.

**Criterio de aceptación**: `npm run dev` arranca, se ve un Hello World con el primary verde aplicado.

---

## Fase 2 — Tipos y constantes del dominio

**Objetivo**: Definir el modelo de datos y las constantes geográficas.

Crea `src/types/index.ts` con:

- `type UserRole = 'owner' | 'caregiver' | 'both'`
- `interface User { id, email, name, phone?, role, avatar?, createdAt, province, canton }`
- `interface Pet { id, ownerId, name, type: 'dog'|'cat'|'bird'|'other', breed?, age, size: 'small'|'medium'|'large', description?, photos[], specialNeeds? }`
- `interface Space { id, caregiverId, title, description, photos[], province, canton, address, pricePerNight, pricePerHour, minHours, acceptedPetTypes[], acceptedPetSizes[], maxPets, amenities[], isActive, rating, reviewCount, createdAt }`
- `type BookingType = 'hourly' | 'overnight'`
- `interface Booking { id, spaceId, ownerId, petIds[], bookingType, startDate, endDate, startTime?, endTime?, hours?, totalPrice, status: 'pending'|'confirmed'|'cancelled'|'completed', paymentStatus: 'pending'|'paid'|'refunded', createdAt, notes? }`
- `interface BlockedDate { id, spaceId, date, reason?, createdAt }`
- `interface Review { id, bookingId, spaceId, ownerId, rating, comment, createdAt }`
- `const PROVINCES = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'] as const`
- `const CANTONES: Record<Province, string[]>` con **todos** los cantones de cada provincia.
- `const PET_TYPES`, `const PET_SIZES`, `const AMENITIES` (Jardín cercado, Aire acondicionado, Cámaras de seguridad, Piscina para mascotas, Área de juegos, Paseos diarios, Alimentación premium, Atención veterinaria, Servicio 24/7, Transporte incluido).

Crea también `src/types/messaging.ts` con `Message`, `Conversation`, `ConversationParticipant`, `ConversationWithDetails`.

---

## Fase 3 — Datos mock

Crea tres archivos en `src/data/`:

- **`mockData.ts`**: `mockSpaces: SpaceWithCoords[]` con ~6 espacios con coordenadas reales en Costa Rica (San José, Escazú, Heredia, Liberia, Puntarenas, Cartago) + `mockUser`.
- **`mockProfileData.ts`**: `mockPets`, `mockBookings`, `mockFavoriteSpaceIds`, helpers `getMockFavoriteSpaces()` y `getSpaceById(id)`.
- **`mockMessagingData.ts`**: `mockParticipants`, `mockConversations`, `mockMessages`, helpers `getConversationsWithDetails()`, `getMessagesForConversation(id)`, `getCurrentUserId()`.

---

## Fase 4 — Layout: Header y Footer

- **`src/components/layout/Header.tsx`**: header fijo en la parte superior con logo (PawPrint icono + "Donver"), navegación (`/`, `/spaces`, `/how-it-works`, `/help`), botones según auth state mock (login/register vs. mensajes con badge de no leídos + perfil), menú hamburguesa responsive.
- **`src/components/layout/Footer.tsx`**: footer con links agrupados (Producto, Empresa, Soporte, Legal) y redes sociales.
- **`src/components/NavLink.tsx`**: helper de link con estado activo basado en `useLocation`.

---

## Fase 5 — Landing page (`/`)

Crea `src/pages/Index.tsx` que renderiza Header + las siguientes secciones + Footer:

1. **`HeroSection`**: H1 grande con `text-gradient-hero`, subtítulo, CTAs ("Buscar espacios" → `/spaces`, "Ofrecer mi espacio" → `/become-caregiver`), imagen/ilustración con animación float.
2. **`FeaturesSection`**: grid 3 columnas con beneficios (cuidadores verificados, pago seguro, soporte 24/7).
3. **`HowItWorksSection`**: 3 pasos numerados (Buscar → Reservar → Disfrutar).
4. **`FeaturedSpacesSection`**: grid de `SpaceCard` usando `mockSpaces.slice(0, 3)`.
5. **`CTASection`**: banner final con CTA a registro.

SEO: `<title>` < 60 chars con keyword "cuidado de mascotas Costa Rica", meta description, una sola `<h1>`.

---

## Fase 6 — Búsqueda de espacios (`/spaces`)

**Componentes a crear primero**:

- **`SpaceCard.tsx`**: card con imagen, título, ubicación (canton, provincia), precio/hora y /noche, rating con estrella, badge de tipos de mascota aceptados, link a `/spaces/:id`.
- **`LocationSearch.tsx`**: input con autocomplete via Nominatim (`https://nominatim.openstreetmap.org/search?q=...&format=json&accept-language=es&countrycodes=cr`), debounce 400 ms, dropdown con resultados, callback `onLocationSelect({lat, lon, displayName})`.
- **`SpaceMarker.tsx`**: `Marker` de Leaflet con icono custom HTML (div con precio/hora visible) + `Popup` con preview del espacio y botón "Ver más".
- **`SpacesMap.tsx`**: `MapContainer` con tiles de OSM, controles de zoom custom, marker de ubicación del usuario con animación ping, `Circle` del radio de búsqueda, selector de radio (5/10/15/25/50 km), contador de resultados flotante.
- **`MapStyles.css`**: ajustes de z-index y popup.

**Hook**: `src/hooks/use-geolocation.ts` que envuelve `navigator.geolocation.getCurrentPosition`.

**Página `SpacesPage.tsx`**:
- Filtros: provincia (select) → cantón (select dependiente), tipo de mascota, rango de precio.
- Toggle de vista: `grid` | `map` | `split`.
- Botón "Usar mi ubicación" + `LocationSearch`.
- `useMemo` para filtrar `mockSpaces` por filtros, ubicación + radio (Haversine), y ordenar por distancia.
- Empty state con mensaje útil cuando no hay resultados.

---

## Fase 7 — Detalle de espacio y reservas (`/spaces/:id`)

**Componentes**:

- **`SpaceGallery.tsx`**: grid tipo Airbnb (1 imagen grande + 4 pequeñas) con dialog full-screen al hacer click.
- **`SpaceAmenities.tsx`**: grid de amenidades con iconos.
- **`SpaceReviews.tsx`**: lista de reseñas con avatar, rating y fecha relativa en español.
- **`BookingCard.tsx`** (crítico, sticky en desktop):
  - Toggle `hourly` / `overnight`.
  - Para hourly: date picker (1 fecha) + time picker + select de horas (mínimo `space.minHours`).
  - Para overnight: range date picker (start/end).
  - **Validación contra `blockedDates`**: deshabilita fechas bloqueadas en el calendar; rechaza rangos que contengan alguna fecha bloqueada.
  - Select de tipo de mascota (filtrado por `acceptedPetTypes`) y cantidad (≤ `maxPets`).
  - Cálculo de precio: `subtotal = pricePerHour * hours` o `pricePerNight * nights`, `serviceFee = subtotal * 0.10`, `total = subtotal + serviceFee`.
  - Botón "Solicitar reservación" → abre `BookingSummary` dialog. Errores con `toast`.
- **`BookingSummary.tsx`**: dialog con foto del espacio, fecha/hora formateada con `date-fns` locale `es`, badge de mascotas, desglose (subtotal + 10% comisión + total), aviso de cancelación, botones "Modificar" / "Confirmar Reservación".

**Página `SpaceDetailPage.tsx`**: lee `id` de `useParams`, busca en `mockSpaces`, muestra "no encontrado" si falta. Genera ~5 fechas mock bloqueadas con `addDays`.

---

## Fase 8 — Autenticación mock + Perfil (`/login`, `/register`, `/profile`)

- **`LoginPage.tsx`**: formulario email/password con loading state, link a `/register` y "olvidé mi contraseña".
- **`RegisterPage.tsx`**: nombre, email, teléfono, **provincia → cantón dependiente**, password + confirmación. Reset cantón cuando cambia provincia.
- **`ProfilePage.tsx`** con `Tabs`:
  - `UserInfoCard` (avatar, nombre, role, ubicación).
  - **Bookings**: lista con `BookingsTab` mostrando estado, fechas, total, espacio relacionado.
  - **Pets**: `PetsTab` + `PetFormDialog` para agregar/editar (nombre, tipo, raza, edad, tamaño, descripción, fotos vía `PhotoUpload`, necesidades especiales).
  - **Favorites**: `FavoritesTab` con grid de `SpaceCard`.

Crea `src/components/ui/photo-upload.tsx` para subir múltiples imágenes con preview y eliminación.

---

## Fase 9 — Cuidadores: registro y dashboard

- **`BecomeCaregiverPage.tsx`** (`/become-caregiver`): formulario multi-paso o single con: título del espacio, descripción, provincia/cantón, dirección, **`LocationPicker`** en mapa, precios (hora/noche), `minHours`, mascotas aceptadas (checkboxes de tipos y tamaños), `maxPets`, amenidades (checkboxes), fotos.
- **`LocationPicker.tsx`**: `MapContainer` con click-to-pin + `LocationSearch` por dirección + botón "Usar mi GPS" (`navigator.geolocation`) + reverse geocoding con Nominatim para autocompletar la dirección.
- **`CaregiverDashboardPage.tsx`** (`/caregiver/dashboard`): lista de mis espacios + `AvailabilityCalendar.tsx` para bloquear/desbloquear fechas (multi-select sobre el calendario).

---

## Fase 10 — Mensajería (`/messages`)

- **`ConversationList.tsx`**: lista lateral con avatar del otro participante, último mensaje, timestamp relativo, badge de no leídos, nombre del espacio asociado.
- **`ChatWindow.tsx`**: header con info del otro participante + scroll de mensajes + input de envío.
- **`MessageBubble.tsx`**: burbuja diferenciada por `isOwn`, timestamp y check de lectura.
- **`MessagesPage.tsx`**: layout responsive — en desktop split (lista | chat); en mobile alterna entre lista y chat con back button.

---

## Fase 11 — Páginas estáticas y 404

- `HelpCenterPage.tsx` (`/help`): FAQ con `Accordion`.
- `HowItWorksPage.tsx` (`/how-it-works`): explicación paso a paso para dueños y para cuidadores.
- `NotFound.tsx` (`*`): mensaje amigable con link al home.

Registra todas las rutas en `App.tsx` **antes** del catch-all `*`.

---

## Fase 12 — Capa de servicio API placeholder

Crea `src/services/api.ts` con módulos `authApi`, `spacesApi`, `bookingsApi`, `petsApi`, `reviewsApi`, `availabilityApi`, `uploadApi`, `messagesApi`, `paymentsApi`. Por ahora apuntan a un placeholder; serán reemplazados por llamadas reales a la API de AWS en la Fase 14.

---

## Fase 13 — Infraestructura backend en AWS

> Mensaje a enviar: **"Crea la infraestructura backend en AWS con CDK"**.

Define la infraestructura base en `AWS us-east-1` con `CDK + TypeScript` y dos ambientes: `dev` y `prod`.

**Infraestructura obligatoria**:

1. **Cognito User Pool**:
   - Email/password con verificación obligatoria de email.
   - Google OAuth habilitado.
   - Cliente de aplicación para frontend web.
   - Flujo de reset password compatible con `/reset-password`.
2. **API Gateway HTTP API**:
   - JWT authorizer con Cognito.
   - Rutas REST para auth bootstrap, spaces, bookings, pets, reviews, availability, uploads, profile y payments.
3. **API Gateway WebSocket**:
   - Rutas mínimas `$connect`, `$disconnect`, `sendMessage`.
   - Uso exclusivo para mensajería en tiempo real.
4. **Lambda functions**:
   - Runtime Node.js + TypeScript.
   - Una función por dominio o caso de uso, no una sola Lambda monolítica.
5. **RDS PostgreSQL + RDS Proxy**:
   - Base de datos relacional principal.
   - Conexión desde Lambdas vía `RDS Proxy`.
6. **S3 buckets**:
   - `donver-space-photos-{env}`
   - `donver-pet-photos-{env}`
   - Carga mediante URLs prefirmadas.
7. **Secrets Manager o SSM Parameter Store**:
   - Secretos de base de datos.
   - `STRIPE_SECRET_KEY`
   - credenciales OAuth si aplican.
8. **CloudWatch**:
   - Logs para API y Lambdas.
   - Alarmas básicas de errores y latencia.
9. **IAM**:
   - Roles de ejecución mínimos para Lambdas.
   - Usuario de despliegue restringido a recursos `donver-*`, sin permisos de borrado.

**Stacks sugeridos**:
- `DonverSharedStack`: VPC, buckets, secretos, roles base.
- `DonverAuthStack`: Cognito.
- `DonverDataStack`: PostgreSQL y RDS Proxy.
- `DonverApiStack`: Lambdas, API HTTP y WebSocket.

**Criterio de aceptación**:
- El despliegue por ambiente genera outputs con `userPoolId`, `userPoolClientId`, `apiBaseUrl`, `wsUrl`, `dbSecretArn`, `bucket names`.
- El usuario restringido puede crear y actualizar recursos Donver, pero no eliminar recursos existentes.

---

## Fase 14 — Modelo de datos y backend de aplicación

> Mensaje a enviar: **"Implementa el backend de Donver sobre AWS usando PostgreSQL, Lambdas y API Gateway"**.

Crea las migraciones SQL para PostgreSQL y el código de las Lambdas.

### Esquema de base de datos

1. **`profiles`**: `id (uuid PK)`, `user_id (uuid unique)`, `email`, `name`, `phone`, `avatar_url`, `province`, `canton`, `created_at`, `updated_at`.
2. **Tabla de roles separada**:
   - `CREATE TYPE app_role AS ENUM ('owner','caregiver','both','admin')`
   - `user_roles (id, user_id, role)` con `unique(user_id, role)`.
3. **`spaces`**: todos los campos del tipo `Space` + `latitude` + `longitude` + `updated_at`.
4. **`pets`**: campos del tipo `Pet` + `updated_at`.
5. **`bookings`**: campos del tipo `Booking` + `service_fee`, `subtotal`, `updated_at`.
6. **`blocked_dates`**: `id`, `space_id`, `date`, `reason`, `created_at`.
7. **`reviews`**: `id`, `booking_id`, `space_id`, `owner_id`, `rating`, `comment`, `created_at`.
8. **`favorites`**: `id`, `owner_id`, `space_id`, `created_at`, `unique(owner_id, space_id)`.
9. **`conversations`**: `id`, `space_id`, `created_at`, `updated_at`.
10. **`conversation_participants`**: `id`, `conversation_id`, `user_id`, `created_at`, `unique(conversation_id, user_id)`.
11. **`messages`**: `id`, `conversation_id`, `sender_id`, `body`, `read_at`, `created_at`.

### Reglas de negocio en backend

- Crear o sincronizar `profiles` al primer login exitoso en Cognito.
- No depender solo del token para roles; consultar `user_roles`.
- `spaces` públicos solo cuando `is_active = true`.
- `bookings` deben validar conflictos con `blocked_dates` y overlaps existentes.
- `reviews` solo pueden crearse si el owner tiene una booking `completed` para ese espacio.
- `serviceFee = subtotal * 0.10` y `total = subtotal + serviceFee` deben calcularse en backend.
- Un usuario solo puede leer conversaciones donde sea participante.

### Lambdas mínimas

- `auth-bootstrap`
- `get-me`
- `update-profile`
- `list-spaces`
- `get-space-detail`
- `list-my-spaces`
- `create-space`
- `update-space`
- `list-pets`
- `create-pet`
- `update-pet`
- `delete-pet`
- `list-owner-bookings`
- `list-caregiver-bookings`
- `create-booking`
- `cancel-booking`
- `create-blocked-date`
- `delete-blocked-date`
- `list-reviews`
- `create-review`
- `create-upload-url`
- `list-conversations`
- `list-messages`
- `ws-connect`
- `ws-disconnect`
- `ws-send-message`

### Endpoints REST mínimos

- `GET /me`
- `PUT /me/profile`
- `GET /spaces`
- `GET /spaces/{id}`
- `GET /caregiver/spaces`
- `POST /caregiver/spaces`
- `PUT /caregiver/spaces/{id}`
- `GET /owner/pets`
- `POST /owner/pets`
- `PUT /owner/pets/{id}`
- `DELETE /owner/pets/{id}`
- `GET /owner/bookings`
- `GET /caregiver/bookings`
- `POST /bookings`
- `POST /bookings/{id}/cancel`
- `POST /caregiver/spaces/{id}/blocked-dates`
- `DELETE /caregiver/spaces/{id}/blocked-dates/{blockedDateId}`
- `GET /spaces/{id}/reviews`
- `POST /spaces/{id}/reviews`
- `POST /uploads/presign`
- `GET /messages/conversations`
- `GET /messages/conversations/{id}/messages`

**Reemplaza** todos los `mockData` por llamadas reales a la API con `fetch` o un cliente HTTP centralizado desde `src/services/api.ts`, usando `useQuery` y `useMutation`.

---

## Fase 15 — Pagos con Stripe

> Mensaje a enviar: **"Implementa el flujo de pagos con Stripe sobre AWS"**.

1. Crea Lambda **`create-payment-checkout`**:
   - Recibe `bookingId`.
   - Verifica el JWT del usuario.
   - Carga la booking, valida que sea suya y `paymentStatus = 'pending'`.
   - Crea una `stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price_data: { currency: 'crc', product_data: { name: space.title }, unit_amount: total * 100 }, quantity: 1 }], success_url, cancel_url })`.
   - Devuelve `{ url }`.
2. Crea Lambda **`verify-payment`** que recibe `session_id`, consulta Stripe y actualiza `bookings.paymentStatus = 'paid'` y `status = 'confirmed'`.
3. Páginas:
   - **`/payment-success`**: invoca `verify-payment`, muestra confirmación con detalles.
   - **`/payment-canceled`**: mensaje + botón "Intentar de nuevo".
4. En `BookingSummary` "Confirmar Reservación" → crea booking pending → invoca `create-payment-checkout` → `window.location.href = url`.

---


## Fase 16 — Integración frontend con AWS y pulido final

- Todos los servicios de `src/services/api.ts` (`authApi`, `spacesApi`, `bookingsApi`, `petsApi`, `reviewsApi`, `availabilityApi`, `uploadApi`, `messagesApi`) ya están migrados a fetch real con autenticación (Bearer token) y fallback a mock si la API no está configurada.
- El build y la integración frontend-backend están validados y listos para despliegue.
- Tras ejecutar `cdk deploy` en la carpeta `aws/`, actualiza el archivo `.env` del frontend con los endpoints y credenciales reales que aparecen en los outputs del deploy.
- Formatea todos los precios como CRC: `new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value)`.
- Todas las fechas con `format(date, "d 'de' MMMM, yyyy", { locale: es })`.
- Verifica accesibilidad: alt en imágenes, labels en inputs, contraste en ambos modos.
- SEO en cada página: title, meta description, canonical.
- Lazy-load de imágenes en cards y galerías.
- Revisa que no haya colores hardcodeados — todo vía tokens.
- Integra autenticación real con Cognito para login, registro, confirmación de email, Google OAuth y reset password.
- Integra mensajería con historial por REST y tiempo real por WebSocket.
- Integra uploads con URL prefirmada a S3.
- Centraliza configuración en `.env` con `VITE_API_BASE_URL`, `VITE_WS_URL`, `VITE_AWS_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`.

---

# ✅ Checklist de verificación final

- [ ] El home `/` carga con hero animado, features, how-it-works, espacios destacados y CTA.
- [ ] `/spaces` permite filtrar por provincia/cantón/tipo de mascota y muestra grid + mapa con marcadores con precio.
- [ ] La geolocalización funciona y el `Circle` de radio se actualiza dinámicamente.
- [ ] `/spaces/:id` muestra galería, amenidades, reviews y `BookingCard` sticky.
- [ ] El cálculo de precio incluye 10% de comisión y se ve en el `BookingSummary`.
- [ ] Las fechas bloqueadas se respetan en el calendar y se valida no haya overlap.
- [ ] Login/Register funcionan con Cognito real (email + Google), `profiles` se crea automáticamente al primer acceso.
- [ ] `/profile` muestra bookings reales, mascotas (CRUD con fotos a Storage) y favoritos.
- [ ] `/become-caregiver` permite crear un espacio con `LocationPicker` y fotos.
- [ ] `/caregiver/dashboard` permite bloquear/desbloquear fechas.
- [ ] `/messages` lista conversaciones y permite enviar mensajes en tiempo real vía WebSocket.
- [ ] El flujo de Stripe redirige a Checkout, vuelve a `/payment-success` y la booking queda `confirmed/paid`.
- [ ] Toda la UI está en español, precios en CRC, fechas con locale `es`.
- [ ] Tokens HSL en todos los componentes — cero colores hardcoded.
- [ ] La autorización backend respeta ownership y roles; ningún usuario puede leer o modificar recursos ajenos.
- [ ] La infraestructura AWS existe en `dev` y `prod` con CDK.
- [ ] El usuario IAM restringido puede desplegar Donver sin borrar recursos existentes.
- [ ] `vite.config.ts` con `dedupe` para React (evita errores de Leaflet).

---

**Fin del prompt maestro.** Ejecuta cada fase en orden y valida el funcionamiento antes de pasar a la siguiente.
