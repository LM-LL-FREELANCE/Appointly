import { useState } from 'react'
import { Alert, Box, Button, Group, Loader, Modal, Stack, Text, Textarea } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar } from '@tabler/icons-react'
import 'dayjs/locale/es'
import SlotBox from '../../components/SlotBox.jsx'
import QueryError from '../../components/QueryError.jsx'
import useSlots from '../../hooks/useSlots.jsx'
import useReprogramarTurno from '../../hooks/useReprogramarTurno.jsx'
import { diasReprogramables } from '../../utils/estadosTurno.js'
import { ahoraEnZona, fechaCorta, horaCorta, ventanaReprogramacion } from '../../utils/fechas.utils.js'

const MOTIVO_MAX = 255
const DIAS_VENTANA = 30

// Picks a new date (only days with free slots), a time and an optional reason, then calls
// POST /turnos/:id/reprogramacion. Stays open on error so another slot can be chosen.
export function ReprogramarTurnoModal({ opened, onClose, turno, dniProfesional, ahora = ahoraEnZona() }) {
  const [fecha, setFecha] = useState(null)
  const [hora, setHora] = useState(null)
  const [motivo, setMotivo] = useState('')

  const { desde, hasta } = ventanaReprogramacion(ahora, DIAS_VENTANA)
  const { data: slotData, isLoading, isError, error, refetch } = useSlots({
    dni: opened ? dniProfesional : undefined,
    desde,
    hasta,
  })
  const { mutate, isPending } = useReprogramarTurno()

  if (!turno) return null

  const dias = diasReprogramables({ dias: slotData?.dias, ahora, original: turno })
  const diasLibres = new Set(dias.map((d) => d.fecha))
  // Derived so a refetch that removes the chosen slot clears the choice.
  const fechaValida = fecha && diasLibres.has(fecha) ? fecha : null
  const slots = dias.find((d) => d.fecha === fechaValida)?.slots ?? []
  const horaValida = slots.includes(hora) ? hora : null

  const cerrar = () => {
    if (isPending) return
    setFecha(null)
    setHora(null)
    setMotivo('')
    onClose()
  }

  const confirmar = () => {
    mutate(
      { id: turno.id_turno, fecha_turno: fechaValida, hora_turno: horaValida, motivo: motivo.trim() },
      {
        onSuccess: cerrar,
        onError: (err) => {
          if (err.code === 'SLOT_TAKEN' || err.code === 'OUT_OF_SCHEDULE') setHora(null)
        },
      },
    )
  }

  const esAusente = turno.estado === 'ausente'

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      centered
      size="md"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Text fw={700} fz="xl" mb="xs">Reprogramar turno</Text>
        <Text c="dimmed" fz="sm" lh={1.6} mb="md">
          Turno actual: {turno.nombre} {turno.apellido} · {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} hs.{' '}
          {esAusente
            ? 'El turno original queda como ausente y se crea uno nuevo.'
            : 'El turno actual queda como reprogramado y se le avisa al paciente por email.'}
        </Text>

        {isLoading && <Group justify="center" py="md"><Loader size="sm" /></Group>}

        {isError && (
          <QueryError message={error?.message || 'No se pudieron cargar los horarios disponibles'} onRetry={refetch} />
        )}

        {!isLoading && !isError && dias.length === 0 && (
          <Alert color="orange" variant="light">
            No hay horarios libres en los próximos {DIAS_VENTANA} días.
          </Alert>
        )}

        {!isLoading && !isError && dias.length > 0 && (
          <Stack gap="md">
            <DatePickerInput
              label="Nueva fecha"
              description={`Solo días con horarios libres (próximos ${DIAS_VENTANA} días)`}
              placeholder="Elegí una fecha"
              locale="es"
              value={fechaValida}
              onChange={(valor) => { setFecha(valor); setHora(null) }}
              valueFormat="ddd D MMM"
              rightSection={<IconCalendar size={16} />}
              minDate={desde}
              maxDate={hasta}
              excludeDate={(f) => !diasLibres.has(f)}
              disabled={isPending}
            />

            <Stack gap="xs">
              <Text fw={500} fz="sm">Nuevo horario</Text>
              {fechaValida ? (
                <SlotBox slots={slots} seleccionado={horaValida} onSelect={setHora} />
              ) : (
                <Text c="dimmed" fz="sm">Elegí primero una fecha.</Text>
              )}
            </Stack>

            <Textarea
              label="Motivo (opcional)"
              description={`${motivo.length}/${MOTIVO_MAX}`}
              placeholder="Se lo incluirá en el email al paciente"
              value={motivo}
              onChange={(e) => setMotivo(e.currentTarget.value)}
              maxLength={MOTIVO_MAX}
              autosize
              minRows={2}
              maxRows={4}
              disabled={isPending}
            />
          </Stack>
        )}
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            Volver
          </Button>
          <Button radius="md" onClick={confirmar} loading={isPending} disabled={!fechaValida || !horaValida}>
            Reprogramar
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
