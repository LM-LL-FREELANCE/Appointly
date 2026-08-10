export const userPermission = {
  ADMIN: 'admin',
  PROFESIONAL: 'profesional',
  CLIENTE: 'cliente',
}

/*const data = {
  es_profesional: 1,
  es_admin_profesional: 1,
  es_cliente: 0,
  es_admin_dedicado: 0
}*/

export const buildPermission = (data) => {
  const roles = []

  if (data.es_profesional) roles.push(userPermission.PROFESIONAL)
  if (data.es_admin_profesional) roles.push(userPermission.ADMIN)
  if (data.es_admin_dedicado) roles.push(userPermission.ADMIN)
  if (data.es_cliente) roles.push(userPermission.CLIENTE)

  return roles
}
