export const userPermission = {
  ADMIN: 'admin',
  PROFESIONAL: 'profesional',
  CLIENTE: 'cliente',
}

// A role is only usable if it maps to one of the role tables. Tokens issued
// before roles were scoped per table carry no role at all, so a session must be
// checked against this before it is trusted.
export const isKnownRole = (role) => Object.values(userPermission).includes(role)
