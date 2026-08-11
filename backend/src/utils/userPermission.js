export const userPermission = {
  ADMIN: 'admin',
  PROFESIONAL: 'profesional',
  CLIENTE: 'cliente',
}

export const isKnownRole = (role) => Object.values(userPermission).includes(role)
