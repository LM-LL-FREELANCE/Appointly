import { useState } from 'react'
import { Alert, Button, Divider, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core'
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'
import { useReasignarTurno } from '../../../hooks/useAdminTurnos.jsx'

const MENSAJES_ERROR = {
  SLOT_TAKEN: 'Ese horario ya está ocupado para el profesional elegido.',
  OUT_OF_SCHEDULE: 'El profesional no atiende en ese horario.',
  AGENDA_BLOCKED: 'El profesional tiene la agenda bloqueada ese día.',
  NOT_REASSIGNABLE: 'Este turno ya no se puede reasignar (pasó o no está abierto).',
}

export function ReasignarTurnoModal({ opened, onClose, turno, profesionales = [] }) {
  const [dniNuevo, setDniNuevo] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [errorCampo, setErrorCampo] = useState(null)
  const [errorApi, setErrorApi] = useState(null)

  const { mutate, isPending } = useReasignarTurno()

  if (!turno) return null

  const opcionesProfesionales = profesionales
    .filter((p) => Number(p.dni_profesional) !== Number(turno.dni_profesional))
    .map((p) => ({
      value: String(p.dni_profesional),
      label: `${p.nombre} ${p.apellido}`,
    }))

  const cerrar = () => {
    if (isPending) return
    setDniNuevo(null)
    setMotivo('')
    setErrorCampo(null)
    setErrorApi(null)
    onClose()
  }

  const confirmar = () => {
    if (!dniNuevo) {
      setErrorCampo('Elegí un profesional')
      return
    }
    setErrorCampo(null)
    setErrorApi(null)

    mutate(
      {
        id: turno.id_turno,
        dni_profesional: Number(dniNuevo),
        motivo: motivo.trim() || undefined,
      },
      {
        onSuccess: cerrar,
        onError: (err) => {
          const msg = MENSAJES_ERROR[err?.code] || err?.message || 'No se pudo reasignar el turno.'
          setErrorApi(msg)
        },
      },
    )
  }

  const nombreCliente = `${turno.c_nombre ?? turno.nombre ?? ''} ${turno.c_apellido ?? turno.apellido ?? ''}`.trim()
  const nombreProfesional = `${turno.p_nombre ?? ''} ${turno.p_apellido ?? ''}`.trim()

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      title={<Text fw={700} fz="lg">Reasignar turno</Text>}
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Stack gap="md">
        <Text c="dimmed" fz="sm" lh={1.6}>
          {nombreCliente} · {fechaCorta(turno.fecha_turno)} {horaCorta(turno.hora_turno)} hs · actualmente con {nombreProfesional}
        </Text>

        <Select
          label="Nuevo profesional"
          placeholder="Elegí un profesional"
          withAsterisk
          searchable
          nothingFoundMessage="No se encontraron profesionales"
          data={opcionesProfesionales}
          value={dniNuevo}
          onChange={(val) => {
            setDniNuevo(val)
            setErrorCampo(null)
            setErrorApi(null)
          }}
          error={errorCampo}
          disabled={isPending}
        />

        <Textarea
          label="Motivo (opcional)"
          placeholder="Ej.: Licencia médica del profesional asignado"
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          maxLength={255}
          autosize
          minRows={2}
          maxRows={4}
          disabled={isPending}
        />

        <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />}>
          El turno mantiene fecha y hora. Si el nuevo profesional no atiende ese horario o tiene la agenda bloqueada, no se va a poder reasignar.
        </Alert>

        {errorApi && (
          <Alert variant="light" color="red" icon={<IconAlertCircle size={18} />}>
            {errorApi}
          </Alert>
        )}

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            Cancelar
          </Button>
          <Button radius="md" onClick={confirmar} loading={isPending}>
            Reasignar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
