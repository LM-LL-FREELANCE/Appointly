import { notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { IconCheck, IconX } from '@tabler/icons-react'
import useGetErrosMsg from './useGetErrosMsg.jsx'
import { isIdentityError } from '../utils/registro.utils.js'

const ID = 'registrandose'
const BASE = { id: ID, position: 'top-right', withCloseButton: true }

/** One notification shared by every registration flow: loading -> success | error. */
export default function useRegistroNotifications() {
  const { errorMessage } = useGetErrosMsg()

  const showLoading = (message = 'Estamos creando tu cuenta.') =>
    notifications.show({
      ...BASE, title: 'Espera un momento...', message, withCloseButton: false, autoClose: false, loading: true,
    })

  const showSuccess = ({ title, message }) =>
    notifications.update({
      ...BASE, title, message, color: 'green', icon: <IconCheck />, loading: false, autoClose: 6000,
    })

  const showError = (error) => {
    // Identity checks are guidance shown next to the field, not a failure toast.
    if (isIdentityError(error?.code)) {
      notifications.hide(ID)
      return
    }

    const exists = ['DUPLICATE_DNI', 'DUPLICATE_EMAIL', 'DUPLICATE_MATRICULA'].includes(error?.code)

    notifications.update({
      ...BASE,
      title: exists ? 'Cuenta ya existente' : 'Ocurrió un problema registrando su cuenta',
      message: errorMessage(error?.code),
      color: 'red', icon: <IconX />, loading: false, autoClose: 5000,
    })
  }

  return { showLoading, showSuccess, showError }
}
