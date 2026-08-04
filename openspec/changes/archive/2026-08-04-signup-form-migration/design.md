# Design: signup-form-migration

## Context

`frontend/src/pages/SignUp.jsx` currently manages 9 independent `useState` slots plus 3 derived booleans (`contrasenasNoCoinciden`, `emailInvalido`, plus a hand-built `disabled` expression on the submit button). `frontend/src/pages/ProfessionalSignUp.jsx` already implements the target pattern for a near-identical field set (missing only `id_obra_social`) using `@mantine/form`'s `useForm({ mode: 'uncontrolled', ... })`. This design maps `SignUp.jsx`'s current behavior onto that pattern field-by-field, decides how to handle the one field with no sibling precedent (`id_obra_social`), and specifies the one-line backend schema change.

## 1. `frontend/src/pages/SignUp.jsx`

### 1.1 `useForm` shape

```js
const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    dni: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: null,
    genero: null,
    id_obra_social: null,
    correo: '',
    password: '',
    confirm: '',
  },
  validate: {
    dni: (value) => (/^\d{7,8}$/).test(value) ? null : 'El DNI debe tener 7 u 8 dígitos',
    nombre: (value) => value.trim().length > 0 ? null : 'El nombre es obligatorio',
    apellido: (value) => value.trim().length > 0 ? null : 'El apellido es obligatorio',
    fecha_nacimiento: (value) => value ? null : 'Selecciona una fecha',
    genero: (value) => value ? null : 'Selecciona un género',
    correo: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value) ? null : 'Formato de email incorrecto',
    password: (value) => value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres',
    confirm: matchesField('password', 'Las contraseñas no coinciden'),
    // id_obra_social: intentionally absent — optional field, no rule (see 1.2)
  },
})
```

This is a byte-for-byte copy of `ProfessionalSignUp.jsx`'s `validate` block (rule text and regexes included, to keep error-message copy identical per the proposal's risk note), with `id_obra_social: null` added to `initialValues` only. `password`'s validate rule (`min 6`) is new relative to current `SignUp.jsx` (which has no password-length check at all today, only the confirm-match check) — but it mirrors `ProfessionalSignUp.jsx` and the backend's `password: z.string().min(6)`, so it closes a real client/server validation gap without being an out-of-scope behavior change: the backend already rejects `password.length < 6`; the current `SignUp.jsx` just failed to tell the user why until the network round-trip. This is consistent with "field-by-field validate rules mirroring `ProfessionalSignUp.jsx`" as directed by the task, and does not require a proposal amendment since it only adds error visibility for a rule the backend already enforces.

Field-by-field mapping from old state to new form key:

| Old `useState` | New form key | Notes |
|---|---|---|
| `dni` | `dni` | same name already |
| `name` | `nombre` | renamed to match backend/sibling naming |
| `lastName` | `apellido` | renamed |
| `fecha` | `fecha_nacimiento` | renamed; raw `Date` value passed straight through via `getInputProps`, no `.toISOString()` step — this removes the bug class described in the proposal by construction |
| `genero` | `genero` | same name |
| `obraSocial` | `id_obra_social` | renamed to match backend payload key directly (see 1.2) |
| `email` | `correo` | renamed |
| `password` | `password` | same name |
| `confirmPassword` | `confirm` | renamed to match sibling/backend |
| `accConfirm` | stays a separate `useState(false)` | UI-only success flag, not form data — `ProfessionalSignUp.jsx` uses the analogous `loginFallido` local `useState` for the same reason (transient UI state, not a form field) |

### 1.2 Wiring `id_obra_social`

Decision: **treat it as a plain, ordinary form field** — added to `initialValues` as `id_obra_social: null`, wired via `key={form.key('id_obra_social')}` + `{...form.getInputProps('id_obra_social')}` on the existing `<Select>`, with no entry in `validate` (Mantine simply skips validation for keys absent from the `validate` map, so this correctly stays optional — matching the "no validation rule (matches current behavior)" requirement from the proposal).

```jsx
<Select
  label="Seleccione una obra social (opcional)"
  size={inputSize}
  placeholder={isLoadingObraSociales ? "Cargando obras sociales..." : "Elija una"}
  data={opcionesMantine}
  disabled={isLoadingObraSociales}
  rightSection={isLoadingObraSociales ? <Loader size="xs" /> : null}
  key={form.key('id_obra_social')}
  {...form.getInputProps('id_obra_social')}
/>
```

`opcionesMantine` and `isLoadingObraSociales` keep being derived exactly as today from `useObrasSociales()`, outside the form — the form only owns the *selected* value, not the async option list, same separation of concerns `ProfessionalSignUp.jsx` uses for `opcionesDeGenero` (a plain constant array, not form state) and the same separation `SignUp.jsx` itself already uses today for `obraSociales`/`opcionesMantine`.

**Justification for "plain field, not handled separately":**
- Mantine's `<Select>` (Mantine v9, native to this select — not `Select.Async` or a custom combobox) already accepts a controlled-by-`getInputProps` value/onChange pair regardless of whether `data` is static or asynchronously populated; the async-loading concern (`isLoadingObraSociales`, `Loader`, `disabled`) is orthogonal to how the *selected value* is tracked, so there is no structural reason to special-case it outside `form`.
- Keeping it inside `form` means `form.values` becomes the single source of truth for the entire payload at submit time (see 1.4's `handleSubmit(values)`), avoiding a split where 8 fields come from `values` and 1 comes from a leftover local `useState` — that split is exactly the kind of drift-prone mixed-state pattern this migration exists to eliminate.
- The one piece of type massaging (`Select` values are always strings; backend wants `id_obra_social: number | null`) is handled at submit time inside `handleSubmit`, not in the field wiring itself — see 1.4.

### 1.3 `DUPLICATE_DNI` / `DUPLICATE_EMAIL` error display (preserving the current mixed presentation)

Per the proposal's stated assumption (#2), the migrated version keeps `SignUp.jsx`'s current mixed layout — `DUPLICATE_DNI` as a field-level error, `DUPLICATE_EMAIL` folded into the generic bottom `Alert` — rather than adopting `ProfessionalSignUp.jsx`'s fully-per-field pattern (which shows both `DUPLICATE_DNI` and `DUPLICATE_EMAIL` as field errors).

```jsx
<TextInput
  label="DNI"
  size={inputSize}
  placeholder="Ej: 12345678"
  required
  key={form.key('dni')}
  {...form.getInputProps('dni')}
  error={form.errors.dni || (errorAcc?.code === 'DUPLICATE_DNI' ? 'DNI ya registrado' : null)}
/>
```

`correo`'s `TextInput` gets **only** `form.errors.correo` (client-side format validation), with no `errorAcc?.code === 'DUPLICATE_EMAIL'` branch — that stays absent, same as today:

```jsx
<TextInput
  label="Email (recibirás notificaciones)"
  required
  size={inputSize}
  placeholder="Ej: juanperez@gmail.com"
  key={form.key('correo')}
  {...form.getInputProps('correo')}
/>
```

The bottom generic `Alert` keeps its existing conditional message logic verbatim, just re-reading `errorAcc` (unchanged variable name/source — still `const { mutate, isPending, error: errorAcc } = useCreateAccount()`):

```jsx
{errorAcc && (
  <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
    {errorAcc?.code === "DUPLICATE_DNI"
      ? "Ya existe una cuenta registrada con este DNI. Si es tuyo, intenta iniciar sesión."
      : "Hubo un problema al registrar la cuenta. Por favor, intenta de nuevo."}
  </Alert>
)}
```

Note this message ternary already treats every non-`DUPLICATE_DNI` error (including `DUPLICATE_EMAIL`) as falling into the generic "Hubo un problema..." branch — this is exactly today's behavior and is preserved unchanged, satisfying the "match current presentation as closely as possible" assumption without adding new logic.

### 1.4 Auto-login-then-navigate flow, preserved unchanged inside `form.onSubmit`

The mutation call sequence, hook usage (`useLoginSession`, not `useAuth().login()`), and the `setTimeout` + `navigate("/")` timing are all preserved exactly — only the trigger changes from an `onClick` handler reading loose `useState` variables to a `handleSubmit(values)` function reading `values` (Mantine's uncontrolled-mode submit callback argument), wired via `<form onSubmit={form.onSubmit(handleSubmit)} noValidate>` instead of a bare `<Button onClick={confirmarAcc}>`:

```js
const handleSubmit = (values) => {
  mutate({
    dni: values.dni,
    nombre: values.nombre,
    apellido: values.apellido,
    correo: values.correo,
    password: values.password,
    confirm: values.confirm,
    fecha_nacimiento: values.fecha_nacimiento,
    genero: getGeneroFormateado(values.genero),
    id_obra_social: values.id_obra_social ? Number(values.id_obra_social) : null,
  }, {
    onSuccess: () => {
      setAccConfirm(true)
      mutateLogin({
        dni: values.dni,
        password: values.password,
        role: "cliente"
      }, {
        onSuccess: () => {
          setTimeout(() => {
            navigate("/")
          }, 1000)
        },
      })
    }
  })
}
```

`getGeneroFormateado` stays a plain function taking the raw `genero` string (`values.genero`) and returning `M`/`F`/`X`, called at submit time — same as `ProfessionalSignUp.jsx`'s `getGeneroFormateado(values.genero)` and functionally identical to `SignUp.jsx`'s current no-arg closure-based version, just parameterized instead of closing over a `useState` variable.

`id_obra_social ? Number(...) : null` is carried over unchanged from today's `confirmarAcc` (`obraSocial ? Number(obraSocial) : null`) — this is the one place the `Select`'s string value is coerced to the number the backend/`registerSchema` expects (`id_obra_social: z.number().optional()`).

`useLoginSession`, `useCreateAccount`, `isPending`, `isLoginIn`, `isErrorLoginIn`, and the `accConfirm` success-alert `useState` are all retained exactly as declared today — none of these are form-owned state, so none of them move into `useForm`. The submit button becomes:

```jsx
<Button type="submit" loading={isPending || isLoginIn}>
  Registrarse
</Button>
```

with `disabled={...}` removed entirely (closing the `fecha`/`genero` submit-gap bug by construction, since `form.onSubmit` short-circuits and populates `form.errors` instead of calling `handleSubmit` when validation fails) and `type="submit"` on this button plus `type="button"` on the other two (`Volver al inicio`, `Ya tengo una cuenta`) so only the real submit button triggers `form.onSubmit`, mirroring `ProfessionalSignUp.jsx`'s button `type` wiring.

### 1.5 Spanish inline comments to translate/remove

Current `SignUp.jsx` has exactly these Spanish inline comments; all must be removed (not carried over) since the rewritten code has no equivalent state-drift concerns to annotate, or translated if the underlying note is still relevant post-rewrite:

1. `// Cuidado, estaba en null. Mejor "" para textos.` (on the `email` `useState` line) — remove; the concern is moot once `initialValues.correo = ''` is a static literal, not a runtime decision.
2. `// Le quité los style={{flex: 1}} porque dentro de SimpleGrid no hacen falta` (above `nombre`/`apellido` `TextInput`s) — remove; historical/self-referential note about a prior edit, not applicable to the rewritten file.
3. `// Forma más corta y limpia` (on `onChange={setFecha}`) — remove; replaced by `{...form.getInputProps('fecha_nacimiento')}`, the comment's subject no longer exists.
4. `// Mantine te pone un loader automáticamente en el botón` (on the `loading={isPending || isLoginIn}` prop) — either remove or translate to English (`// Mantine shows a loader automatically on the button`) if judged worth keeping; not required for correctness, only for the English-only convention, so removing is simplest and sufficient.

No other Spanish comments exist in the current file (`ProfessionalSignUp.jsx` has none either, confirming the target convention).

## 2. `backend/src/schemas/auth.schema.js`

Single-line change: `registerSchema`'s top-level `z.object({...})` → `z.strictObject({...})`, no other characters altered — field list, per-field validators, and the trailing `.refine(...)` are untouched:

```js
export const registerSchema = z.strictObject({
  dni: dniSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.email().max(255),
  genero: z.enum(["M", "F", "X"]),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6),
  confirm: z.string(),
  id_obra_social: z.number().optional(),
}).refine((data) => data.password === data.confirm, {
  error: "Las contraseñas no coinciden",
  path: ["confirm"],
})
```

`z.strictObject(...).refine(...)` chain validity: `z.strictObject(shape)` returns a `ZodObject` (same base class `z.object(shape)` returns, just with the `"strict"` unknown-keys catchall mode pre-applied) — `.refine()` is a method on `ZodType`/`ZodObject` generally, not gated on the object's unknown-keys mode. This exact chain shape (`z.object({...}).refine(...)`) is already used twice in this same file today (`registerSchema` pre-change, and `registerProfesionalSchema`), and `loginSchema` already demonstrates `z.strictObject({...})` (without a trailing `.refine`) working correctly in this codebase's Zod version. Combining the two — `z.strictObject({...}).refine(...)` — introduces no new API surface; it is simply composing two already-proven-working pieces from the same file, so no separate verification beyond this reasoning is required. `registerProfesionalSchema` is explicitly left as `z.object` per the proposal's stated out-of-scope decision.

## Data flow summary (frontend)

```
user input
  -> form.getInputProps(fieldKey) [uncontrolled Mantine inputs]
  -> form.onSubmit(handleSubmit) [runs `validate` map; blocks call if any rule fails]
  -> handleSubmit(values) [reads form.values snapshot, applies getGeneroFormateado + Number() coercion]
  -> mutate(payload) [useCreateAccount -> POST /register, validated server-side by registerSchema (now strict)]
  -> onSuccess -> setAccConfirm(true) + mutateLogin(...) [useLoginSession -> POST /login]
  -> onSuccess -> setTimeout(1000) -> navigate("/")
```

No change to `useObrasSociales`, `useRegisterAccount`, or `useLoginSession` call signatures — all three are re-consumed identically to today, only the values fed into `mutate`/`mutateLogin` now originate from `form.values` instead of loose `useState` variables.

## Tests impacted

- Any existing frontend test asserting on `SignUp.jsx`'s old `useState`/`onChange` wiring (e.g. `fireEvent.change` on inputs expecting immediate controlled re-render, or a disabled-button assertion tied to the old boolean expression) needs updating to Mantine's uncontrolled-mode interaction pattern (same adjustments `ProfessionalSignUp.jsx`'s existing tests, if any, already reflect).
- Any backend test asserting `registerSchema` silently drops/ignores unexpected extra fields needs updating to assert a validation rejection instead, consistent with `loginSchema`'s existing strict behavior.

## Rollout / rollback

No new dependencies, no data migration, no route/contract changes beyond stricter validation on already-documented fields. Both changes are independently revertible as described in the proposal (single-file frontend revert; single-line backend revert), with no shared migration state.
