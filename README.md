# Diamont Deals

Plataforma de gestión profesional de jugadores de poker con sistema automatizado de cálculo de comisiones (rakeback) basado en rendimiento individual.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Monorepo:** Turborepo
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel (gratis)

## 📋 Requisitos Previos

- Node.js 18+
- pnpm 8+
- Supabase CLI (opcional, para desarrollo local)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
cd diamont-deals
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar Supabase

#### Opción A: Usando Supabase Cloud

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia las credenciales (URL y anon key)
3. Crea el archivo `.env.local` en `apps/web`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

4. Edita `apps/web/.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

5. Ejecuta las migraciones desde el dashboard de Supabase:
   - Copia el contenido de `supabase/migrations/20241023000001_initial_schema.sql`
   - Ve a SQL Editor en tu dashboard
   - Pega y ejecuta el SQL
   - Repite para `20241023000002_rls_policies.sql`

6. (Opcional) Ejecuta el seed:
   - Copia el contenido de `supabase/seed/seed.sql`
   - Ejecuta en SQL Editor

#### Opción B: Usando Supabase Local (Recomendado para desarrollo)

1. Instala Supabase CLI:

```bash
brew install supabase/tap/supabase
```

2. Inicia Supabase local:

```bash
supabase init
supabase start
```

3. Esto creará una instancia local. Copia las credenciales que aparecen en la terminal a `apps/web/.env.local`

4. Las migraciones se aplicarán automáticamente. Para aplicar seeds:

```bash
supabase db reset
```

### 4. Ejecutar el proyecto

```bash
pnpm dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Supabase Studio (si usas local): http://localhost:54323

## 📁 Estructura del Proyecto

```
diamont-deals/
├── apps/
│   └── web/                    # Next.js app
│       ├── src/
│       │   ├── app/           # App Router (páginas)
│       │   ├── components/    # Componentes React
│       │   └── lib/           # Utilidades y configuración
│       └── package.json
├── packages/
│   ├── database/              # Cliente Supabase + tipos
│   │   └── src/
│   │       ├── types/        # Database types
│   │       ├── queries/      # Queries helpers
│   │       └── client.ts     # Supabase client
│   ├── ui/                    # Componentes compartidos
│   │   └── src/
│   │       └── components/   # shadcn/ui components
│   └── utils/                 # Utilidades compartidas
│       └── src/
│           ├── rakeback-calculator.ts
│           └── validators.ts
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── seed/                 # Seed data
├── package.json
├── turbo.json
└── README.md
```

## 🎯 Funcionalidades Principales

### Para Administradores

- ✅ Gestión completa de jugadores
- ✅ Generación automática de códigos únicos
- ✅ Gestión de clubs de poker
- ✅ Sistema de condiciones dinámicas configurables
- ✅ Dashboard con métricas y estadísticas
- ✅ Generación de reportes

### Para Jugadores

- ✅ Registro mediante código único
- ✅ Dashboard personal con estadísticas
- ✅ Visualización de comisiones por club
- ✅ Historial de estadísticas mensuales
- ✅ Gestión de perfil personal

### Sistema de Cálculo Automático

- ✅ Procesamiento automático según tabla de condiciones
- ✅ Aplicación de reglas basadas en ratio resultado/rake
- ✅ Gestión multi-club por jugador
- ✅ Histórico de cálculos y auditoría

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario (admin/player)
- **players**: Jugadores de poker
- **clubs**: Clubs de poker
- **player_clubs**: Relación N:N entre jugadores y clubs
- **condition_templates**: Templates de condiciones dinámicas
- **condition_rules**: Reglas específicas de cada template
- **player_conditions**: Condiciones asignadas a cada jugador
- **player_stats**: Estadísticas mensuales por jugador/club

Ver `DIAMONT_DEALS_TECH_SPEC.md` para más detalles.

## 🔐 Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) en todas las tablas
- Políticas granulares por rol (admin/player)
- Encriptación de datos sensibles
- Tokens JWT
- Backup automático diario

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Test en modo watch
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automático con cada push a main

### Variables de Entorno en Producción

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NODE_ENV=production
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia todos los proyectos en modo desarrollo
pnpm build            # Build de producción
pnpm start            # Inicia en modo producción

# Testing
pnpm test             # Ejecuta tests
pnpm lint             # Linter
pnpm format           # Formatea código con Prettier

# Limpieza
pnpm clean            # Limpia node_modules y builds
```

## 🔧 Comandos de Supabase

```bash
# Desarrollo local
supabase start        # Inicia Supabase local
supabase stop         # Detiene Supabase local
supabase status       # Estado de Supabase local

# Migraciones
supabase migration new nombre_migracion  # Crea nueva migración
supabase db reset     # Resetea DB y aplica migraciones + seed

# Deploy
supabase db push      # Pushea migraciones a producción
supabase db pull      # Pull de cambios desde producción
```

## 📊 Roadmap

### Fase 1 - Semana 1 (Días 1-5)
- [x] Setup de infraestructura y monorepo
- [x] Base de datos y migraciones
- [x] Sistema de autenticación
- [ ] Panel de administración básico
- [ ] Sistema de condiciones
- [ ] Portal de jugadores

### Fase 2 - Semana 2 (Días 6-12)
- [ ] Lógica de cálculo de rakeback
- [ ] Testing integral
- [ ] Despliegue en producción
- [ ] Ajustes y revisiones finales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Propietario: Diamont Deals
Todos los derechos reservados.

## 📞 Soporte

Para soporte, contacta a: support@diamontdeals.com

---

**Desarrollado con ❤️ para la gestión profesional de jugadores de poker**
