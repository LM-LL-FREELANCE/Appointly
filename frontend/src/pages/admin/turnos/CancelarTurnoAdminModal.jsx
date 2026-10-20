import { useState } from 'react'
import { Box, Button, Group, Modal, Text, Textarea } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'

export function CancelarTurnoAdminModal({ opened, onClose, onConfirm, turno, isPending }) {
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState(null)

  if (!turno) return null

  const cerrar = () => {
    if (isPending) return
    setMotivo('')
    setErrorMotivo(null)
    onClose()
  }

  const handleConfirm = () => {
    const limpio = motivo.trim()
    if (!limpio) {
      setErrorMotivo('Escribí un motivo')
      return
    }
    setErrorMotivo(null)
    onConfirm(limpio, () => {
      setMotivo('')
      setErrorMotivo(null)
    })
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
          <IconAlertCircle size={28} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
          <Text fw={700} fz="xl">¿Cancelar este turno?</Text>
        </Group>
        <Text c="dimmed" fz="sm" lh={1.6} mb="xs">
          {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} hs · Paciente: {nombreCliente} · Profesional: {nombreProfesional}.
        </Text>
        <Text c="dimmed" fz="sm" lh={1.6} mb="md">
          Se le va a avisar por email al cliente y al profesional. El horario vuelve a quedar libre.
        </Text>
        <Textarea
          label="Motivo de cancelación"
          placeholder="Se lo incluirá en el email al cliente y al profesional"
          withAsterisk
          value={motivo}
          onChange={(e) => {
            setMotivo(e.currentTarget.value)
            if (errorMotivo) setErrorMotivo(null)
          }}
          error={errorMotivo}
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
          <Button variant="light" color="red" radius="md" onClick={handleConfirm} loading={isPending}>
            Sí, cancelar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
