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
}

const DEFAULT_MESSAGE = 'Ocurrió un problema. Intentá de nuevo en unos minutos.'

export default function useGetErrosMsg() {
  // Receives the backend error `code` (e.g. error.code) and returns a message.
  const errorMessage = (code) => MESSAGES[code] ?? DEFAULT_MESSAGE

  return { errorMessage, singingUp: errorMessage }
}
