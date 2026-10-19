import { useState } from 'react'
import { Box, Button, Group, Modal, Text, Textarea } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'

// Confirmation for state changes that are hard to undo (ausente, completado).
// `accion` is an entry of accionesProfesional(); the motivo is optional and goes to the history.
export function ConfirmarEstadoModal({
  opened,
  onClose,
  onConfirm,
  turno: turnoProp,
  accion: accionProp,
  confirmacion,
  isPending,
}) {
  const turno = turnoProp ?? confirmacion?.turno
  const accion = accionProp ?? confirmacion?.accion
  const isOpened = opened !== undefined ? Boolean(opened) : Boolean(turno && accion)
  const [motivo, setMotivo] = useState('')

  if (!turno || !accion) return null

  const cerrar = () => {
    if (isPending) return
    setMotivo('')
    onClose()
  }

  return (
    <Modal
      opened={isOpened}
      onClose={cerrar}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          <IconAlertCircle size={28} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿{accion.label}?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6} mb="md">
          {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} · {turno.nombre} {turno.apellido}.{' '}
          El cambio queda registrado en el historial del turno.
        </Text>
        <Textarea
          label="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          maxLength={255}
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
          <Button radius="md" onClick={() => { onConfirm(motivo.trim()); setMotivo('') }} loading={isPending}>
            Sí, confirmar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
