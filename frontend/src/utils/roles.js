// Where each role lands after logging in.
export const HOME_BY_ROLE = {
  cliente: '/',
  profesional: '/dashboard',
  admin: '/admin',
}

// Each role signs in through its own screen; logout sends the user back to it.
export const LOGIN_BY_ROLE = {
  cliente: '/login',
  profesional: '/professional-login',
  admin: '/admin-login',
}
