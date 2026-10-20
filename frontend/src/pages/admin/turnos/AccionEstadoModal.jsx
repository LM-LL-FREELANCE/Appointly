import { useState } from 'react'
import { Box, Button, Group, Modal, Text, Textarea } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'

export function AccionEstadoModal({ opened, onClose, onConfirm, turno, tipo, isPending }) {
  const [motivo, setMotivo] = useState('')

  if (!turno || !tipo) return null

  const esAusente = tipo === 'ausente'
  const titulo = esAusente
    ? '¿Marcar este turno como ausente?'
    : '¿Marcar este turno como completado?'
  const color = esAusente ? 'orange' : 'teal'

  const cerrar = () => {
    if (isPending) return
    setMotivo('')
    onClose()
  }

  const confirmar = () => {
    onConfirm(motivo.trim() || undefined, () => setMotivo(''))
  }

  const nombreCliente = `${turno.c_nombre ?? turno.nombre ?? ''} ${turno.c_apellido ?? turno.apellido ?? ''}`.trim()
  const nombreProfesional = `${turno.p_nombre ?? ''} ${turno.p_apellido ?? ''}`.trim()

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          {esAusente ? (
            <IconAlertCircle size={28} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0 }} />
          ) : (
            <IconCircleCheck size={28} color="var(--mantine-color-teal-6)" style={{ flexShrink: 0 }} />
          )}
          <Text fw={700} fz="xl">{titulo}</Text>
        </Group>

        <Text c="dimmed" fz="sm" lh={1.6} mb={esAusente ? 'xs' : 'md'}>
          {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} hs · {nombreCliente} ({nombreProfesional}).{' '}
          El cambio queda registrado en el historial del turno.
        </Text>

        {esAusente && (
          <Text c="dimmed" fz="sm" lh={1.6} mb="md">
            Cuenta para la tasa de ausentismo del panel.
          </Text>
        )}

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
          <Button variant="light" color={color} radius="md" onClick={confirmar} loading={isPending}>
            Sí, confirmar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
