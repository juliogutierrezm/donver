# Donver App

Aplicación web de marketplace para alojamiento y cuidado de mascotas en Costa Rica. Conecta dueños de mascotas con cuidadores calificados que ofrecen espacios seguros para el hospedaje de perros, gatos y otras mascotas.

## Tabla de Contenidos



## Servicios de API

`src/services/api.ts` centraliza toda la lógica de integración con la API real de AWS. Todos los módulos (`authApi`, `spacesApi`, `bookingsApi`, `petsApi`, `reviewsApi`, `availabilityApi`, `uploadApi`, `messagesApi`) ya están migrados a fetch real con autenticación (Bearer token) y fallback a mock si la API no está configurada. El build y la integración frontend-backend están validados y listos para despliegue.

Tras ejecutar `cdk deploy` en la carpeta `aws/`, debes actualizar el archivo `.env` del frontend con los endpoints y credenciales reales que aparecen en los outputs del deploy.

### Ejemplo de configuración .env

```
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
VITE_WS_URL=wss://<ws-id>.execute-api.<region>.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
```

| Categoría | Tecnología |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Estilos | Tailwind CSS 3 |
| UI Components | Radix UI + shadcn/ui |
| Enrutamiento | React Router DOM v6 |
| Mapas | Leaflet + React Leaflet |
| Estado/HTTP | TanStack Query (React Query) |
| Iconos | Lucide React |
| Notificaciones | Sonner |
| Animaciones | Tailwind CSS Animate |

## Estructura del Proyecto

```
donver-app/
├── public/                    # Archivos estáticos
├── src/
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base reutilizables (Button, Input, Dialog, etc.)
│   │   ├── caregiver/         # Componentes específicos del portal de cuidadores
│   │   ├── layout/            # Layouts y estructuras de página
│   │   ├── messaging/         # Componentes de mensajería
│   │   ├── profile/           # Componentes de perfil de usuario
│   │   ├── sections/          # Secciones reutilizables de páginas
│   │   ├── BookingCard.tsx
│   │   ├── BookingSummary.tsx
│   │   ├── LocationPicker.tsx
│   │   ├── LocationSearch.tsx
│   │   ├── NavLink.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── SpaceAmenities.tsx
│   │   ├── SpaceCard.tsx
│   │   ├── SpaceGallery.tsx
│   │   ├── SpaceMarker.tsx
│   │   ├── SpaceReviews.tsx
│   │   └── SpacesMap.tsx
│   ├── pages/                 # Páginas/Rutas principales
│   │   ├── Index.tsx
│   │   ├── SpacesPage.tsx
│   │   ├── SpaceDetailPage.tsx
│   │   ├── CaregiverDashboardPage.tsx
│   │   ├── BecomeCaregiverPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── HowItWorksPage.tsx
│   │   ├── HelpCenterPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── NotFound.tsx
│   ├── hooks/                 # Custom Hooks
│   │   ├── use-geolocation.ts
│   │   ├── use-toast.ts
│   │   └── useAuthSessionUser.ts
│   ├── lib/                   # Utilidades
│   │   └── utils.ts
│   ├── services/              # Servicios de API
│   │   └── api.ts
│   ├── types/                 # Definiciones de tipos TypeScript
│   │   ├── index.ts
│   │   └── messaging.ts
│   ├── data/                  # Datos mock para desarrollo
│   │   ├── mockData.ts
│   │   ├── mockCaregiverData.ts
│   │   ├── mockMessagingData.ts
│   │   └── mockProfileData.ts
│   ├── styles/                # Estilos adicionales
│   │   └── MapStyles.css
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── aws/                       # Infraestructura AWS CDK
│   ├── bin/
│   ├── lib/
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── components.json            # Configuración de shadcn/ui
```

## Requisitos Previos

- Node.js 18+
- npm o pnpm

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd donver-app

# Instalar dependencias del frontend
npm install

# Instalar dependencias de AWS CDK (opcional, para infraestructura)
cd aws && npm install
```

## Scripts Disponibles

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Vite |
| `npm run build` | Compila TypeScript y genera build de producción |
| `npm run preview` | Previsualiza el build de producción localmente |

### AWS CDK

| Script | Descripción |
|--------|-------------|
| `cdk bootstrap` | Prepara el entorno de AWS para despliegue |
| `cdk deploy` | Despliega la infraestructura en AWS |
| `cdk synth` | Genera la plantilla de CloudFormation |

## Arquitectura

### Enrutamiento

La aplicación utiliza React Router DOM con las siguientes rutas principales:

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Index` | Página de inicio/landing |
| `/spaces` | `SpacesPage` | Listado y mapa de espacios |
| `/spaces/:id` | `SpaceDetailPage` | Detalle de un espacio |
| `/caregiver/dashboard` | `CaregiverDashboardPage` | Dashboard del cuidador |
| `/become-caregiver` | `BecomeCaregiverPage` | Registro como cuidador |
| `/profile` | `ProfilePage` | Perfil de usuario |
| `/messages` | `MessagesPage` | Centro de mensajes |
| `/how-it-works` | `HowItWorksPage` | Guía de uso |
| `/help` | `HelpCenterPage` | Centro de ayuda |
| `/login` | `LoginPage` | Inicio de sesión |
| `/register` | `RegisterPage` | Registro de usuario |
| `/verify-email` | `VerifyEmailPage` | Verificación de correo electrónico |
| `*` | `NotFound` | Página 404 |

### Gestión de Estado

- **TanStack Query**: Para fetching, caching y sincronización de datos del servidor.
- **React hooks locales**: Para estado de UI a nivel componente.

### Estilos

- **Tailwind CSS**: Framework de utilidades para estilos.
- **CSS Variables**: Variables HSL para theming (modo oscuro compatible).
- **Fuentes**: Nunito (cuerpo) y Poppins (títulos).
- **Componentes UI**: Basados en Radix UI para accesibilidad.

## Modelos de Datos

### Usuario

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "owner" | "caregiver" | "both";
  avatar?: string;
  createdAt: Date;
  province: Province;
  canton: string;
}
```

### Mascota

```typescript
interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: "dog" | "cat" | "bird" | "other";
  breed?: string;
  age: number;
  size: "small" | "medium" | "large";
  description?: string;
  photos: string[];
  specialNeeds?: string;
}
```

### Espacio (Alojamiento)

```typescript
interface Space {
  id: string;
  caregiverId: string;
  title: string;
  description: string;
  photos: string[];
  province: Province;
  canton: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  pricePerHour: number;
  minHours: number;
  acceptedPetTypes: PetType[];
  acceptedPetSizes: PetSize[];
  maxPets: number;
  amenities: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}
```

### Reserva

```typescript
interface Booking {
  id: string;
  spaceId: string;
  ownerId: string;
  petIds: string[];
  bookingType: "hourly" | "overnight";
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  hours?: number;
  subtotal: number;
  serviceFee: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: Date;
  notes?: string;
}
```

### Ubicaciones Soportadas

El sistema incluye las **7 provincias de Costa Rica** y sus respectivos cantones:

- San José
- Alajuela
- Cartago
- Heredia
- Guanacaste
- Puntarenas
- Limón

## Infraestructura AWS

El directorio `aws/` contiene una aplicación CDK (Cloud Development Kit) para el despliegue de la infraestructura en AWS:

### Stacks

| Stack | Archivo | Descripción |
|-------|---------|-------------|
| `AuthStack` | `lib/auth-stack.ts` | Amazon Cognito User Pool + Identity Pool |
| `DataStack` | `lib/data-stack.ts` | Tablas DynamoDB y bucket S3 |
| `SharedStack` | `lib/shared-stack.ts` | Recursos compartidos entre stacks |
| `ApiStack` | `lib/api-stack.ts` | API Gateway REST + WebSocket + Lambda handlers |

### Lambda Handlers

| Handler | Descripción |
|---------|-------------|
| `auth-bootstrap` | Inicialización de sesión de usuario |
| `auth-register` | Registro de nuevos usuarios |
| `get-me` | Obtener perfil del usuario autenticado |
| `update-profile` | Actualizar datos del perfil |
| `caregiver-onboarding` | Completar registro como cuidador |
| `create-space` | Crear espacio de alojamiento |
| `update-space` | Actualizar espacio existente |
| `list-spaces` | Listar espacios disponibles |
| `list-my-spaces` | Listar espacios del cuidador |
| `get-space-detail` | Obtener detalle de un espacio |
| `create-blocked-date` | Bloquear fechas de disponibilidad |
| `delete-blocked-date` | Eliminar fecha bloqueada |
| `create-booking` | Crear reserva |
| `cancel-booking` | Cancelar reserva |
| `list-owner-bookings` | Listar reservas del dueño de mascota |
| `list-caregiver-bookings` | Listar reservas del cuidador |
| `create-pet` | Crear mascota |
| `update-pet` | Actualizar mascota |
| `delete-pet` | Eliminar mascota |
| `list-pets` | Listar mascotas del usuario |
| `create-review` | Crear reseña |
| `list-reviews` | Listar reseñas de un espacio |
| `create-upload-url` | Generar URL prefirmada para subir fotos (S3) |
| `list-conversations` | Listar conversaciones del usuario |
| `list-messages` | Listar mensajes de una conversación |
| `ws-connect` | Conexión WebSocket |
| `ws-disconnect` | Desconexión WebSocket |
| `ws-send-message` | Enviar mensaje en tiempo real |

### Variables de Entorno

Tras ejecutar `cdk deploy` en la carpeta `aws/`, actualiza el archivo `.env` del frontend con los outputs del deploy:

```env
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
VITE_WS_URL=wss://<ws-id>.execute-api.<region>.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
```

## Convenciones

### Nomenclatura de Archivos

- Componentes: `PascalCase.tsx` (ej. `SpaceCard.tsx`)
- Hooks: `use-kebab-case.ts` (ej. `use-geolocation.ts`)
- Utilidades: `kebab-case.ts` (ej. `utils.ts`)
- Tipos: `kebab-case.ts` en `types/`

### Imports

Se utiliza la configuración de path aliases de TypeScript/Vite para imports absolutos desde `src/`.

### Componentes UI

Los componentes base en `src/components/ui/` siguen el patrón de **shadcn/ui**, utilizando:

- `class-variance-authority` (CVA) para variantes de componentes
- `clsx` + `tailwind-merge` para manejo de clases condicionales
- Radix UI como base para accesibilidad

### Estilos

- Colores definidos mediante variables CSS HSL en `index.css`
- Soporte para modo oscuro mediante la clase `dark`
- Shadow tokens: `--shadow-elegant`, `--shadow-soft`
- Gradient tokens: `--gradient-primary`, `--gradient-hero`
- Border radius configurable mediante `--radius`

---

Desarrollado con ❤️ para el cuidado de mascotas en Costa Rica.