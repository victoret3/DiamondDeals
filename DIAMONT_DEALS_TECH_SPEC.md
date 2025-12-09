# Diamont Deals - Especificación Técnica

## 📋 Resumen Ejecutivo

Plataforma de gestión de jugadores de poker profesionales con sistema de rakeback dinámico basado en rendimiento. Monorepo desplegado en Vercel (gratis) + Supabase.

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
monorepo/
├── apps/
│   ├── web/                    # Next.js 14 (App Router)
│   └── admin/                  # Panel de administración (opcional, o mismo web)
├── packages/
│   ├── database/              # Supabase client & types
│   ├── ui/                    # Componentes compartidos (shadcn/ui)
│   └── utils/                 # Helpers compartidos
└── supabase/
    ├── migrations/            # SQL migrations
    └── seed.sql              # Datos iniciales
```

**Tecnologías:**
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **ORM/Client:** Supabase JS Client
- **Monorepo:** Turborepo
- **Deploy:** Vercel (gratis para hobby projects)
- **Testing:** Vitest + Testing Library + Playwright

---

## 🗄️ Modelo de Datos (Supabase)

### Tablas Principales

#### 1. `users` (extends auth.users)
```sql
-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'player')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `players`
```sql
-- Jugadores de poker
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_code TEXT UNIQUE NOT NULL, -- Código único generado por admin
  user_id UUID REFERENCES public.profiles(id) NULL, -- NULL hasta que se registre
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_player_code ON public.players(player_code);
CREATE INDEX idx_players_user_id ON public.players(user_id);
```

#### 3. `clubs`
```sql
-- Clubs de poker
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Ej: "GGPOKER", "POKERSTARS"
  base_rakeback_percentage DECIMAL(5,2) NOT NULL, -- Ej: 60.00 (60%)
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `player_clubs`
```sql
-- Relación N:N entre jugadores y clubs
CREATE TABLE public.player_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  username_in_club TEXT, -- Alias del jugador en ese club
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  UNIQUE(player_id, club_id)
);

CREATE INDEX idx_player_clubs_player_id ON public.player_clubs(player_id);
CREATE INDEX idx_player_clubs_club_id ON public.player_clubs(club_id);
```

#### 5. `condition_templates`
```sql
-- Templates de condiciones (como la tabla de la imagen)
CREATE TABLE public.condition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Ej: "Condiciones Standard 2024"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `condition_rules`
```sql
-- Reglas específicas del template (cada fila de la imagen)
CREATE TABLE public.condition_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.condition_templates(id) ON DELETE CASCADE,

  -- Ratio (Resultado/Rake)
  ratio_min DECIMAL(10,2) NOT NULL, -- Ej: -0.5
  ratio_max DECIMAL(10,2) NULL,     -- NULL = sin límite superior (ej: "0.50 o mayor")

  -- Manos jugadas
  hands_min INTEGER NOT NULL,        -- Ej: 0
  hands_max INTEGER NULL,            -- NULL = sin límite (ej: "7k+")

  -- Rakeback de Diamont Deals
  rakeback_percentage DECIMAL(5,2) NOT NULL, -- Ej: 20.00 (20%)

  priority INTEGER DEFAULT 0, -- Para ordenar reglas en caso de conflicto

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_condition_rules_template_id ON public.condition_rules(template_id);
```

#### 7. `player_conditions`
```sql
-- Condiciones asignadas a cada jugador por club
CREATE TABLE public.player_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_club_id UUID REFERENCES public.player_clubs(id) ON DELETE CASCADE,

  -- Puede ser fijo o dinámico
  condition_type TEXT NOT NULL CHECK (condition_type IN ('fixed', 'dynamic')),

  -- Si es fijo
  fixed_percentage DECIMAL(5,2) NULL,

  -- Si es dinámico
  template_id UUID REFERENCES public.condition_templates(id) NULL,

  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NULL, -- NULL = indefinido

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (condition_type = 'fixed' AND fixed_percentage IS NOT NULL AND template_id IS NULL) OR
    (condition_type = 'dynamic' AND template_id IS NOT NULL AND fixed_percentage IS NULL)
  )
);

CREATE INDEX idx_player_conditions_player_club_id ON public.player_conditions(player_club_id);
```

#### 8. `player_stats` (opcional pero recomendado)
```sql
-- Estadísticas mensuales del jugador por club
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_club_id UUID REFERENCES public.player_clubs(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  hands_played INTEGER DEFAULT 0,
  total_rake DECIMAL(12,2) DEFAULT 0,
  total_result DECIMAL(12,2) DEFAULT 0, -- Ganancias/pérdidas
  ratio DECIMAL(10,2) DEFAULT 0, -- Calculado: result/rake

  club_rakeback_amount DECIMAL(12,2) DEFAULT 0, -- Lo que paga el club
  diamont_rakeback_amount DECIMAL(12,2) DEFAULT 0, -- Lo que paga Diamont
  applied_rakeback_percentage DECIMAL(5,2), -- % aplicado en ese periodo

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_club_id, period_start)
);

CREATE INDEX idx_player_stats_player_club_id ON public.player_stats(player_club_id);
CREATE INDEX idx_player_stats_period ON public.player_stats(period_start, period_end);
```

---

## 🔐 Seguridad (Row Level Security - RLS)

### Políticas RLS

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Ejemplo: Players solo ven su propia info
CREATE POLICY "Players can view own data"
  ON public.players FOR SELECT
  USING (user_id = auth.uid());

-- Admins ven todo
CREATE POLICY "Admins can view all players"
  ON public.players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- (Repetir para todas las tablas con lógica similar)
```

---

## 🎯 Funcionalidades Principales

### Para ADMINS

1. **Gestión de Jugadores**
   - Crear jugadores (genera `player_code` único)
   - Ver lista de jugadores (pending/active/inactive)
   - Editar info de jugadores
   - Eliminar jugadores

2. **Gestión de Clubs**
   - CRUD de clubs
   - Configurar rakeback base del club

3. **Gestión de Condiciones**
   - Crear/editar templates de condiciones dinámicas
   - Asignar condiciones (fijas o dinámicas) a jugadores por club
   - Ver historial de condiciones

4. **Dashboard**
   - Estadísticas generales
   - Jugadores pendientes de registro
   - Ingresos/egresos

### Para JUGADORES

1. **Registro**
   - Formulario con `player_code` (validación en BD)
   - Solo puede registrarse si el code existe y no está usado

2. **Dashboard Personal**
   - Ver clubs en los que juega
   - Ver condiciones actuales por club
   - Ver estadísticas mensuales (manos, rake, resultado, rakeback)
   - Historial de pagos

3. **Perfil**
   - Editar datos personales

---

## 🚀 Flujo de Registro de Jugador

```
1. Admin crea jugador → genera player_code (ej: "DD-2024-001")
2. Admin comparte el código con el jugador (email, WhatsApp, etc.)
3. Jugador va a /register
4. Introduce player_code + email + contraseña
5. Sistema valida:
   - ¿El code existe?
   - ¿No está ya vinculado a otro user?
6. Si válido:
   - Crea cuenta en auth.users
   - Vincula players.user_id con el nuevo user
   - Jugador puede hacer login
```

---

## 🧪 Testing

### Unitarios (Vitest)
- Helpers de cálculo de rakeback
- Validaciones
- Utilidades

### Integración (Vitest + Supabase Local)
- Queries a BD
- RLS policies
- Triggers

### E2E (Playwright)
- Flujo de registro
- Login admin/player
- CRUD de jugadores
- Asignación de condiciones
- Visualización de stats

---

## 📦 Estructura del Monorepo

```
diamont-deals/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   └── layout.tsx
│       │   ├── (admin)/
│       │   │   ├── dashboard/
│       │   │   ├── players/
│       │   │   ├── clubs/
│       │   │   ├── conditions/
│       │   │   └── layout.tsx
│       │   ├── (player)/
│       │   │   ├── dashboard/
│       │   │   ├── stats/
│       │   │   ├── profile/
│       │   │   └── layout.tsx
│       │   └── layout.tsx
│       ├── components/
│       ├── lib/
│       └── public/
├── packages/
│   ├── database/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── queries/
│   │   └── package.json
│   ├── ui/
│   │   ├── src/
│   │   │   └── components/
│   │   └── package.json
│   └── utils/
│       ├── src/
│       │   ├── rakeback-calculator.ts
│       │   └── validators.ts
│       └── package.json
├── supabase/
│   ├── migrations/
│   │   ├── 20240101_initial_schema.sql
│   │   └── 20240102_rls_policies.sql
│   └── seed.sql
├── package.json
├── turbo.json
└── README.md
```

---

## ⏱️ ESTIMACIÓN DE HORAS

### FASE 1: Setup y Base (16-20h)
- **Setup monorepo + Turborepo:** 2h
- **Setup Supabase + migrations:** 4h
- **Setup Next.js + routing + layout:** 3h
- **Setup shadcn/ui + tema:** 2h
- **Auth básico (login/register):** 4-5h
- **RLS policies básicas:** 2-3h
- **Deploy inicial a Vercel:** 1h

### FASE 2: Backend/Base de Datos (12-15h)
- **Migrations completas (todas las tablas):** 4-5h
- **Triggers y funciones PL/pgSQL:** 3-4h
- **Políticas RLS completas:** 3-4h
- **Queries y helpers (package/database):** 2h

### FASE 3: Frontend Admin (24-30h)
- **Dashboard admin:** 3-4h
- **CRUD Jugadores:** 6-8h
- **CRUD Clubs:** 4-5h
- **Sistema de condiciones (templates + rules):** 8-10h
- **Asignación de condiciones a jugadores:** 3-4h

### FASE 4: Frontend Jugador (12-16h)
- **Dashboard jugador:** 4-5h
- **Vista de clubs y condiciones:** 3-4h
- **Vista de estadísticas:** 4-6h
- **Perfil:** 1-2h

### FASE 5: Lógica de Negocio (8-10h)
- **Calculadora de rakeback dinámico:** 4-5h
- **Sistema de matching de condiciones:** 3-4h
- **Generación de stats mensuales:** 1-2h

### FASE 6: Testing (16-20h)
- **Tests unitarios (utils, calculators):** 4-5h
- **Tests de integración (queries, RLS):** 5-6h
- **Tests E2E críticos:** 6-8h
- **Setup CI/CD:** 1-2h

### FASE 7: Refinamiento y Ajustes (12-16h)
- **UX/UI polish:** 4-5h
- **Validaciones exhaustivas:** 3-4h
- **Manejo de errores:** 2-3h
- **Performance optimization:** 2-3h
- **Documentación:** 1-2h

---

## 📊 RESUMEN DE ESTIMACIÓN

| Fase | Horas (rango) | Horas (promedio) |
|------|---------------|------------------|
| Setup y Base | 16-20h | 18h |
| Backend/BD | 12-15h | 13.5h |
| Frontend Admin | 24-30h | 27h |
| Frontend Jugador | 12-16h | 14h |
| Lógica de Negocio | 8-10h | 9h |
| Testing | 16-20h | 18h |
| Refinamiento | 12-16h | 14h |
| **TOTAL** | **100-127h** | **113.5h** |

### Desglose por Área:
- **Backend (BD + lógica):** ~40.5h (36%)
- **Frontend:** ~41h (36%)
- **Testing:** ~18h (16%)
- **Setup + Refinamiento:** ~14h (12%)

---

## 💰 Costos

### Hosting y Servicios (TODO GRATIS)
- **Vercel:** Gratis (plan Hobby)
- **Supabase:** Gratis hasta 500MB BD + 50k MAU
- **Dominio:** ~12€/año (opcional, puedes usar .vercel.app)

### Escalabilidad
Si creces más allá del plan gratis:
- **Vercel Pro:** $20/mes (poco probable que lo necesites)
- **Supabase Pro:** $25/mes (cuando superes 500MB o 50k usuarios)

---

## 🎯 Recomendaciones

1. **Empezar con MVP:**
   - CRUD jugadores + clubs
   - Condiciones fijas únicamente
   - Dashboard básico
   - **Estimación MVP:** ~50-60h

2. **Fase 2:**
   - Condiciones dinámicas
   - Sistema de stats automático
   - **Estimación Fase 2:** +30-40h

3. **Fase 3:**
   - Reportes avanzados
   - Notificaciones
   - Exportación de datos
   - **Estimación Fase 3:** +20-30h

4. **Usar Supabase CLI local:**
   - Desarrollo sin depender de internet
   - Migrations versionadas
   - Seed data para testing

5. **Considerar:**
   - **Backups automáticos** (Supabase los hace diarios en plan gratis)
   - **Logs de auditoría** (añadir trigger para tabla `audit_logs`)
   - **Sistema de notificaciones** (email cuando se asignan condiciones)

---

## 🚦 Roadmap Sugerido

### Sprint 1 (1-2 semanas)
- Setup completo
- Auth + registro con player_code
- CRUD jugadores (admin)
- CRUD clubs (admin)

### Sprint 2 (1-2 semanas)
- Condiciones fijas
- Asignación de jugadores a clubs
- Dashboard admin básico
- Dashboard jugador básico

### Sprint 3 (1-2 semanas)
- Condiciones dinámicas (templates + rules)
- Calculadora de rakeback
- Vista de stats para jugadores

### Sprint 4 (1 semana)
- Testing completo
- Refinamiento UX
- Deploy producción
- Documentación

---

## 📞 Siguiente Paso

¿Quieres que:
1. **Cree la estructura del monorepo** completa con Turborepo?
2. **Genere las migrations de Supabase** con todo el schema?
3. **Cree un README** con instrucciones de setup?
4. **Haga un MVP rápido** (solo jugadores + clubs + condiciones fijas)?

Dime por dónde empezamos.
