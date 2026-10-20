# PLAN — Panel de Administración, MFA y Tiempo Real (Appointly)

> **⚠️ ARCHIVO EFÍMERO — LEER ESTA CAJA ANTES DE EMPEZAR**
>
> 1. Este archivo es un **plan de trabajo**, no documentación permanente.
> 2. Cuando TODAS las features estén implementadas y verificadas (checklist global en §13.4 en ✅), **hay que BORRAR este archivo**: `git rm PLAN_ADMIN.md`. No moverlo a `.docs/`, no archivarlo, no dejarlo morir de a poco.
> 3. Antes de tocar código: leer el documento completo, ubicar tu workstream (WS), y respetar las reglas de propiedad de archivos (§7).
> 4. Si el código real contradice este plan, **gana el código real**: actualizar el plan y anotarlo en el reporte final.
> 5. Al terminar tu WS: marcá tu checklist con `[x]` + fecha + agente en "Estado de avance" (§12) y seguí el orden de olas de §7.
>
> Versión 1 — 2026-10-16 — elaborado por eng-manager a partir del relevamiento del repo.

---

## 1. Objetivo

Construir el **panel de administración completo** de Appointly (hoy es un esqueleto con placeholders), más **MFA por email para admins** y **notificaciones en tiempo real con Socket.IO**. Features solicitadas:

1. **Configuración general**: datos de la institución, políticas globales de turnos (anticipación mínima para reservar, límite de cancelación, días hábiles y franja horaria), avisos/banners globales.
2. **Gestión integral de usuarios y cuentas**: listado con filtros, ficha de detalle, edición, suspensión/baja (`eliminado_en`), reset de credenciales.
3. **Catálogos maestros**: ABM de especialidades y obras sociales con habilitar/deshabilitar y profesionales asociados.
4. **Monitor global de turnos**: vista maestra tabla/calendario, cancelación justificada, reasignación entre profesionales, bloqueos de agenda (centro o profesional).
5. **Centro de comunicaciones**: envío individual, segmentado/masivo e historial de envíos.
6. **Dashboard de métricas**: KPIs, rendimiento, crecimiento, exportación CSV.
7. **MFA para admins** (código de 6 dígitos por email al iniciar sesión) + **Socket.IO** para tiempo real.

---

## 2. Contexto técnico del repo (lo que YA existe)

**Stack**: monorepo pnpm. Backend: Node ESM + Express 5 + MySQL (mysql2 pool) + JWT en cookie httpOnly + bcrypt + Zod 4 + Resend (emails) + helmet + express-rate-limit + multer/sharp/AWS-S3-R2 (avatares). Frontend: React 19 + Vite 8 + Mantine 9 (`@mantine/core|dates|form|modals|notifications|charts|schedule`) + TanStack React Query 5 + react-router 7 + dayjs + Recharts + Tailwind. Deploy: un solo servicio (Express sirve `frontend/dist`), Railway + MySQL. Dev: Vite proxya `/api` → `:3000`.

**Estructura clave del backend** (`backend/src/`): `routes/*.routes.js` → `controllers/` → `services/` → `models/` (MVC, ver `.docs/api-spec.md` §2); `middlewares/` (`auth.middleware.js` con `requireAuth`, `grantAccess`, `attachUser`; `error.middleware.js` arma el envelope de error; `rateLimit.middleware.js`); `emails/email.methods.js` (Resend, helper `sendMail` + `escapeHtml`); `config/` (`db.js` con `withTransaction`, `constants.js`, `r2.js`); `scripts/` (`schema.sql`, `seed.sql`, `drop.sql`, `run_sql.js`, `migrations/001_...sql`); `schemas/` (Zod); `utils/` (`AppError.js`, `helperSlots.js`, `userPermission.js`).

**Estructura clave del frontend** (`frontend/src/`): `App.jsx` (rutas + links del sidebar por rol), `MainLayout.jsx`, `api/api.js` (wrapper `request()` con cookie + `x-api-key`), hooks react-query (`hooks/use*.jsx`), `pages/admin/` (AdminInicio, AdminInvitaciones, AdminConfiguracion — placeholders), componentes Mantine reutilizables (`PageHeader`, `QueryError`, tablas, modales).

**Tablas actuales** (ver `backend/src/scripts/schema.sql`): `rol`, `especialidad`, `obra_social`, `persona`, `persona_rol` (tiene `eliminado_en` para baja lógica), `profesional` (tiene `duracion_turno_min`, hoy ignorada por la lógica de slots), `cliente`, `profesional_especialidad`, `obra_social_profesional`, `horario_atencion` (dia_semana **0=domingo … 6=sábado**), `turno` (**v2**: 8 estados + `turno_evento` + `id_turno_origen` — §2.1; `motivo_cancelacion`; timestamps por estado), `invitacion`.

**Lo que se reutiliza** — mapa completo en §4.

**Cómo correr**: `pnpm dev` (raíz) o `pnpm dev:back` / `pnpm dev:front`. DB: `pnpm db:reset` (drop+schema+seed), `pnpm db:seed`. Probar API: archivos `.http` en `backend/src/querys/`.

---

### 2.1 ⚠️ YA IMPLEMENTADO — Turnos v2 (`origin/feat/ap-register`, sin mergear a `dev`)

La rama `origin/feat/ap-register` (14 commits sobre la base; incluye `002_estados_turno.sql` y suite de tests backend+frontend) trae el ciclo de vida nuevo de turnos. **NO re-implementar nada de esto; REUSAR.** Toda referencia a `activo` en este plan queda invalidada (se anota en cada sección).

- **8 estados** (`turno.estado`, default `confirmado`): `pendiente_confirmacion`, `confirmado`, `en_espera`, `en_curso`, `completado`, `ausente`, `reprogramado`, `cancelado`. Ocupan slot todos menos `cancelado` y `reprogramado` (`ESTADOS_OCUPAN_SLOT`). `activo` ya no existe.
- **`turno_evento`**: historial de cambios (estado anterior/nuevo, actor+rol, motivo). **`turno.id_turno_origen`**: reprogramaciones/recuperos enlazados. **NO existe `ausente_en`** (el ausente se trackea por evento).
- **Constantes v2** (`config/constants.js`): `TIMEZONE`, `ESTADOS_TURNO`, `ESTADOS_ABIERTOS`, `ESTADOS_OCUPAN_SLOT`.
- **Endpoints existentes con soporte admin** (reusar tal cual):
  - `GET /api/turnos?profesional=&desde=&hasta=&estado=` — el admin consulta cualquier profesional.
  - `GET /api/turnos/:id` — admin irrestricto (incluye `cancelado_por_rol/dni` vía eventos e `id_turno_origen`).
  - `PATCH /api/turnos/:id/estado` — matriz `TRANSICIONES` (`turnos.service.js`). Admin hoy SOLO: `pendiente_confirmacion → confirmado` y `confirmado → en_espera` (mismo día). `en_curso`/`completado`/`ausente` son exclusivos del profesional.
  - `POST /api/turnos/:id/reprogramacion` — misma profesional, nueva fecha/hora; lock `FOR UPDATE`, sucesor enlazado, email al paciente (`turnoReprogramado`), evento. Errores `NOT_REPROGRAMMABLE` / `ALREADY_REPROGRAMMED`.
  - `POST /api/turnos/:id/cancelacion` — motivo (≤255), evento, email al paciente.
  - `POST /api/turnos` — alta manual por admin (cualquier profesional/paciente), serializada.
  - `GET /api/turnos/:id/eventos` y `GET /api/turnos/eventos?profesional=...` — auditoría.
- **Frontend existente**: `components/EstadoTurnoBadge.jsx` (8 estados), `pages/turnos/TurnoHistorialModal.jsx`, `pages/turnos/ReprogramarTurnoModal.jsx`, `pages/turnos/ConfirmarEstadoModal.jsx`, `utils/estadosTurno.js` (`estadoLabel`, `ESTADO_COLOR`, `esCancelable`, `esReprogramable`, `esAbierto`), hooks `useCambiarEstadoTurno`, `useReprogramarTurno`, `useTurnosDia`.
- **Impacto directo en este plan**: la migración del panel se **renumera a `003_panel_admin.sql`** (el 002 ya es de v2) y pierde los cambios a `turno.estado`/`ausente_en`; `schema.sql`/`seed.sql` se reconcilian sobre los de v2 (seed ya usa estados nuevos); §8.4 T2/T4/T5 y §11 quedan anotados; WS4 se acota a lo nuevo (monitor global, reasignación de profesional, bloqueos, acciones faltantes).

## 3. Decisiones de arquitectura (NO re-discutir sin datos nuevos)

1. **Dependencias nuevas: SOLO dos.** Backend `socket.io`, frontend `socket.io-client` (§5). Nada más: códigos MFA con `node:crypto`, CSV sin librería, hashing con `bcrypt`/`sha256` existentes.
2. **Estado de cuenta**: se agrega `persona_rol.suspendido_en TIMESTAMP NULL`. Semántica: activa = `eliminado_en IS NULL AND suspendido_en IS NULL`; suspendida = `suspendido_en` seteado (bloquea login, reversible); baja = `eliminado_en` seteado (soft-delete, reversible por admin). NO usar la columna huérfana `persona_rol.estado` (migración 001 la agregó a algunas DBs, `schema.sql` no la tiene y el login la ignora — queda como deuda técnica documentada, ver parking lot). Login: `eliminado_en` → 401 `INVALID_CREDENTIALS` (sin filtrar info); `suspendido_en` → 403 `ACCOUNT_SUSPENDED` (después de validar la contraseña). `me` (`getSession`) devuelve `null` si está suspendida o dada de baja.
3. **Autorización admin**: reutilizar `requireAuth` + `grantAccess(["admin"])` existentes en todas las rutas `/api/admin/*`. Eliminar `identityStandIn` de `auth.middleware.js` (código muerto que permitiría simular identidad por headers — riesgo latente).
4. **MFA (admin)**: flujo challenge-response por HTTPS. El código de 6 dígitos se guarda **hasheado (sha256)**, TTL 10 min, máx. 5 intentos, reenvío limitado. La sesión (cookie `access_token`) se emite **solo** al verificar el código. **Los WebSockets NO son el canal de validación** (la verificación debe ser server-side request/response; el socket solo refleja estado del desafío en la pantalla). No se toca el login de cliente/profesional (cero regresión).
5. **Socket.IO**: mismo servidor HTTP de Express. Autenticación por cookie en el handshake; salas `admins` (solo rol admin) y `mfa:<id_codigo>` (desafío pre-login). Usos reales: (a) notificaciones en vivo al panel (turno creado/cancelado/reasignado, aviso publicado) + refresco del monitor; (b) estado del desafío MFA en la pantalla de login. Detalle en §9. Single-instance (Railway) — si algún día escala, sticky sessions/adapter Redis (parking lot).
6. **Bloqueos de agenda NO cancelan turnos existentes.** Bloquear afecta disponibilidad futura (slots) y validación de reservas; si hay turnos ya tomados dentro del bloqueo, el admin los ve en el monitor y los cancela/reasigna a mano. (Autocancelar silenciosamente es peor UX y más riesgoso.)
7. **"Ausentismo": fuente de verdad — ✅ resuelto por v2**: el ENUM de 8 estados + `turno_evento` + el flujo de asistencia del profesional ya existen (§2.1). GAP del panel: "marcar completado"/"marcar ausente" desde el monitor (ampliar `TRANSICIONES` para admin — §8.4 T4/T5). NO existe `ausente_en`: la fuente es el estado + los eventos.
8. **Exportación**: CSV server-side sin dependencias, con BOM UTF-8 (abre bien en Excel). `.xlsx` nativo (exceljs) → parking lot (solo si lo piden).
9. **Zona horaria**: todas las comparaciones temporales de políticas (anticipación, límite de cancelación, vigencia de avisos) se evalúan **en SQL contra `NOW()`**, no en JS, para evitar drift Node↔MySQL. Cálculos de slots en JS usan fechas `YYYY-MM-DD` sin hora (comportamiento actual).
10. **Sin paginación** (escala de consultorio, convención §1.5 del api-spec). Filtros por query params. Si crece, se agrega `?page=&size=` sin romper contrato.
11. **Multi-rol**: una persona puede tener cuenta de cliente y de profesional (ya soportado). Las rutas admin de usuarios se identifican por `:dni` + `:rol` (la cuenta es el par). 

---

## 4. Reutilización de código (mapa)

| Necesidad | Ya existe | Dónde | Nota |
|---|---|---|---|
| Guard de rol admin | `requireAuth`, `grantAccess(["admin"])` | `middlewares/auth.middleware.js` | Ya usado por `invitaciones.routes.js` |
| Envelope de error + códigos | `AppError`, `errorHandler` | `utils/AppError.js`, `middlewares/error.middleware.js` | Agregar códigos nuevos (§8.4) |
| Emails | `EmailMethods.sendMail` (helper interno), `escapeHtml`, cliente Resend lazy | `emails/email.methods.js` | Agregar métodos nuevos como métodos estáticos (append) |
| Hash de tokens | patrón `hashToken` sha256 | `services/invitaciones.service.js` | Copiar patrón para `mfa_codigo.codigo_hash` |
| Rate limiting | `globalLimiter`, `authLimiter`, `sensitiveActionsLimiter` | `middlewares/rateLimit.middleware.js` | Agregar limiters para MFA y masivos |
| Transacciones | `withTransaction(fn)` | `config/db.js` | Para reasignación + log y baja + auditoría |
| Turnos: queries y validaciones | `TurnosModel` (getTurnoById, getTurnosByProfesional, existeActivo, cancelTurno…), `TurnosService.cancelTurnoById` (con `#assertOwnership`), `helperSlots.js` (`calcularSlotsDisponibles`, `slotsDelDia`) | `models/turnos.model.js`, `services/turnos.service.js`, `utils/helperSlots.js` | Extender, no duplicar |
| Update parcial de cliente (patrón dinámico SET + obra social por nombre) | `ClientesModel.patchClienteData` | `models/clientes.model.js` | Mismo patrón para ediciones admin |
| Update de profesional | `ProfesionalesController.updateByDni` + `PATCH /api/profesionales/:dni/actualizar` | existente | Reusar lógica para matrícula/duración |
| Baja lógica | `ClientesModel.deleteAccount` (`eliminado_en = NOW()`) | `models/clientes.model.js` | Mismo patrón |
| Emisión de credenciales/reset | `AuthService.forgotPassword` (token JWT 10 min) + `EmailMethods.resetPassWord` | `services/auth.service.js`, `emails/` | El reset admin reusa esto (buscar correo por dni+rol y llamar) |
| Módulo admin de referencia | `invitaciones.*` (route+controller+service+model+schema+emails) | backend | Copiar la estructura para cada módulo admin nuevo |
| Frontend: fetch + errores | `request()` (incluye `error.code`, `error.fieldErrors`) | `api/api.js` | |
| Frontend: patrón de hooks | hooks `useQuery/useMutation` con `queryKey: ['admin', ...]`, `meta:{silent}` | `hooks/useAdmin.jsx` y resto | Copiar patrón |
| Frontend: UI | Mantine `Table`, `Modal`, `Drawer`, `Tabs`, `DatePickerInput`, `@mantine/schedule` (calendario ya usado en `Agenda.jsx`), `@mantine/charts`/Recharts (usado en dashboard profesional), `@mantine/notifications` (montado en `main.jsx`) | `frontend/src` | `PageHeader`, `QueryError` como envoltorios estándar |
| Probar endpoints | archivos `.http` | `backend/src/querys/*.http` | Crear `admin.http`, `admin-usuarios.http`, etc. |

---

## 5. Dependencias a instalar (exacto)

```bash
pnpm --filter backend add socket.io
pnpm --filter frontend add socket.io-client
```

- `socket.io` v4 — server WebSocket sobre el mismo HTTP server de Express. Necesario para tiempo real (pedido explícito). Compatible con Express 5 (se engancha al `http.Server`, no al framework).
- `socket.io-client` — cliente para React. Conexión same-origin (proxy en dev, mismo dominio en prod).

**NO instalar** (y por qué): códigos OTP → `node:crypto` (`randomInt`, `createHash`); CSV → generación manual (~40 líneas, §4/§10.6); xlsx → parking lot; tests → parking lot; `cookie` (parsear cookie en el handshake del socket) → mini helper propio de 5 líneas, no vale una dependencia.

No hace falta ninguna variable de entorno nueva. Constantes nuevas van a `backend/src/config/constants.js` (§10.7).

---

## 6. Base de datos — Migración del panel (003 tras integrar v2) + schema/seed

**Regla de oro del repo**: `schema.sql` es el estado final (una DB nueva con `pnpm db:reset` ya nace completa). La migración del panel es SOLO para DBs existentes y se corre UNA vez. NO editar `001` ni `002_estados_turno.sql` (de v2).

**Aplicar** (desde `backend/`): `node --env-file=.env src/scripts/run_sql.js migrations/003_panel_admin.sql` — hasta integrar v2, el archivo que dejó WS0 se llama `002_panel_admin.sql` (§2.1 / §6.10)
Nota: el script raíz `db:migrate` no pasa el archivo (`run_sql.js` lo espera como argv[2]); dejar la instrucción de arriba o mejorar el script raíz.

**IMPORTANTE — dos linajes de DB**: (a) DBs que corrieron `001` tienen `persona_rol.estado`; (b) DBs nuevas (schema.sql actual) NO la tienen. La migración 002 debe funcionar en AMBAS: por eso agrega `suspendido_en` (columna que no existe en ningún linaje) y NO toca `estado`.

### 6.1 Cambios a `persona_rol`
```sql
ALTER TABLE persona_rol ADD COLUMN suspendido_en TIMESTAMP NULL DEFAULT NULL AFTER eliminado_en;
```

### 6.2 Tabla `configuracion` (singleton, fila id=1)
```sql
CREATE TABLE configuracion (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  nombre_centro VARCHAR(150) NOT NULL DEFAULT '',
  telefono VARCHAR(30) NULL,
  email_institucional VARCHAR(255) NULL,
  direccion VARCHAR(255) NULL,
  anticipacion_reserva_min INT UNSIGNED NOT NULL DEFAULT 0,   -- minutos; 0 = sin mínimo
  limite_cancelacion_horas INT UNSIGNED NOT NULL DEFAULT 0,   -- horas; 0 = sin límite
  dias_habiles JSON NULL,          -- ej [1,2,3,4,5] con 0=domingo..6=sábado (misma convención que horario_atencion)
  hora_apertura TIME NULL,
  hora_cierre TIME NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por INT UNSIGNED NULL,
  CONSTRAINT chk_config_singleton CHECK (id = 1),
  FOREIGN KEY (actualizado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);
```
`ConfiguracionModel.get()` devuelve defaults seguros si la fila no existe (nombre '', 0/0, días L-V, 08:00-20:00).

### 6.3 Tabla `aviso`
```sql
CREATE TABLE aviso (
  id_aviso INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('info','advertencia','critico') NOT NULL DEFAULT 'info',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  vigente_desde DATE NULL,
  vigente_hasta DATE NULL,
  creado_por INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);
```

### 6.4 Tabla `bloqueo_agenda`
```sql
CREATE TABLE bloqueo_agenda (
  id_bloqueo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dni_profesional INT UNSIGNED NULL,   -- NULL = bloqueo a nivel centro (todos)
  fecha DATE NOT NULL,
  hora_inicio TIME NULL,               -- NULL+NULL = día completo
  hora_fin TIME NULL,
  motivo VARCHAR(255) NULL,
  creado_por INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL,
  CONSTRAINT chk_bloqueo_horas CHECK (
    (hora_inicio IS NULL AND hora_fin IS NULL) OR
    (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_inicio < hora_fin)
  ),
  INDEX idx_bloqueo_fecha (fecha),
  INDEX idx_bloqueo_prof (dni_profesional, fecha)
);
```

### 6.5 Tabla `email_enviado` (historial de comunicaciones)
```sql
CREATE TABLE email_enviado (
  id_envio INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dni_admin INT UNSIGNED NULL,
  tipo ENUM('individual','masivo') NOT NULL,
  segmento VARCHAR(50) NULL,           -- 'clientes_turnos_activos' | 'profesionales' | 'todos' (solo masivo)
  segmento_params JSON NULL,           -- {desde, hasta} del segmento
  destinatarios JSON NOT NULL,         -- array de correos
  cantidad INT UNSIGNED NOT NULL,
  exitos INT UNSIGNED NOT NULL DEFAULT 0,
  fallos INT UNSIGNED NOT NULL DEFAULT 0,
  asunto VARCHAR(255) NOT NULL,
  cuerpo TEXT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dni_admin) REFERENCES persona(dni_persona) ON DELETE SET NULL,
  INDEX idx_envio_fecha (creado_en)
);
```

### 6.6 Tabla `mfa_codigo`
```sql
CREATE TABLE mfa_codigo (
  id_codigo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dni_persona INT UNSIGNED NOT NULL,
  codigo_hash CHAR(64) NOT NULL,       -- sha256 del código de 6 dígitos
  expira_en TIMESTAMP NOT NULL,
  intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consumido_en TIMESTAMP NULL DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dni_persona) REFERENCES persona(dni_persona) ON DELETE CASCADE,
  INDEX idx_mfa_vigente (dni_persona, consumido_en)
);
```

### 6.7 Tabla `turno_reasignacion` (auditoría)
```sql
CREATE TABLE turno_reasignacion (
  id_reasignacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_turno INT UNSIGNED NOT NULL,
  dni_prof_anterior INT UNSIGNED NOT NULL,
  dni_prof_nuevo INT UNSIGNED NOT NULL,
  motivo VARCHAR(255) NULL,
  creado_por INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
  FOREIGN KEY (dni_prof_anterior) REFERENCES profesional(dni_profesional),
  FOREIGN KEY (dni_prof_nuevo) REFERENCES profesional(dni_profesional),
  FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);
```

### 6.8 Alteraciones a tablas existentes
```sql
-- ⚠️ YA EN V2 (feat/ap-register): turno.estado con 8 estados + turno_evento + id_turno_origen.
-- NO re-implementar; NO agregar ausente_en (el ausente se trackea por turno_evento).

ALTER TABLE especialidad ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE obra_social ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

-- Índices para el monitor global y métricas (v2 trae idx_turno_profesional_fecha e idx_turno_cliente):
ALTER TABLE turno
  ADD INDEX idx_turno_fecha (fecha_turno),
  ADD INDEX idx_turno_estado_fecha (estado, fecha_turno);
```

### 6.9 `schema.sql` y `seed.sql`
- ⚠️ Base v2: re-derivar sobre los archivos de `feat/ap-register` (su seed ya usa los estados nuevos). `schema.sql` = v2 + lo de §6.1–6.8 del panel; `seed.sql` = v2 + fila de `configuracion` (anticipación 60 min, límite cancelación 2 hs, días [1,2,3,4,5], 08:00–20:00), 2–3 `aviso` (uno vigente, uno programado), 1 `bloqueo_agenda` demo (feriado centro, fecha futura).
- **Fechas del seed**: turnos a **fechas relativas** (`CURDATE() ± INTERVAL n DAY`) del mes corriente, con varios `completado`, `cancelado`, `ausente` y días con `en_espera`/`en_curso`. Criterio de aceptación: con un `db:reset`, el dashboard muestra turnos de hoy y del mes > 0.

### 6.10 Migración — verificación obligatoria (WS0)
- ⚠️ Renumeración: v2 ya tiene `002_estados_turno.sql` → la del panel es **`003_panel_admin.sql`** (y NO toca `turno.estado` ni agrega `ausente_en`).
- Probar `003` sobre: (a) DB con `002_estados_turno` aplicada (base v2, la del `db:reset` nuevo) — no debe chocar; (b) DB vieja sin v2 → se actualiza `002_estados_turno` y después `003_panel_admin`, en ese orden.
- `pnpm db:reset` con el schema nuevo (v2 + panel) corre limpio y el seed carga.

---

## 7. Reglas de trabajo para agentes

**Olas de ejecución** (respetar: define qué puede ir en paralelo):
- **Ola 0**: WS0 (todo lo demás depende de esto).
- **Ola 1** (paralelo, sin archivos en común entre sí): WS1, WS2, WS5, y de WS7 solo su **núcleo backend** (MFA + infra Socket.IO + `socket/events` API).
- **Ola 2**: WS3 y el resto de WS7 (frontend de MFA + canal realtime).
- **Ola 3**: WS4 (toca los MISMOS archivos de turnos que WS3 → va después).
- **Ola 4**: WS6.
- **Ola 5**: WS8 (QA final + regresión + borrado del md).

**Propiedad de archivos compartidos** (evitar pisadas):
| Archivo | Quién lo toca | Regla |
|---|---|---|
| `backend/src/app.js` | WS0 (montar `adminRouter`) | Única edición en WS0 |
| `backend/src/routes/admin.routes.js` + subrouters | WS0 crea TODOS (con routers vacíos montados) | Cada WS llena SOLO su subrouter |
| `backend/src/services/turnos.service.js`, `controllers/turnos.controller.js`, `utils/helperSlots.js`, `models/turnos.model.js` | WS3 → luego WS4 | Secuencial, nunca en paralelo |
| `backend/src/emails/email.methods.js` | WS3, WS4, WS5, WS7 | Agregar métodos nuevos AL FINAL de la clase (append); si corre en paralelo con otro, coordinar y rebasar |
| `backend/src/services/auth.service.js`, `auth.controller.js`, `routes/auth.routes.js` | SOLO WS7 | — |
| `backend/src/config/constants.js` | SOLO WS7 (constantes MFA) | — |
| `frontend/src/App.jsx` | SOLO WS0 (agrega TODAS las rutas/links admin + páginas placeholder) | Los demás WS reemplazan SOLO el contenido de su página |
| `frontend/src/MainLayout.jsx` | WS3 (banner de avisos) y WS7 (canal socket) | Dos inserciones puntuales; si corren juntos, coordinar |
| `frontend/src/api/api.js`, `hooks/useAuth.js` | SOLO WS7 | — |
| `backend/src/scripts/**` (schema, seed, migración) | SOLO WS0 | — |
| `api/<dominio>.js` del frontend | Un archivo NUEVO por dominio (`api/adminUsuarios.js`, `api/adminTurnos.js`, …) | No editar `api/admin.js` existente |

**Al arrancar tu WS**: leer §8 (contrato) + §10 (flujo exacto) + los archivos existentes que vas a extender ANTES de escribir. **Al terminar**: actualizar §12 con `[x]`, fecha y agente; listar desvíos del plan; correr la verificación de tu WS (cada uno tiene criterios).

---

## 8. Contrato de API (nuevo y modificado)

Convenciones del repo: envelope de error único (código estable en `code`), zod para validar, 400 sintaxis / 422 referencia inexistente / 409 conflicto / 403 permiso, `Location` en 201. Todo lo nuevo administrativo vive bajo `/api/admin/*` con `requireAuth + grantAccess(["admin"])`, EXCEPTO los writes de catálogos que van sobre los recursos existentes (extensión prevista en api-spec §3.6) y las lecturas públicas.

### 8.1 Auth / MFA (modifica `auth.routes.js`)
| # | Método y path | Rol | Comportamiento |
|---|---|---|---|
| A1 | `POST /api/auth/login` | — | **Cambia solo para admin**: credenciales OK → `200 { mfa_required: true, challenge: "<jwt>", expira_en }` y **NO setea cookie**. Cliente/profesional: igual que hoy |
| A2 | `POST /api/auth/mfa/verificar` | — | `{ challenge, codigo }` → valida → `200 user` + cookie `access_token` (mismo shape que login actual) |
| A3 | `POST /api/auth/mfa/reenviar` | — | `{ challenge }` → regenera código y reenvía email → `200 { msg }` |

### 8.2 Configuración y avisos
| # | Método y path | Rol | Comportamiento |
|---|---|---|---|
| C1 | `GET /api/configuracion` | público | `200` con todos los campos de §6.2 (defaults si no hay fila) |
| C2 | `PUT /api/admin/configuracion` | admin | Reemplazo completo (validado con zod), `200` |
| C3 | `GET /api/avisos/activos` | público | Avisos `activo=1` y vigentes (desde/hasta contra `CURDATE()`) |
| C4 | `GET /api/admin/avisos` | admin | Todos (incluye inactivos/futuros) |
| C5 | `POST /api/admin/avisos` | admin | Crea. `201` |
| C6 | `PUT /api/admin/avisos/:id` | admin | Edita (incluye `activo`). `200` |
| C7 | `DELETE /api/admin/avisos/:id` | admin | Borra. `204` |

### 8.3 Usuarios y cuentas (la cuenta = par `dni` + `rol`)
| # | Método y path | Comportamiento |
|---|---|---|
| U1 | `GET /api/admin/usuarios?rol=&estado=&q=` | Listado de cuentas. `estado`: `activa\|suspendida\|baja`. `q`: busca por nombre, apellido, DNI o correo (LIKE). Devuelve: dni, rol, nombre, apellido, correo, telefono, estado, creado_en |
| U2 | `GET /api/admin/usuarios/:dni/:rol` | Ficha: datos personales, datos de cuenta, datos de perfil (obra social/afiliado u matrícula/duración), estado, e historial de turnos (los últimos 50, reutilizando query de turnos por cliente/profesional) |
| U3 | `PATCH /api/admin/usuarios/:dni/:rol` | Edita parcial. cliente: `telefono`, `obra_social` (nombre o id, patrón `patchClienteData`), `numero_afiliado`. profesional: `telefono`, `numero_matricula` (verificar único → 409), `duracion_turno_min`. admin: `telefono` |
| U4 | `POST /api/admin/usuarios/:dni/:rol/suspension` | Setea `suspendido_en=NOW()`. Si ya suspendida → 409 `ALREADY_SUSPENDED` |
| U5 | `POST /api/admin/usuarios/:dni/:rol/reactivacion` | Limpia `suspendido_en` y `eliminado_en`. Si ya activa → 409 `NOT_SUSPENDED` |
| U6 | `DELETE /api/admin/usuarios/:dni/:rol` | Baja lógica (`eliminado_en=NOW()`). No permitir que un admin se dé de baja a sí mismo → 409 `CANNOT_DELETE_SELF` |
| U7 | `POST /api/admin/usuarios/:dni/:rol/reset-password` | Genera token (reusar `AuthService.forgotPassword` con el correo de la cuenta) y envía email con el link existente. `200 { success: true }` |

Nota U2/U3: validar que la cuenta exista (aunque sea dada de baja → se muestra para poder reactivar). El historial de turnos NO se toca nunca (integridad).

### 8.4 Turnos — monitor, acciones y bloqueos
| # | Método y path | Comportamiento |
|---|---|---|
| T1 | `GET /api/admin/turnos?desde=&hasta=&estado=&profesional=&cliente=` | **Extender v2**: `GET /api/turnos` (v2) ya filtra por fechas/estado/profesional y el admin ve a todos; falta el filtro `cliente` y datos resumidos de AMBAS contrapartes. Default: mes corriente. No duplicar: ampliar el model de v2 |
| T2 | `POST /api/admin/turnos/:id/cancelacion` | **YA EN V2** (`POST /api/turnos/:id/cancelacion`: admin OK, motivo ≤255 obligatorio, evento, email al paciente). GAP: al cancelar un admin, avisar TAMBIÉN al profesional (`EmailMethods.turnoCanceladoPorAdmin` ya existe) → extender el método de v2 |
| T3 | `POST /api/admin/turnos/:id/reasignacion` | **NUEVO — no existe en v2** (la reprogramación v2 mantiene la profesional). `{ dni_profesional, motivo? }`. Validaciones: turno existe, estado en `ESTADOS_ABIERTOS` (v2), `fecha_turno >= CURDATE()` → 409 `NOT_REASSIGNABLE`; profesional nuevo existe y activo → 422; sin turno en ese slot (`ESTADOS_OCUPAN_SLOT`) → 409 `SLOT_TAKEN`; slot dentro de su horario → 409 `OUT_OF_SCHEDULE`; no bloqueado → 409 `AGENDA_BLOCKED`. Update + INSERT en `turno_reasignacion` + `turno_evento`, en UNA transacción. Emails: cliente y profesional nuevo. `200 turno` |
| T4 | `POST /api/admin/turnos/:id/completacion` | **GAP v2**: `TRANSICIONES` hoy habilita `completado` solo a `profesional` — ampliar para admin (recomendado: vía el `PATCH /:id/estado` existente; endpoint propio solo si hace falta). `completado_en` ya existe |
| T5 | `POST /api/admin/turnos/:id/ausencia` | **GAP v2**: ídem T4 para `ausente`. NO setear `ausente_en` (no existe en v2): el cambio queda registrado en `turno_evento` |
| B1 | `GET /api/admin/bloqueos?desde=&hasta=&profesional=` | Lista bloqueos del rango (incluye los de centro con `dni_profesional NULL`) |
| B2 | `POST /api/admin/bloqueos` | `{ fechas: ["YYYY-MM-DD", ...], hora_inicio?, hora_fin?, dni_profesional? (null/omitido = centro), motivo? }` → inserta una fila por fecha. Valida horas (ambas o ninguna) y fechas |
| B3 | `DELETE /api/admin/bloqueos/:id` | `204` |

### 8.5 Comunicaciones
| # | Método y path | Comportamiento |
|---|---|---|
| M1 | `GET /api/admin/comunicaciones` | Historial (más reciente primero) |
| M2 | `GET /api/admin/comunicaciones/segmentos/:tipo?desde=&hasta=` | Preview del segmento → `{ cantidad, muestra: [correos...max 10] }`. Tipos: `todos`, `profesionales`, `clientes_turnos_activos` (requiere desde/hasta) |
| M3 | `POST /api/admin/comunicaciones/individual` | `{ dni, rol, asunto, mensaje }` → resuelve correo, envía, loguea con `tipo='individual'`. 404 si la cuenta no existe |
| M4 | `POST /api/admin/comunicaciones/masivo` | `{ segmento, desde?, hasta?, asunto, mensaje }` → resuelve destinatarios (excluir `eliminado_en` y `suspendido_en`), envía en lotes de 100 (`resend.batch.send`), loguea con conteos. Segmento vacío → 422 `SEGMENT_EMPTY`. Rate limit propio (3/hora) |

### 8.6 Métricas y reportes
| # | Método y path | Comportamiento |
|---|---|---|
| D1 | `GET /api/admin/metricas?desde=&hasta=` | Bundle JSON (§12 WS6 para el shape exacto) |
| D2 | `GET /api/admin/reportes/turnos.csv?desde=&hasta=&estado=&profesional=&cliente=` | CSV con BOM, `Content-Disposition: attachment; filename=...` |
| D3 | `GET /api/admin/reportes/usuarios.csv?rol=&estado=` | Ídem usuarios |

### 8.7 Catálogos (extiende recursos existentes)
| # | Método y path | Rol | Comportamiento |
|---|---|---|---|
| E1 | `GET /api/especialidades` | público | Ahora incluye campo `activo`. El frontend filtra donde corresponde (formularios, filtros) |
| E2 | `POST /api/especialidades` | admin | Crea. 409 `DUPLICATE_NAME` si repetido. `201` |
| E3 | `PUT /api/especialidades/:id` | admin | Edita `tipo`. `200` |
| E4 | `PATCH /api/especialidades/:id/estado` | admin | `{ activo: bool }` habilitar/deshabilitar. `200`. Deshabilitar NO rompe relaciones existentes (solo deja de ofrecerse para nuevos filtros/reservas) |
| E5 | `GET /api/especialidades/:id/profesionales` | admin | Profesionales asociados (join `profesional_especialidad`) |
| E6–E10 | `GET/POST/PUT/PATCH/:id/estado` + `GET /:id/profesionales` en `/api/obras-sociales` | público/admin | Espejo de E1–E5 para obras sociales |

### 8.8 Códigos de error nuevos
`ACCOUNT_SUSPENDED`, `ALREADY_SUSPENDED`, `NOT_SUSPENDED`, `CANNOT_DELETE_SELF`, `MFA_INVALID_CODE`, `MFA_EXPIRED`, `MFA_TOO_MANY_ATTEMPTS`, `MFA_RESEND_TOO_SOON`, `MFA_CHALLENGE_INVALID`, `MOTIVO_REQUIRED`, `NOT_REASSIGNABLE`, `AGENDA_BLOCKED`, `CENTER_CLOSED`, `BOOKING_TOO_SOON`, `CANCEL_TOO_LATE`, `SEGMENT_EMPTY`, `DUPLICATE_NAME`. (Los ya existentes se reutilizan: `SLOT_TAKEN`, `OUT_OF_SCHEDULE`, `FORBIDDEN`, etc.)

---

## 9. Socket.IO — diseño

**Servidor** (`backend/src/socket/index.js`, nuevo):
- `initSocket(httpServer)` — crea el `Server` de socket.io, path default `/socket.io`, sin CORS en prod (same-origin); en dev el proxy de Vite evita CORS (ver abajo).
- **Auth del handshake**: parsear cookie `access_token` del header (helper mini `parseCookies`, sin dependencia nueva). JWT válido con `role='admin'` → join sala `admins`. Sin cookie → permite solo handshake con `auth: { mfa: "<challenge>" }` (JWT `purpose:'mfa'` válido) → join sala `mfa:<id_codigo>`. Cualquier otro caso → desconectar.
- **Eventos que EMITE el server** (nunca acepta eventos de datos del cliente):
  - a `admins`: `turno:creado`, `turno:cancelado`, `turno:reasignado`, `aviso:publicado` (payload chico: ids, fecha/hora, nombres).
  - a `mfa:<id_codigo>`: `mfa:codigo_enviado`, `mfa:intento_fallido` (`{restantes}`), `mfa:verificado`, `mfa:bloqueado`.
- **API interna** exportada para los controllers: `emitToAdmins(evento, payload)` y `emitToMfa(idCodigo, evento, payload)`. Los emisores se llaman DESPUÉS de que la operación commiteó.
- `server.js` cambia: `const server = createServer(app); initSocket(server); server.listen(...)`.
- Emit points: `TurnosController.crearTurno` → `turno:creado`; `TurnosService.cancelTurnoById` → `turno:cancelado`; reasignación → `turno:reasignado`; `AvisosController` (POST/PUT) → `aviso:publicado`; `MfaService` → eventos MFA.

**Frontend** (`frontend/src/socket/client.js`, nuevo): singleton `getSocket()` con `io({ withCredentials: true })` + `disconnectSocket()` (llamar en logout). El canal se conecta SOLO si `user?.role === 'admin'` (componente `AdminRealtimeChannel` montado en `MainLayout`, escucha eventos → `notifications.show(...)` + `queryClient.invalidateQueries` de las keys `['admin','turnos']`, `['admin','metricas']`, `['avisos','activos']`).

**Vite (dev)** — agregar a `vite.config.js` (`server.proxy`):
```js
'/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true, secure: false }
```

**Producción**: same-origin, sin config extra. Single-instance (Railway) OK. Multi-instancia → parking lot.

---

## 10. MFA — flujo exacto

1. **Login admin**: `POST /api/auth/login {dni, password, role:'admin'}`. Credenciales malas → igual que hoy (401). Suspendido/baja → 403/401 (§3, punto 2). OK → genera código de **6 dígitos** (`crypto.randomInt(0, 1_000_000)` padded), lo **hashea sha256**, invalida códigos previos no consumidos del admin, inserta en `mfa_codigo` (TTL 10 min), manda email (`EmailMethods.mfaCodigo`), responde `{ mfa_required: true, challenge, expira_en }`. **Sin cookie.**
2. **Challenge**: JWT `{ sub: dni, role: 'admin', purpose: 'mfa', code_id }`, `expiresIn: MFA_TTL_MIN`, firmado con `JWT_SECRET` (como todo lo demás).
3. **Verificar**: `POST /api/auth/mfa/verificar {challenge, codigo}`. Valida JWT (purpose + no expirado) → busca `mfa_codigo` por `code_id` → checks en orden: existe, no consumido, no expirado, `intentos < MFA_MAX_INTENTOS` → compara `sha256(codigo)`. OK → marca `consumido_en`, emite la sesión (mismo JWT/cookie/objeto `user` que el login actual — extraer helper compartido en `AuthService`) y emite `mfa:verificado` a la sala. Mal → `intentos+1`, 401 `MFA_INVALID_CODE`, emite `mfa:intento_fallido`. Agotados → invalida y 429 `MFA_TOO_MANY_ATTEMPTS` + `mfa:bloqueado`.
4. **Reenviar**: `POST /api/auth/mfa/reenviar {challenge}` → cooldown 60 s (429 `MFA_RESEND_TOO_SOON`), máx `MFA_MAX_RESENDS` por challenge, invalida el código anterior y emite `mfa:codigo_enviado`.
5. **WebSocket**: la pantalla de login puede conectar con `auth: { mfa: challenge }` para reflejar los eventos (progreso/reenvío/bloqueo). La verificación SIEMPRE va por HTTP (la cookie solo puede emitirse en una respuesta HTTP) — esto es una decisión, no una limitación.
6. **Frontend** (`RoleLogin.jsx`): si la respuesta del login trae `mfa_required` → paso 2 (input de código de 6 dígitos + botón reenviar con countdown + mensaje "te enviamos un código a tu correo"). Al verificar OK → `queryClient.setQueryData(['auth','me'], user)` + navegar a `/admin`. Ajustar `useAuth.js`/`useLoginSession` para no setear `me` con la respuesta del challenge. `notifications.show` para errores/estados.
7. **Constantes** (`config/constants.js`): `MFA_TTL_MIN = 10`, `MFA_MAX_INTENTOS = 5`, `MFA_RESEND_COOLDOWN_SEG = 60`, `MFA_MAX_RESENDS = 3`.
8. **Limiters**: `mfaVerifyLimiter` (10 intentos / 15 min por IP) y el cooldown de reenvío. El login ya está limitado por `authLimiter`.
9. **Email** (`EmailMethods.mfaCodigo`): asunto "Tu código de acceso", código visible grande, aviso de que expira en 10 minutos y de que nadie de Appointly te lo va a pedir. Usar `sendMail` + `escapeHtml` existentes.

---

## 11. Integraciones profundas (políticas + slots + duración)

Estas reglas tocan `helperSlots.js`, `turnos.controller.js` y `turnos.service.js` (WS3 y WS4 en orden). **La validación server-side es la fuente de verdad**; los slots también las reflejan para no ofrecer horarios inválidos.

1. **Días hábiles** (`dias_habiles`): si el día de la fecha no está en el array (convención 0=domingo…6=sábado), ese día NO genera slots. Reserva en día no hábil → 409 `CENTER_CLOSED`.
2. **Franja global** (`hora_apertura`–`hora_cierre`): los slots se recortan a esa ventana (intersección con el horario del profesional).
3. **Anticipación mínima** (`anticipacion_reserva_min`): slots anteriores a `NOW() + N min` no se ofrecen; reserva por fuera → 409 `BOOKING_TOO_SOON`. Evaluar en SQL (`fecha/hora < NOW() + INTERVAL ? MINUTE`).
4. **Límite de cancelación** (`limite_cancelacion_horas`): en el `cancelTurnoById` de v2 (§2.1 — ya exime admin y exige motivo), si el que cancela NO es admin y `NOW() > datetime(turno) - N horas` → 409 `CANCEL_TOO_LATE`. Evaluar en SQL.
5. **Bloqueos** (WS4): un slot está bloqueado si existe `bloqueo_agenda` con `fecha` = fecha del slot, `(dni_profesional = prof OR dni_profesional IS NULL)`, y `(hora_inicio IS NULL OR rango del slot intersecta [hora_inicio, hora_fin))`. Reserva en slot bloqueado → 409 `AGENDA_BLOCKED` (chequear también contra `ESTADOS_OCUPAN_SLOT` de v2 al validar reservas).
6. **Duración por profesional** (`profesional.duracion_turno_min`): usar la duración del profesional en el grid de slots (`GET /slots` devuelve `duracion_min`; la creación valida contra ese grid). ⚠️ Verificar contra v2 (`utils/time.js` nuevo): si v2 ya usa la duración en slots/validación, solo resta el ajuste de UI en `Agenda.jsx` (eventos hardcodeados a 30 min, `30 * 60 * 1000`).
7. **Lógica compartida**: refactorizar `calcularSlotsDisponibles`/`slotsDelDia` para recibir un objeto `{ horarios, fecha(s), duracionMin, config, bloqueos }` — pura y testeable. ⚠️ v2 ya define `ESTADOS_TURNO`/`ESTADOS_ABIERTOS`/`ESTADOS_OCUPAN_SLOT` en `constants.js`: REUSAR esas constantes (no crear un `ESTADOS_VALIDOS` paralelo).

---

## 12. Workstreams

> Cada WS: objetivo → agente sugerido → depende de → archivos → criterios de aceptación (verificables) → tamaño. Al terminar: marcar en la tabla de §12.10.

### WS0 — Fundaciones (DB + esqueleto admin)
**Agentes**: dba (migración/schema) → senior-dev (esqueleto) · **Depende de**: nada · **Tamaño**: S (1–2 sesiones)

**Hacer**:
1. Migración `002_panel_admin.sql` (→ se renumera `003` al integrar v2, §2.1) + `schema.sql` end-state + `seed.sql` (§6 completo, incluir fechas relativas de turnos).
2. Backend: `routes/admin.routes.js` que monta los subrouters de cada dominio (crear los archivos de subrouter VACÍOS: `adminUsuarios`, `adminTurnos`, `adminBloqueos`, `adminComunicaciones`, `adminMetricas`, `adminReportes` (o dentro de metricas), `adminConfiguracion`, `adminAvisos`); montar `/api/admin` en `app.js`; `configuracion.routes.js` y `avisos.routes.js` públicos (routers vacíos por ahora o completos si se animan — la lectura pública puede hacerse acá).
3. Actualizar `AuthModel.findCredentialsByDniAndRole` y `getSession` para el chequeo de suspensión (§3, punto 2). **Eliminar `identityStandIn`**.
4. Frontend: en `App.jsx` agregar rutas admin (`/admin/usuarios`, `/admin/usuarios/:dni/:rol`, `/admin/turnos`, `/admin/comunicaciones`, `/admin/catalogos`) + links del sidebar + páginas placeholder (`AdminUsuarios`, `AdminUsuarioDetalle`, `AdminTurnos`, `AdminComunicaciones`, `AdminCatalogos` — estilo de los placeholders actuales). `vite.config.js`: proxy `/socket.io` (§9).
5. `backend/src/querys/admin.http` con ejemplos de todos los endpoints nuevos (aunque devuelvan vacío/404 — para probar a medida que se implementan).

**Aceptación**: `pnpm db:reset` limpio + seed con turnos del mes corriente; 002 aplica sin error sobre DB con y sin `001`; login de los 3 roles sigue funcionando; `/api/admin/*` da 403 a no-admin y 404/200 vacío a admin; las páginas placeholder renderizan para admin; build del frontend pasa.

### WS1 — Gestión de usuarios y cuentas
**Agente**: senior-dev · **Depende de**: WS0 · **Tamaño**: M (2–3)

**Hacer**: backend U1–U7 completos (routes en `adminUsuarios.routes.js`, controller, service, model, schemas zod). Frontend: `AdminUsuarios.jsx` (tabla con búsqueda + filtros rol/estado, badges de estado, paginación NO), `AdminUsuarioDetalle.jsx` (ficha + historial de turnos + acciones: editar, suspender/reactivar, baja con confirmación, reset de contraseña), `api/adminUsuarios.js` + hooks `useAdminUsuarios.js`.

**Aceptación**: buscar por nombre/DNI/correo filtra bien; editar teléfono/obra social/afiliado se refleja en el perfil del cliente; matrícula duplicada → 409 visible en UI; suspender → ese usuario no puede loguearse (403 `ACCOUNT_SUSPENDED` al intentar con password correcta) y su sesión muere al recargar (`/me` → null); reactivar restaura; baja lógica conserva los turnos en el historial; reset envía email con el link funcionando (probar con Resend en dev); un admin no puede darse de baja a sí mismo.

### WS2 — Catálogos maestros
**Agente**: senior-dev · **Depende de**: WS0 · **Tamaño**: S–M (2)

**Hacer**: E1–E10 backend (extender `especialidades.*` y `obra-sociales.*` existentes + `activo`). Frontend: `AdminCatalogos.jsx` con dos tabs (Especialidades | Obras sociales): ABM completo + toggle activo/inactivo + drawer/lista de profesionales asociados. Ajustes menores: formularios y filtros públicos (registro, buscar) usan solo `activo=1` — revisar `useObraSociales.jsx`, `Especialidad.jsx`, `RegisterForm`, `Buscar`.

**Aceptación**: crear/editar/deshabilitar especialidad y obra social; nombre duplicado → 409 visible; deshabilitada no aparece en el registro ni en filtros de búsqueda pero sigue visible en la ficha de usuarios históricos; profesionales asociados listados correctamente; sin regresiones en registro/reserva.

### WS3 — Configuración general + Avisos + políticas en reservas
**Agente**: senior-dev · **Depende de**: WS0 · **Tamaño**: M–L (3)

**Hacer**: C1–C7 + integraciones §11.1–§11.3 y §11.6–11.7 (días hábiles, franja global, anticipación, límite de cancelación, duración por profesional en slots — NO bloqueos, eso es WS4). Frontend: `AdminConfiguracion.jsx` real (form Mantine con secciones: Datos de la institución / Políticas de turnos / Avisos) + gestión de avisos (lista + crear/editar/activar/eliminar) + `AvisoBanner.jsx` en `MainLayout` (fetch de `/api/avisos/activos`, color por tipo, dismiss en sesión) + `api/configuracion.js`, `api/avisos.js` + hooks.

**Aceptación**: guardar configuración persiste y se relee; con anticipación=60min un slot de dentro de 30 min no se ofrece Y su reserva directa da 409 `BOOKING_TOO_SOON`; con `limite_cancelacion_horas=2`, un cliente no puede cancelar a 1 h del turno (409 `CANCEL_TOO_LATE`) pero un admin sí (vía monitor, WS4 — mientras verificable por API); un día fuera de `dias_habiles` no ofrece slots (409 `CENTER_CLOSED` al forzar reserva); franja global recorta slots; cambiar `duracion_turno_min` de un profesional cambia el grid de sus slots y la respuesta de `/slots`; aviso creado aparece en el banner para cualquier rol logueado; aviso vencido no aparece; sin regresiones en reserva normal.

### WS4 — Monitor global de turnos + bloqueos + acciones admin
**Agente**: senior-dev · **Depende de**: integración de `feat/ap-register` (turnos v2 — §2.1) + WS3 (mismos archivos de turnos) y del `socket/events` de WS7 (Ola 1) · **Tamaño**: L (3–4)

**⚠️ REUSAR v2 (NO re-implementar)**: `EstadoTurnoBadge`, `TurnoHistorialModal`, `ReprogramarTurnoModal`, `ConfirmarEstadoModal`, `utils/estadosTurno.js`, hooks `useCambiarEstadoTurno`/`useReprogramarTurno`/`useTurnosDia`, matriz `TRANSICIONES` y endpoints `GET /api/turnos` + `PATCH /:id/estado` + `POST /:id/cancelacion|reprogramacion` + `GET /:id/eventos` (§2.1). El monitor admin los consume; no duplica.

**Hacer (solo gaps §8.4)**: backend — T1 (extender v2: filtro `cliente` + ambas contrapartes), T2 (email al profesional en cancelación admin), T3 (reasignación NUEVA), T4/T5 (ampliar `TRANSICIONES` para admin — o quitarlas del monitor: decisión de producto), B1–B3 (bloqueos NUEVOS, §11.5). Frontend — `AdminTurnos.jsx` (tabla + calendario `@mantine/schedule`; filtros fecha/estado/profesional/cliente; acciones: confirmar/en espera/reprogramar/historial [v2], cancelar con motivo, reasignar, completado/ausente [si T4/T5]; `BloqueosModal` + `NuevoBloqueoModal`). `api/adminTurnos.js` + hooks. Emitir socket en los writes nuevos y en `crearTurno` de v2 (`turno:creado`).

**Aceptación**: tabla lista el mes por defecto con ambos nombres y `EstadoTurnoBadge` v2; filtros combinables; cancelar exige motivo y avisa a cliente y profesional (Resend); reprogramar/historial abren los modales v2 sin duplicar lógica; reasignar a ocupado/bloqueado/fuera de horario → 409 correcto, a uno libre → mueve + auditoría + emails; (si T4/T5) completado/ausente vía PATCH con evento; bloqueo de día completo oculta los slots de ese día (slot fuera de `/slots`, reserva directa 409 `AGENDA_BLOCKED`); bloqueo de rango horario solo ese rango; bloqueo de centro a todos; borrar bloqueo restaura; turnos existentes dentro de un bloqueo NO se cancelan solos (visibles en monitor); dos pestañas admin + reserva cliente → notificación en vivo.

### WS5 — Centro de comunicaciones
**Agente**: senior-dev · **Depende de**: WS0 · **Tamaño**: M (2–3)

**Hacer**: M1–M4 backend + métodos de email nuevos (`EmailMethods.comunicado`). Frontend: `AdminComunicaciones.jsx` (tabs: Individual / Masivo / Historial; individual con auto-completar usuario por DNI; masivo con selector de segmento + rango si aplica + preview de cantidad + confirmación; historial en tabla). `api/adminComunicaciones.js` + hooks.

**Aceptación**: preview de cada segmento muestra cantidad correcta (validar contra SQL manual); individual llega al correo del usuario y queda en historial con emisor/fecha/asunto; masivo envía en lotes y registra exitos/fallos; segmento vacío → 422 `SEGMENT_EMPTY`; el límite de 3 masivos/hora responde 429; usuarios dados de baja/suspendidos no reciben.

### WS6 — Dashboard de métricas + exportaciones
**Agente**: senior-dev · **Depende de**: WS4 (para que `ausente` tenga datos) · **Tamaño**: M (2–3)

**Hacer**: D1–D3 + `utils/csv.js` (escape + BOM). Shape de `GET /api/admin/metricas?desde&hasta`:
```json
{
  "rango": { "desde": "...", "hasta": "..." },
  "turnos_hoy": 0, "turnos_rango": 0,
  "por_estado": { "pendiente_confirmacion": 0, "confirmado": 0, "en_espera": 0, "en_curso": 0, "completado": 0, "ausente": 0, "reprogramado": 0, "cancelado": 0 },
  "tasas": { "completitud": 0, "cancelacion": 0, "ausentismo": 0 },
  "especialidades_top": [{ "id": 0, "tipo": "", "total": 0 }],
  "profesionales_top": [{ "dni": 0, "nombre": "", "apellido": "", "total": 0 }],
  "horas_pico": [{ "hora": "09:00", "total": 0 }],
  "nuevos_clientes": [{ "periodo": "2026-09", "total": 0 }]
}
```
(`por_estado` = 8 estados de v2 (§2.1); tasas = % sobre turnos del rango; `especialidades_top`/`profesionales_top` top 5; `horas_pico` agrupa por hora; `nuevos_clientes` últimos 6 meses de altas `id_rol=1`.) Frontend: reemplazar el placeholder de `AdminInicio.jsx` por el dashboard (KPIs en cards, gráficos con `@mantine/charts`/Recharts como en el dashboard del profesional, DatePicker de rango, botones "Exportar CSV" que descargan vía fetch blob). `api/adminMetricas.js` + hooks.

**Aceptación**: KPIs del día/mes cuadran con SQL manual sobre el seed; tasas suman coherente; top 5 de especialidades/profesionales correcto; horas pico correctas; nuevos clientes por mes correctos; los dos CSV abren en Excel con acentos correctos (BOM) y columnas completas; rango de fechas del dashboard al filtrar.

### WS7 — MFA + Socket.IO
**Agente**: senior-dev (revisión de `security` recomendada para el flujo MFA) · **Depende de**: WS0 · **Tamaño**: L (3–4). **Entregar el núcleo backend (auth + `socket/index.js` + `socket/events`) en la Ola 1** (WS4 lo necesita).

**Hacer**: §9 completo + §10 completo + `EmailMethods.mfaCodigo`. Frontend: `RoleLogin.jsx` con paso MFA, `socket/client.js`, `AdminRealtimeChannel`, ajustes `useAuth`/`api.js`. `querys/admin.http` (o nuevo `mfa.http`) con secuencia login→verify.

**Aceptación**: admin loguea → recibe email con código → con código correcto entra (cookie seteada, `me` devuelve el user); código incorrecto 5 veces → bloqueo; código vencido → `MFA_EXPIRED`; reenvío funciona con cooldown y el anterior queda inválido; cliente/profesional loguean como siempre (sin código); login admin NO setea cookie antes de verificar (verificar en DevTools); eventos socket llegan a la pantalla de login (reenvío/verificado) y al panel admin (turno creado/cancelado/avisos) con notificaciones Mantine + invalidación de queries; logout desconecta el socket; sin errores de consola.

### WS8 — QA final + regresión + borrado
**Agentes**: qa + security · **Depende de**: TODO · **Tamaño**: M (1–2)

**Hacer**: el guion E2E completo (§13), la regresión (§13.2), los chequeos de seguridad (§13.3). Corregir lo que aparezca (o derivar y anotar). **Al terminar: borrar este archivo**.

**Aceptación**: checklist global §13.4 completo + build de frontend + eslint backend/frontend sin errores + `PLAN_ADMIN.md` borrado (`git rm`).

### 12.10 Estado de avance
| WS | Descripción | Estado | Agente | Fecha |
|---|---|---|---|---|
| WS0 | Fundaciones (DB + esqueleto admin) | [x] | senior-dev | 2026-10-18 |
| WS1 | Usuarios y cuentas | 🟡 backend ✓ s/auditar · frontend a medias | Ola1 (sin reporte) | 2026-10-19 |
| WS2 | Catálogos maestros | 🟡 backend ✓ s/auditar · frontend pendiente | Ola1 (sin reporte) | 2026-10-19 |
| WS3 | Configuración + avisos + políticas | ☐ pendiente | | |
| WS4 | Monitor de turnos + bloqueos | ☐ pendiente | | |
| WS5 | Comunicaciones | 🟡 backend ✓ s/auditar · frontend pendiente | Ola1 (sin reporte) | 2026-10-19 |
| WS6 | Métricas + exportaciones | ☐ pendiente | | |
| WS7 | MFA + Socket.IO | 🟡 núcleo backend ✓ s/auditar · frontend Ola 2 pendiente | Ola1 (sin reporte) | 2026-10-19 |
| WS8 | QA final + borrado del md | ☐ pendiente | | |

**Desvíos WS0** (senior-dev, 2026-10-18):
- Los appends a archivos compartidos se hicieron TODOS en WS0 (en vez de que cada WS agregue los suyos) para permitir la Ola 1 en paralelo: `email.methods.js` (mfaCodigo, turnoCanceladoPorAdmin, turnoReasignado, comunicado, comunicadoLote), `useGetErrosMsg.jsx` (§8.8 completo), `constants.js` (MFA_*), `rateLimit.middleware.js` (mfaVerifyLimiter, massMailLimiter). Los WS siguientes NO deben re-agregarlos.
- `app.js` también monta `configuracion`/`avisos` públicos vacíos (contemplado en §12 WS0.2); se completan en WS3.
- Verificación 002: OK en ambos linajes. Nota: la 001 original ya no corre sobre el schema HEAD (intenta dropear `profesional.estado_validacion`, ausente en el schema actual); el linaje a se verificó emulando su delta (`persona_rol.estado`).
- Verificado por curl: `db:reset` limpio (27 turnos del mes, 5 hoy, ausente=3); login 3 roles; `/api/admin/*` 401 sin sesión / 403 cliente / 404 admin (routers vacíos); build frontend OK. Render visual de placeholders: pendiente de ojo humano.
- ⚠️ Migración del panel: al integrar v2 (§2.1) se renumera a `003_panel_admin.sql` y pierde los cambios de `turno.estado`/`ausente_en`; la verificación §6.10 se rehace sobre la base v2. Entorno dev: backend en `--watch` sobre :4000; MySQL 3307 levantado manualmente (DBngin, no por la GUI).

**✅ INTEGRACIÓN HECHA (2026-10-19) — merge `fe90e9e`**: `origin/feat/ap-register` (turnos v2) integrado sobre `59c5b0d` (WS0). Reconciliación: migración del panel renumerada a `003_panel_admin.sql` (ya no toca `turno.estado` ni agrega `ausente_en`; corre después de `002_estados_turno`), `schema.sql`/`seed.sql` re-derivados sobre v2 (seed con fechas relativas y estados v2: 2 `pendiente_confirmacion`, 1 `en_espera`, 3 `ausente`, 4 `completado`, 4 `cancelado`, resto `confirmado`; sin filas de `turno_evento` y sin `reprogramado` sembrado — se generan en flujos reales). Conflictos solo en `constants.js` (unión MFA_* + TIMEZONE/ESTADOS_TURNO), `schema.sql` y `seed.sql`; el resto auto-mergeó (incl. `email.methods.js`, `rateLimit`, `App.jsx`, tests v2). Verificado: `pnpm db:reset`, linaje de migración viejo→002→003 en DB scratch con datos, 218 tests backend + 47 frontend en verde, build OK, smoke (login 3 roles, guards 401/403, `GET /api/turnos?profesional=` 200/400 por contrato). Commit/merge: solo con pedido explícito del usuario.

**🟡 OLA 1 EJECUTADA PARCIALMENTE — SIN AUDITAR (noche 2026-10-19)**: se lanzaron 4 subagentes en paralelo (WS1, WS2, WS5 y WS7-núcleo backend); la sesión se canceló antes de que entregaran sus reportes y **nada está commiteado** (working tree: 14 archivos modificados + ~23 nuevos). Inventario:

- **WS1 backend** ✅ presente: `adminUsuarios.routes.js` lleno + `controllers/services/models/adminUsuarios.*` + `schemas/adminUsuario.schema.js` + `test/admin-usuarios.test.js`.
- **WS1 frontend** 🟡 parcial: `api/adminUsuarios.js`, `hooks/useAdminUsuarios.jsx` y `pages/admin/usuarios/` (UsuarioCard, RolCuentaBadge, EstadoCuentaBadge, modales Suspender/ResetPassword/Baja). **Sin wirear**: los placeholders `AdminUsuarios.jsx`/`AdminUsuarioDetalle.jsx` siguen intactos y no hay rutas nuevas.
- **WS2 backend** ✅ presente: `especialidades.*`/`obra-sociales.*` extendidos (routes/controllers/models + services nuevos) + `schemas/catalogos.schema.js` + `test/catalogos.test.js`. **Frontend entero pendiente** (AdminCatalogos.jsx intacto).
- **WS5 backend** ✅ presente: `adminComunicaciones.routes.js` lleno + controller/service/model + `schemas/adminComunicaciones.schema.js`. **Frontend entero pendiente**.
- **WS7-núcleo backend** ✅ presente: flujo MFA en `auth.service/controller/routes` + `auth.middleware.js` (un token con `purpose` nunca vale como sesión — §13.3) + `server.js` (socket.io sobre el mismo http server — §9) + `socket/{index,events}.js` + `models/mfa.model.js` + `schemas/mfa.schema.js` + `querys/mfa.http` + `test/{mfa,socket}.test.js` + `test/helpers/mfa-test-app.js`. Frontend WS7 = Ola 2 (pendiente por diseño).
- **Schema/seed/migraciones intactos** (las tablas ya venían de WS0/003).

**Verificado la noche del 2026-10-19 (sobre el working tree crudo)**: backend :4000 bootea con todo cargado (200 `/api/especialidades`); `pnpm test` backend **268/268 verde** (los 218 previos + 50 nuevos: MFA §10 completo, socket handshake/salas/eventos `turno:creado`/`mfa:*`, usuarios admin, catálogos); `pnpm test` frontend **47/47**; `pnpm build` frontend OK (6.6 s; warning rrule/mantine-schedule pre-existente). El código MFA se loguea en consola en dev (`[MFA dev] codigo para <dni>: NNNNNN`, solo `NODE_ENV != production`; desvío declarado, jamás viaja en la respuesta HTTP).

**Auditoría pendiente (próxima sesión, en orden)**: (1) leer los diffs de los 4 WS contra sus contratos §8 y §12 (nadie los revisó; verificar alcance y que el login admin por MFA cumpla §10 al pie); (2) completar frontend WS1 (wirear páginas/rutas) y el frontend de WS2/WS5; (3) correr los criterios de aceptación §12 por curl/UI; (4) actualizar esta tabla; (5) commitear **solo con pedido explícito del usuario**.

**Arranque mañana**: MySQL (DBngin manual, 3307) — si está caída tras reiniciar la máquina: `Start-Process "C:\Users\Usuario\AppData\Local\com.tinyapp.DBngin\Binaries\mysql\8.4.2\bin\mysqld.exe" -ArgumentList '--defaults-file="C:\Users\Usuario\AppData\Local\com.tinyapp.DBngin\Engines\mysql\1c1f33d6-6656-4fbc-b9b0-9d5fc08cb93f\mysql.cnf"'` (también hay 9.7.1 en Binaries; manda el cnf). Backend: `pnpm dev` (watch :4000). Frontend: `pnpm dev` (:5173). Header `x-api-key` = `API_KEY` de `backend/.env`. Seed: admin 27845123 / profesional 27845123 / cliente 22456789, password `password123`. **Login admin ahora pide MFA**: en dev el código sale del log del backend (`[MFA dev] ...`). Rate limits dev por IP (auth 5/15 min, global 150/15 min): reusar cookies con curl -c/-b; para martillar, instancia aparte `PORT=4101 node --env-file=.env src/server.js`.

---

## 13. Verificación final

### 13.1 Guion E2E (correr completo antes de dar por cerrado)
1. `pnpm db:reset` en limpio → seed OK con turnos del mes.
2. Admin: login → MFA → dashboard con métricas > 0.
3. Crear aviso → aparece banner para un cliente logueado en otra pestaña (en vivo, sin refresh).
4. Cliente reserva un turno nuevo → notificación en vivo en el panel admin.
5. Admin cancela un turno con motivo → emails a cliente y profesional → historial del cliente lo muestra cancelado.
6. Admin reasigna un turno → emails → auditoría en `turno_reasignacion` → el monitor refleja el nuevo profesional.
7. Admin crea bloqueo de día completo en un profesional → `/slots` de ese día vacío → reserva forzada por API → 409.
8. Masivo "profesionales" → preview de cantidad correcta → envío → historial con exitos/fallos.
9. Exportar ambos CSV → abrir en Excel → acentos OK.
10. Suspender un cliente → login falla (`ACCOUNT_SUSPENDED`) → reactivar → login OK.
11. Reset de contraseña desde admin → email → link funciona → nueva password entra.
12. Deshabilitar una obra social → no aparece en registro → los clientes existentes conservan la suya.

### 13.2 Regresión (lo viejo no se rompe)
Registro cliente; login cliente y profesional; buscador de profesionales + filtros; reservar turno (slots correctos); cancelar turno cliente/profesional; agenda del profesional (calendario); horarios de atención (ABM del profesional); invitaciones admin/profesional (loop completo); mi perfil (edición + avatar); `GET /api/me` sin cookie → `null`.

### 13.3 Seguridad
- `/api/admin/*` sin cookie → 401; con cookie de cliente/profesional → 403. Probar 3 endpoints distintos.
- MFA: cookie NO emitida antes de verificar; challenge no sirve como access token (`/api/me` con challenge → null); código de otro admin no valida; intentos máximos bloquean; hash en DB (no código plano).
- Filtros SQL todos parametrizados (LIKE de `q` incluido), sin concatenación.
- CSV injection: prefijar celdas que empiezan con `=+-@` con `'`.
- Socket: handshake sin cookie ni challenge → desconectado; sala `admins` inaccesible para cliente.
- Rate limits responden 429 (login, MFA, masivos).

### 13.4 Checklist global
- [ ] WS0–WS7 completos con sus criterios de aceptación verificados
- [ ] §13.1 E2E completo ✅
- [ ] §13.2 regresión ✅
- [ ] §13.3 seguridad ✅
- [ ] `pnpm --filter frontend build` OK · eslint backend y frontend OK · backend bootea sin warnings
- [ ] **BORRAR `PLAN_ADMIN.md`** (`git rm PLAN_ADMIN.md`)

---

## 14. Parking lot (NO hacer ahora — candidatos futuros)

- Export `.xlsx` nativo (exceljs) si lo piden.
- Tests automatizados (vitest + supertest) — alta recomendación para una próxima iteración.
- Redis adapter / sticky sessions si el deploy escala a más de una instancia.
- Índice único anti-doble-reserva (la carrera de slots se valida en controller, hay ventana de carrera).
- Email automático al profesional cuando un cliente reserva.
- Limpieza de la columna huérfana `persona_rol.estado` (deuda de la migración 001).
- Paginación si la escala crece.
- Notificación de ausencias/tarde, agenda pública, multi-sede.

---

> **RECORDATORIO FINAL**: cuando §13.4 esté todo en ✅, este archivo se borra. Es la última tarea de WS8. `git rm PLAN_ADMIN.md && git commit -m "chore: panel admin completo — se elimina el plan de trabajo"`.
