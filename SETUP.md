# Guía de Setup - Diamont Deals

Esta guía te llevará paso a paso desde 0 hasta tener el proyecto funcionando localmente.

## ✅ Paso 1: Verificar Requisitos

Asegúrate de tener instalado:

```bash
# Verificar Node.js (debe ser >= 18)
node --version

# Verificar pnpm (debe ser >= 8)
pnpm --version

# Si no tienes pnpm, instálalo:
npm install -g pnpm
```

## ✅ Paso 2: Instalar Dependencias

```bash
# Desde la raíz del proyecto
pnpm install
```

Esto instalará todas las dependencias del monorepo.

## ✅ Paso 3: Configurar Supabase

### Opción A: Supabase Cloud (Más fácil para empezar)

1. **Crear cuenta y proyecto:**
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta
   - Crea un nuevo proyecto
   - Elige región (Europe West - Ireland recomendado para España)
   - Espera ~2 minutos mientras se crea

2. **Obtener credenciales:**
   - En tu proyecto, ve a Settings > API
   - Copia:
     - `Project URL` → será tu `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` (Click "Reveal") → será tu `SUPABASE_SERVICE_ROLE_KEY`

3. **Configurar variables de entorno:**

```bash
# Desde la raíz del proyecto
cp apps/web/.env.example apps/web/.env.local
```

Edita `apps/web/.env.local` y pega tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
NODE_ENV=development
```

4. **Ejecutar migraciones:**
   - Ve a tu dashboard de Supabase
   - Click en "SQL Editor" (icono de </> en el menú lateral)
   - Click en "New query"
   - Copia todo el contenido de `supabase/migrations/20241023000001_initial_schema.sql`
   - Pega en el editor
   - Click en "Run" (o Ctrl/Cmd + Enter)
   - Repite para `supabase/migrations/20241023000002_rls_policies.sql`

5. **Ejecutar seed (datos de prueba):**
   - Misma mecánica que las migraciones
   - Copia el contenido de `supabase/seed/seed.sql`
   - Ejecuta en SQL Editor

6. **Crear usuario admin:**
   - Ve a Authentication > Users
   - Click "Add user" > "Create new user"
   - Email: `admin@diamontdeals.com`
   - Password: `Admin123!`
   - Click "Create user"
   - Ahora ve a Table Editor > profiles
   - Busca el usuario que acabas de crear
   - Cambia el campo `role` de `player` a `admin`

### Opción B: Supabase Local (Para desarrollo avanzado)

1. **Instalar Supabase CLI:**

```bash
# macOS
brew install supabase/tap/supabase

# Windows (con Scoop)
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

2. **Iniciar Supabase local:**

```bash
# Desde la raíz del proyecto
supabase init
supabase start
```

3. **Copiar credenciales:**
   - Al terminar `supabase start`, verás en la terminal:
     - API URL
     - anon key
     - service_role key
   - Cópialas a `apps/web/.env.local`

4. **Las migraciones se aplican automáticamente** cuando usas Supabase local.

## ✅ Paso 4: Ejecutar el Proyecto

```bash
# Desde la raíz del proyecto
pnpm dev
```

Deberías ver:

```
web:dev: ▲ Next.js 14.2.15
web:dev: - Local:        http://localhost:3000
```

## ✅ Paso 5: Verificar que Funciona

1. **Abre el navegador:**
   - Ve a http://localhost:3000
   - Deberías ver "Diamont Deals - Plataforma de Gestión de Jugadores de Poker"

2. **Probar login:**
   - Ve a http://localhost:3000/login (cuando lo implementemos)
   - Usa las credenciales del admin que creaste

## 🐛 Troubleshooting

### Error: "Cannot find module '@diamont-deals/...'"

```bash
# Limpia e instala de nuevo
pnpm clean
pnpm install
```

### Error: "Invalid Supabase URL"

- Verifica que las variables de entorno en `.env.local` sean correctas
- Asegúrate de que el archivo esté en `apps/web/.env.local` (no en la raíz)

### Error en migraciones SQL

- Asegúrate de ejecutar primero `20241023000001_initial_schema.sql`
- Luego `20241023000002_rls_policies.sql`
- El orden importa

### El servidor no arranca

```bash
# Mata procesos de Next.js
killall node

# Intenta de nuevo
pnpm dev
```

### Supabase local no inicia

```bash
# Detener y limpiar
supabase stop
docker system prune -a

# Intentar de nuevo
supabase start
```

## 📝 Siguientes Pasos

Una vez que todo funcione:

1. **Familiarízate con la estructura:**
   - Lee `README.md`
   - Explora `DIAMONT_DEALS_TECH_SPEC.md`

2. **Revisa la base de datos:**
   - Si usas Supabase Cloud: Dashboard > Table Editor
   - Si usas local: http://localhost:54323

3. **Empieza a desarrollar:**
   - Las páginas están en `apps/web/src/app/`
   - Los componentes en `apps/web/src/components/`
   - La lógica de DB en `packages/database/src/`

## 🎉 ¡Listo!

Ya tienes todo configurado. Ahora puedes empezar a desarrollar las funcionalidades.

### Comandos útiles:

```bash
# Ver logs del dev server
pnpm dev

# Ejecutar tests (cuando los implementemos)
pnpm test

# Formatear código
pnpm format

# Linter
pnpm lint

# Build de producción
pnpm build
```

### Estructura de rutas (a implementar):

- `/` - Landing page
- `/login` - Login
- `/register` - Registro con player_code
- `/admin/*` - Panel de administración
- `/player/*` - Portal de jugadores

## 📞 ¿Necesitas ayuda?

Si tienes algún problema:
1. Revisa esta guía de nuevo
2. Busca el error en los logs
3. Verifica las variables de entorno
4. Contacta al equipo

---

**Happy coding! 🚀**
