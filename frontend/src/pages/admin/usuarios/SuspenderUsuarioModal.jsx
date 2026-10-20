import { Box, Button, Group, Modal, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export function SuspenderUsuarioModal({ opened, onClose, onConfirm, usuario, isPending, size = 'sm' }) {
  if (!usuario) return null

  const nombre = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      centered
      size={size}
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          <IconAlertCircle size={28} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿Suspender esta cuenta?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6}>
          {nombre} no va a poder iniciar sesión hasta que la reactives. Sus turnos y datos se conservan.
        </Text>
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            No, volver
          </Button>
          <Button variant="light" color="yellow" radius="md" onClick={onConfirm} loading={isPending}>
            Sí, suspender
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
