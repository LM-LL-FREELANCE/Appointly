import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAvatar } from '../api/storage.js'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'

export default function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['perfil', 'profesional', variables.dni] })
      queryClient.invalidateQueries({ queryKey: ['perfil', 'cliente', variables.dni] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      notifications.show({
        id: 'avatar-deleted',
        title: 'Foto eliminada',
        message: 'Tu foto de perfil fue eliminada correctamente.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        id: 'avatar-delete-error',
        title: 'Error al eliminar foto',
        message: err?.message || 'No se pudo eliminar la foto de perfil.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 4000,
      })
    },
  })
}
