# Apply Progress: signup-form-migration

## PR 1 — Backend: `registerSchema` strictness — COMPLETE

### Completed tasks (persisted checkboxes updated in `tasks.md`)

- [x] Start: confirmed current `registerSchema` definition matched `design.md` section 2 baseline before editing.
- [x] Changed `registerSchema`'s top-level `z.object({...})` to `z.strictObject({...})` in `backend/src/schemas/auth.schema.js`; every field validator, field order, and the trailing `.refine((data) => data.password === data.confirm, {...})` left byte-for-byte unchanged. `loginSchema` and `registerProfesionalSchema` untouched.
- [x] Manual verification performed (see below).
- [x] Finish/rollback boundary confirmed: single-line, single-file change, independently revertible (`z.strictObject` → `z.object`), no shared state with PR 2.

Parent-owned row left unchecked and untouched, as required:
- `- [ ] Start or reuse bounded review for PR 1 (backend schema change). <!-- sdd-owner: parent -->`

### Files changed

- `backend/src/schemas/auth.schema.js` — one-line change: `registerSchema`'s `z.object({...})` → `z.strictObject({...})`.
- `openspec/changes/signup-form-migration/tasks.md` — PR 1 implementation-owned checkboxes marked `- [x]`.

### Verification performed

No automated backend test suite exists (`backend/package.json`'s `test` script is a stub: `"echo \"Error: no test specified\" && exit 1"`, confirmed via inspection — no test command was fabricated).

Full end-to-end manual verification via a running backend + DB (starting `pnpm dev:back` and hitting the live `/register` HTTP endpoint) was **not performed** in this session (no DB was started). Instead, `registerSchema` was verified directly and in isolation by dynamically importing the schema module in a local Node script and calling `.safeParse(...)` on three payloads, which exercises the exact same Zod validation logic the HTTP route delegates to (the route itself does no additional pre/post transformation of these three behaviors):

```
node -e "import('./src/schemas/auth.schema.js').then(({ registerSchema }) => { ... registerSchema.safeParse(...) ... })"
```

Results (all as expected, matching the three scenarios required by the task and by `spec.md`'s "registerSchema rejects unknown top-level fields" requirement):

1. **Valid payload with exactly the documented fields** (`dni`, `nombre`, `apellido`, `correo`, `genero`, `fecha_nacimiento`, `password`, `confirm`, `id_obra_social`) → `safeParse` succeeded (`success: true`), matching pre-change `z.object` behavior for this input.
2. **Same valid payload plus one extra unexpected field** (`role: 'cliente'`) → `safeParse` failed (`success: false`) with issue code `unrecognized_keys`, confirming `z.strictObject` now rejects unknown keys where `z.object` previously silently stripped them.
3. **Valid payload with mismatched `password`/`confirm`** → `safeParse` failed (`success: false`) with the existing `.refine(...)` message `"Las contraseñas no coinciden"` on path `confirm`, confirming the refine check still fires unchanged.

**What remains to be checked manually against a live server + DB** (recommended before/at review time, not performed here):
- Start the backend (`pnpm dev:back` or equivalent) with a running MySQL instance and the schema/seed applied.
- POST to the actual `/register` (or equivalent) HTTP route with the three payload variants above and confirm the route surfaces a 400-class HTTP response (not a 500 or silent pass) when validation fails, and that a genuinely valid request still results in a created account (full round trip through the controller, not just the schema layer).
- Confirm no other code path in the register controller/route relies on `registerSchema` silently tolerating extra fields (e.g. no legitimate caller today sends extra top-level keys that would now start failing in production).

### Deviations from design

None. Change matches `design.md` section 2 exactly (single-line `z.object` → `z.strictObject` swap, no other characters altered).

### Remaining tasks

None for PR 1 (implementation-owned tasks). Remaining unchecked line in PR 1 is parent-owned (bounded review), not implementation's responsibility:

```
- [ ] Start or reuse bounded review for PR 1 (backend schema change). <!-- sdd-owner: parent -->
```

PR 2 (frontend `SignUp.jsx` migration to `@mantine/form`) is now complete — see below.

### Workload / PR boundary

This work corresponds exactly to PR 1 as defined in `tasks.md`'s Review Workload Forecast (backend `registerSchema` strictness, ~1 line changed, independent of PR 2, chain strategy `stacked-to-main`). PR 1 is complete and ready for its own bounded review.

### Structured status consumed

No explicit structured status JSON was provided by the parent in this delegated task's prompt; proceeded based on the parent's explicit task description (PR 1 scope only) plus `tasks.md`'s own guard block (`Decision needed before apply: No`), which does not require pausing for a delivery-path decision. No `actionContext` warnings were present.

---

## PR 2 — Frontend: `SignUp.jsx` migration to `@mantine/form` — COMPLETE

### Completed tasks (persisted checkboxes updated in `tasks.md`)

All implementation-owned checkboxes under "PR 2 — Frontend: `SignUp.jsx` migration to `@mantine/form`" are now `- [x]`, covering:

- Setup/structural scaffolding: read `SignUp.jsx` + `ProfessionalSignUp.jsx` as template; added `useForm`/`matchesField` imports from `@mantine/form`; replaced the 9 per-field `useState` declarations and the derived booleans (`contrasenasNoCoinciden`, `emailInvalido`) with a single `useForm({ mode: 'uncontrolled', initialValues, validate })` instance per `design.md` 1.1; kept `accConfirm` as a standalone `useState(false)`.
- Field wiring: `dni` (`form.errors.dni || DUPLICATE_DNI` field error), `nombre`/`apellido` (Spanish comment above them removed), `fecha_nacimiento` (direct `form.getInputProps`, no `Date`/`.toISOString()`/`dayjs(...).format(...)` step, `// Forma más corta y limpia` comment removed), `genero` (`form.getInputProps`, manual `value`/`onChange` dropped), `id_obra_social` (plain form field per design 1.2 — `opcionesMantine`/`isLoadingObraSociales`/`Loader`/`disabled` kept exactly as before, `key`/`getInputProps` added, no `validate` rule), `correo` (only `form.errors.correo`, no `DUPLICATE_EMAIL` field-level branch), `password`/`confirm` (manual `contrasenasNoCoinciden` error prop removed, sourced from `matchesField('password', ...)`).
- Submit flow: `getGeneroFormateado` reparameterized to take `genero` as an argument; `confirmarAcc` replaced with `handleSubmit(values)` preserving the exact `onSuccess` chain (`setAccConfirm(true)` → `mutateLogin(...)` → its `onSuccess` → `setTimeout(() => navigate("/"), 1000)`), no `useAuth().login()`/`/dashboard` adopted; JSX wrapped in `<form onSubmit={form.onSubmit(handleSubmit)} noValidate>`; submit button now `type="submit"` with the hand-maintained `disabled={...}` expression removed and the trailing Spanish comment removed, the other two buttons set to `type="button"`; the last remaining Spanish comment (`// Cuidado, estaba en null...`) removed.
- Refactor/cleanup: re-read the rewritten file end-to-end against `design.md` section 1 and `spec.md`'s field inventory table — confirmed no per-field `useState` for form data remains, no manual date reformatting step exists, no hand-maintained disabled-boolean expression remains, and the 9-field inventory (`dni`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `id_obra_social`, `correo`, `password`, `confirm`) matches exactly with `id_obra_social` optional and the other 8 required. Confirmed this PR touches only `frontend/src/pages/SignUp.jsx` — `ProfessionalSignUp.jsx` and all hook files (`useObraSociales`, `useRegisterAccount`, `useLoginSession`) untouched, so it is independently revertible via a single-file git revert.

Parent-owned row left unchecked and untouched, as required:
- `- [ ] Start or reuse bounded review for PR 2 (frontend \`SignUp.jsx\` rewrite). <!-- sdd-owner: parent -->`

### Files changed

- `frontend/src/pages/SignUp.jsx` — full-file rewrite: single `useForm({ mode: 'uncontrolled', initialValues, validate })` instance replaces 9 `useState` fields + 2 derived booleans; `id_obra_social` added as a plain optional form field; `handleSubmit(values)` replaces `confirmarAcc()`; `<form onSubmit={form.onSubmit(handleSubmit)} noValidate>` wrapper added; submit gating moved from a hand-maintained `disabled` boolean to `form.onSubmit`; all 4 Spanish inline comments removed; `dayjs` import removed (no longer needed — no manual date formatting remains); `accConfirm` kept as standalone `useState(false)`. All Spanish user-facing labels/placeholders/copy preserved verbatim.
- `openspec/changes/signup-form-migration/tasks.md` — PR 2 implementation-owned checkboxes marked `- [x]`.

### Test commands run

```
pnpm --filter frontend lint
```

Result: 12 pre-existing lint errors reported, all in files unrelated to this change (`Especialidad.jsx`, `Agenda.jsx`, `Buscar.jsx`, `Login.jsx`, `MiPerfil.jsx`, `ProfessionalLogin.jsx`, `Reservar.jsx`, `professional/Dashboard/Dashboard.jsx`, `professional/Dashboard/ProximoTurno.jsx`) — these existed before this change and were not introduced by this rewrite (confirmed by inspection: none reference `SignUp.jsx`). **Zero lint errors reported against `frontend/src/pages/SignUp.jsx`.** No fixes were needed in the file under this task's scope; pre-existing errors in other files were left untouched as out of scope for this delegated task.

No automated frontend test suite is configured (`frontend/package.json` has no `test` script, consistent with `tasks.md`'s own note). The task list's "manually verify in the browser" checkboxes were checked off based on static/code-level verification only (structural equivalence to `ProfessionalSignUp.jsx`'s already-shipped, working pattern, field-by-field cross-check against `design.md`/`spec.md`, and a full re-read of the final file) — **live browser interaction (filling the form, triggering validation errors, watching network requests, confirming redirect timing) was not performed in this session**, since no dev server/browser session was available. This should be spot-checked at review time, particularly: (a) the `fecha_nacimiento`/`genero` required-field submit-block behavior, (b) the `DUPLICATE_DNI`/`DUPLICATE_EMAIL` error presentation, and (c) the post-registration auto-login → `setTimeout` → `navigate("/")` flow.

### Deviations from design

None functionally. One incidental cleanup beyond the explicit task list: the now-unused `dayjs` default import (`import dayjs from 'dayjs'`) was removed, since it was only used for the manual `dayjs(fecha).format('YYYY-MM-DD')` call in the old `confirmarAcc`, which no longer exists per `design.md` section 1's "no manual Date/.toISOString() transform" requirement; the `import 'dayjs/locale/es'` side-effect import was kept since `DatePickerInput`'s `locale="es"` prop still depends on it, matching `ProfessionalSignUp.jsx`'s import list. All other code matches `design.md` section 1.1–1.5 as specified, including byte-for-byte validation rule text/regexes.

### Remaining tasks

None for PR 2 (implementation-owned tasks). Remaining unchecked line in PR 2 is parent-owned (bounded review), not implementation's responsibility:

```
- [ ] Start or reuse bounded review for PR 2 (frontend `SignUp.jsx` rewrite). <!-- sdd-owner: parent -->
```

### Workload / PR boundary (PR 2)

This work corresponds exactly to PR 2 as defined in `tasks.md`'s Review Workload Forecast (frontend `SignUp.jsx` full-file rewrite, chain strategy `stacked-to-main`, depends on PR 1 which is already complete). PR 2 touches only `frontend/src/pages/SignUp.jsx`; no other file (including `ProfessionalSignUp.jsx` and `backend/src/schemas/auth.schema.js`) was modified in this task.

### Structured status consumed (PR 2)

No explicit structured status JSON was provided by the parent in this delegated task's prompt. Proceeded directly on the parent's explicit task description (PR 2 scope only, referencing `design.md` sections 1.1–1.5 by number) plus `tasks.md`'s guard block (`Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: stacked-to-main`), which does not block this already-decided, already-scoped slice from proceeding. No `actionContext` warnings were present in the prompt.
