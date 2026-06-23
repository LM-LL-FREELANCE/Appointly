import { Box, Button, Group, Modal, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export function CancelarTurnoModal({ opened, onClose, onConfirm, turno, isPending, size = 'sm' }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={size}
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="xl">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          <IconAlertCircle size={28} color="red" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿Cancelar este turno?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6}>
          {turno.fecha_turno} · {turno.hora_turno} · {turno.p_nombre} {turno.p_apellido}.{' '}
          El horario vuelve a quedar disponible y te enviaremos la confirmación por email.
        </Text>
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={onClose} disabled={isPending}>
            No, volver
          </Button>
          <Button variant="light" color="red" radius="md" onClick={onConfirm} loading={isPending}>
            Sí, cancelar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
