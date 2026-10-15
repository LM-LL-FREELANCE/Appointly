# registro-roles

Profesional se registra por solicitud + aprobacion del admin; admin se registra por invitacion (token 24h, un solo uso).
Registro/existencia unificados y transaccionales. Branch: `feat/ap-register`. Sin tests (S16). Reset password y key de Resend de otros: fuera de scope salvo S17.

## Specs

- S1: "envio de invitacion a roles profesional y admin" -> decision final: "hacer invitacion para admins y solicitud + aprobacion para profesionales". Profesional: "el profesional, solicite registro y luego se vera si el admin lo acepta o no". Admin: invitacion.
- S2: "romper el token pasadas 24 horas o que una vez usado se rompa" (token de invitacion; opaco, hash en DB, consumo atomico en la misma transaccion que crea la cuenta).
- S3: "la idea es que la logica se comparta no se repita en codigo" / "unifica los register y existe". Un solo `register({role})`, un solo `existe(dni|correo, role)`, un solo endpoint `POST /api/auth/registro` con `role`; se elimina `/registro-profesional`.
- S4: "vamos a usar transacciones" (sin `INSERT IGNORE` en `persona_rol`).
- S5: corregir el bug de `es_admin` en `/me`.
- S6: matricula duplicada: "deberia actuar igual como si la persona ya estuviese registrada" -> 409 `DUPLICATE_MATRICULA`.
- S7: persona existente: "creo que si ya tiene cuenta minimo deberia saber lo referido a ella" -> en solicitud, si el DNI ya existe se exige la contraseña de una cuenta aprobada suya; no se pisan sus datos.
- S8: estado en `persona_rol.estado` (`pendiente`/`aprobado`); cliente "nace aprobado"; profesional nace `pendiente`; `profesional.estado_validacion` se migra ahi. Login con cuenta pendiente (password correcta) -> 403 `ACCOUNT_PENDING`; `/me` solo aprobadas.
- S9: busqueda, perfil publico y reserva de turnos solo con profesionales aprobados ("si hacelo, es muy util").
- S10: rechazo: "rechazo como vos recomendas" -> se borra la cuenta del rol (cascada a `profesional`); si la persona no tiene otro rol, se borra tambien `persona`.
- S11: invitacion de admin lleva DNI + correo; "me parece bien que lleve dni fijo" (el invitado no edita DNI ni correo). Persona existente: solo elige contraseña. Persona nueva: completa datos. Ya admin -> error. Reinvitar al mismo DNI revoca la anterior. La cuenta admin nace `aprobado`.
- S12: rate limit: "si lo ves, entonces hacelo" -> el limiter de registro existente aplicado a los endpoints nuevos (consumo/validacion de token). Sin limiter nuevo.
- S13: migracion: "estaria bueno que dejes un readme por ahi para luego saber la intencion y como debe hacerse a nivel general" -> `backend/src/scripts/migrations/README.md`; actualizar `schema.sql` y `drop.sql`.
- S14: panel admin: "tenga su side bar, y la aprobacion se vea en una de esas secciones y la invitacion en otra, deja un inicio (el dashboard de profesional) vacio, tambien la seccion de configuracion... cerrar sesion y cambiar de tema tambien". UI de registro de admin separada de la de profesional; login parametrizado por rol (`/admin-login`). Tras registrarse profesional: sin auto-login, "solicitud enviada".
- S15: primer admin: script `pnpm admin:invite <dni> <correo>` que imprime el link por consola.
- S16: "Nada de tests."
- S17: "hacelo una variable de entorno entonces (y cambialo en los otros que mencionaste antes)" -> la key de Resend sale de `RESEND_API_KEY` en `.env` (y `.env.example`) para todos los mails. Reset password: "tema reset pass dejalo".
- S18: CLAUDE.md se actualiza al final ("la update del claude.md pero despues"). Mails "se esta analizando tus datos" / "se confirmo la creacion de tu cuenta": opcionales, al final.

## Tasks

- [x] T1 (S8, S13) Migracion + schema: `persona_rol.estado`, tabla `invitacion`, `schema.sql`, `drop.sql`, migracion numerada, README. Route: inline. Commit: 80e05db (verificado: migracion sobre schema viejo con datos y schema nuevo desde cero, en MySQL descartable puerto 33061)
- [x] T2 (S3, S4, S5, S6, S7, S8) `AccountService` unificado y transaccional + schema por rol + `es_admin`. Route: inline. Commit: 96ab05d (verificado: 14 casos HTTP y DB en MySQL descartable, incluida carrera por matricula y rollback)
- [x] T3 (S8, S9) Login/sesion con estado; filtro de aprobados en busqueda, perfil y turnos. Route: inline. Commit: a8eded8 (verificado por HTTP: login pendiente 403 solo con password correcta, /me null, listado/perfil/slots/turno excluyen pendientes, aprobados intactos)
- [x] T4 (S1, S10) Solicitudes: listar, aprobar, rechazar (admin). Route: inline. Commit: 7e54da7 (verificado por HTTP: 401/403 sin permisos, aprobar, rechazar borra cuenta y persona huerfana, conserva persona con otro rol, 404 si ya resuelta, 400 validaciones, DNI y matricula liberados tras rechazo)
- [x] T5 (S2, S11, S12, S15, S17) Invitaciones: crear/listar/revocar/validar/registro; mail; script primer admin; Resend por env. Route: inline. Commit: 7c4e269 (verificado por HTTP/DB en MySQL descartable con Resend falso: un solo uso, carrera de 2 aceptaciones, vencimiento, revocar/reinvitar, persona existente sin pisar datos, token solo como hash, falla de mail -> 502 y token revocado, rollback no quema el token, script admin:invite)
- [x] T6 (S3, S14) Frontend registro: `RegisterForm` compartido, profesional "solicitud enviada", registro admin por invitacion, login por rol. Route: inline. Commit: 8d93eeb (verificado en Chrome headless real contra backend descartable: validaciones, solicitud enviada sin auto-login, login pendiente, cliente con auto-login, DNI existente pide contraseña con error inline, invitacion token falso/usado/persona nueva/persona existente, /admin-login; lint de archivos propios y build OK)
- [x] T7 (S14) Frontend admin: layout con sidebar (Inicio, Solicitudes, Invitaciones, Configuracion), logout, tema. Route: inline. Commit: 72d2f6b (verificado en Chrome headless real: redireccion a /admin-login sin sesion, cliente bloqueado en /admin, aprobar/rechazar con modal, invitar/revocar/reenviar, error de admin existente, tema claro/oscuro, logout; el smoke detecto y corregimos un bug dni.trim)
- [x] T8 (S18) Mails opcionales + CLAUDE.md. Route: inline. Commit: PENDING_T8 (mails verificados contra Resend falso: recibida/aprobada/rechazada, cliente no dispara mail, HTML escapado, Resend caido no rompe registro ni aprobacion; CLAUDE.md actualizado localmente pero esta en .gitignore, no se commitea)

## Log

- L1: "tengo que pensar en la reestructuracion de la seccion de registro para profesionales y aniadir el registro para el role admin... la idea es aplicar estas ideas 'para que un profesional o un admin pueda registrarse envio de invitacion a roles profesional y admin
romper el token pasadas 24 horas o que una vez usado se rompa
la idea es que la logica se comparta no se repita en codigo', mas alla de eso, me gustaria que analices lo que tenemos, y si podes plantear algo mas que veas necesario, la idea es centrarnos en resolver esto por el momento, decime que tenemos, lo planificamos, acordamos y le mandamos."
- L2: "el profesional, solicite registro y luego se vera si el admin lo acepta o no, lo mismo para otro admin, nada de token... " (luego reemplazado por L3 para admin)
- L3: "que opinas de hacer invitacion para admins y solicitud + aprobacion para profesionales?" ... "(recien leo 2.admin y coincidimos! me parece bien eso)"
- L4: "ok a todo lo anterior" ... "Nada de tests." ... "rechazo como vos recomendas, lo de la persona existente si lo veo logico".
- L5: "Solicitud de profesional, ok. Invitacion de admin, ok. ... rate limit, si lo ves, entonces hacelo. ... hacelo una variable de entorno entonces (y cambialo en los otros que mencionaste antes) ... Plan final, ok. Y si, me parece bien que lleve dni fijo. Creo que ya estariamos listos para comenzar"
