import { useState } from 'react'
import { Box, Button, Group, Modal, Text, Textarea } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export function CancelarTurnoProfesionalModal({ opened, onClose, onConfirm, turno, isPending }) {
  const [motivo, setMotivo] = useState('')

  const handleClose = () => {
    if (isPending) return
    setMotivo('')
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(motivo.trim())
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          <IconAlertCircle size={28} color="red" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿Cancelar este turno?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6} mb="md">
          {turno.fecha_turno} · {turno.hora_turno} · {turno.p_nombre} {turno.p_apellido}.{' '}
          El horario vuelve a quedar disponible y se notificará al paciente por email.
        </Text>
        <Textarea
          label="Motivo de la cancelación"
          description="Se incluirá en la notificación al paciente"
          placeholder="Ej: El profesional no estará disponible ese día"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          minRows={3}
          autosize
          disabled={isPending}
        />
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={handleClose} disabled={isPending}>
            No, volver
          </Button>
          <Button variant="light" color="red" radius="md" onClick={handleConfirm} loading={isPending}>
            Sí, cancelar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
