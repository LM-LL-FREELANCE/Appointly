import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconTrash } from '@tabler/icons-react'
import { useEliminarAviso } from '../../../hooks/useAvisos.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'

export function EliminarAvisoModal({ aviso, onClose }) {
  const { mutate: eliminar, isPending } = useEliminarAviso()
  const { errorMessage } = useGetErrosMsg()

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  const confirmar = () => {
    eliminar({ id: aviso.id }, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          title: 'Aviso eliminado.',
          position: 'top-right',
        })
        onClose()
      },
      onError: (err) => notifications.show({
        color: 'red',
        title: 'No se pudo eliminar el aviso',
        message: errorMessage(err.code),
        position: 'top-right',
      }),
    })
  }

  return (
    <Modal
      opened={Boolean(aviso)}
      onClose={cerrar}
      centered
      size="sm"
      title="¿Eliminar este aviso?"
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      withCloseButton={!isPending}
    >
      <Stack gap="md">
        <Text fz="sm">
          Se borra definitivamente. Si querés ocultarlo sin perderlo, desactivalo con el switch.
        </Text>
        <Text fz="sm" fw={500}>{aviso?.titulo}</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={cerrar} disabled={isPending}>Cancelar</Button>
          <Button color="red" leftSection={<IconTrash size={18} />} loading={isPending} onClick={confirmar}>
            Eliminar aviso
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
