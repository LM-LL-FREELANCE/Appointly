export const SLOT_DURATION_MIN = 30;
export const MAX_RANGE_DAYS = 31;
export const SALT_ROUNDS = 10;
export const INVITACION_TTL_HORAS = 24;

// MFA de admins (PLAN_ADMIN.md §10.7)
export const MFA_TTL_MIN = 10;
export const MFA_MAX_INTENTOS = 5;
export const MFA_RESEND_COOLDOWN_SEG = 60;
export const MFA_MAX_RESENDS = 3;

// Timezone used by every time-based rule on turnos ("today", "has started").
export const TIMEZONE = "America/Argentina/Buenos_Aires";

export const ESTADOS_TURNO = [
  "pendiente_confirmacion",
  "confirmado",
  "en_espera",
  "en_curso",
  "completado",
  "ausente",
  "reprogramado",
  "cancelado",
];

// "Open" turnos: still pending attention (not finished, not cancelled/moved).
export const ESTADOS_ABIERTOS = ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso"];

// States that hold a slot: everything except cancelado and reprogramado.
export const ESTADOS_OCUPAN_SLOT = ESTADOS_TURNO.filter((e) => e !== "cancelado" && e !== "reprogramado");
