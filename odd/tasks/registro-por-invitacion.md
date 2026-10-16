# registro-por-invitacion

Branch `feat/registro-por-invitacion` (off `feat/ap-register`). Both `profesional` and
`admin` accounts are created only from an admin invitation, each on its own page.
The approval state (`persona_rol.estado`) and the whole solicitudes module disappear.

## Specs

S1. A `profesional` account can only be created from an invitation. The public
    self-registration page and endpoint path for profesional are gone.
S2. An `admin` account can only be created from an invitation (unchanged behaviour).
S3. A `cliente` still self-registers: `POST /api/auth/registro` keeps working and now
    accepts only `role: "cliente"` (any other role is rejected).
S4. An invitation carries its role. `POST /api/invitaciones` takes `{ dni, correo, role }`
    with `role` in `profesional | admin`; `invitacion.id_rol` already exists in the schema.
S5. The invited professional types the `numero_matricula` in the registration form, not
    the admin at invitation time. A duplicate matricula is rejected with
    `409 DUPLICATE_MATRICULA` when the invitation is accepted.
S6. `persona_rol.estado` is removed from `schema.sql` and `seed.sql`. No migration file is
    added: existing data is throwaway and the user runs `pnpm db:reset`. Migration `001`
    stays as committed history; `backend/src/scripts/migrations/README.md` gains a note
    saying `estado` was removed afterwards and such a DB should be reset.
S7. No account is ever `pendiente`: login never returns `403 ACCOUNT_PENDING`, and
    `AccountService` has no `estadoInicial`.
S8. The solicitudes module is deleted: `GET /api/solicitudes`,
    `PATCH /api/solicitudes/:dni/:role`, its route/controller/service/model/schema files,
    the admin page, its sidebar link and its frontend hooks.
S9. The three `pr.estado = 'aprobado'` filters in `profesionales.model.js` are removed; the
    public professional queries keep filtering `pr.eliminado_en IS NULL`.
S10. The solicitud emails (recibida / aprobada / rechazada) are removed. The invitation
    email text names the role the person was invited to.
S11. `pnpm admin:invite <dni> <correo> [role]` issues an invitation for either role,
     defaulting to `admin`. It stays the bootstrap path when no admin exists.
S12. Two separate registration pages: `/registro/profesional/:token` and
     `/registro/admin/:token`, sharing one form component. A token whose role does not
     match the page is rejected. The old `/registro/invitacion/:token` route is gone.
S13. `/professional-signup` and `/solicitud-enviada` are deleted, with every link that
     points at them.
S14. The admin invitation form has a role selector and the invitations table shows the
     role of each invitation.
S15. `CLAUDE.md` and the `.http` files describe the new routes.

## Tasks

| ID | Specs | Route | Commit |
|----|-------|-------|--------|
| T1 | S6 | inline | |
| T2 | S4, S5, S11 | inline | |
| T3 | S1, S3, S7, S8, S9, S10 | inline | |
| T4 | S8, S14 | inline | |
| T5 | S12, S13 | inline | |
| T6 | S15 + manual verification | inline | |

## Log

L1. User request (verbatim): "Al final decidimos con mi amigo en que tanto profesionales
    como admins se van a registrar por invitacion, igualmente por paginas separadas, eso
    implica que tambien deberias eliminar el estado de validacion, podrias crear el plan
    para llevar a cabo esto?"
L2. Decision (user, questionnaire): the professional types the matricula at registration
    time; the invitation carries only dni + correo + role.
L3. Decision (user, questionnaire): pending accounts are deleted rather than approved.
    Superseded by L5: there is no migration, the DB is reset instead.
L4. Decision (user): "Eliminar pero el registro debe estar en el link" — the public
    professional signup pages are removed; registration happens through the invitation link.
L5. User correction (verbatim): "No hace falta que hagas una migracion, los datos que
    tenemos son solo de prueba. Con pnpm db:reset luego dejo todo en cero, excepto si te
    haces referencia a pasar los datos que estan en otras tablas". No data moves between
    tables: `estado` was a standalone column. T1 edits `schema.sql`/`seed.sql` only.
L6. Context: the `invitacion` table already has an `id_rol` column, written as `admin` by
    the current code, so S4 needs no schema change.
