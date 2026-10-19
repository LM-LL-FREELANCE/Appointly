const MESSAGES = {
  DUPLICATE_DNI: 'Ya existe una cuenta registrada con este DNI. Si es tuyo, intenta iniciar sesión.',
  DUPLICATE_EMAIL: 'Ya existe una cuenta registrada con este MAIL. Si es tuyo, intenta iniciar sesión',
  DUPLICATE_MATRICULA: 'Ya existe una cuenta con esa matrícula. Revisá que esté bien escrita.',
  IDENTITY_VERIFICATION_REQUIRED: 'Este DNI ya tiene una cuenta en Appointly. Ingresá la contraseña de esa cuenta para continuar.',
  IDENTITY_VERIFICATION_FAILED: 'No pudimos verificar tu identidad con esa contraseña.',
  INVITATION_INVALID: 'El enlace de invitación no es válido o fue revocado.',
  INVITATION_EXPIRED: 'La invitación venció. Pedile a un administrador que te envíe una nueva.',
  INVITATION_USED: 'Esta invitación ya fue usada. Si ya creaste tu cuenta, iniciá sesión.',
  ADMIN_ALREADY_EXISTS: 'Esa persona ya tiene una cuenta de administrador.',
  EMAIL_SEND_FAILED: 'No pudimos enviar el correo. Probá de nuevo en unos minutos.',
  NOT_FOUND: 'Ese elemento ya no está disponible. Actualizá la lista.',
  ACCOUNT_PENDING: 'Tu solicitud todavía está pendiente de aprobación.',
  ACTION_RATE_LIMIT_EXCEEDED: 'Hiciste demasiados intentos. Esperá un rato e intentá de nuevo.',
  // Panel admin (PLAN_ADMIN.md §8.8)
  ACCOUNT_SUSPENDED: 'Tu cuenta está suspendida. Contactá a la administración del centro.',
  ALREADY_SUSPENDED: 'La cuenta ya estaba suspendida.',
  NOT_SUSPENDED: 'La cuenta ya está activa.',
  CANNOT_DELETE_SELF: 'No podés dar de baja tu propia cuenta.',
  MFA_INVALID_CODE: 'El código no es correcto.',
  MFA_EXPIRED: 'El código venció. Pedí uno nuevo.',
  MFA_TOO_MANY_ATTEMPTS: 'Demasiados intentos. Volvé a empezar o pedí un código nuevo.',
  MFA_RESEND_TOO_SOON: 'Esperá unos segundos antes de pedir otro código.',
  MFA_CHALLENGE_INVALID: 'La verificación venció. Iniciá sesión de nuevo.',
  MFA_RATE_LIMIT_EXCEEDED: 'Demasiados intentos de verificación. Esperá unos minutos y volvé a probar.',
  MOTIVO_REQUIRED: 'Escribí un motivo para la cancelación.',
  NOT_REASSIGNABLE: 'Este turno ya no se puede reasignar.',
  AGENDA_BLOCKED: 'El profesional tiene la agenda bloqueada en ese horario.',
  CENTER_CLOSED: 'El centro permanece cerrado ese día.',
  BOOKING_TOO_SOON: 'Ese horario es demasiado próximo para reservar.',
  CANCEL_TOO_LATE: 'Ya no estás a tiempo de cancelar este turno.',
  SEGMENT_EMPTY: 'El segmento seleccionado no tiene destinatarios.',
  DUPLICATE_NAME: 'Ya existe un registro con ese nombre.',
}

const DEFAULT_MESSAGE = 'Ocurrió un problema. Intentá de nuevo en unos minutos.'

export default function useGetErrosMsg() {
  // Receives the backend error `code` (e.g. error.code) and returns a message.
  const errorMessage = (code) => MESSAGES[code] ?? DEFAULT_MESSAGE

  return { errorMessage, singingUp: errorMessage }
}
