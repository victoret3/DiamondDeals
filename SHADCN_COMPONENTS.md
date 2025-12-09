# Componentes shadcn/ui Instalados

## ✅ Componentes Disponibles

### Formularios
- ✅ **Form** - Wrapper para React Hook Form con validación Zod
- ✅ **Input** - Input de texto con estilos
- ✅ **Label** - Etiquetas de formulario
- ✅ **Button** - Botones con variantes (default, destructive, outline, secondary, ghost, link)

### Feedback
- ✅ **Alert** - Alertas con variantes (default, destructive)
- ✅ **Toast** - Notificaciones toast usando Sonner
- ✅ **Badge** - Badges con variantes (default, secondary, destructive, outline, success, warning)

### Layout
- ✅ **Card** - Tarjetas con Header, Title, Description, Content, Footer
- ✅ **Dialog** - Modales/Diálogos
- ✅ **Dropdown Menu** - Menús desplegables completos

### Tablas
- ✅ **Table** - Tabla completa con Header, Body, Footer, Row, Cell

### Utilidades
- ✅ **cn()** - Función para merge de clases con Tailwind

---

## 📦 Dependencias Instaladas

```json
{
  "@hookform/resolvers": "^3.9.1",
  "@radix-ui/react-accordion": "^1.2.1",
  "@radix-ui/react-alert-dialog": "^1.1.2",
  "@radix-ui/react-avatar": "^1.1.1",
  "@radix-ui/react-checkbox": "^1.1.2",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.2",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-popover": "^1.1.2",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-switch": "^1.1.1",
  "@radix-ui/react-tabs": "^1.1.1",
  "@radix-ui/react-toast": "^1.2.2",
  "@tanstack/react-table": "^8.20.5",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "cmdk": "^1.0.0",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.462.0",
  "react-day-picker": "^8.10.1",
  "react-hook-form": "^7.53.2",
  "sonner": "^1.7.1",
  "tailwind-merge": "^2.5.4",
  "tailwindcss-animate": "^1.0.7"
}
```

---

## 🎨 Uso de Componentes

### Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Form con React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido de la tarjeta
  </CardContent>
  <CardFooter>
    <Button>Acción</Button>
  </CardFooter>
</Card>
```

### Toast (Notificaciones)

```tsx
import { toast } from "sonner";

// Success
toast.success("Jugador creado correctamente");

// Error
toast.error("Error al guardar");

// Info
toast.info("Información importante");

// Warning
toast.warning("Advertencia");

// Con descripción
toast.success("Éxito", {
  description: "El jugador ha sido creado",
});

// Con acción
toast("Nueva notificación", {
  action: {
    label: "Ver",
    onClick: () => console.log("Ver"),
  },
});
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Estás seguro?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button variant="destructive">Eliminar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Table

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>
        <Badge variant="success">Activo</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Opciones</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 🎨 Variantes de Status para Players

```tsx
// Badge para status de jugador
function PlayerStatusBadge({ status }: { status: string }) {
  const variants = {
    pending: "warning",
    active: "success",
    inactive: "secondary",
  } as const;

  return <Badge variant={variants[status]}>{status}</Badge>;
}
```

---

## 🚀 Próximos Componentes a Añadir (según necesidad)

- [ ] Select - Select dropdown
- [ ] Checkbox - Checkboxes
- [ ] Switch - Toggle switches
- [ ] Tabs - Pestañas
- [ ] Accordion - Acordeones
- [ ] Separator - Separadores
- [ ] Avatar - Avatares de usuario
- [ ] Popover - Popovers
- [ ] Calendar - Selector de fechas
- [ ] Command - Command palette (Cmd+K)

Para añadir más componentes, puedes usar el CLI de shadcn:

```bash
cd apps/web
npx shadcn-ui@latest add [component-name]
```

Ejemplo:
```bash
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tabs
```

---

## 📝 Notas

- Todos los componentes usan `cn()` para merge de clases
- Integración completa con React Hook Form
- Accesibilidad (a11y) built-in via Radix UI
- Dark mode ready
- Totalmente tipado con TypeScript
- Personalizables via Tailwind CSS

---

## 🔗 Links Útiles

- [shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
