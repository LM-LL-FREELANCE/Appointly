import { useState } from 'react'
import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@mantine/core'
import { DatePickerInput, TimeInput } from '@mantine/dates'
import { IconAlertTriangle, IconCalendarEvent, IconClock } from '@tabler/icons-react'
import 'dayjs/locale/es'
import { ahoraEnZona } from '../../../utils/fechas.utils.js'
import { useCrearBloqueo } from '../../../hooks/useAdminTurnos.jsx'

export function NuevoBloqueoModal({ opened, onClose, profesionales = [] }) {
  const [fechas, setFechas] = useState([])
  const [todoElDia, setTodoElDia] = useState(true)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [alcance, setAlcance] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errores, setErrores] = useState({})

  const { mutate, isPending } = useCrearBloqueo()
  const hoy = ahoraEnZona().fecha

  const opcionesAlcance = [
    { value: '', label: 'Todo el centro' },
    ...profesionales.map((p) => ({
      value: String(p.dni_profesional),
      label: `${p.nombre} ${p.apellido}`,
    })),
  ]

  const limpiar = () => {
    setFechas([])
    setTodoElDia(true)
    setHoraInicio('')
    setHoraFin('')
    setAlcance('')
    setMotivo('')
    setErrores({})
  }

  const cerrar = () => {
    if (isPending) return
    limpiar()
    onClose()
  }

  const guardar = () => {
    const nuevosErrores = {}
    if (!Array.isArray(fechas) || fechas.length === 0) {
      nuevosErrores.fechas = 'Seleccioná al menos una fecha.'
    }
    if (!todoElDia) {
      const inicio = (horaInicio || '').slice(0, 5)
      const fin = (horaFin || '').slice(0, 5)
      if (!inicio) nuevosErrores.horaInicio = 'Indicá la hora de inicio.'
      if (!fin) nuevosErrores.horaFin = 'Indicá la hora de fin.'
      if (inicio && fin && inicio >= fin) {
        nuevosErrores.horaFin = 'La hora de fin debe ser posterior a la de inicio.'
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    setErrores({})
    mutate(
      {
        fechas: fechas.map((f) => String(f).slice(0, 10)),
        hora_inicio: todoElDia ? null : horaInicio.slice(0, 5),
        hora_fin: todoElDia ? null : horaFin.slice(0, 5),
        dni_profesional: alcance ? Number(alcance) : null,
        motivo: motivo.trim() || null,
      },
      {
        onSuccess: cerrar,
      },
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      title={<Text fw={700} fz="lg">Nuevo bloqueo</Text>}
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Stack gap="md">
        <DatePickerInput
          type="multiple"
          label="Fechas"
          placeholder="Elegí una o más fechas"
          withAsterisk
          locale="es"
          valueFormat="DD/MM/YYYY"
          minDate={hoy}
          leftSection={<IconCalendarEvent size={16} />}
          value={fechas}
          onChange={(val) => {
            setFechas(val ?? [])
            if (errores.fechas) setErrores((prev) => ({ ...prev, fechas: null }))
          }}
          error={errores.fechas}
          disabled={isPending}
        />

        <Switch
          label="Todo el día"
          checked={todoElDia}
          onChange={(e) => {
            setTodoElDia(e.currentTarget.checked)
            setErrores((prev) => ({ ...prev, horaInicio: null, horaFin: null }))
          }}
          disabled={isPending}
        />

        {!todoElDia && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TimeInput
              label="Desde"
              withAsterisk
              leftSection={<IconClock size={16} />}
              value={horaInicio}
              onChange={(e) => {
                setHoraInicio(e.currentTarget.value)
                if (errores.horaInicio) setErrores((prev) => ({ ...prev, horaInicio: null }))
              }}
              error={errores.horaInicio}
              disabled={isPending}
            />
            <TimeInput
              label="Hasta"
              withAsterisk
              leftSection={<IconClock size={16} />}
              value={horaFin}
              onChange={(e) => {
                setHoraFin(e.currentTarget.value)
                if (errores.horaFin) setErrores((prev) => ({ ...prev, horaFin: null }))
              }}
              error={errores.horaFin}
              disabled={isPending}
            />
          </SimpleGrid>
        )}

        <Select
          label="Alcance"
          data={opcionesAlcance}
          searchable
          value={alcance}
          onChange={(val) => setAlcance(val ?? '')}
          allowDeselect={false}
          disabled={isPending}
        />

        <Textarea
          label="Motivo (opcional)"
          placeholder="Ej.: Feriado nacional, jornada de capacitación..."
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          maxLength={255}
          autosize
          minRows={2}
          maxRows={4}
          disabled={isPending}
        />

        <Alert variant="light" color="yellow" icon={<IconAlertTriangle size={18} />}>
          Los turnos ya tomados dentro del bloqueo NO se cancelan. Los vas a ver en el monitor para cancelarlos o reasignarlos a mano.
        </Alert>

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            Cancelar
          </Button>
          <Button radius="md" onClick={guardar} loading={isPending}>
            Crear bloqueo(s)
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
