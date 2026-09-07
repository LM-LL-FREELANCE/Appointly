import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadAvatar } from '../api/storage.js'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'

export default function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['perfil', 'profesional', variables.dni] })
      queryClient.invalidateQueries({ queryKey: ['perfil', 'cliente', variables.dni] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      notifications.show({
        id: 'avatar-uploaded',
        title: 'Foto actualizada',
        message: 'Tu foto de perfil se actualizó correctamente.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        id: 'avatar-upload-error',
        title: 'Error al subir foto',
        message: err?.message || 'No se pudo subir la foto de perfil.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 4000,
      })
    },
  })
}
