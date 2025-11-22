# Smarter App - Gestión de Objetivos SMARTER

Aplicación móvil-first PWA para gestión personal de objetivos usando el método SMARTER (Specific, Measurable, Achievable, Relevant, Time-bound, Evaluate, Readjust).

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.0.0
- npm

### Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   
   Copia el archivo de ejemplo y configura tus variables:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```
   
   Edita `.env.local` y configura:
   - `DATABASE_URL`: Ruta a la base de datos SQLite (por defecto: `file:./prisma/dev.db`)
   - `JWT_SECRET`: Clave secreta para JWT (mínimo 32 caracteres)
   - `AI_PROVIDER`: `openai` o `azure`
   - `OPENAI_API_KEY`: Tu API key de OpenAI (si usas OpenAI)
   - `OPENAI_MODEL`: Modelo a usar (por defecto: `gpt-4`)

3. **Configurar base de datos:**
   ```bash
   cd frontend
   npm run db:generate  # Generar cliente Prisma
   npm run db:migrate   # Sincronizar esquema de base de datos (usa prisma db push)
   npm run db:seed      # Poblar con datos de ejemplo
   ```
   
   **Nota:** Los comandos `db:migrate` y `db:seed` cargan automáticamente las variables de entorno desde `.env.local` usando `dotenv-cli`.

4. **Iniciar aplicación:**
   ```bash
   # Desde la raíz del proyecto
   npm run dev
   ```
   
   O desde el directorio frontend:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Abrir en el navegador:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 📁 Estructura del Proyecto

```
smarter-app/
├── frontend/              # Aplicación Next.js
│   ├── src/
│   │   ├── app/           # Rutas y páginas Next.js
│   │   │   └── api/       # API Routes (backend integrado)
│   │   ├── lib/           # Utilidades y configuración
│   │   ├── repositories/  # Acceso a datos (Prisma)
│   │   ├── services/      # Lógica de negocio
│   │   ├── clients/       # Cliente OpenAI/Azure
│   │   └── features/      # Features del frontend
│   ├── prisma/            # Schema y migraciones Prisma
│   └── public/            # Assets estáticos (PWA)
├── shared/                # Esquemas Zod y tipos compartidos
└── package.json          # Workspace root
```

## 🔧 Scripts Disponibles

### Desde la raíz:
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run test` - Ejecuta tests

### Desde frontend/:
- `npm run dev` - Inicia Next.js en modo desarrollo
- `npm run build` - Construye la aplicación
- `npm run start` - Inicia servidor de producción
- `npm run db:generate` - Genera cliente Prisma
- `npm run db:migrate` - Ejecuta migraciones
- `npm run db:seed` - Pobla la base de datos
- `npm run db:studio` - Abre Prisma Studio

## 🔐 Usuario por Defecto

Después de ejecutar el seed, puedes iniciar sesión con:
- **Email:** `user@local`
- **Password:** `password123` (configurable en `prisma/seed.ts`)

## 📱 Características PWA

- ✅ Manifest configurado
- ✅ Service Worker para caché offline
- ✅ Instalación como app nativa
- ✅ Notificaciones push

## 🤖 Integración con IA

La aplicación usa OpenAI o Azure OpenAI para:
- Validar objetivos según criterios SMARTER
- Validar minitasks (verificar que sean acciones concretas)
- Generar sugerencias de minitasks

## 🛠️ Tecnologías

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Base de datos:** Prisma + SQLite
- **Autenticación:** JWT (jose)
- **IA:** OpenAI SDK
- **Validación:** Zod
- **Estado:** React Query, Zustand

## 📝 Notas

- La aplicación está diseñada para un solo usuario local
- La base de datos SQLite se almacena en `frontend/prisma/dev.db`
- Todas las rutas de API están en `frontend/src/app/api/`
