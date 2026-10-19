# Migraciones de base de datos

El proyecto no usa un sistema de migraciones (ni ORM). Este README fija la
convencion para no perder la intencion de cada cambio de schema.

## Fuente de verdad

- `../schema.sql` describe el estado **actual** completo. Una DB nueva se crea
  con `pnpm db:schema` (o `pnpm db:reset`) y **no** necesita migraciones.
- Los `.sql` numerados de esta carpeta existen **solo** para llevar una DB que
  ya tiene datos desde un schema viejo al actual, sin perderlos.

## Reglas

1. Cada cambio de schema = un archivo `NNN_descripcion.sql` (numeracion
   correlativa) **y** el mismo cambio reflejado en `schema.sql` (y `seed.sql` /
   `drop.sql` si corresponde), en el mismo commit.
2. El encabezado de cada migracion explica la **intencion** (por que), no solo
   el SQL.
3. Se corren en orden numerico, una sola vez por DB. No se editan migraciones
   ya aplicadas en algun entorno: se agrega una nueva.
4. Las migraciones migran datos existentes (UPDATE) antes de borrar columnas.
5. Hacer backup antes de correrlas en una DB con datos reales.

## Como correr una migracion

Desde la raiz del repo, con `backend/.env` configurado:

```bash
pnpm db:migrate migrations/001_estado_cuenta_e_invitacion.sql
```

## Indice

| # | Archivo | Intencion |
|---|---|---|
| 001 | `001_estado_cuenta_e_invitacion.sql` | `persona_rol.estado` (`pendiente`/`aprobado`) reemplaza `profesional.estado_validacion`, asi el estado de aprobacion tambien aplica al admin. Agrega la tabla `invitacion` (token con hash, 24h, un solo uso) para altas de admin. Las cuentas existentes quedan `aprobado`, salvo profesionales no aprobados. |
| 002 | `002_estados_turno.sql` | `turno.estado` pasa a ocho estados (`activo` se renombra `confirmado`; se suman `pendiente_confirmacion`, `en_espera`, `en_curso`, `ausente`, `reprogramado`). Agrega `turno.id_turno_origen` (enlace de reprogramacion/recupero) y la tabla `turno_evento` (historial de estados con su autor). Los cancelados previos quedan sin evento. |
| 003 | `003_panel_admin.sql` | Base del panel de administracion (PLAN_ADMIN.md §6): tablas `configuracion`, `aviso`, `bloqueo_agenda`, `email_enviado`, `mfa_codigo` y `turno_reasignacion`; `persona_rol.suspendido_en` (suspension reversible, la baja sigue siendo `eliminado_en`); `activo` en `especialidad`/`obra_social`; indices de `turno` para el monitor. No toca `turno.estado` (eso es la 002). |

> **Obsoleta en parte**: `persona_rol.estado` se elimino despues (registro por
> invitacion para profesional y admin), antes de que el modelo de aprobacion
> llegara a ningun entorno real. No se agrego una migracion para quitarlo: una DB
> que haya corrido la 001 solo tiene datos de prueba y se rehace con
> `pnpm db:reset`. La tabla `invitacion` que crea la 001 sigue vigente.

## Modelo de altas

- `cliente`: se registra solo desde la web.
- `profesional` y `admin`: se crean unicamente desde una invitacion que emite un
  admin (token con hash, 24h, un solo uso). La invitacion es la autorizacion, asi
  que la cuenta nace activa y no existe un estado de aprobacion.
