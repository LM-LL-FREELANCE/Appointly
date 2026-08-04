# Proposal: signup-form-migration

## Intent

Migrate the client self-registration form (`frontend/src/pages/SignUp.jsx`) from raw `useState`-per-field local state to the `@mantine/form` pattern (`useForm` + declarative `validate` rules + `form.getInputProps`) already proven in production on the sibling page `frontend/src/pages/ProfessionalSignUp.jsx`. In parallel, harden the corresponding backend contract by switching `registerSchema` in `backend/src/schemas/auth.schema.js` from `z.object(...)` to `z.strictObject(...)`, so the API rejects unexpected extra fields at the boundary, consistent with `loginSchema`.

This is a maintenance/consistency change, not a new feature. `SignUp.jsx` has already required two reactive point-fixes under the current architecture:
1. A `Date` / `.toISOString()` mismatch against Mantine v9's `DatePickerInput` (the field state and the picker's expected value shape drifted).
2. A missing disabled-button guard for `fecha`/`genero`, allowing submission attempts with incomplete required fields.

Both bug classes are structural to manually-synchronized `useState` form fields (value/validity kept in ad hoc parallel state, prone to drift) and do not occur on `ProfessionalSignUp.jsx`, which already centralizes value, validation, and error state in a single `useForm` instance. Migrating removes the underlying class of bug rather than patching further symptoms.

## Scope

### In scope
- `frontend/src/pages/SignUp.jsx`
  - Replace all per-field `useState` (`dni`, `name`/`nombre`, `lastName`/`apellido`, `fecha`, `genero`, `obraSocial`, `password`, `confirmPassword`, `email`) with a single `useForm({ mode: 'uncontrolled', initialValues, validate })` instance, mirroring `ProfessionalSignUp.jsx`'s structure and field-naming convention (`dni`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `correo`, `password`, `confirm`).
  - Add `id_obra_social` as an additional form field (optional, not present on `ProfessionalSignUp.jsx`), keeping the existing async-loaded `Select` sourced from `useObrasSociales()` and its loading state (`Loader` in `rightSection`, disabled while loading).
  - Reimplement validation declaratively via `validate` rules equivalent to current ad hoc checks:
    - `dni`: 7–8 digit regex (matches `ProfessionalSignUp.jsx` and backend `dniSchema`).
    - `nombre`, `apellido`: non-empty after trim.
    - `fecha_nacimiento`: required, non-null.
    - `genero`: required, non-null.
    - `correo`: existing email regex format check.
    - `password`: minimum length consistent with backend (`min(6)`).
    - `confirm`: `matchesField('password', ...)` (removes the manual `contrasenasNoCoinciden` boolean and the `Date`/ISO mismatch risk, since `DatePickerInput` will be wired directly via `form.getInputProps('fecha_nacimiento')` the same way `ProfessionalSignUp.jsx` does — no separate reformatting step).
    - `id_obra_social`: remains optional, no validation rule (matches current behavior).
  - Preserve the disabled-button gap fix: submit gating moves from a hand-maintained boolean expression to `form.onSubmit(handleSubmit)`, which will not fire while validation fails, closing the `fecha`/`genero` guard gap by construction instead of by patch.
  - Preserve existing UX/business behaviors 1:1:
    - Loading states (`isPending || isLoginIn` on the submit button).
    - Server-side error alerts for `DUPLICATE_DNI` and `DUPLICATE_EMAIL` (shown as field-level errors where `ProfessionalSignUp.jsx` does so — e.g. on `dni`/`correo` inputs — and/or the existing generic `Alert` block, matching the sibling page's approach).
    - Success confirmation alert and automatic login after successful registration, including existing timeout/redirect-to-`/` behavior (or aligned with `ProfessionalSignUp.jsx`'s `login()`-based auto-login flow if that is confirmed to be the current session mechanism for clients — see open question below).
    - The `genero` -> `M`/`F`/`X` mapping (`getGeneroFormateado`) stays as a plain function applied at submit time, same as `ProfessionalSignUp.jsx`.
  - Preserve the existing English-only code/comment convention (the current file has a few Spanish inline comments, e.g. `// Cuidado, estaba en null...`; these should be translated or removed during the rewrite, not carried over verbatim).
- `backend/src/schemas/auth.schema.js`
  - Change `registerSchema`'s top-level `z.object({...})` to `z.strictObject({...})`, keeping the existing field list, per-field validators, and the trailing `.refine(...)` password-match check unchanged. `z.strictObject(...).refine(...)` is a supported chain (same pattern already used with `z.object(...).refine(...)` in this file), so no other schema mechanics change.

### Out of scope
- `frontend/src/pages/ProfessionalSignUp.jsx` — already uses the target pattern, not touched.
- Any other page or component.
- Any other schema in `auth.schema.js` (`loginSchema` already strict; `registerProfesionalSchema` currently still uses `z.object`, not `z.strictObject` — bringing it in line is a natural follow-up but is explicitly **not** part of this change, to keep this proposal scoped to the client signup path only).
- Any new fields, new validation rules, or behavior changes beyond what exists today (e.g. no password-strength policy changes, no new obra social requirement).
- Client-side visual/design changes (spacing, copy, layout) beyond what naturally falls out of adopting `form.getInputProps` (e.g. error prop wiring).

## Affected areas

- **Frontend**: `frontend/src/pages/SignUp.jsx` (rewrite), indirectly exercises `frontend/src/hooks/useObraSociales.js`, `frontend/src/hooks/useRegisterAccount.js` (or equivalent), and the client login hook used for auto-login — none of these hooks are modified, only re-consumed with the same call signatures.
- **Backend**: `backend/src/schemas/auth.schema.js` (`registerSchema` only). This schema is used by the client registration route/controller for `POST` request body validation; any client (including the migrated `SignUp.jsx`) sending exactly the documented field set is unaffected. Any caller currently sending extra/unexpected fields in the registration payload will start receiving a validation error instead of having those fields silently ignored.
- **Tests**: any existing frontend tests targeting `SignUp.jsx`'s old `useState`-based structure (selectors, state assertions) will need to be updated to the `@mantine/form` pattern. Any backend tests asserting `registerSchema` tolerates extra fields will need to be updated to expect rejection.

## Risks

- **Behavioral drift during rewrite**: manually reimplementing validation as declarative rules could subtly change error message text, timing (blur vs change vs submit), or which fields show errors before submit — mitigate by validating field-by-field against `ProfessionalSignUp.jsx`'s already-shipped equivalents and by keeping message copy identical to current Spanish-language messages.
- **`id_obra_social` has no sibling reference**: since `ProfessionalSignUp.jsx` has no equivalent optional-select-with-async-data field, this part of the migration has no existing pattern to copy exactly — extra care needed to preserve current loading/disabled/placeholder behavior.
- **Auto-login flow difference**: `SignUp.jsx` currently uses `useLoginSession()` + `setTimeout` + `navigate("/")`; `ProfessionalSignUp.jsx` uses `useAuth().login()` + immediate `navigate('/dashboard')`. These may not be interchangeable (different auth hook, different redirect target for clients vs professionals). The migration should preserve `SignUp.jsx`'s existing auto-login mechanism and redirect target, not silently adopt `ProfessionalSignUp.jsx`'s, unless confirmed equivalent.
- **Backend strictness change is a breaking change for any non-compliant caller**: if any current or in-flight client code sends extra fields to the register endpoint (e.g. leftover fields, analytics metadata, a stray `role` field), `z.strictObject` will start rejecting those requests with a 400 instead of ignoring the extra data. Scope confirms the migrated `SignUp.jsx` will send exactly the documented fields, so this is expected to be a no-op in practice, but any other caller (Postman collections, e2e tests, future integrations) should be checked.

## Rollback

Both changes are isolated to two files with no shared migration state or data changes:
- Frontend: revert `frontend/src/pages/SignUp.jsx` to the prior `useState`-based implementation (git revert of the single commit/PR).
- Backend: revert `registerSchema` from `z.strictObject` back to `z.object` (single-line change).
Either can be reverted independently without affecting the other, since the migrated form only ever sends the documented field set and does not depend on the schema's strictness.

## Success criteria

- `SignUp.jsx` no longer contains per-field `useState` calls for form data; all form state is owned by a single `useForm` instance, matching `ProfessionalSignUp.jsx`'s structural pattern (`mode: 'uncontrolled'`, `initialValues`, `validate`, `form.getInputProps`, `form.onSubmit`).
- All previously supported fields (`dni`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `id_obra_social` optional, `correo`, `password`, `confirm`) remain present, required/optional as before, and submit the same payload shape to `useCreateAccount`/registration mutation as today.
- The two previously-patched bug classes cannot recur by construction:
  - No manual `Date`/`.toISOString()` conversion step exists between the date picker and validation/submission — `form.getInputProps('fecha_nacimiento')` owns the value directly.
  - The submit button is gated by `form.onSubmit`, which will not invoke `handleSubmit` while any required field (including `fecha_nacimiento`/`genero`) fails validation — no hand-maintained disabled-boolean expression to fall out of sync.
- Existing UX is preserved: loading indicators, `DUPLICATE_DNI`/`DUPLICATE_EMAIL` error surfacing, success alert, and auto-login-then-redirect behavior all function as they do today.
- All new/changed code and comments in `SignUp.jsx` are in English, consistent with the project's stated convention.
- `registerSchema` in `backend/src/schemas/auth.schema.js` uses `z.strictObject(...)`; a registration request body containing an unexpected extra top-level field is rejected by validation instead of silently passing through.
- No changes to `ProfessionalSignUp.jsx` or any schema other than `registerSchema`.

## Proposal question round

This proposal was scoped directly from a fully-specified user request (source file, target pattern, exact field list, and exact schema change were all given explicitly), so no blocking ambiguity was found. The following points are flagged for confirmation rather than left as silent assumptions, since getting them wrong would mean shipping a behavior change beyond "migrate the pattern":

1. **Auto-login mechanism after signup** — `SignUp.jsx` currently uses `useLoginSession()` with a `setTimeout` before `navigate("/")`, while `ProfessionalSignUp.jsx` uses `useAuth().login()` with an immediate `navigate('/dashboard')`. Should the migration keep `SignUp.jsx`'s existing hook/timing/redirect target exactly as-is (assumed: **yes**, this proposal treats it as out of scope to change), or is there a business reason (e.g. an in-flight `useAuth()` unification effort) to align it with the professional flow's mechanism as part of this change?
2. **Error display placement for `DUPLICATE_DNI`/`DUPLICATE_EMAIL`** — `ProfessionalSignUp.jsx` shows these as field-level errors on the `dni`/`correo` inputs directly (via the `error` prop combining `form.errors.x` with the server error code check), whereas current `SignUp.jsx` shows `DUPLICATE_DNI` as a field error but folds `DUPLICATE_EMAIL` into the generic bottom `Alert`. Should the migrated version standardize on the sibling page's per-field pattern for both, or preserve `SignUp.jsx`'s current mixed presentation exactly? (Assumed: **match the current `SignUp.jsx` presentation as closely as possible**, since visual/UX changes are explicitly out of scope.)
3. **`registerProfesionalSchema` strictness gap** — this proposal only changes `registerSchema`, but `registerProfesionalSchema` also currently uses `z.object` rather than `z.strictObject`, despite the task description characterizing it as already using the strict convention. Is a follow-up change desired to bring `registerProfesionalSchema` in line as well, or should it intentionally stay `z.object` for now? (Assumed: **out of scope for this change**, flagged as a discrepancy only.)

If no correction is provided, this proposal proceeds under the stated assumptions (preserve `SignUp.jsx`'s existing auto-login mechanism and error-display layout as-is; leave `registerProfesionalSchema` untouched).
