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

## Modelo de estados (desde 001)

- `cliente`: nace `aprobado`.
- `profesional`: nace `pendiente`; un admin lo aprueba o lo rechaza (el rechazo
  borra la cuenta del rol).
- `admin`: se crea solo por invitacion, nace `aprobado` (la invitacion ya es la
  autorizacion).
- Una cuenta `pendiente` no inicia sesion y su perfil no es publico.
