# Próximos Pasos - Diamont Deals

## 🎯 Objetivo Inmediato

Implementar el **sistema de autenticación completo** (login + registro con player_code).

---

## 📋 Día 1-2: Sistema de Autenticación

### Task 1: Páginas de Login y Register

#### 1.1 Crear estructura de carpetas

```bash
mkdir -p apps/web/src/app/\(auth\)/login
mkdir -p apps/web/src/app/\(auth\)/register
```

#### 1.2 Crear layout de auth

**Archivo:** `apps/web/src/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Diamont Deals</h1>
          <p className="text-gray-600 mt-2">Gestión de Jugadores de Poker</p>
        </div>
        {children}
      </div>
    </div>
  );
}
```

#### 1.3 Crear página de login

**Archivo:** `apps/web/src/app/(auth)/login/page.tsx`

Funcionalidades:
- Formulario con email + password
- Validación client-side
- Llamada a Supabase Auth
- Redirect según rol (admin → /admin/dashboard, player → /player/dashboard)
- Mostrar errores

#### 1.4 Crear página de registro

**Archivo:** `apps/web/src/app/(auth)/register/page.tsx`

Funcionalidades:
- Formulario con:
  - Player Code (required)
  - Email
  - Password
  - Confirm Password
- Validar que player_code existe en BD
- Validar que player_code no esté ya usado
- Crear usuario en Supabase Auth
- Vincular user_id con player
- Redirect a /player/dashboard

### Task 2: Server Actions para Auth

**Archivo:** `apps/web/src/app/(auth)/actions.ts`

Crear server actions para:
- `signIn(email, password)`
- `signUp(playerCode, email, password)`
- `signOut()`
- `validatePlayerCode(code)`

### Task 3: Componentes de formularios

Crear en `apps/web/src/components/auth/`:
- `login-form.tsx`
- `register-form.tsx`

Usar:
- shadcn/ui components (Input, Button, Label, Alert)
- React Hook Form (para validación)
- Zod (para schemas)

### Task 4: Testing del flujo de auth

- [ ] Test: Login con credenciales correctas
- [ ] Test: Login con credenciales incorrectas
- [ ] Test: Register con player_code válido
- [ ] Test: Register con player_code inválido
- [ ] Test: Register con player_code ya usado
- [ ] Test: Logout funciona
- [ ] Test: Redirect funciona según rol

---

## 📋 Día 3-4: Panel de Administración

### Task 5: Layout de Admin

**Archivo:** `apps/web/src/app/(admin)/layout.tsx`

Componentes necesarios:
- Sidebar con navegación
- Header con usuario + logout
- Rutas:
  - Dashboard
  - Jugadores
  - Clubs
  - Condiciones

### Task 6: Dashboard Admin

**Archivo:** `apps/web/src/app/(admin)/dashboard/page.tsx`

Métricas a mostrar:
- Total jugadores (pending/active/inactive)
- Total clubs
- Estadísticas del mes
- Últimos jugadores registrados
- Acciones rápidas

### Task 7: CRUD Jugadores

**Archivos:**
- `apps/web/src/app/(admin)/players/page.tsx` - Lista
- `apps/web/src/app/(admin)/players/new/page.tsx` - Crear
- `apps/web/src/app/(admin)/players/[id]/page.tsx` - Ver/Editar
- `apps/web/src/app/(admin)/players/[id]/edit/page.tsx` - Editar

**Funcionalidades:**
- Tabla con búsqueda y filtros
- Botón "Crear Jugador"
- Generar player_code automático
- Formulario completo (nombre, email, phone)
- Copiar player_code al clipboard
- Editar información
- Cambiar status (pending/active/inactive)
- Eliminar (con confirmación)

### Task 8: CRUD Clubs

Similar estructura a jugadores:
- Lista de clubs
- Crear club
- Editar club
- Ver detalles (con lista de jugadores)

### Task 9: Componentes compartidos para admin

Crear en `packages/ui/src/components/`:
- `data-table.tsx` - Tabla genérica
- `page-header.tsx` - Header de páginas
- `stat-card.tsx` - Card para métricas
- `dialog.tsx` - Modal de shadcn
- `form/` - Componentes de formulario

---

## 📋 Día 5: Condiciones + Portal Jugador

### Task 10: Sistema de Condiciones

**Archivos:**
- `apps/web/src/app/(admin)/conditions/page.tsx` - Ver templates
- `apps/web/src/app/(admin)/conditions/new/page.tsx` - Crear template
- `apps/web/src/app/(admin)/players/[id]/clubs/page.tsx` - Asignar a clubs

**Funcionalidades:**
- Ver templates de condiciones
- Ver reglas de cada template
- Crear nuevo template
- Asignar jugador a club
- Asignar condición (fija % o template dinámico)

### Task 11: Portal de Jugadores

**Archivos:**
- `apps/web/src/app/(player)/layout.tsx`
- `apps/web/src/app/(player)/dashboard/page.tsx`
- `apps/web/src/app/(player)/clubs/page.tsx`
- `apps/web/src/app/(player)/stats/page.tsx`
- `apps/web/src/app/(player)/profile/page.tsx`

**Funcionalidades:**
- Dashboard con resumen
- Lista de clubs donde juega
- Condiciones actuales por club
- Vista de estadísticas (cuando las haya)
- Editar perfil personal

---

## 📦 Packages adicionales a instalar

```bash
# Para formularios
pnpm add react-hook-form @hookform/resolvers zod

# Para tablas
pnpm add @tanstack/react-table

# Para iconos
pnpm add lucide-react

# Para dates
pnpm add date-fns

# Para copiar al clipboard
pnpm add react-hot-toast

# shadcn/ui components (ir añadiendo según necesites)
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add form
```

---

## 🎨 Diseño UI/UX

### Paleta de Colores

```css
/* Poker-themed colors */
--primary: Azul oscuro (profesional)
--secondary: Verde poker (mesas)
--accent: Dorado (diamantes - brand)
--danger: Rojo (alertas)
```

### Componentes clave a diseñar

1. **Player Card**
   - Avatar/iniciales
   - Nombre
   - Status badge
   - Player code
   - Stats rápidas

2. **Club Card**
   - Logo del club
   - Nombre
   - Rakeback base
   - Número de jugadores

3. **Stats Card**
   - Manos jugadas
   - Rake total
   - Resultado
   - Ratio
   - Rakeback ganado

4. **Condition Viewer**
   - Tabla de reglas
   - Highlight de regla aplicable
   - Visual clara de rangos

---

## 🧪 Testing Strategy

### Unit Tests

Archivos a testear:
- `packages/utils/src/rakeback-calculator.ts`
- `packages/utils/src/validators.ts`
- `packages/database/src/queries/*.ts`

### Integration Tests

- Auth flow completo
- CRUD operations
- RLS policies

### E2E Tests (Playwright)

Escenarios críticos:
1. Admin crea jugador → Jugador se registra → Login funciona
2. Admin asigna jugador a club → Jugador ve el club
3. Admin asigna condiciones → Cálculo correcto
4. Admin ingresa stats → Player ve stats actualizadas

---

## 📊 Métricas de Progreso

| Tarea | Estimación | Estado |
|-------|------------|--------|
| Auth (login/register) | 8h | ⏳ |
| Panel Admin - Base | 4h | ⏳ |
| CRUD Jugadores | 8h | ⏳ |
| CRUD Clubs | 6h | ⏳ |
| Sistema Condiciones | 8h | ⏳ |
| Portal Jugador | 10h | ⏳ |
| Lógica Cálculo | 12h | ⏳ |
| Testing | 8h | ⏳ |
| Deploy | 4h | ⏳ |
| Ajustes | 8h | ⏳ |
| **TOTAL Restante** | **76h** | |

---

## 🚀 Quick Start para Empezar

```bash
# 1. Asegúrate de que todo esté instalado
pnpm install

# 2. Configura Supabase (si no lo has hecho)
# Ver SETUP.md

# 3. Instala los componentes de shadcn que necesitarás
cd apps/web
npx shadcn-ui@latest init

# 4. Añade componentes básicos
npx shadcn-ui@latest add button input label form card

# 5. Crea la estructura de carpetas para auth
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register

# 6. Empieza a codear!
cd ../..
pnpm dev
```

---

## 💡 Tips de Desarrollo

1. **Usa Server Actions** para mutations (create, update, delete)
2. **Usa Server Components** por defecto, Client Components solo cuando necesites interactividad
3. **Aprovecha RLS** - deja que Supabase maneje la seguridad
4. **Reutiliza componentes** entre admin y player donde tenga sentido
5. **Documenta mientras desarrollas** - añade JSDoc a funciones complejas
6. **Commit frecuente** - commits pequeños y descriptivos

---

## 📞 Siguiente Sesión

**Objetivo:** Tener login + register funcionando completamente

**Checklist antes de continuar:**
- [ ] Supabase configurado y migrations ejecutadas
- [ ] pnpm install ejecutado sin errores
- [ ] pnpm dev funciona
- [ ] Puedes ver localhost:3000

**Listo para continuar?** → Empieza con Task 1: Páginas de Login y Register

---

**Happy Coding! 🎰♠️♥️♣️♦️**
