# Spec: signup-form-migration

## Purpose

Define the required post-migration behavior of the client self-registration form (`frontend/src/pages/SignUp.jsx`) after it is rewritten to use `@mantine/form` (mirroring `frontend/src/pages/ProfessionalSignUp.jsx`), and the corresponding hardening of `registerSchema` in `backend/src/schemas/auth.schema.js`. This is a structural/consistency migration: no new fields, no new business rules, no visual redesign — only elimination of the two bug classes caused by manually-synchronized `useState` form fields, and stricter backend payload validation.

## Requirements

### Requirement: Field inventory and required/optional status

The migrated `SignUp.jsx` form MUST expose exactly the following fields, with the required/optional status unchanged from the pre-migration form:

| Field | Required |
|---|---|
| `dni` | required |
| `nombre` | required |
| `apellido` | required |
| `fecha_nacimiento` | required |
| `genero` | required |
| `id_obra_social` | optional |
| `correo` | required |
| `password` | required |
| `confirm` | required |

No field MUST be added, removed, or have its required/optional status changed relative to the current shipped form.

#### Scenario: All required fields present and empty on initial render

- GIVEN a user navigates to the sign-up page for the first time
- WHEN the form mounts
- THEN `useForm` initial values include `dni`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `id_obra_social`, `correo`, `password`, and `confirm`, and no field is missing from `initialValues`

#### Scenario: id_obra_social remains optional

- GIVEN a user fills all required fields but leaves the obra social select unselected
- WHEN the user submits the form
- THEN validation MUST NOT block submission on account of `id_obra_social` being empty

### Requirement: Declarative per-field validation rules

The migrated form MUST implement validation via a single declarative `validate` object passed to `useForm`, equivalent in effect to the current ad hoc checks, using the same rule semantics already proven in `ProfessionalSignUp.jsx` where an equivalent field exists:

- `dni`: MUST match a 7–8 digit numeric pattern (consistent with `ProfessionalSignUp.jsx` and backend `dniSchema`).
- `nombre`: MUST be non-empty after trimming whitespace.
- `apellido`: MUST be non-empty after trimming whitespace.
- `fecha_nacimiento`: MUST be required (non-null/non-undefined); a missing value MUST produce a validation error.
- `genero`: MUST be required (non-null/non-undefined); a missing value MUST produce a validation error.
- `correo`: MUST match the existing email format regex used by the current implementation.
- `password`: MUST enforce a minimum length consistent with backend `min(6)`.
- `confirm`: MUST be validated against `password` using a match rule (e.g. `matchesField('password', ...)`), replacing the manual `contrasenasNoCoinciden` boolean.
- `id_obra_social`: MUST have no validation rule (remains optional, matching current behavior); the async-loaded `Select` sourced from `useObrasSociales()` MUST retain its loading indicator (`Loader` in `rightSection`) and disabled-while-loading state, since no sibling page provides a precedent for this field's async/optional pattern.

#### Scenario: Invalid DNI format is rejected before submit

- GIVEN a user enters a DNI with fewer than 7 digits
- WHEN the user attempts to submit the form
- THEN the `dni` field MUST show a validation error and the submit handler MUST NOT run

#### Scenario: Password/confirm mismatch is caught declaratively

- GIVEN a user enters different values in `password` and `confirm`
- WHEN the user attempts to submit the form
- THEN the `confirm` field MUST show a validation error sourced from the `matchesField('password', ...)` rule, and no separately-maintained boolean flag is used to compute this error

#### Scenario: Obra social select shows loading state while data loads

- GIVEN `useObrasSociales()` has not yet resolved
- WHEN the `id_obra_social` `Select` is rendered
- THEN it MUST display a `Loader` in its `rightSection` and MUST be disabled until the data resolves

### Requirement: Submit payload shape matches backend registerSchema field names

On successful validation and submit, the registration mutation payload MUST use exactly these field names, matching `registerSchema` in `backend/src/schemas/auth.schema.js`: `dni`, `nombre`, `apellido`, `correo`, `password`, `confirm`, `fecha_nacimiento`, `genero`, `id_obra_social`. No renamed, extra, or missing top-level fields MUST be sent relative to this list.

#### Scenario: Payload uses backend-matching field names

- GIVEN a user fills out and submits a valid form
- WHEN the registration mutation is invoked
- THEN the request body sent MUST contain exactly the keys `dni`, `nombre`, `apellido`, `correo`, `password`, `confirm`, `fecha_nacimiento`, `genero`, and `id_obra_social` (with `id_obra_social` present even if empty/undefined per existing optional-field behavior), and no other top-level keys

### Requirement: No manual Date/.toISOString() transform on fecha_nacimiento

`fecha_nacimiento` MUST be owned directly by `form.getInputProps('fecha_nacimiento')` wired to the `DatePickerInput`, with no intermediate manual `Date` construction or `.toISOString()` (or equivalent manual reformatting) step between the date picker's onChange and the value stored in form state or submitted in the payload. This is a regression guard against the value/validity drift bug that motivated this migration.

#### Scenario: Date picker value flows directly to form state

- GIVEN a user selects a birth date in the `DatePickerInput`
- WHEN the value changes
- THEN the new value MUST be written into `useForm` state via `form.getInputProps('fecha_nacimiento')` with no separate `useState` mirror, manual `Date` object construction, or `.toISOString()` call in the component code between the picker and validation/submission

#### Scenario: No reformatting step exists in submit payload construction

- GIVEN the form is submitted successfully
- WHEN the submit payload is built
- THEN `fecha_nacimiento` in the payload MUST be taken directly from `form.values.fecha_nacimiento` (or the value provided by `form.onSubmit`'s callback) without any manual date-to-string conversion logic written specifically for this field

### Requirement: Submit is gated by form validation, not a hand-maintained boolean

The submit action MUST be wired via `form.onSubmit(handleSubmit)`, such that `handleSubmit` (and therefore the registration mutation) cannot be invoked while any required field — including `fecha_nacimiento` and `genero` — fails validation. This gating MUST be a structural property of `@mantine/form`'s validation pipeline, not a separately hand-maintained `disabled` boolean expression that must be kept in sync with the validation rules.

#### Scenario: Submit blocked when fecha_nacimiento is missing

- GIVEN a user leaves `fecha_nacimiento` unset and fills every other required field
- WHEN the user clicks the submit button
- THEN `form.onSubmit` MUST prevent `handleSubmit` from running and MUST surface a validation error on `fecha_nacimiento`, with no registration mutation call made

#### Scenario: Submit blocked when genero is missing

- GIVEN a user leaves `genero` unset and fills every other required field
- WHEN the user clicks the submit button
- THEN `form.onSubmit` MUST prevent `handleSubmit` from running and MUST surface a validation error on `genero`, with no registration mutation call made

#### Scenario: No standalone disabled-boolean expression governs submit eligibility

- GIVEN the migrated component's submit button
- WHEN its `disabled`/eligibility state is inspected
- THEN it MUST derive from `useForm`'s built-in state (e.g. mutation pending state combined with `form.onSubmit` gating) and MUST NOT reintroduce a hand-written boolean expression enumerating individual field non-empty checks (e.g. a reconstructed `!fecha || !genero || ...` guard)

### Requirement: registerSchema rejects unknown top-level fields

`registerSchema` in `backend/src/schemas/auth.schema.js` MUST be defined using `z.strictObject(...)` instead of `z.object(...)`, while preserving every existing per-field validator (including the `dni` pattern check and other field-level rules already present) and the existing password/confirm `.refine(...)` check, unchanged in behavior for documented fields.

#### Scenario: Request with only documented fields is accepted

- GIVEN a registration request body containing exactly `dni`, `nombre`, `apellido`, `correo`, `password`, `confirm`, `fecha_nacimiento`, `genero`, and `id_obra_social` with valid values
- WHEN `registerSchema` validates the body
- THEN validation MUST succeed, identical to pre-migration `z.object` behavior for this same input

#### Scenario: Request with an unexpected extra field is rejected

- GIVEN a registration request body containing all documented fields plus one unexpected extra top-level field (e.g. `role`)
- WHEN `registerSchema` validates the body
- THEN validation MUST fail because of the unrecognized key, instead of silently stripping/ignoring it as `z.object` would

#### Scenario: Password/confirm mismatch is still rejected by the existing refine check

- GIVEN a registration request body with all documented fields present but `password` and `confirm` not matching
- WHEN `registerSchema` validates the body
- THEN validation MUST fail via the existing `.refine(...)` check, unchanged from pre-migration behavior

### Requirement: Preserved loading state UX

The migrated form MUST preserve the existing loading-state UX on the submit button, reflecting both the registration mutation's pending state and the login/session-establishment pending state (`isPending || isLoginIn` or equivalent), unchanged from current behavior.

#### Scenario: Submit button shows loading state during registration

- GIVEN a user submits a valid form
- WHEN the registration mutation is in flight
- THEN the submit button MUST reflect a loading/disabled state consistent with current `isPending || isLoginIn` behavior

### Requirement: Preserved DUPLICATE_DNI and DUPLICATE_EMAIL error handling

The migrated form MUST preserve existing server-error handling for `DUPLICATE_DNI` and `DUPLICATE_EMAIL` response codes, matching current `SignUp.jsx` presentation as closely as possible: `DUPLICATE_DNI` MUST continue to surface as a field-level error on `dni`, and `DUPLICATE_EMAIL` MUST continue to be presented via the existing generic bottom `Alert` block (not moved to a field-level error on `correo`), unless doing so is unavoidable to preserve equivalent information to the user.

#### Scenario: Duplicate DNI shows field-level error

- GIVEN the registration mutation returns a `DUPLICATE_DNI` error code
- WHEN the response is handled
- THEN a field-level error MUST be shown on the `dni` input, consistent with pre-migration behavior

#### Scenario: Duplicate email shows generic alert

- GIVEN the registration mutation returns a `DUPLICATE_EMAIL` error code
- WHEN the response is handled
- THEN the existing generic `Alert` block MUST display the duplicate-email message, consistent with pre-migration behavior

### Requirement: Preserved success alert and auto-login-then-redirect flow

On successful registration, the migrated form MUST preserve `SignUp.jsx`'s existing success confirmation alert and its existing auto-login mechanism (`useLoginSession()` plus its current timing/redirect behavior, e.g. `setTimeout` before `navigate("/")`) exactly as implemented pre-migration. The migration MUST NOT adopt `ProfessionalSignUp.jsx`'s `useAuth().login()` mechanism or its `/dashboard` redirect target for the client flow.

#### Scenario: Success alert shown after registration

- GIVEN a user submits a valid form and registration succeeds
- WHEN the response is handled
- THEN a success confirmation alert MUST be displayed, consistent with pre-migration behavior

#### Scenario: Auto-login and redirect use the existing client mechanism

- GIVEN registration succeeds
- WHEN the post-registration flow runs
- THEN it MUST use `useLoginSession()` (not `useAuth().login()`) and MUST redirect to `/` (not `/dashboard`), preserving the existing timing behavior (e.g. `setTimeout` before `navigate`)

### Requirement: English-only code and comments

All new or changed code and comments in the migrated `SignUp.jsx` MUST be written in English, consistent with the project's stated convention. Pre-existing inline Spanish comments (e.g. `// Cuidado, estaba en null...`) MUST be translated or removed, not carried over verbatim.

#### Scenario: No Spanish-language comments remain in changed code

- GIVEN the migrated `SignUp.jsx` file
- WHEN its comments are reviewed
- THEN no Spanish-language inline comments MUST remain in the sections rewritten as part of this migration

## Out of Scope (explicit non-requirements)

- No changes to `frontend/src/pages/ProfessionalSignUp.jsx`.
- No changes to `registerProfesionalSchema` or any schema other than `registerSchema`.
- No new fields, new validation rules beyond those listed above, or business-logic changes (e.g. no password-strength policy change, no new required obra social).
- No visual/design changes beyond what naturally results from adopting `form.getInputProps` (e.g. `error` prop wiring).
