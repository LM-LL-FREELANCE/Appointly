# Progreso del panel admin — Appointly

**Fecha:** 2026-10-19 22:16 (America/Argentina/Buenos_Aires)
**Branch:** `feat/admin-panel`
**Último avance:** WS3 (configuración + avisos + políticas de turnos) implementado en backend y frontend. Falta smoke visual/UI y ajustar la tabla de avance del plan.

> Este archivo es una nota de continuidad. No commitear salvo que el usuario lo pida.

---

## 1. Dónde retomar

Estado actual: **WS3 completo a nivel código y tests**. El siguiente paso es el smoke de UI y después arrancar **WS4 — Bloqueos de agenda**.

### Inmediato (al volver)

1. **Smoke visual de WS3** (no hay Playwright/Puppeteer en el proyecto):
   - Backend ya está corriendo en `http://localhost:3000` (PID 12644, reiniciado con el código nuevo).
   - `frontend/.env` local tiene `VITE_API_URL=http://localhost:4000`, que **no** coincide con el backend en 3000. Para probar la UI: levantar el backend en 4000 o cambiar temporalmente `VITE_API_URL=http://localhost:3000` y reiniciar Vite. **No** commitear ese cambio.
   - Login admin: credenciales del seed + código MFA del log (ver §5).
   - Verificar `/admin/configuracion`: guardar persiste, botón Guardar disabled sin cambios, chips L–D correctos, crear/editar/activar/eliminar aviso, preview del modal, banner en `MainLayout`, dismiss por sesión.
   - Verificar banner como cliente/profesional (los avisos activos del seed son 2).
2. Si el smoke visual encuentra detalles, corregirlos en:
   - `frontend/src/pages/admin/AdminConfiguracion.jsx`
   - `frontend/src/pages/admin/configuracion/*`
   - `frontend/src/components/AvisoBanner.jsx`
3. Actualizar la tabla de avance **§12.10 de `PLAN_ADMIN.md`** (WS3 en curso/verificado).
4. Continuar con **WS4** según `PLAN_ADMIN.md` §12 (bloqueos de agenda). WS4 toca los mismos archivos de turnos que WS3: ya están libres.

### Pendiente no bloqueante / decisión

- **Realtime del banner en cliente/profesional:** `AdminRealtimeChannel` se conecta solo con rol admin (diseño WS7). Por eso un aviso nuevo aparece en vivo **solo en el panel admin**; cliente/profesional lo ven al refetch/navegar/volver a foco. Es coherente con §9/§387 del plan, pero contradice la letra de DISEÑO §8.2 (“sin recargar” para cualquier rol). Si se quiere live para todos, hay que ampliar el handshake/rooms del socket en otra tarea.
- **`frontend/.env` vs backend 3000/4000:** configuración local, no del repo.
- El build de Vite muestra un warning preexistente de `@mantine/schedule`/`rrule` (`default` undefined). No rompe el build.

---

## 2. Verificación ya realizada

### Backend

- `pnpm test` en `backend/`: **286 tests, 286 pass, 0 fail**.
  - Incluye las suites nuevas `configuracion.test.js` (9 tests) y `politicas-turnos.test.js` (9 tests).
  - No hay fallas; los logs de `RESEND_API_KEY` son esperados en tests de email best-effort.
- Lint limpio en los archivos backend tocados:
  - `src/models/turnos.model.js`
  - `test/configuracion.test.js`
  - `test/politicas-turnos.test.js`
  - `test/helpers/test-app.js`

### Frontend

- Lint limpio en todos los archivos WS3 tocados (y los ajustes de `Agenda`, `Buscar`, `RegisterForm`).
- `pnpm build` en `frontend/`: **verde**.
- Smoke API con backend reiniciado:
  - `GET /api/configuracion` → 200, devuelve seed (anticipación 60, límite 2, L–V, 08:00–20:00).
  - `GET /api/avisos/activos` → 200, 2 avisos (`Corte de luz programado`, `Campana de vacunacion`).

### Smoke API WS2 previo (referencia)

- Especialidades 5 / obras sociales 6.
- POST duplicado → 409 `DUPLICATE_NAME`; POST nuevo → 201; PATCH estado → 200.
- Fila de prueba eliminada de la DB; quedó limpia.

---

## 3. Qué se implementó en WS3

### Backend

Archivos nuevos:

- `backend/src/models/configuracion.model.js`
  - Singleton `id=1`; defaults seguros si no hay fila.
  - Normaliza `dias_habiles` (JSON/array), horas `HH:MM`.
- `backend/src/schemas/configuracion.schema.js`
  - PUT de **reemplazo completo** (`strictObject`).
  - Días únicos 0–6, al menos 1; anticipación 0–43200; límite 0–720.
  - Apertura/cierre: ambos o ninguno; cierre > apertura.
- `backend/src/services/configuracion.service.js`
- `backend/src/controllers/configuracion.controller.js`
- `backend/src/routes/configuracion.routes.js` → `GET /api/configuracion` (público)
- `backend/src/routes/adminConfiguracion.routes.js` → `PUT /api/admin/configuracion` (admin)

- `backend/src/models/avisos.model.js`
  - Alias `id`, `activo` booleano, fechas ISO.
  - Activos: filtra `activo=1` + vigencia contra `CURDATE()`; orden crítico → advertencia → info.
- `backend/src/schemas/avisos.schema.js`
  - Título ≤150, mensaje ≤20000, tipo `info|advertencia|critico`, fechas reales, desde ≤ hasta.
- `backend/src/services/avisos.service.js` (emite `aviso:publicado` en POST/PUT)
- `backend/src/controllers/avisos.controller.js`
- `backend/src/routes/avisos.routes.js` → `GET /api/avisos/activos` (público)
- `backend/src/routes/adminAvisos.routes.js` → `GET/POST/PUT/DELETE /api/admin/avisos` (admin)

Integración de políticas:

- `backend/src/utils/helperSlots.js`
  - Helpers nuevos: `estaDiaHabilitado`, `reservaDemasiadoPronto`, `cancelacionVencida`.
  - `calcularSlotsDisponibles` / `slotsDelDia` aceptan `config` y `duracion`.
  - Recorte por día hábil, franja global, anticipación y duración.
- `backend/src/utils/time.js`
  - `restarMinutosFechaHora`.
- `backend/src/models/profesionales.model.js`
  - `getDuracionTurno(dni)` con fallback 30.
- `backend/src/controllers/turnos.controller.js`
  - `GET /slots` usa config + duración y devuelve `duracion_min`.
  - Crear valida (en orden): `CENTER_CLOSED`, `BOOKING_TOO_SOON`, `OUT_OF_SCHEDULE`.
- `backend/src/services/turnos.service.js`
  - Reprogramar aplica las mismas políticas.
  - Cancelar no-admin aplica `CANCEL_TOO_LATE`; admin exento.
- `backend/src/models/turnos.model.js`
  - `getTurnosByProfesional` ahora devuelve `duracion_turno_min` (para Agenda).

Tests nuevos:

- `backend/test/configuracion.test.js`: C1 defaults/seed, C2 persistencia/validación/roles, C3 activos/vigencia/orden, C4–C7 CRUD.
- `backend/test/politicas-turnos.test.js`: días hábiles, franja global, anticipación, límite de cancelación, duración 45 min, reprogramación, helpers puros.
- `backend/test/helpers/test-app.js`: monta routers públicos/admin de configuración y avisos.

### Frontend

Archivos nuevos:

- `frontend/src/api/configuracion.js`
- `frontend/src/api/avisos.js`
- `frontend/src/hooks/useConfiguracion.jsx`
- `frontend/src/hooks/useAvisos.jsx`
  - Keys: `['configuracion']`, `['avisos','activos']`, `['admin','avisos']`.
  - Mutaciones `meta:{silent}` e invalidación de avisos.
- `frontend/src/utils/avisos.js` (tipos/colores/orden/vigencia)
- `frontend/src/components/AvisoIcon.jsx`
- `frontend/src/components/AvisoBanner.jsx`
  - Hasta 2 avisos, críticos primero, dismiss por `sessionStorage`, “y N avisos más”.
- `frontend/src/pages/admin/configuracion/ConfiguracionForm.jsx`
  - Un `useForm` para institución + políticas; `isDirty` controla Guardar.
  - Chips L M X J V S D; TimeInput con limpiar; validaciones.
- `frontend/src/pages/admin/configuracion/AvisoItem.jsx`
- `frontend/src/pages/admin/configuracion/AvisoModal.jsx`
  - Crear/editar con preview; conserva `activo` al editar.
- `frontend/src/pages/admin/configuracion/EliminarAvisoModal.jsx`
- `frontend/src/pages/admin/AdminConfiguracion.jsx` (reemplaza placeholder)

Modificados:

- `frontend/src/MainLayout.jsx`: `<AvisoBanner />` antes de `<Outlet />`.
- `frontend/src/pages/Agenda.jsx`: duración de eventos desde `duracion_turno_min` (fallback 30).
- `frontend/src/pages/Buscar.jsx`: filtros de especialidad/obra social solo activos.
- `frontend/src/components/RegisterForm.jsx`: obras sociales solo activas.
- `frontend/src/utils/fechas.admin.js`: `formatFecha` ya no corre el día en fechas `YYYY-MM-DD` (fix zona horaria).

---

## 4. Contratos y códigos nuevos

- `GET /api/configuracion` (público)
- `PUT /api/admin/configuracion` (admin, reemplazo completo)
- `GET /api/avisos/activos` (público)
- `GET /api/admin/avisos` / `POST` / `PUT /:id` / `DELETE /:id` (admin)
- Errores de política: `CENTER_CLOSED`, `BOOKING_TOO_SOON`, `CANCEL_TOO_LATE`, `OUT_OF_SCHEDULE`.
- Seed actual de configuración: anticipación 60, límite 2 h, días `[1,2,3,4,5]`, 08:00–20:00.
- Seed de avisos: 2 activos vigentes + 1 futuro.

---

## 5. Entorno y comandos útiles

- Repo: `D:\Desktop\Programacion\webdev\freelance\PROYECTO FINAL\Appointly`
- Backend dev: `http://localhost:3000`, PID actual `12644`.
  - Log: `C:\Users\Usuario\AppData\Local\Temp\opencode\appointly-backend.log`
  - Errores: `C:\Users\Usuario\AppData\Local\Temp\opencode\appointly-backend.err.log`
- MFA dev: buscar en el log `[MFA dev] codigo para 27845123: NNNNNN`.
- API key global: la de `backend/.env` (`API_KEY`).
  - Header `x-api-key` en todas las llamadas, incluso públicas.
- Login admin: credenciales del seed (`backend/src/scripts/seed.sql`).
- MySQL temporal: puerto `3307`; cliente `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`.
- Tests backend: `cd backend; pnpm test`
- Build frontend: `cd frontend; pnpm build`
- Lint backend/frontend: `pnpm exec eslint <archivos>`

---

## 6. Estado de las olas

| WS | Estado |
| --- | --- |
| WS0 | Completado (sidebar, placeholders, envelope) |
| WS1 | Completado (usuarios backend + frontend) |
| WS2 | Completado (catálogos backend + frontend, smoke API OK) |
| WS3 | **Código + tests + build OK; falta smoke visual y actualizar §12.10** |
| WS4 | Pendiente (siguiente) |
| WS5 | Pendiente |
| WS6 | Pendiente |
| WS7 | Completado (MFA + socket admin) |
| WS8 | Pendiente |

---

## 7. Recordatorios del proyecto

- No commitear sin pedido explícito.
- Al completar todas las features: borrar `PLAN_ADMIN.md` y `DISENO_ADMIN.md` con `git rm`.
- Si el código contradice al plan, gana el código y se anota como desvío.
- Frontend no tiene tests automatizados ni browser automation; la verificación es lint + build + smoke API/manual.
