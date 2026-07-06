import { useState } from 'react'
import { Box, Button, Group, Modal, Text, Textarea } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'

// Confirmación para desktop. Muestra los datos del PACIENTE (no del profesional)
// y permite escribir un motivo opcional que se le enviará al paciente por email.
export function CancelarTurnoProfModal({ opened, onClose, onConfirm, turno, isPending, size = 'sm' }) {
  const [motivo, setMotivo] = useState('')

  if (!turno) return null

  const cerrar = () => {
    if (isPending) return
    setMotivo('')
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
          <IconAlertCircle size={28} color="red" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿Cancelar este turno?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6} mb="md">
          {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} · {turno.nombre} {turno.apellido}.{' '}
          El horario vuelve a quedar disponible y se le avisará al paciente por email.
        </Text>
        <Textarea
          label="Motivo (opcional)"
          placeholder="Se lo incluirá en el email al paciente"
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          autosize
          minRows={2}
          maxRows={4}
          disabled={isPending}
        />
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            No, volver
          </Button>
          <Button variant="light" color="red" radius="md" onClick={() => onConfirm(motivo.trim())} loading={isPending}>
            Sí, cancelar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
