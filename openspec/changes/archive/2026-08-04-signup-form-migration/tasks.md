# Tasks: signup-form-migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~410 total (backend: ~1 line; frontend: ~190 removed / ~220 added, full-file rewrite of `SignUp.jsx`) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend `registerSchema` strictness) → PR 2 (frontend `SignUp.jsx` `@mantine/form` rewrite) |
| Delivery strategy | auto-chain (config `chainedPrStrategy: force-chained`) |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

Rationale: `openspec/config.yaml` sets `chainedPrStrategy: force-chained` and `reviewBudgetLines: 400`. The backend change is a true one-liner and is fully independent (see proposal's Rollback section), so it is split into its own small, trivially-reviewable PR. The frontend change is a near-total rewrite of `frontend/src/pages/SignUp.jsx` (~190 current lines, replaced end-to-end per `design.md` section 1); estimated diff size sits close to the 400-line budget, so it stays as its own chained PR rather than being merged with the backend change, and is not further subdivided since the file's field/validation/handler/JSX pieces are too interdependent (single `useForm` instance, single `handleSubmit`) to split into independently-mergable partial states without leaving the component in a broken intermediate form.

---

## PR 1 — Backend: `registerSchema` strictness (`backend/src/schemas/auth.schema.js`)

- [x] Start: open `backend/src/schemas/auth.schema.js`; confirm current `registerSchema` definition (`z.object({...}).refine(...)`) matches `design.md` section 2 baseline (field list: `dni`, `nombre`, `apellido`, `correo`, `genero`, `fecha_nacimiento`, `password`, `confirm`, `id_obra_social`). <!-- sdd-owner: implementation -->
- [x] Change `registerSchema`'s top-level `z.object({...})` to `z.strictObject({...})`, keeping every field validator, the field order, and the trailing `.refine((data) => data.password === data.confirm, {...})` exactly unchanged (no other schema in the file — `loginSchema`, `registerProfesionalSchema` — is touched). <!-- sdd-owner: implementation -->
- [x] Manually verify (no backend test suite is configured — `backend/package.json`'s `test` script is a stub that exits with an error, confirmed via inspection): start the backend (`pnpm dev:back` or equivalent) and exercise the register endpoint that uses `registerSchema` with (a) a valid payload containing exactly the documented fields — expect success, matching pre-change behavior; (b) the same valid payload plus one extra unexpected field (e.g. `role`) — expect a validation rejection (400-class error), confirming `z.strictObject` now rejects unknown keys where `z.object` previously silently ignored them; (c) a valid payload with mismatched `password`/`confirm` — expect the existing `.refine(...)` rejection to still fire unchanged. <!-- sdd-owner: implementation -->
- [x] Finish/rollback boundary: this PR is a single-line, single-file change with no shared state with PR 2 — it can be merged, deployed, and independently reverted (`z.strictObject` → `z.object`) without affecting or being affected by the frontend rewrite in PR 2, per the proposal's Rollback section. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review for PR 1 (backend schema change). <!-- sdd-owner: parent -->

---

## PR 2 — Frontend: `SignUp.jsx` migration to `@mantine/form` (`frontend/src/pages/SignUp.jsx`)

Depends on: PR 1 merged (or confirmed independently deployable — the migrated form only ever sends the documented field set, so it is compatible with `registerSchema` either strict or not, but PR 1 should land first per the stacked chain order).

### Setup / structural scaffolding

- [x] Start: read current `frontend/src/pages/SignUp.jsx` in full and cross-reference `frontend/src/pages/ProfessionalSignUp.jsx` as the structural template, per `design.md` section 1 (field mapping table in 1.1, `id_obra_social` wiring in 1.2, error display in 1.3, submit flow in 1.4, comment cleanup in 1.5). <!-- sdd-owner: implementation -->
- [x] Add imports needed for the rewrite: `useForm`, `matchesField` from `@mantine/form`; remove the now-unused `useState` import if no non-form `useState` remains other than `accConfirm` (keep `useState` import for `accConfirm`, which stays local per design 1.1's mapping table). <!-- sdd-owner: implementation -->
- [x] Replace the 9 per-field `useState` declarations (`dni`, `name`, `lastName`, `fecha`, `genero`, `obraSocial`, `password`, `confirmPassword`, `email`) and the derived booleans (`contrasenasNoCoinciden`, `emailInvalido`) with a single `useForm({ mode: 'uncontrolled', initialValues, validate })` instance, using exactly the shape specified in `design.md` section 1.1 (field names `dni`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `id_obra_social`, `correo`, `password`, `confirm`; `id_obra_social: null` added to `initialValues` with no corresponding `validate` entry). <!-- sdd-owner: implementation -->
- [x] Keep `accConfirm` as a standalone `useState(false)` (transient UI-only success flag, not form data, per design 1.1's mapping table) — do not fold it into `useForm`. <!-- sdd-owner: implementation -->

### Field wiring (RED→GREEN via manual verification, no automated test suite present)

- [x] Wire the `dni` `TextInput` to `key={form.key('dni')}` + `{...form.getInputProps('dni')}`, combining the declarative validation error with the existing `DUPLICATE_DNI` server-error display per `design.md` section 1.3 (`error={form.errors.dni || (errorAcc?.code === 'DUPLICATE_DNI' ? 'DNI ya registrado' : null)}`). <!-- sdd-owner: implementation -->
- [x] Wire `nombre` and `apellido` `TextInput`s to `form.key`/`form.getInputProps`, removing the Spanish comment above them (`// Le quité los style={{flex: 1}}...`) per `design.md` section 1.5, item 2 (remove, do not translate). <!-- sdd-owner: implementation -->
- [x] Wire `fecha_nacimiento` directly via `key={form.key('fecha_nacimiento')}` + `{...form.getInputProps('fecha_nacimiento')}` on `DatePickerInput`, with no manual `Date` construction or `.toISOString()`/`dayjs(...).format(...)` step anywhere in the component; remove the `// Forma más corta y limpia` comment (design 1.5, item 3) since its subject (`onChange={setFecha}`) no longer exists. <!-- sdd-owner: implementation -->
- [x] Wire `genero` `Select` (kept as the existing `opcionesDeGenero` array, unchanged) via `key={form.key('genero')}` + `{...form.getInputProps('genero')}`, dropping the manual `value`/`onChange` props. <!-- sdd-owner: implementation -->
- [x] Wire `id_obra_social` `Select` per `design.md` section 1.2: keep `opcionesMantine`/`isLoadingObraSociales` derived from `useObrasSociales()` exactly as today (outside the form), keep the `Loader` in `rightSection` and `disabled={isLoadingObraSociales}` behavior, add `key={form.key('id_obra_social')}` + `{...form.getInputProps('id_obra_social')}`, and add no `validate` rule for this key (optional field, matches current behavior). <!-- sdd-owner: implementation -->
- [x] Wire `correo` `TextInput` via `key={form.key('correo')}` + `{...form.getInputProps('correo')}`, with **only** `form.errors.correo` as the error source (no `DUPLICATE_EMAIL` field-level branch), per `design.md` section 1.3's "preserve current mixed presentation" requirement. <!-- sdd-owner: implementation -->
- [x] Wire `password` and `confirm` `PasswordInput`s via `form.key`/`form.getInputProps`; remove the manual `contrasenasNoCoinciden`-driven `error` prop on `confirm` (now sourced from `form.errors.confirm` via the `matchesField('password', ...)` rule already defined in `useForm`). <!-- sdd-owner: implementation -->
- [x] Manually verify each field's wiring in the browser (no automated frontend test suite is configured — `frontend/package.json` has no `test` script, confirmed via inspection): fill each field individually and confirm the corresponding validation error text (matching the exact copy in `design.md` section 1.1) appears/clears as expected, including the DNI 7–8 digit check, empty `nombre`/`apellido`, missing `fecha_nacimiento`, missing `genero`, malformed `correo`, short `password`, and mismatched `confirm`. <!-- sdd-owner: implementation -->

### Submit flow and handler

- [x] Rename `getGeneroFormateado` from a no-arg closure to a function taking `genero` as a parameter (`getGeneroFormateado(values.genero)`), matching `ProfessionalSignUp.jsx`'s signature, per `design.md` section 1.4. <!-- sdd-owner: implementation -->
- [x] Replace `confirmarAcc` with `handleSubmit(values)` exactly as specified in `design.md` section 1.4: build the `mutate(...)` payload from `values.*` (field names matching `registerSchema`: `dni`, `nombre`, `apellido`, `correo`, `password`, `confirm`, `fecha_nacimiento`, `genero`, `id_obra_social`), applying `getGeneroFormateado(values.genero)` and `values.id_obra_social ? Number(values.id_obra_social) : null`, with `fecha_nacimiento` taken directly from `values.fecha_nacimiento` (no reformatting). Preserve the existing `onSuccess` chain unchanged: `setAccConfirm(true)` → `mutateLogin({ dni, password, role: 'cliente' })` → on its `onSuccess`, `setTimeout(() => navigate("/"), 1000)`. Do not adopt `useAuth().login()` or a `/dashboard` redirect. <!-- sdd-owner: implementation -->
- [x] Wrap the form JSX in `<form onSubmit={form.onSubmit(handleSubmit)} noValidate>` (replacing the bare `<Button onClick={confirmarAcc}>` trigger), matching `ProfessionalSignUp.jsx`'s top-level submit wiring. <!-- sdd-owner: implementation -->
- [x] Update the submit button: remove the hand-maintained `disabled={contrasenasNoCoinciden || emailInvalido || !dni || ...}` expression entirely, set `type="submit"`, and keep `loading={isPending || isLoginIn}` (remove or translate the trailing Spanish comment per `design.md` section 1.5, item 4 — removal is sufficient). Set `type="button"` explicitly on the other two buttons ("Volver al inicio", "Ya tengo una cuenta") so only the submit button triggers `form.onSubmit`. <!-- sdd-owner: implementation -->
- [x] Remove the remaining Spanish inline comment (`// Cuidado, estaba en null. Mejor "" para textos.`) per `design.md` section 1.5, item 1 — moot once `initialValues.correo` is a static `''` literal. Confirm no Spanish-language comments remain anywhere in the rewritten file. <!-- sdd-owner: implementation -->
- [x] Manually verify the full submit flow end-to-end in the browser (no automated frontend test suite configured): (a) attempt submit with `fecha_nacimiento` empty and all other required fields filled — confirm `handleSubmit`/the registration mutation is NOT called (e.g. via network tab) and a validation error appears on `fecha_nacimiento`; (b) repeat with `genero` empty — same expectation; (c) fill the form fully and correctly, submit, and confirm the registration request payload contains exactly the 9 documented keys with the expected field names/types (`id_obra_social` as `number | null`, `fecha_nacimiento` unmangled); (d) on success, confirm the success alert (`accConfirm`) appears, an auto-login request fires via `useLoginSession`, and after ~1s the browser navigates to `/` (not `/dashboard`). <!-- sdd-owner: implementation -->
- [x] Manually verify preserved error UX (no automated frontend test suite configured): simulate/trigger a `DUPLICATE_DNI` server response and confirm it still surfaces as a field-level error on `dni` (not the generic `Alert`); simulate/trigger a `DUPLICATE_EMAIL` server response and confirm it still surfaces only via the generic bottom `Alert` block (unchanged ternary logic), not as a field-level error on `correo`. <!-- sdd-owner: implementation -->
- [x] Manually verify loading-state UX (no automated frontend test suite configured): confirm the submit button shows a loading state while `isPending || isLoginIn` is true, matching pre-migration behavior. <!-- sdd-owner: implementation -->
- [x] Run `pnpm --filter frontend lint` (the project's only configured frontend verification command) against the rewritten file and resolve any lint errors introduced by the rewrite. <!-- sdd-owner: implementation -->

### Refactor / cleanup

- [x] Re-read the full rewritten `SignUp.jsx` against `design.md` section 1 end-to-end and confirm: no per-field `useState` for form data remains, no manual `Date`/`.toISOString()` step exists between the date picker and submission, no hand-maintained disabled-boolean expression remains, and the field list/required-optional status matches the spec's field inventory table exactly (`spec.md`, "Field inventory and required/optional status"). <!-- sdd-owner: implementation -->
- [x] Finish/rollback boundary: confirm this PR touches only `frontend/src/pages/SignUp.jsx` (no changes to `ProfessionalSignUp.jsx` or any hook signature), so it can be reverted independently via a single-file git revert per the proposal's Rollback section, without needing to also revert PR 1. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review for PR 2 (frontend `SignUp.jsx` rewrite). <!-- sdd-owner: parent -->
