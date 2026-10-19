# DISEÑO — Panel de Administración (especificación UI para senior-dev)

> **ARCHIVO EFÍMERO — LEER ESTA CAJA ANTES DE EMPEZAR**
>
> 1. Este archivo es la **especificación de UI/UX** del `PLAN_ADMIN.md`: define CÓMO se ven y se comportan las pantallas; el plan define QUÉ se construye (API, DB, workstreams, olas y propiedad de archivos). **Se leen juntos, no se reemplazan.**
> 2. Tu tarea sigue siendo tu **WS del PLAN** (§12): acá encontrás el diseño de tu WS con criterios de aceptación visuales (§14). Si algo de acá contradice al código real, **gana el código real**: anotalo como desvío en §14.
> 3. Antes de codear leé §2 (convenciones globales). No inventes estilos, iconos ni colores fuera de este documento y de `frontend/src/theme.js`.
> 4. Cuando **todas** las secciones estén implementadas y verificadas (checklist §14 en ✅), **BORRAR este archivo**: `git rm DISENO_ADMIN.md`. Es la última tarea de WS8, junto con el borrado de `PLAN_ADMIN.md`.
>
> Versión 1 — 2026-10-16 — elaborado por **ux-ui** a partir del relevamiento de `frontend/src` (theme, MainLayout, App, patrones de tablas/modales/hooks existentes) y del `PLAN_ADMIN.md`.

---

## 1. Mapa: qué diseño le toca a cada workstream

> Cada sección de este doc corresponde a un WS del PLAN. **No diseñes ni codees secciones que no son de tu WS.**

| WS (PLAN §12) | Sección acá | Archivos frontend | Ola |
|---|---|---|---|
| **WS0** — Fundaciones | §3 | `App.jsx` (links + rutas + placeholders) | 0 |
| **WS1** — Usuarios y cuentas | §4 y §5 | `pages/admin/AdminUsuarios.jsx`, `pages/admin/AdminUsuarioDetalle.jsx`, `pages/admin/usuarios/*` | 1 |
| **WS2** — Catálogos | §6 | `pages/admin/AdminCatalogos.jsx`, `pages/admin/catalogos/*` | 1 |
| **WS3** — Configuración + avisos | §7 y §8 | `pages/admin/AdminConfiguracion.jsx`, `pages/admin/configuracion/*`, `components/AvisoBanner.jsx`, `MainLayout.jsx` (inserción) | 1 |
| **WS4** — Monitor + bloqueos | §9 (reusa v2: `EstadoTurnoBadge`, `ReprogramarTurnoModal`, `TurnoHistorialModal`, `utils/estadosTurno.js`) | `pages/admin/AdminTurnos.jsx`, `pages/admin/turnos/*` | 3 |
| **WS5** — Comunicaciones | §10 | `pages/admin/AdminComunicaciones.jsx`, `pages/admin/comunicaciones/*` | 1 |
| **WS6** — Métricas + exportaciones | §11 | `pages/admin/AdminInicio.jsx`, `pages/admin/inicio/*`, `api/descargas.js` (NUEVO) | 4 |
| **WS7** — MFA + Socket.IO | §12 y §13 | `RoleLogin.jsx`, `socket/client.js`, `socket/AdminRealtimeChannel.jsx`, `MainLayout.jsx` (inserción), `api/api.js`, `hooks/useAuth.js` | 1/2 |
| **WS8** — QA final | §14 | checklist visual + borrado de este archivo | 5 |

**Fuera de alcance de este doc**: login de cliente/profesional, invitaciones (ya existen y funcionan), pantallas públicas. El plan manda sobre rutas, API, hooks (`api/adminUsuarios.js`, `hooks/useAdminUsuarios.js`, etc.) y propiedad de archivos — ver PLAN §7 y §12. **Turnos v2 (`origin/feat/ap-register`)**: el ciclo de vida de turnos (8 estados), `EstadoTurnoBadge`, historial y reprogramación YA existen — reusar (PLAN §2.1); este doc solo define lo admin nuevo.

---

## 2. Convenciones globales (obligatorias para TODAS las secciones)

### 2.1 Reglas de implementación (senior-dev)

- **Sin dependencias nuevas.** Todo sale de lo ya instalado: Mantine 9 (`core`, `dates`, `form`, `modals`, `notifications`, `charts`, `schedule`), `@tabler/icons-react` 3.44, TanStack Query 5, dayjs, Tailwind (solo utilidades puntuales). Nada de librerías de tablas, íconos alternativos ni CSS frameworks.
- **Tokens = `theme.js`.** Colores solo de las paletas del theme (`brand`, `accent`, `cyan`, `green`, `yellow`, `red`, `gray`, `dark`), radios por prop `radius`, espaciados por props de Mantine (`gap="lg"`, `p="md"`) o `var(--mantine-*)`. **Prohibido** hex sueltos, `13px` arbitrarios o clases Tailwind nuevas para color/espaciado.
- **Reusá antes de crear.** Componentes existentes: `PageHeader`, `QueryError`, `UserAvatar`, `EstadoTurnoBadge` (`components/`), `formatFechaHora` (`utils/fechas.admin.js`), `fechaCorta`/`horaCorta`/`aISO`/`rangoMes` (`utils/fechas.utils.js`), `useIsDesktop` (`hooks/`), `useGetErrosMsg` (mensajes de error), `notifications` de Mantine. La columna “Patrón de referencia” de cada sección indica el archivo a copiar como estructura.
- **El server es la fuente de verdad.** La UI previene errores obvios (disable, campos requeridos) y muestra los errores del envelope (`error.code` → `useGetErrosMsg`, `error.fieldErrors` → `form.setFieldError`). No duplicar reglas de negocio (slots, políticas, rate limits) en el cliente.
- **Copy en español, voseo, consistente con el resto de la app.** Los strings especificados en este doc se usan tal cual salvo que el dev encuentre un bloqueo — en ese caso, proponer alternativa al final del archivo (§14).
- **Nada de cambios fuera de tu WS.** Si un cambio compartido parece necesario (ej. `useGetErrosMsg`, `MainLayout`, `api.js`), aplicá la regla de propiedad del PLAN §7 y anotá el desvío en §14.
- **Sin scope creep.** ¿Encontraste un bug o una mejora? Se reporta en §14, no se arregla de prepo en este PR.

### 2.2 Los 5 estados (plantilla por pantalla)

Toda vista con datos define SIEMPRE estos estados (los criterios de aceptación de cada sección los concretan):

| Estado | Regla visual |
|---|---|
| **Loading** | Primera carga: `Center h="30vh"` + `<Loader />` dentro del área de contenido (convención del repo: `AdminInvitaciones.jsx`). En el dashboard (§11) además: Skeleton en las KPI cards. Refetch en vivo (socket): usar `placeholderData` para no parpadear (§11). |
| **Empty** | Ícono propósito `size={48}` + `Text c="dimmed"` centrado, y **si el vacío tiene causa accionable**, un botón (ej. “Limpiar filtros”). Nunca un vacío mudo. |
| **Error** | `<QueryError message={error.message} onRetry={refetch} />` — sin excepciones. Errores de mutación → `notifications.show` rojo con el mensaje de `useGetErrosMsg` (§2.11). |
| **Partial** | Si una parte de la página falla, el resto sigue usable: cada `Paper` con datos propios gestiona su estado (ej. KPIs cargan aunque un gráfico venga vacío → “Sin datos en el período”). |
| **Ideal + overflow** | Nombres largos → `Text lineClamp={1}` con `title`; tablas anchas → `Table.ScrollContainer` con `minWidth`; listas largas → `ScrollArea`; textos largos → `lineClamp` o drawer con scroll (§10). |

### 2.3 Iconografía (regla + fuente única)

**Solo `@tabler/icons-react`** (ya instalado, v3.44). Los íconos de la tabla siguiente son LA selección: no cambiarlos por “uno parecido” — la consistencia es parte del diseño.

Tamaños y strokes (tomados del código existente, no inventados):

| Contexto | `size` | `stroke` | Referencia en el repo |
|---|---|---|---|
| Navegación lateral (sidebar) | 20 | 1.5 | `NavLinks.jsx`, `NavbarFooter.jsx` |
| Título de sección dentro de un `Paper` | 16 | 2 | `Dashboard.jsx` (`IconChartBar`) |
| Botón con texto | 18 | default | `AdminInvitaciones.jsx` (`IconMailPlus`) |
| Botón compacto / ítem de `Menu` | 16 | default | `ProximoTurno.jsx`, `TurnosDeHoy.jsx` |
| `ActionIcon` | 16–18 | 2 | — |
| Metadato en línea (hora, fecha, contacto) | 14 | default, `c="dimmed"` | `ProximoTurno.jsx` |
| Estado vacío centrado | 48 | default, `c="dimmed"` | `ProximoTurno.jsx` (`IconCalendarOff`) |
| Encabezado de modal destructivo | 28 | default, `color="red"` | `CancelarTurnoProfModal.jsx` |
| Placeholder de página (`ThemeIcon 56 radius="xl" variant="light"`) | 30 | default | `AdminInicio.jsx` actual |

**Selección por uso:**

| Uso | Ícono |
|---|---|
| Sidebar: Inicio (métricas) | `IconLayoutDashboard` |
| Sidebar: Turnos (monitor) | `IconCalendarStats` |
| Sidebar: Usuarios | `IconUsers` |
| Sidebar: Comunicaciones | `IconSpeakerphone` |
| Sidebar: Catálogos | `IconBooks` |
| Sidebar: Invitaciones (ya existe) | `IconMailPlus` |
| Sidebar footer: Configuración (ya existe) | `IconSettings` |
| Buscar | `IconSearch` |
| Filtros / limpiar | `IconFilter` |
| Ver ficha / navegar a detalle | `IconChevronRight` |
| Volver | `IconArrowLeft` |
| Editar | `IconPencil` |
| Eliminar (físico) | `IconTrash` |
| Guardar | `IconDeviceFloppy` |
| Crear / agregar | `IconPlus` |
| Reintentar | `IconRefresh` |
| Cerrar / descartar | `IconX` |
| Éxito / confirmación | `IconCheck`, `IconCircleCheck` |
| Confirmación peligrosa (modal) | `IconAlertCircle` |
| Peligro / zona de riesgo | `IconAlertTriangle` |
| Info | `IconInfoCircle` |
| Crítico | `IconAlertOctagon` |
| Hora / reloj | `IconClock` |
| Fecha / calendario | `IconCalendarEvent` |
| Reset de contraseña | `IconKey` |
| Bloqueo de agenda | `IconCalendarOff` |
| Cuenta: activa / suspendida / baja | `IconUserCheck` / `IconUserPause` / `IconUserOff` |
| Datos personales / de cuenta | `IconUser` / `IconIdBadge2` |
| Contacto inline (mail, teléfono, dirección) | `IconMail`, `IconPhone`, `IconMapPin` |
| Historial | `IconHistory` |
| Especialidad (perfil/tab/catálogo) | `IconStethoscope` |
| Obra social (perfil/tab/catálogo) | `IconHeartHandshake` |
| Monitor: menú de fila | `IconDots` |
| Monitor: reasignar | `IconArrowsExchange` |
| Monitor: completar | `IconCircleCheck` |
| Monitor: ausente | `IconUserX` |
| Monitor: cancelar turno | `IconCalendarX` |
| Monitor: vista calendario | `IconCalendarMonth` |
| Comunicaciones: individual / masivo / historial / enviar / preview | `IconUser` / `IconUsersGroup` / `IconHistory` / `IconSend` / `IconEye` |
| Métricas: turnos hoy / rango / completitud / ausentismo | `IconCalendarCheck` / `IconCalendarMonth` / `IconCircleCheck` / `IconUserX` |
| Métricas: gráficos (estado / horas pico / clientes / tops) | `IconChartPie` / `IconChartBar` / `IconTrendingUp` / `IconStethoscope`, `IconUsers` |
| Exportar CSV | `IconFileSpreadsheet` / `IconFileDownload` |
| MFA: escudo / reenviar | `IconShieldLock` / `IconRefresh` |
| Realtime: turno creado / cancelado / reasignado / aviso / general | `IconCalendarPlus` / `IconCalendarX` / `IconArrowsExchange` / `IconSpeakerphone` / `IconBellRinging` |

### 2.4 Superficies, espaciado y tipografía

- **Página**: `PageHeader` (título + subtítulo + acciones + avatar) seguido de `Stack gap="lg"` (o `gap="md"` si hay muchas secciones). El `PageHeader` ya oculta el subtítulo en mobile (`visibleFrom="sm"`).
- **Contenedores**: `Paper withBorder radius="md"` (secciones de trabajo) / `radius="lg"` (cards tipo dashboard). Padding `p="md"` o `p="lg"`. **No** anidar más de 2 niveles de Paper.
- **Título de sección dentro de un Paper**: `Group gap="xs"` con ícono `16/2` + `Text fw={700} fz="lg"` + `Divider my="md" size="xs"` (patrón `Dashboard.jsx`).
- **Espaciado**: pasos del theme — `xs`=8, `sm`=12, `md`=16, `lg`=24, `xl`=32. Proximidad: lo relacionado junta (`gap="xs"`/`"sm"`), lo independiente separa (`gap="lg"` o `Divider`).
- **Tipografía**: no inventar tamaños — `fz="xl"` título, `fz="lg"` subtítulo de card, `fz="md"` body, `fz="sm"` secundario, `fz="xs"` etiquetas uppercase con `c="dimmed"`. Dos pesos: 600/700 para énfasis, default para el resto. Valores grandes de KPI: `fz={40}` `fw={700} lh={1}`.
- **Jerarquía**: una sola acción primaria por pantalla/sección (`Button` filled), el resto `variant="default"` (neutros) o `variant="light"` (semánticos: rojo = destructivo, etc.). Si todo está resaltado, nada lo está.
- **Color de estados (consistencia con badges existentes)**: turno — usar `ESTADO_COLOR` de `utils/estadosTurno.js` (v2: `EstadoTurnoBadge` cubre los 8 estados; NO hardcodear colores por estado); cuenta `activa=teal`, `suspendida=yellow`, `baja=red` (§4.2); aviso `info=brand`, `advertencia=yellow`, `critico=red` (§8). El color **nunca** va solo: siempre acompañado de texto o ícono.

### 2.5 Tablas y vistas móviles

Patrón canónico de tabla (mezcla de `TurnosTableProf.jsx` + `AdminInvitaciones.jsx`):

```jsx
<Paper withBorder radius="md">
  <Table.ScrollContainer minWidth={N}>   // N según columnas (ver cada sección)
    <Table verticalSpacing="sm" highlightOnHover>
      <Table.Thead><Table.Tr>
        <Table.Th><Text fz="xs" fw={700} tt="uppercase" c="dimmed">Columna</Text></Table.Th>
      </Table.Tr></Table.Thead>
      ...
```

- **Mobile** (`useIsDesktop('sm')` → false): las listas operativas (usuarios §4, turnos §9) se renderizan como **cards** (`Paper withBorder radius="lg" p="md"`, patrón `TurnoCardProf.jsx`). Las tablas cortas y de baja frecuencia (catálogos §6, historial de comunicaciones §10) mantienen tabla con scroll horizontal — anotado en cada sección.
- Fechas/horas en tablas: `fechaCorta()` / `horaCorta()` (turnos) y `formatFechaHora()` (fechas administrativas). No formatear a mano.

### 2.6 Badges

- Estados de turno: **reusar `EstadoTurnoBadge`** tal cual (v2: cubre los 8 estados — `pendiente_confirmacion`, `confirmado`, `en_espera`, `en_curso`, `completado`, `ausente`, `reprogramado`, `cancelado`).
- Estados de cuenta (nuevo, WS1): `EstadoCuentaBadge` (§4.2) — copia exacta de la estructura de `EstadoTurnoBadge`: `variant="light" radius="xl" size="md" tt="uppercase"`.
- Roles: `Badge variant="outline"` — `Cliente=brand`, `Profesional=teal`, `Admin=violet` (consistente con `AdminInvitaciones.jsx`).
- Tipos de aviso / tipo de envío: `variant="light"` con el color de §2.4 + ícono de la tabla de §2.3 donde aplique.

### 2.7 Modales, confirmaciones y microcopy

- **Anatomía de modal**: `Modal centered`, `overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}` (patrón `CancelarTurnoProfModal.jsx`). Formularios → header estándar de Mantine. Confirmaciones destructivas → header custom: `IconAlertCircle 28` rojo + título `fw={700} fz="xl"`, `withCloseButton={false}`, texto dimmed que **explica la consecuencia**, y footer `Group justify="flex-end"` con `[Secundario variant="default"] [Confirmar variant="light" color]`.
- **Presupuesto de fricción** (qué lleva confirmación y qué no):
  - Confirman: cancelar turno (motivo **obligatorio**), dar de baja, suspender, reset de contraseña, eliminar aviso, eliminar bloqueo, envío masivo, marcar ausente.
  - **No** confirman: reactivar cuenta, marcar completado (acción frecuente y de bajo costo), toggle de catálogo (reversible con el mismo switch), guardar configuración.
- **Mientras `isPending`**: el botón de confirmar va `loading`, los botones de cancelar/cerrar van `disabled`, y el cierre por overlay/X no debe cerrar (patrón `cerrar()` de `CancelarTurnoProfModal.jsx`).
- Microcopy dado en cada sección — usarlo tal cual (voseo).

### 2.8 Notificaciones

`notifications.show` siempre `position: 'top-right'` (convención del repo):

| Tipo | Regla |
|---|---|
| Éxito | `color: 'green'`, `icon: <IconCheck />`, entre 3 y 6 palabras de título + consecuencia en el mensaje. |
| Error | `color: 'red'`, `icon: <IconX />` (o el ícono de §2.3), mensaje = `errorMessage(error.code)`. |
| En vivo (socket) | Ícono + color por evento (§13.2). |
| Contadores (reenvío) | Patrón `useNotificationCountDown` + `notifications.update` como en `RoleLogin.jsx`. |

### 2.9 Formularios

- `useForm` de Mantine, `mode: 'uncontrolled'` (convención del repo), `key={form.key('x')}` + `form.getInputProps('x')`.
- Validaciones de formato en `validate` (DNI 7–8 dígitos, email, requeridos). Mensajes en voseo, accionables (“El DNI debe tener 7 u 8 dígitos”).
- Errores del server: `error.fieldErrors` → `form.setFieldError(campo, mensaje)`; si no hay fieldErrors, notificación roja con `useGetErrosMsg`.
- **Nunca** limpiar el formulario en error (el usuario no pierde lo tipeado). Submit: botón `loading={isPending}`, `disabled` hasta que sea válido.
- `onSubmit` con `form.onSubmit(handler)` y `<form noValidate>`.

### 2.10 Responsive y accesibilidad

- Breakpoints del theme: `sm` = 48em (≈768px), `md` = 62em (≈992px). Decisiones por breakpoint en cada sección; regla general: **columnas apilan, tablas se vuelven cards o scrollean, filtros pasan a `SimpleGrid cols={{ base: 1, sm: 2 }}`**.
- Touch: todo control tappable ≥ 44px en mobile (botones `size="md"`, `ActionIcon size="lg"`; `Switch size="md"`). El repo ya fuerza `font-size: 16px` en inputs móviles (`index.css`) — no pelear con eso.
- `ActionIcon` **siempre** con `aria-label` (ej. `aria-label="Editar especialidad"`). `Switch` con `aria-label`. Tablas: `Table.Th` con texto real (nunca ícono solo).
- Foco: al abrir un modal, Mantine lo maneja; al avanzar de paso (MFA §12), el nuevo paso enfoca su primer control.
- Contraste: usar colores `-7`/`-light-color` del theme para texto sobre fondos light (los badges light ya cumplen). Nada de gris sobre gris.
- Dark mode: usar props/`var(--mantine-*)` (que ya resuelven por esquema); si hace falta un color condicional, patrón `useComputedColorScheme` de `StatCard.jsx`. **Probar cada pantalla en ambos temas.**

### 2.11 Mensajes de error nuevos (`useGetErrosMsg.jsx`)

El plan (§8.8) agrega códigos nuevos. Agregar al **final** del objeto `MESSAGES` (append; si corrés en paralelo con otro WS, rebasá — misma regla que `email.methods.js` en PLAN §7):

| Código | Mensaje (voseo) | WS que lo agrega |
|---|---|---|
| `ACCOUNT_SUSPENDED` | Tu cuenta está suspendida. Contactá a la administración del centro. | WS7 |
| `ALREADY_SUSPENDED` | La cuenta ya estaba suspendida. | WS1 |
| `NOT_SUSPENDED` | La cuenta ya está activa. | WS1 |
| `CANNOT_DELETE_SELF` | No podés dar de baja tu propia cuenta. | WS1 |
| `MFA_INVALID_CODE` | El código no es correcto. | WS7 (inline, ver §12) |
| `MFA_EXPIRED` | El código venció. Pedí uno nuevo. | WS7 (inline) |
| `MFA_TOO_MANY_ATTEMPTS` | Demasiados intentos. Volvé a empezar o pedí un código nuevo. | WS7 (inline) |
| `MFA_RESEND_TOO_SOON` | Esperá unos segundos antes de pedir otro código. | WS7 |
| `MFA_CHALLENGE_INVALID` | La verificación venció. Iniciá sesión de nuevo. | WS7 |
| `MOTIVO_REQUIRED` | Escribí un motivo para la cancelación. | WS4 |
| `NOT_REASSIGNABLE` | Este turno ya no se puede reasignar. | WS4 |
| `AGENDA_BLOCKED` | El profesional tiene la agenda bloqueada en ese horario. | WS4 |
| `CENTER_CLOSED` | El centro permanece cerrado ese día. | WS3 |
| `BOOKING_TOO_SOON` | Ese horario es demasiado próximo para reservar. | WS3 |
| `CANCEL_TOO_LATE` | Ya no estás a tiempo de cancelar este turno. | WS3 |
| `SEGMENT_EMPTY` | El segmento seleccionado no tiene destinatarios. | WS5 |
| `DUPLICATE_NAME` | Ya existe un registro con ese nombre. | WS2 |

---

## 3. WS0 — Navegación y placeholders

**Referencia**: PLAN §12 WS0 punto 4. **Archivo**: `frontend/src/App.jsx` (única edición, SOLO WS0).

### 3.1 Links del sidebar (orden final)

```
Inicio         → /admin                  (IconLayoutDashboard)
Turnos         → /admin/turnos           (IconCalendarStats)
Usuarios       → /admin/usuarios         (IconUsers)
Comunicaciones → /admin/comunicaciones   (IconSpeakerphone)
Catálogos      → /admin/catalogos        (IconBooks)
Invitaciones   → /admin/invitaciones     (IconMailPlus)
```

- **Por qué este orden**: frecuencia de uso diario — el monitor de turnos es la pantalla operativa principal, usuarios/comunicaciones después, catálogos e invitaciones son de baja frecuencia. “Configuración” **no** va al sidebar: ya vive en el footer (`NavbarFooter.jsx` → `/admin/configuracion`), no duplicar.
- `linksForAdmin` mantiene la estructura actual (`{ label, path, element, icon }`); rutas dentro del `ProtectedRoute roles={['admin']}` existente. Ruta de detalle: `/admin/usuarios/:dni/:rol`.

### 3.2 Placeholders (WS0 los crea, WS1–WS6 los reemplazan)

Copiar el patrón actual de `AdminInicio.jsx`/`AdminConfiguracion.jsx` (PageHeader + `Center h="60vh"` + `ThemeIcon 56 radius="xl" variant="light"` + ícono 30 + Text dimmed):

| Página | Título | Ícono | Mensaje |
|---|---|---|---|
| `AdminUsuarios.jsx` | Usuarios | `IconUsers` | Pronto vas a poder gestionar acá las cuentas de usuarios. |
| `AdminUsuarioDetalle.jsx` | Usuario | `IconUser` | La ficha del usuario va a aparecer acá. |
| `AdminTurnos.jsx` | Turnos | `IconCalendarStats` | Pronto vas a ver acá el monitor global de turnos. |
| `AdminComunicaciones.jsx` | Comunicaciones | `IconSpeakerphone` | Pronto vas a poder enviar comunicaciones desde acá. |
| `AdminCatalogos.jsx` | Catálogos | `IconBooks` | Pronto vas a poder administrar especialidades y obras sociales. |

**Criterio de aceptación**: siendo admin, los 6 links aparecen en el sidebar con el ícono correcto, cada uno navega a su página, “Configuración” sigue en el footer, y ningún otro rol ve estos links. Cada placeholder renderiza en light y dark.

---

## 4. WS1a — Usuarios (listado)

**Referencia**: PLAN §12 WS1 (U1–U7 backend; acá U1–U2 listado). **Página**: `pages/admin/AdminUsuarios.jsx`. **Patrón**: `AdminInvitaciones.jsx` (filtros + tabla) + `TurnosTableProf.jsx` (theads).

### 4.1 Layout

```
Usuarios                                              [avatar]
Buscá y gestioná las cuentas del centro.

+-- Filtros -------------------------------------------------------+
| [Buscar nombre, apellido, DNI o correo...] [Rol v] [Estado v]   |
|                                                  [Limpiar filtros]|
+------------------------------------------------------------------+
+-- Tabla ----------------------------------------------------------+
| NOMBRE          ROL          DNI       CORREO       ESTADO   ACC |
| (av) Ana Perez  [Cliente]    30111222  ana@x.com    [Activa] Ver |
| (av) Dr. Gomez  [Profesional]28777111  gomez@x.com  [Susp.]  Ver |
+------------------------------------------------------------------+
12 cuentas
```

### 4.2 Anatomía

| Parte | Especificación |
|---|---|
| Filtros | `Paper withBorder p="md" radius="md"`; `SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}` con: `TextInput` (leftSection `IconSearch`) placeholder “Nombre, apellido, DNI o correo…” (debounce 300 ms → `q`); `Select` Rol: “Todos los roles” + Cliente/Profesional/Admin; `Select` Estado: “Todos los estados” + Activa/Suspendida/Baja; `Button variant="default"` “Limpiar filtros” (visible solo si hay algún filtro activo). |
| Tabla | Desktop: columnas NOMBRE (avatar 32 + `nombre apellido`), ROL (badge outline §2.6), DNI, CORREO, ESTADO, ACCIONES. `Table.ScrollContainer minWidth={760}`. Fila con `highlightOnHover`. |
| Estado cuenta | **Componente nuevo `EstadoCuentaBadge`** en `pages/admin/usuarios/EstadoCuentaBadge.jsx` — copia de `EstadoTurnoBadge` con mapa `{ activa: ['teal','Activa'], suspendida: ['yellow','Suspendida'], baja: ['red','Baja'] }`. |
| Acción por fila | `Button size="xs" variant="light"` “Ver ficha” → `navigate('/admin/usuarios/{dni}/{rol}')`. Es la única acción de la lista (las pesadas viven en la ficha — una acción primaria por pantalla). |
| Contador | `Text fz="sm" c="dimmed"` bajo la tabla: “N cuentas” (“1 cuenta” en singular). Sin paginación (PLAN §3.10). |
| Mobile (< sm) | Cards `UsuarioCard.jsx` (`Paper withBorder radius="lg" p="md"`): fila 1 avatar + nombre + `EstadoCuentaBadge`; fila 2 badges de rol + DNI; fila 3 `Button variant="default"` “Ver ficha” full width (patrón `TurnoCardProf.jsx`). |

### 4.3 Estados

- **Loading**: `Center h="30vh"` + `Loader` (área de la tabla; los filtros ya están visibles).
- **Empty sin filtros**: ícono `IconUsers` 48 + “Todavía no hay cuentas registradas.”
- **Empty con filtros**: ícono `IconUserSearch` 48 + “No hay cuentas que coincidan con los filtros.” + `Button` “Limpiar filtros”.
- **Error**: `QueryError` con retry.
- **Overflow**: nombres/correos largos → `lineClamp={1}` + `title`.

### 4.4 Criterios de aceptación

- [ ] Con ≥ 12 cuentas seed, la tabla lista todas, con badge de estado correcto por cuenta.
- [ ] Escribir 3+ caracteres en buscar filtra por nombre/apellido/DNI/correo (probar las 4 variantes); “Limpiar filtros” restaura la lista completa.
- [ ] Un usuario suspendido muestra badge amarillo; uno de baja, rojo; la ficha de ambos sigue accesible (§5).
- [ ] En < sm la lista se ve como cards, sin scroll horizontal de página.
- [ ] Light + dark OK.

---

## 5. WS1b — Ficha de usuario (detalle)

**Referencia**: PLAN §12 WS1 (U2, U3, U4, U5, U6, U7). **Página**: `pages/admin/AdminUsuarioDetalle.jsx`. **Ruta**: `/admin/usuarios/:dni/:rol`.

### 5.1 Layout (desktop ≥ md)

```
<- Volver a Usuarios                                  [avatar]

+-- Ficha ---------------------------------------------------------+
| (av 64) Ana Perez            [Cliente] [Activa]                  |
|         DNI 30111222 - ana@x.com - +54 9 11 5555-5555            |
|                                    [Editar datos] [Resetear pass]|
+------------------------------------------------------------------+
+-- col 4 -----------------+-- col 8 ------------------------------+
| Datos personales         | Historial de turnos (ultimos 50)      |
|  Nombre: Ana             | FECHA   HORA  CONTRAPARTE  ESTADO MOT.|
|  ...                     | vie 17  09:00 (av) Dr. Gomez [Activo] -|
| Datos de la cuenta       |                                       |
|  Creada el: ...          |                                       |
| Datos del perfil         |                                       |
|  Obra social: OSDE       |                                       |
| Zona de riesgo           |                                       |
|  [Suspender cuenta]      |                                       |
|  [Dar de baja]           |                                       |
+--------------------------+---------------------------------------+
```

- Dos columnas con `Grid`: izquierda `Grid.Col span={{ base: 12, md: 4 }}` (Stack de Papers, `gap="md"`), derecha `span={{ base: 12, md: 8 }}` (historial). Mobile: apiladas con la ficha primero.
- **Back**: `Anchor` con `IconArrowLeft` “Volver a Usuarios” arriba (en el `title` del `PageHeader` como nodo, o justo debajo). El estado del listado (filtros) no se preserva — aceptado (navegación simple).

### 5.2 Ficha (header card)

| Parte | Especificación |
|---|---|
| Identidad | `UserAvatar size={64}` + `Text fw={700} fz="xl"` nombre completo + badges de rol (§2.6) y `EstadoCuentaBadge`. |
| Datos de contacto | `Group` con ícono 14 dimmed + texto (`IconId`/`IconIdBadge2` DNI, `IconMail` correo, `IconPhone` teléfono — omitir los vacíos con “—”). |
| Acciones | `Button` primary `IconPencil` “Editar datos”; `Button variant="default"` `IconKey` “Resetear contraseña”. Si la cuenta está `baja`: ambas deshabilitadas + `Tooltip` “Reactivá la cuenta para editarla”. |

### 5.3 Paneles de datos (columna izquierda)

- **Datos personales**: filas etiqueta/valor — `Group`: `Text fz="sm" c="dimmed" w={140}` etiqueta + `Text fz="sm"` valor. Campos: nombre, apellido, DNI, fecha de nacimiento, género, correo, teléfono.
- **Datos de la cuenta**: rol, estado, creada el (`formatFechaHora`).
- **Datos del perfil**: **solo cliente/profesional** — cliente: obra social (`IconHeartHandshake`), n° afiliado; profesional: matrícula, duración del turno (min). Si es admin: este Paper no se muestra.
- **Zona de riesgo** (Paper con `IconAlertTriangle` amarillo en el título): texto dimmed “Acciones sensibles sobre esta cuenta.” + `Button variant="light"` contextual:
  - cuenta `activa` → “Suspender cuenta” (yellow) → modal §5.5.
  - cuenta `suspendida` o `baja` → “Reactivar cuenta” (teal) → **sin modal**: acción directa + notificación verde “Cuenta reactivada.” (bajo costo, reversible).
  - “Dar de baja” (red) siempre visible si no es uno mismo; si `dni/rol` == usuario logueado → `disabled` + `Tooltip` “No podés dar de baja tu propia cuenta” (espejo del 409 `CANNOT_DELETE_SELF`).

### 5.4 Historial de turnos (columna derecha)

- Tabla `Table.ScrollContainer minWidth={560}`: FECHA, HORA, CONTRAPARTE (cliente → muestra profesional; profesional → muestra cliente, con `UserAvatar 32` + nombre), ESTADO (`EstadoTurnoBadge`), MOTIVO (`lineClamp={1}` + `title`; “—” si vacío).
- Subtítulo del Paper: “Últimos 50 turnos.”
- Empty: ícono `IconHistory` 48 + “Sin turnos registrados.”
- Solo lectura: el admin cancela/reasigna desde el monitor (§9), no desde acá — evita duplicar flujos.

### 5.5 Modales

| Modal | Título / copy | Contenido y confirmación |
|---|---|---|
| **Suspender** | “¿Suspender esta cuenta?” — “{Nombre} no va a poder iniciar sesión hasta que la reactives. Sus turnos y datos se conservan.” | Solo texto. Confirm `variant="light" color="yellow"` “Sí, suspender”. Éxito: “Cuenta suspendida.” |
| **Dar de baja** | “¿Dar de baja esta cuenta?” — “La cuenta deja de poder iniciar sesión y deja de recibir comunicaciones. Es reversible: podés reactivarla desde esta misma ficha.” | Solo texto. Confirm `variant="light" color="red"` “Sí, dar de baja”. Éxito: “Cuenta dada de baja.” |
| **Reset de contraseña** | “¿Enviar correo de restablecimiento?” — “Le vamos a enviar a {correo} un enlace para crear una nueva contraseña. Vence en 10 minutos.” | Solo texto. Confirm filled (primary) “Enviar correo”. Éxito: “Correo enviado a {correo}.” |
| **Editar datos** (`EditarUsuarioModal.jsx`) | Header estándar “Editar datos de {Nombre}”. | `useForm` con campos **según rol**: cliente → teléfono, obra social (`Select` de obras sociales activas + valor actual aunque esté inactiva), n° afiliado; profesional → teléfono, n° matrícula, duración del turno (min); admin → teléfono. Submit primary `IconDeviceFloppy` “Guardar cambios” `loading`. `DUPLICATE_MATRICULA` (409) → `form.setFieldError('numero_matricula', ...)`; otros → notificación roja. Éxito: “Datos actualizados.” |

### 5.6 Criterios de aceptación

- [ ] U2: la ficha muestra personales + cuenta + perfil según rol, con estado correcto; historial lista los últimos 50 turnos con contraparte correcta.
- [ ] U3: editar teléfono se refleja en el perfil del cliente; obra social por nombre funciona; matrícula duplicada → error visible en el campo, sin perder el resto del form.
- [ ] U4/U5: suspender bloquea login con `ACCOUNT_SUSPENDED` (403) y `me` → null al recargar; reactivar restaura sin modal.
- [ ] U6: baja conserva el historial; el botón está deshabilitado en la propia cuenta con tooltip.
- [ ] U7: reset dispara email real (probar con Resend dev) y no muestra la contraseña en ningún lado.
- [ ] Mobile: todo apilado, touch targets ≥ 44px, ningún modal corta su footer.

---

## 6. WS2 — Catálogos maestros

**Referencia**: PLAN §12 WS2 (E1–E10). **Página**: `pages/admin/AdminCatalogos.jsx`. **Patrón**: `AdminInvitaciones.jsx` (form + tabla).

### 6.1 Layout

```
Catálogos                                              [avatar]
Especialidades y obras sociales que ofrece el centro.

[ IconStethoscope Especialidades | IconHeartHandshake Obras sociales ]

+-- Tab activa ----------------------------------------------------+
| [Buscar...]                            [+ Nueva especialidad]    |
| NOMBRE           ESTADO           PROFESIONALES        ACCIONES  |
| Cardiologia      [Switch] Activa  [3 profesionales]    [IconPencil]|
| Dermatologia     [Switch] Inactiva 0                   [IconPencil]|
+------------------------------------------------------------------+
```

### 6.2 Anatomía

- **Tabs**: `Tabs` de Mantine, labels con ícono 16 (`IconStethoscope` / `IconHeartHandshake`). Ambas tabs renderizan el **mismo componente genérico** `CatalogoTabla.jsx` parametrizado por `recurso` ('especialidades' | 'obras-sociales') — misma anatomía, un solo componente.
- **Barra superior**: `TextInput` (izq, `IconSearch`, placeholder “Buscar {especialidad|obra social}…”) + `Button` primary (der) “Nueva especialidad” / “Nueva obra social” (`IconPlus`). El botón es la acción primaria de la pantalla.
- **Tabla** (`Table.ScrollContainer minWidth={520}`): NOMBRE, ESTADO (`Switch size="sm"` + `Text fz="sm"` “Activa”/“Inactiva”; `aria-label` por fila), PROFESIONALES (`Button variant="subtle" size="xs"` “N profesionales” → abre Drawer; si 0, `Text c="dimmed"` “0”), ACCIONES (`ActionIcon variant="light" aria-label` `IconPencil` → modal editar).
- **Estado del switch**: mutación `PATCH /:id/estado` pendiente → `Switch disabled`; al terminar, notificación “Especialidad deshabilitada — ya no se ofrece en nuevas reservas.” / “Especialidad habilitada.” (mismo copy con “Obra social” en la otra tab). **Sin modal**: el switch es reversible en un click (presupuesto de fricción §2.7).
- **Mobile**: se mantiene tabla con scroll horizontal — es una lista corta de administración, no vale duplicar como cards (anotado).
- **Drawer de asociados** (`ProfesionalesAsociadosDrawer.jsx`, `size="md"`): título “Profesionales — {nombre}”; `Paper`-filas: `UserAvatar 32` + nombre + matrícula; click navega a `/admin/usuarios/{dni}/profesional`. Empty: ícono `IconUsers` 48 + “Ningún profesional tiene esta {especialidad|obra social} asociada.”
- **Modal crear/editar** (`CatalogoItemModal.jsx`, `size="sm"`): campo único “Nombre” (`TextInput`, required); crear → `POST` + “Especialidad creada.”; editar → `PUT` + “Cambios guardados.”; `DUPLICATE_NAME` → `form.setFieldError` (“Ya existe una especialidad con ese nombre.”).

### 6.3 Estados

- Loading: `Loader` en el área de tabla. Error: `QueryError`. Empty: “No hay especialidades cargadas.” / “No hay obras sociales cargadas.” + botón crear.

### 6.4 Criterios de aceptación

- [ ] Crear en cada tab; duplicado → 409 visible en el campo, sin cerrar el modal.
- [ ] Deshabilitar una especialidad: desaparece de filtros de búsqueda pública y del registro, pero sigue visible en la ficha de usuarios históricos; el switch lo refleja al recargar.
- [ ] Drawer lista los profesionales asociados correctos y navega a la ficha.
- [ ] Sin regresiones en registro/reserva (los formularios públicos usan solo activos).

---

## 7. WS3a — Configuración general

**Referencia**: PLAN §12 WS3 (C1–C7); contrato C2 = **PUT de reemplazo completo**. **Página**: `pages/admin/AdminConfiguracion.jsx` (reemplaza el placeholder). **Patrón**: `MiPerfil.jsx` (form por secciones) + `AdminInvitaciones.jsx`.

### 7.1 Layout

```
Configuración                                          [avatar]
Datos del centro, políticas de turnos y avisos.

+-- IconBuildingHospital Datos de la institucion ------------------+
| Nombre del centro * [__________________________]                 |
| Telefono            [________________]   Email [_______________] |
| Direccion           [__________________________________________] |
+------------------------------------------------------------------+
+-- IconCalendarCog Politicas de turnos ---------------------------+
| Dias habiles   [L] [M] [X] [J] [V] [S] [D]      (Chip.Group)     |
| Franja horaria [08:00] a [20:00]                                 |
| Anticipacion minima (min) [60]   Limite de cancelacion (hs) [2]  |
+------------------------------------------------------------------+
[IconDeviceFloppy Guardar cambios]   <- disabled hasta que haya cambios

+-- IconSpeakerphone Avisos ---------------------------------------+
| [+ Nuevo aviso]                                                  |
| [Info] Corte de luz  20/10 al 21/10   [Switch activo] [IconPencil][IconTrash]|
+------------------------------------------------------------------+
```

### 7.2 Form (institución + políticas)

- **Un solo `useForm`** para los dos primeros Papers (el PUT es de reemplazo completo: enviar todos los campos, no solo los tocados). `form.isDirty()` controla “Guardar cambios” (disabled + `Text fz="sm" c="dimmed"` “Sin cambios para guardar” al lado cuando limpio). Submit primary `IconDeviceFloppy`, `loading={isPending}`. Éxito: “Configuración guardada.” Error: notificación roja con `useGetErrosMsg`.
- **Campos**:
  - Nombre del centro: `TextInput` required (máx. 150).
  - Teléfono: `TextInput` (máx. 30). Email: `TextInput type="email"` validado. Dirección: `TextInput` (máx. 255).
  - **Días hábiles**: `Chip.Group multiple` con 7 `Chip` en orden visual L M X J V S D, mapeados a la convención de la DB (**0=domingo … 6=sábado** — PLAN §6.2): `[1,2,3,4,5,6,0]`. Validación: al menos 1 día. Helper dimmed: “Los días no marcados no ofrecen turnos.”
  - **Franja horaria**: dos `TimeInput` (`IconClock` en leftSection) “Apertura” y “Cierre”. Validación: ambas o ninguna; cierre > apertura. Helper: “Recorta los horarios de atención de todos los profesionales.”
  - **Anticipación mínima**: `NumberInput min={0}` sufijo “min”. Helper: “0 = sin mínimo. Ej.: 60 = no se ofrecen turnos dentro de la próxima hora.”
  - **Límite de cancelación**: `NumberInput min={0}`, sufijo “hs”. Helper: “0 = sin límite. Ej.: 2 = no se puede cancelar a menos de 2 horas del turno (un admin sí puede).”
- **Mobile**: `SimpleGrid cols={{ base: 1, sm: 2 }}` por par de campos; el botón Guardar full width.

### 7.3 Avisos (gestión)

- **Lista** (`AvisoItem.jsx`): `Paper withBorder radius="md" p="md"` por aviso — fila 1: `Badge` tipo (§2.6, con ícono del tipo) + `Text fw={600}` título + `Switch` “Activo” (`aria-label` “Aviso activo”) + `ActionIcon` editar (`IconPencil`) + `ActionIcon` eliminar (`IconTrash`, rojo). Fila 2: `Text fz="sm"` mensaje (`lineClamp={2}`). Fila 3: vigencia dimmed — “Sin fecha límite” / “Desde el {fecha}” / “Vigente hasta el {fecha}” / “Programado: {desde} — {hasta}”.
- **Nuevo/editar** (`AvisoModal.jsx`, `size="md"`): Título (`TextInput` required, máx. 150); Tipo (`SegmentedControl` Info/Advertencia/Crítico); Mensaje (`Textarea` required autosize minRows 3); Vigencia (`DatePickerInput type="range" clearable` → `vigente_desde`/`vigente_hasta`; validación desde ≤ hasta). **Vista previa** al pie: `Alert` con el color/ícono del tipo y el título+mensaje tipeados (“Así se va a ver”) — el admin ve lo que va a publicar antes de publicar. Submit “Publicar aviso”/“Guardar cambios” + notificación verde.
- **Eliminar**: modal de confirmación — “¿Eliminar este aviso?” / “Se borra definitivamente. Si querés ocultarlo sin perderlo, desactivalo con el switch.” Confirm rojo. Éxito: “Aviso eliminado.”
- **Empty**: “No hay avisos. Creá uno para comunicar algo a todo el centro.”
- **Estados**: loading (`Loader`), error (cada Paper gestiona su query — el form funciona aunque la lista de avisos falle y viceversa).

### 7.4 Criterios de aceptación

- [ ] Guardar persiste y al recargar los valores vuelven exactos (incluidos los chips de días correctos).
- [ ] El botón Guardar está disabled sin cambios y pasa a enabled+primary al tocar cualquier campo.
- [ ] Crear aviso vigente → aparece en el banner (§8) para un usuario logueado **sin recargar** (socket WS7); aviso con `vigente_hasta` pasado → no aparece.
- [ ] Desactivar con switch lo oculta del banner (refetch); eliminar pide confirmación.
- [ ] Con anticipación=60 y límite=2 se verifican los criterios del PLAN WS3 end-to-end (slot no ofrecido + 409 al forzar).

---

## 8. WS3b — AvisoBanner (MainLayout)

**Referencia**: PLAN §12 WS3 (“`AvisoBanner.jsx` en `MainLayout`”). **Archivos**: `components/AvisoBanner.jsx` (nuevo) + **una inserción puntual** en `MainLayout.jsx` (ver PLAN §7: MainLayout lo tocan WS3 y WS7 — coordinar).

### 8.1 Layout y comportamiento

```
+----------------------------------------------------------+
| (i) Corte de luz: el sabado 20/10 de 8 a 12 el centro    | x |
|     permanece cerrado.                                    |
+----------------------------------------------------------+
```

- Se monta **dentro de `AppShell.Main`, antes de `<Outlet />`** (ancho del contenido, todos los roles logueados — el fetch C3 es público).
- Un `Alert variant="light"` por aviso activo, apilados (`Stack gap="xs" mb="md"`): `color` e `icon` por tipo — `info` → `brand` + `IconInfoCircle`; `advertencia` → `yellow` + `IconAlertTriangle`; `critico` → `red` + `IconAlertOctagon`. `title` = título, children = mensaje. `withCloseButton` (la X descarta **en la sesión**: ids descartados en `sessionStorage` — al recargar en la misma sesión siguen ocultos; en una sesión nueva vuelven).
- Orden: críticos primero, luego advertencia, luego info (lo que más importa arriba). Si hay más de 2: mostrar los primeros 2 + `Text fz="sm" c="dimmed"` “y N avisos más” (evita empujar todo el contenido hacia abajo).
- Query `['avisos','activos']` (hook de WS3) con `staleTime` 5 min; el socket de WS7 la invalida al publicar (`aviso:publicado`) — un aviso nuevo aparece en vivo.
- **Sin avisos activos → no renderiza nada** (ni espacio vacío).

### 8.2 Criterios de aceptación

- [ ] Aviso activo vigente aparece para cliente, profesional y admin; inactivo o vencido no.
- [ ] El dismiss con X no rompe el layout ni vuelve hasta abrir una sesión nueva (nueva pestaña sí lo muestra de nuevo).
- [ ] Un aviso publicado desde el panel aparece sin recargar (socket).
- [ ] Ambos temas y mobile (el texto wrappea, la X no se superpone).

---

## 9. WS4 — Monitor global de turnos + bloqueos

**Referencia**: PLAN §12 WS4 (T1–T5, B1–B3) + **turnos v2** (PLAN §2.1). **Página**: `pages/admin/AdminTurnos.jsx`. **Patrón**: `Agenda.jsx` (Schedule) + `TurnosTableProf.jsx` (tabla/acciones) + `CancelarTurnoProfModal.jsx` (modal). **REUSAR de v2**: `EstadoTurnoBadge`, `ReprogramarTurnoModal`, `TurnoHistorialModal`, `ConfirmarEstadoModal`, `utils/estadosTurno.js`.

### 9.1 Layout (vista Tabla)

```
Turnos                                                 [avatar]
Monitor global de turnos del centro.

+-- Filtros -------------------------------------------------------+
| [IconCalendarEvent 01/10/26 - 16/10/26] [Estado v] [Profesional v]|
| [Cliente: nombre o DNI...]  [Limpiar]                            |
| [ Tabla | Calendario ]              [IconCalendarOff Bloqueos]   |
+------------------------------------------------------------------+
+-- Tabla ----------------------------------------------------------+
| FECHA    HORA  PACIENTE      PROFESIONAL      ESTADO    ACC      |
| vie 17   09:00 (av) Ana P.   (av) Dr. Gomez   [CONFIRMADO] [IconDots]|
| sab 18   10:30 (av) Luis R.  (av) Dra. Diaz   [AUSENTE]    -       |
+------------------------------------------------------------------+
```

- **Filtros** (`Paper withBorder p="md"`): `DatePickerInput type="range"` (`IconCalendarEvent`), default **mes corriente** (`rangoMes()`); `Select` Estado (“Todos” + los 8 estados de v2 con labels de `estadoLabel` — reusar); `Select` Profesional searchable (opciones de `getFilteredProfesional` **existente** — reusar, no duplicar); `TextInput` Cliente (“Nombre o DNI…”, debounce); `Button variant="default"` Limpiar. Segunda fila: `SegmentedControl` “Tabla | Calendario” + (derecha) `Button variant="default"` `IconCalendarOff` **“Bloqueos de agenda”**.
- **Tabla**: columnas FECHA (`fechaCorta`), HORA (`horaCorta`), PACIENTE y PROFESIONAL (avatar 32 + nombre), ESTADO (`EstadoTurnoBadge` v2), ACCIONES (ancho fijo ~56). `minWidth={820}`.
- **Menú de fila** (visible si `esAbierto(estado)` de `utils/estadosTurno.js` — v2; si no, `Text c="dimmed"` “—”): `ActionIcon variant="subtle" aria-label="Acciones del turno"` `IconDots` → `Menu`: “Confirmar” (`IconCheck`; solo `pendiente_confirmacion`), “Marcar en espera” (`IconClock`; solo `confirmado`, mismo día), “Reprogramar” (`IconCalendarEvent`; modal v2), “Ver historial” (`IconHistory`; modal v2), “Reasignar profesional” (`IconArrowsExchange`; NUEVO), “Marcar completado” (`IconCircleCheck`) / “Marcar ausente” (`IconUserX`) *(solo si se amplía T4/T5)*, `Menu.Divider`, “Cancelar turno” (`IconCalendarX`, `color="red"`).
- **Mobile**: cards `TurnoCardAdmin.jsx` — `Paper radius="lg" p="md"`: fila 1 fecha·hora + `EstadoTurnoBadge`; fila 2 paciente; fila 3 profesional; fila 4 `Button variant="default"` full width “Acciones” → mismo `Menu`.

### 9.2 Vista Calendario

- `Schedule` de `@mantine/schedule` en vista **mes** (patrón y labels en español de `Agenda.jsx` — copiar `etiquetasEs`). Eventos: `title: "{HH:MM} {nombre} {apellido}"`, `color` **desde `ESTADO_COLOR`** (`utils/estadosTurno.js`, v2; `confirmado` = `'blue'`, consistente con `Agenda.jsx`; si un nombre de color no rinde en el componente, usar el más cercano del theme — nunca hex).
- Click en un día → el calendario **cambia a vista tabla con el rango de ese día** (una sola fuente de acciones; el calendario es overview, anotado para que nadie duplique menús).
- Los filtros de estado/profesional/cliente aplican también acá.

### 9.3 Modales

| Modal | Spec |
|---|---|
| **Cancelar** (base: `CancelarTurnoProfModal.jsx` de v2 → `CancelarTurnoAdminModal.jsx`) | El server de v2 ya exige motivo (`MOTIVO_REQUIRED`) y registra evento; la UI admin lo hace **required** (`Textarea`, error en campo “Escribí un motivo”) y cambia el copy: “Se le va a avisar por email al cliente y al profesional. El horario vuelve a quedar libre.” Título “¿Cancelar este turno?”. Fecha·hora·nombres en el cuerpo (dimmed). Confirm `variant="light" color="red"` “Sí, cancelar”. |
| **Reprogramar** (reusa `ReprogramarTurnoModal.jsx` de v2) | **No crear modal nuevo.** El admin reprograma igual que el profesional (misma profesional, nueva fecha/hora). Errores v2: `NOT_REPROGRAMMABLE`, `ALREADY_REPROGRAMMED`. |
| **Ver historial** (reusa `TurnoHistorialModal.jsx` de v2) | Desde el menú “Ver historial”. Sin cambios; muestra `turno_evento`. |
| **Reasignar** (`ReasignarTurnoModal.jsx`, `size="md"`) | Header estándar “Reasignar turno”. Cuerpo: resumen dimmed “{Paciente} · {fecha} {hora} · actualmente con {Prof.}”; `Select` searchable “Nuevo profesional” (required, excluye al actual); `Textarea` “Motivo (opcional)”; `Alert variant="light" color="blue"` `IconInfoCircle`: “El turno mantiene fecha y hora. Si el nuevo profesional no atiende ese horario o tiene la agenda bloqueada, no se va a poder reasignar.” Confirm filled “Reasignar”. **Errores dentro del modal** (Alert rojo sobre el footer, sin cerrar): `SLOT_TAKEN` “Ese horario ya está ocupado para el profesional elegido.”, `OUT_OF_SCHEDULE` “El profesional no atiende en ese horario.”, `AGENDA_BLOCKED` “El profesional tiene la agenda bloqueada ese día.”, `NOT_REASSIGNABLE` “Este turno ya no se puede reasignar (pasó o no está abierto).” Éxito: “Turno reasignado. Se avisó al cliente y al profesional nuevo.” |
| **Completar / Ausente** (`AccionEstadoModal.jsx`, `size="sm"`) | **Solo si se amplía `TRANSICIONES` a admin (PLAN §8.4 T4/T5)** — hoy completado/ausente son exclusivos del profesional. “¿Marcar este turno como completado?” / “…como ausente?” + resumen dimmed del turno. Para ausente, línea extra: “Cuenta para la tasa de ausentismo del panel.” Confirm `variant="light"` (teal / orange respectivamente). Éxito: “Turno marcado como completado.” / “Turno marcado como ausente.” |

### 9.4 Bloqueos

- **Botón “Bloqueos de agenda”** (no primario) → `BloqueosModal.jsx` (`size="xl"`): título “Bloqueos de agenda”; subtítulo dimmed “Solo de este rango: {desde} — {hasta}”. Tabla: FECHA(S) (una fila por fecha — el POST crea una por fecha), HORARIO (“Todo el día” o “{inicio}–{fin}”), ALCANCE (“Todo el centro” o nombre del profesional), MOTIVO (dimmed, “—” si vacío), ACCIONES (`ActionIcon` `IconTrash` rojo, `aria-label` “Eliminar bloqueo” → confirm: “¿Eliminar este bloqueo?” / “Los horarios vuelven a estar disponibles para reservar.” → éxito “Bloqueo eliminado.”). Empty: “No hay bloqueos en este rango.” Footer: `Button` primary `IconPlus` “Nuevo bloqueo” → `NuevoBloqueoModal`.
- **Nuevo bloqueo** (`NuevoBloqueoModal.jsx`, `size="md"`): Fechas (`DatePickerInput type="multiple"` required, `minDate` hoy); `Switch` “Todo el día” (default **on**; al apagar aparecen dos `TimeInput` “Desde”/“Hasta” required, validación desde < hasta); `Select` “Alcance”: “Todo el centro” (default, `dni_profesional = null`) + profesionales; `Textarea` “Motivo (opcional)”; `Alert variant="light" color="yellow"` `IconAlertTriangle`: “Los turnos ya tomados dentro del bloqueo NO se cancelan. Los vas a ver en el monitor para cancelarlos o reasignarlos a mano.” (decisión de producto del PLAN §3.6 — anotada para que no la “arreglen”). Confirm primary “Crear bloqueo(s)”. Éxito: “Se crearon N bloqueos.” / “Bloqueo creado.”

### 9.5 Realtime (con WS7)

- Con dos pestañas admin abiertas, un turno creado desde el flujo cliente dispara notificación en vivo (§13) + invalidación de `['admin','turnos']` → la tabla/calendario se refresca sola.

### 9.6 Estados

- Loading: `Loader` en el área de contenido (filtros visibles). Error: `QueryError`. Empty (período): `IconCalendarOff` 48 + “No hay turnos en el período.” Empty con filtros: mismo + botón Limpiar. Overflow: nombres largos `lineClamp={1}`; el menú de fila nunca se corta (Mantine portal).

### 9.7 Criterios de aceptación

- [ ] La tabla lista el mes por defecto con ambos nombres y `EstadoTurnoBadge` v2 por estado; filtros combinables y “Limpiar” los resetea.
- [ ] Confirmar/en espera/reprogramar/historial funcionan reusando la UI de v2 (sin duplicar lógica); cancelar exige motivo (UI + server) y envía emails al cliente y al profesional (Resend).
- [ ] Reasignar a ocupado/bloqueado/fuera de horario → mensaje correcto dentro del modal; a uno libre → turno movido + auditoría + emails.
- [ ] (Si T4/T5 aprobado) completado/ausente cambian estado vía PATCH con evento visible en el historial; si no, esas acciones no aparecen en el menú.
- [ ] Bloqueo de día completo: `/slots` de ese día vacío y reserva forzada 409; de rango: solo ese rango; de centro: todos; borrarlo restaura.
- [ ] Turnos existentes dentro de un bloqueo NO se cancelan solos.
- [ ] Calendario: mes con eventos de color por estado; click de día → tabla de ese día.
- [ ] Socket: dos pestañas, reserva del cliente → notificación + refresh en vivo sin recargar.
- [ ] Mobile: cards + menú funcionando con touch.

---

## 10. WS5 — Centro de comunicaciones

**Referencia**: PLAN §12 WS5 (M1–M4). **Página**: `pages/admin/AdminComunicaciones.jsx`. **Patrón**: `AdminInvitaciones.jsx` (form + tabla).

### 10.1 Layout

```
Comunicaciones                                          [avatar]
Envía correos a una cuenta o a un segmento.

[IconUser Individual | IconUsersGroup Masivo | IconHistory Historial]

-- Tab Individual --
+-- Destino -------------------------------------------------------+
| DNI [________] [Rol v]                                           |
| Asunto [______________________________________________________]  |
| Mensaje [_____________________________________________________]  |
| (autosize)                                                       |
| [IconSend Enviar correo]                                         |
+------------------------------------------------------------------+

-- Tab Masivo --
+-- Segmento [v Clientes con turnos en un periodo] [01/10 - 16/10] -+
| +-- Preview (IconEye) ------------------------------------------+|
| |  123 destinatarios         Muestra: a@x.com, b@y.com (+121)  |||
| +---------------------------------------------------------------+|
| Asunto [...]  Mensaje [...]                                       |
| [IconSend Enviar a 123 personas]                                  |
+------------------------------------------------------------------+

-- Tab Historial --
| FECHA  TIPO  DESTINO  ASUNTO  ENVIOS  EXITOS  FALLOS             |
```

### 10.2 Tab Individual

- Campos: DNI (`TextInput`, validación 7–8 dígitos), Rol (`Select` Cliente/Profesional/Admin, default Cliente), Asunto (`TextInput` required, máx. 255), Mensaje (`Textarea` required autosize minRows 4).
- **Flujo**: completar → “Enviar correo” (primary `IconSend`) → **modal de confirmación** (`ConfirmarEnvioModal.jsx`, `size="sm"`): “¿Enviar este correo?” / “Se le va a enviar a la cuenta {DNI} ({rol}). Asunto: «{asunto}».” Confirm filled “Sí, enviar”. (Un email no se puede deshacer — fricción justificada.)
- Éxito: “Correo enviado.” El form se limpia solo (el envío ya ocurrió). Error 404 → `form.setFieldError('dni', 'No existe una cuenta con ese DNI y ese rol.')`.
- Nota: no hace falta autocompletado con U2 (evita dependencia cruzada de WS); el 404 del server cubre el caso.

### 10.3 Tab Masivo

- `Select` Segmento: “Todos los usuarios” / “Profesionales” / “Clientes con turnos en un período” (`clientes_turnos_activos`). Si es el último → `DatePickerInput type="range"` required (+ validación desde ≤ hasta).
- **Preview** (Paper con `IconEye` en el título; refetch M2 al cambiar segmento/fechas, debounced): número grande (`fz={40} fw={700}`) + “destinatarios”; debajo `Text fz="sm" c="dimmed"`: “Muestra: a@x.com, b@y.com, … (+N más)”. Si **cantidad = 0**: `Alert` amarillo “Este segmento no tiene destinatarios todavía.” y el botón de envío **deshabilitado** (espejo del 422 `SEGMENT_EMPTY`; prevención > error).
- Asunto + Mensaje (requeridos, igual que individual).
- Botón label dinámico “Enviar a {N} personas” (primary `IconSend`, disabled hasta `N > 0` y form válido).
- **Confirmación reforzada** (envío masivo e irreversible): “¿Enviar a {N} personas?” / “Se envía en lotes y no se puede deshacer. El resultado queda en el Historial.” + asunto. Confirm `color="red"` “Sí, enviar a {N}”. Éxito: “Envío iniciado: {N} destinatarios. Mirá el resultado en el Historial.”
- 429 (límite 3/hora): notificación roja con `ACTION_RATE_LIMIT_EXCEEDED` ya existente (“Hiciste demasiados intentos. Esperá un rato e intentá de nuevo.”).

### 10.4 Tab Historial

- Tabla (`minWidth={760}`): FECHA (`formatFechaHora`), TIPO (`Badge variant="light"` — individual `brand`, masivo `violet`), DESTINO (individual → correo único; masivo → etiqueta del segmento + “({N})”), ASUNTO (`lineClamp={1}` + `title`), ENVÍOS, ÉXITOS (`c="green" fw={600}`), FALLOS (rojo si > 0, dimmed “0” si no). Fila clickeable (`highlightOnHover`, `cursor: pointer`) → **Drawer** (`size="md"`): asunto, cuerpo completo (`white-space: pre-wrap`), destinatarios (lista en `ScrollArea mah={300}`), emisor (dni admin) y fecha.
- Empty: ícono `IconHistory` 48 + “Todavía no se enviaron comunicaciones.”

### 10.5 Criterios de aceptación

- [ ] Individual: confirmación antes de enviar; llega el correo; se limpia el form; DNI inexistente → error en el campo.
- [ ] Masivo: preview correcta contra SQL manual; 0 destinatarios → alerta + botón deshabilitado; confirmación roja; el historial registra éxitos/fallos.
- [ ] El 4º masivo en una hora responde 429 con mensaje legible.
- [ ] Usuarios dados de baja/suspendidos no reciben (verificar en el conteo del preview).
- [ ] Historial: drawer muestra el cuerpo completo sin cortar y lista destinatarios con scroll.

---

## 11. WS6 — Dashboard de métricas

**Referencia**: PLAN §12 WS6 (D1–D3 + shape JSON del bundle). **Página**: `pages/admin/AdminInicio.jsx` (reemplaza el placeholder). **Patrón**: `Dashboard.jsx` profesional (StatCard + `@mantine/charts`).

### 11.1 Layout (desktop ≥ md)

```
Inicio                                                 [avatar]
Hola Ana, este es el resumen del centro.

[IconCalendarMonth 01/10/26 - 16/10/26]   [IconFileSpreadsheet Exportar v]

+-- KPI ----------+ +-- KPI ----------+ +-- KPI ----------+ +-- KPI --+
| [IconCalendarCheck] | [IconCalendarMonth]| [IconCircleCheck] | [IconUserX]|
| TURNOS HOY      | | TURNOS DEL PERIODO| | COMPLETITUD  | | AUSENTISMO |
| 12              | | 89               | | 82%          | | 5%         |
+-----------------+ +------------------+ +--------------+ +------------+

+-- IconChartPie Turnos por estado --+ +-- IconChartBar Horas pico -----+
|        (DonutChart)                | |        (BarChart)              |
|  Tasa de cancelacion: 9%           | |                                |
+------------------------------------+ +-------------------------------+
+-- IconTrendingUp Nuevos clientes --+ +-- IconStethoscope Top espec. --+
|        (AreaChart)                 | |  Cardiologia  24  [Progress]  |
+------------------------------------+ +-------------------------------+
+-- IconUsers Top profesionales ----------------------------------------+
| (av) Dra. Diaz   32 [badge]    (av) Dr. Gomez  27 [badge]            |
+----------------------------------------------------------------------+
```

### 11.2 Anatomía

- **Barra de control** (`Group justify="space-between" wrap="wrap"`): `DatePickerInput type="range"` (`IconCalendarMonth`), default mes corriente; `Menu` de exportación (`Button variant="default"` `IconFileSpreadsheet` “Exportar”): “Turnos del período (CSV)” (`IconFileSpreadsheet`) y “Usuarios (CSV)” (`IconFileDownload`).
- **KpiCard** (`pages/admin/inicio/KpiCard.jsx`) — componente NUEVO, **no reusar `StatCard`** del dashboard profesional: esa card es alta (`pt 2rem pb 4rem`) para llenar un grid de 4 tiles sin más contenido; acá los KPIs conviven con gráficos y necesitan menos aire + ícono + caption. Anatomía: `Paper withBorder radius="lg" p="lg"` con fondo/borde por color (misma lógica `useComputedColorScheme` de `StatCard.jsx`): fila `Group`: `ThemeIcon variant="light" color` + label uppercase (`fz="xs" fw={600} c="dimmed"`); valor `fz={40} fw={700} lh={1}` en el color `-7`/`-light-color`; caption `fz="xs" c="dimmed"` opcional.
  - Cards: “Turnos hoy” (`IconCalendarCheck`, `brand`), “Turnos del período” (`IconCalendarMonth`, `cyan`, caption “{desde} — {hasta}”), “Completitud” (`IconCircleCheck`, `green`, caption “de {turnos_rango} turnos”), “Ausentismo” (`IconUserX`, `orange`, caption “de {turnos_rango} turnos”). Tasas: `{valor}%` redondeado a entero.
- **Gráficos** (cada uno `Paper withBorder radius="lg" p="lg"` con título-sección §2.4):
  - “Turnos por estado”: `DonutChart` — `por_estado` (8 estados de v2 — PLAN §2.1) con colores alineados a `EstadoTurnoBadge`/`ESTADO_COLOR`; leyenda con nombre + conteo; caption dimmed “Tasa de cancelación: {tasas.cancelacion}%”.
  - “Horas pico”: `BarChart` (`dataKey="hora"`, serie `total` `brand.6`), alto ~220.
  - “Nuevos clientes (últimos 6 meses)”: `AreaChart` (`dataKey="periodo"`, serie `total` `accent.6`).
  - “Top especialidades”: filas `Group`: nombre (`fz="sm"` flex 1) + `Progress value={(total/max)*100} color="brand.6"` (ancho ~140) + total (`fw={600} fz="sm"`).
  - “Top profesionales”: filas: `UserAvatar 32` + nombre + `Badge variant="light"` “{total} turnos”.
- **Mobile**: KPIs `SimpleGrid cols={2}`; gráficos apilados (1 col); el `Menu` de exportar queda en la barra (funciona en touch); las filas de tops se mantienen.

### 11.3 Datos y estados

- Hook `useAdminMetricas(desde, hasta)` (`api/adminMetricas.js` + `hooks/useAdminMetricas.js`) con `placeholderData: keepPreviousData` — **por qué**: el socket invalida `['admin','metricas']` con cada turno en vivo y sin esto el dashboard parpadearía con cada evento.
- Loading inicial: KPIs con `Skeleton` (altura de card) + Papers de gráficos con `Center h={220}` `Loader`. Error: `QueryError` con retry. Empty del período (`turnos_rango === 0`): KPIs en 0 y cada gráfico con “Sin datos en el período.” centrado dimmed (no ocultar las cards — el layout no salta).
- Overflow: nombres largos en tops → `lineClamp={1}`.
- **CSV**: nuevo `api/descargas.js` (WS6; **no tocar `api.js`** — es de WS7): `descargarCSV(path, nombre)` que hace `fetch` con `credentials: 'include'` + header `x-api-key` (misma mecánica que `api.js`), recibe blob y dispara descarga con `URL.createObjectURL` + `<a download>`. Nombres: `turnos_{desde}_{hasta}.csv`, `usuarios.csv`. Mientras descarga: `loading` en el ítem del `Menu`. Error → notificación roja.

### 11.4 Criterios de aceptación

- [ ] KPIs del día/período cuadran con SQL manual sobre el seed (PLAN WS6); tasas coherentes.
- [ ] Donut con los 4 estados y colores alineados a los badges; horas pico y nuevos clientes coinciden con las agregaciones.
- [ ] Cambiar el rango refiltra TODO sin recargar; el rango por defecto es el mes corriente.
- [ ] Los dos CSV abren en Excel con acentos correctos (BOM) y columnas completas; el botón muestra estado mientras descarga.
- [ ] Un turno en vivo refresca sin parpadeo (placeholderData) y sin recargar la página.
- [ ] Dark mode: los fondos de KpiCard usan las variantes light del theme.

---

## 12. WS7a — MFA en el login de admin

**Referencia**: PLAN §10 (flujo exacto) y §12 WS7. **Archivo**: `pages/RoleLogin.jsx` (solo cuando `role === 'admin'`; cliente/profesional intactos).

### 12.1 Flujo (máquina de 2 pasos en el mismo `Paper`)

```
Paso 1 (actual): DNI + Contrasena -> [Iniciar sesion]
        |  login OK con mfa_required
        v
Paso 2:
+-----------------------------------+
|         (ShieldLock, ThemeIcon)   |
|      Verifica tu identidad        |
|  Te enviamos un codigo de 6       |
|  digitos a tu correo.             |
|  Vence en 10 minutos.             |
|                                   |
|      [_][_][_][_][_][_]           |
|   [ Verificar codigo ]            |
|   IconRefresh Reenviar (0:47)     |
|   <- Volver al inicio de sesion   |
+-----------------------------------+
```

- Estado local: `paso` ('credenciales' | 'mfa') + `challenge` + `expiraEn`. Al recibir `mfa_required` del login (sin cookie): guardar challenge, ir a paso 2, **no** tocar `queryClient.setQueryData(['auth','me'])` ni navegar (ajuste de `useAuth`/`useLoginSession` indicado en PLAN §10.6).
- **Paso 2**: `ThemeIcon size={56} radius="xl" variant="light"` con `IconShieldLock 30` (patrón placeholder, centrado); título `Title order={3} ta="center"` “Verificá tu identidad”; texto dimmed centrado “Te enviamos un código de 6 dígitos a tu correo. Vence en 10 minutos.”; `PinInput length={6} type="number" oneTimeCode data-autofocus` (`size="md"`, `gap="sm"`); `Button fullWidth` “Verificar código” (`loading={isPending}`, `disabled` hasta 6 dígitos); `Button variant="subtle" size="sm"` `IconRefresh` “Reenviar código” — con countdown 60 s en el label (“Reenviar en 0:47”), reusando `useNotificationCountDown`; `Anchor` centrado “← Volver al inicio de sesión”.
- **Volver**: resetea paso, challenge y errores; no permitido mientras `isPending`.
- Al verificar OK: como hoy post-login — `queryClient.setQueryData(['auth','me'], user)` + `navigate(HOME_BY_ROLE.admin)`. Conectar el socket del desafío (§12.3) recién en paso 2 y desconectarlo al salir del paso.

### 12.2 Estados y errores (inline, no notificación)

El error del código vive **inline** (bajo el PinInput, `Text c="red" size="sm" ta="center"` con `aria-live="polite"`): es un campo en foco; una notificación lejos del campo obliga a buscar el problema.

| Situación | UI |
|---|---|
| Código incorrecto (401) | “El código no es correcto. Revisá el correo e intentá de nuevo.” + `PinInput` limpio + foco. Si llegó `mfa:intento_fallido` por socket: “Te quedan {N} intentos.” |
| Código vencido (`MFA_EXPIRED`) | “El código venció. Pedí uno nuevo.” (resaltar el botón Reenviar). |
| Demasiados intentos (`MFA_TOO_MANY_ATTEMPTS`, 429) | Estado bloqueado: se oculta `PinInput` y verificar; `Alert color="red" variant="light"` con `IconAlertCircle` “Demasiados intentos incorrectos.” + `Button` “Volver a empezar” → paso 1. |
| Challenge inválido (`MFA_CHALLENGE_INVALID`) | Volver a paso 1 + notificación roja “La verificación venció. Iniciá sesión de nuevo.” |
| Reenvío en cooldown (`MFA_RESEND_TOO_SOON`, 429) | El botón ya está deshabilitado por countdown; si igual llega: notificación roja con el mensaje. |
| Credenciales inválidas (401) / cuenta suspendida (`ACCOUNT_SUSPENDED`, 403) | Paso 1: el texto rojo actual pasa a usar `useGetErrosMsg` (agregar `ACCOUNT_SUSPENDED` — §2.11). |
| Reenvío OK | Notificación verde “Te enviamos un código nuevo. El anterior ya no sirve.” + countdown reiniciado. |

### 12.3 Socket del desafío (reflejo, no validación)

- En paso 2: `getSocket()` con `auth: { mfa: challenge }` (WS7 `socket/client.js`). Eventos:
  - `mfa:codigo_enviado` → actualiza el countdown de reenvío (por si el reenvío vino de otro lado).
  - `mfa:intento_fallido` → actualiza “Te quedan N intentos” (si el usuario sigue en paso 2).
  - `mfa:verificado` → **guard `verificadoRef`**: si la verificación salió por HTTP en esta pestaña, el evento se ignora (evitar doble navegación); si llegó solo por socket, `getMe()` + `setQueryData` + navigate.
  - `mfa:bloqueado` → pasar al estado bloqueado del §12.2.
- Al desmontar/salir del paso: `disconnectSocket()`.

### 12.4 Criterios de aceptación

- [ ] Admin: login → paso 2 sin cookie seteada (verificar DevTools) → código del email → entra a `/admin`.
- [ ] Código incorrecto 5 veces → estado bloqueado → “Volver a empezar” funciona.
- [ ] Código vencido → mensaje de vencido + reenvío disponible.
- [ ] Reenvío con cooldown de 60 s y notificación; el código anterior queda inválido.
- [ ] Cliente y profesional: login idéntico a hoy (sin paso 2, sin regresión).
- [ ] `PinInput` con auto-focus; mensajes con voseo; light + dark.

---

## 13. WS7b — Canal realtime del panel (AdminRealtimeChannel)

**Referencia**: PLAN §9 (frontend) y §12 WS7. **Archivos**: `socket/client.js` (singleton `getSocket`/`disconnectSocket`), `socket/AdminRealtimeChannel.jsx` (montado en `MainLayout` — inserción coordinada con WS3, PLAN §7), `api/api.js` + `hooks/useAuth.js` (solo WS7).

### 13.1 Comportamiento

- `AdminRealtimeChannel` renderiza `null`; efecto: si `user?.role === 'admin'` → `getSocket()` (conecta con cookie); si no, `disconnectSocket()`. Al logout (`useAuth.logout()`) → `disconnectSocket()` explícito.
- Nunca acepta datos del cliente para mutar estado propio: solo escucha eventos del server → notificación + invalidación.

### 13.2 Mapa de eventos → UI

| Evento | Notificación (`position: 'top-right'`) | Invalidar |
|---|---|---|
| `turno:creado` | `color="blue"`, `IconCalendarPlus`; “Nuevo turno” / “{paciente} reservó con {profesional} para el {fecha} {hora}.” | `['admin','turnos']`, `['admin','metricas']` |
| `turno:cancelado` | `color="red"`, `IconCalendarX`; “Turno cancelado” / “{paciente} · {fecha} {hora} con {profesional}.” | `['admin','turnos']`, `['admin','metricas']` |
| `turno:reasignado` | `color="yellow"`, `IconArrowsExchange`; “Turno reasignado” / “{paciente} pasa a {profesionalNuevo} · {fecha} {hora}.” | `['admin','turnos']` |
| `aviso:publicado` | `color="cyan"`, `IconSpeakerphone`; “Nuevo aviso publicado” / título del aviso. | `['avisos','activos']` |
| (fallback) otros | `IconBellRinging` genérico | — |

- Los payloads son chicos (ids, fecha/hora, nombres — PLAN §9): armar el message con lo que venga; si falta un campo, omitirlo con elegancia (nunca `undefined` visible).
- Eventos seguidos: `notifications.show` con `id` por evento + id de turno para no apilar duplicados.

### 13.3 Criterios de aceptación

- [ ] Con dos pestañas admin: reservar como cliente → notificación en vivo + monitor refrescado sin recargar.
- [ ] Cancelar/reasignar/avisos → notificación con el color e ícono del mapa.
- [ ] Logout desconecta el socket (no quedan conexiones en Network); cliente/profesional nunca conectan.
- [ ] Sin errores de consola.

---

## 14. Checklist visual (WS8) y borrado del archivo

### 14.1 Por WS (además de los criterios de aceptación de cada sección)

| WS | Chequeo visual mínimo |
|---|---|
| WS0 | Sidebar admin con los 6 ítems y sus íconos exactos (§2.3); “Configuración” solo en footer; placeholders renderizan. |
| WS1 | Listado con filtros + badges + cards móvil; ficha con las 3 columnas de datos + historial + zona de riesgo; modales con el microcopy dado. |
| WS2 | Tabs con íconos; switch de estado; drawer de asociados; duplicado con error en campo. |
| WS3 | Form con helpers y guardado disabled-dirty; avisos con preview en el modal; banner con 3 tipos de color + dismiss por sesión. |
| WS4 | Monitor tabla + calendario; menú de fila con acciones v2 (confirmar/en espera/reprogramar/historial) + admin (reasignar/cancelar) y el ítem rojo al final; modales de cancelar/reasignar/bloqueos con sus Alert; badges v2. |
| WS5 | 3 tabs; preview de segmento; confirmaciones (individual normal, masivo roja); drawer de historial. |
| WS6 | 4 KPIs con ícono/color; donut alineado a badges; exports con estado de descarga. |
| WS7 | Paso MFA con todos sus estados (§12.2); notificaciones en vivo (§13.2); sin regresión en logins existentes. |

### 14.2 Global

- [ ] Light y dark en TODAS las pantallas nuevas (toggle del sidebar).
- [ ] Mobile (~375px) y desktop (~1440px) de cada sección; sin scroll horizontal de página; touch ≥ 44px.
- [ ] `pnpm --filter frontend build` OK y `pnpm --filter frontend lint` sin errores (requisito del PLAN §13.4).
- [ ] Ningún texto cortado en botones/badges; ningún `undefined`/`NaN` visible con datos reales del seed.
- [ ] Desvíos respecto a este doc anotados acá abajo por cada WS (si no hubo, no hace falta).

---

> **RECORDATORIO FINAL**: cuando la checklist §14 esté completa y el PLAN §13.4 esté todo en ✅, este archivo se BORRA junto con el plan:
>
> ```bash
> git rm DISENO_ADMIN.md PLAN_ADMIN.md
> git commit -m "chore: panel admin completo — se eliminan plan y diseño de trabajo"
> ```
>
> No moverlo a `.docs/`, no archivarlo. Es la última tarea de WS8.
