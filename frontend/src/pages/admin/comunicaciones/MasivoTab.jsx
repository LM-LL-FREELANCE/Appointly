import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDebouncedValue } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheck,
  IconEye,
  IconSend,
  IconX,
} from '@tabler/icons-react'
import 'dayjs/locale/es'
import QueryError from '../../../components/QueryError.jsx'
import { useEnviarMasivo, usePreviewSegmento } from '../../../hooks/useAdminComunicaciones.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'
import { rangoMes } from '../../../utils/fechas.utils.js'
import { ConfirmarEnvioModal } from './ConfirmarEnvioModal.jsx'

const SEGMENTOS = [
  { value: 'todos', label: 'Todos los usuarios' },
  { value: 'profesionales', label: 'Profesionales' },
  { value: 'clientes_turnos_activos', label: 'Clientes con turnos en un período' },
]

export function MasivoTab() {
  const mesInicial = useMemo(() => rangoMes(), [])
  const [confirmOpened, setConfirmOpened] = useState(false)
  const { mutate: enviarMasivo, isPending } = useEnviarMasivo()
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    initialValues: {
      segmento: 'todos',
      rango: [mesInicial.desde, mesInicial.hasta],
      asunto: '',
      mensaje: '',
    },
    validate: {
      rango: (val, values) => {
        if (values.segmento !== 'clientes_turnos_activos') return null
        const d = val?.[0] ? String(val[0]).slice(0, 10) : null
        const h = val?.[1] ? String(val[1]).slice(0, 10) : null
        if (!d || !h) return 'Elegí el rango de fechas completo.'
        if (d > h) return 'La fecha de inicio no puede ser posterior a la de fin.'
        return null
      },
      asunto: (v) => {
        const s = v.trim()
        if (!s) return 'El asunto es obligatorio.'
        if (s.length > 255) return 'El asunto no puede superar los 255 caracteres.'
        return null
      },
      mensaje: (v) => (v.trim() ? null : 'El mensaje es obligatorio.'),
    },
  })

  const requiereRango = form.values.segmento === 'clientes_turnos_activos'
  const desde = requiereRango && form.values.rango?.[0] ? String(form.values.rango[0]).slice(0, 10) : undefined
  const hasta = requiereRango && form.values.rango?.[1] ? String(form.values.rango[1]).slice(0, 10) : undefined

  const [paramsDebounced] = useDebouncedValue(
    { tipo: form.values.segmento, desde, hasta },
    250,
  )

  const {
    data: preview,
    isLoading: cargandoPreview,
    isError: errorPreview,
    error: errPreview,
    refetch: refetchPreview,
  } = usePreviewSegmento(paramsDebounced)

  const cantidad = preview?.cantidad ?? 0
  const muestra = preview?.muestra ?? []
  const restoMuestra = Math.max(0, cantidad - muestra.length)

  const formListo =
    Boolean(form.values.asunto.trim()) &&
    Boolean(form.values.mensaje.trim()) &&
    (!requiereRango || (Boolean(desde) && Boolean(hasta) && desde <= hasta))

  const abrirConfirmacion = () => {
    if (cantidad <= 0) return
    setConfirmOpened(true)
  }

  const confirmarEnvioMasivo = () => {
    enviarMasivo(
      {
        segmento: form.values.segmento,
        desde,
        hasta,
        asunto: form.values.asunto.trim(),
        mensaje: form.values.mensaje.trim(),
      },
      {
        onSuccess: (res) => {
          setConfirmOpened(false)
          form.setFieldValue('asunto', '')
          form.setFieldValue('mensaje', '')
          const total = res?.cantidad ?? cantidad
          notifications.show({
            title: 'Comunicación enviada',
            message: `Envío iniciado: ${total} destinatarios. Mirá el resultado en el Historial.`,
            position: 'top-right',
            icon: <IconCheck size={16} />,
            color: 'green',
            autoClose: 4500,
          })
        },
        onError: (err) => {
          setConfirmOpened(false)
          notifications.show({
            title: 'No se pudo realizar el envío masivo',
            message: errorMessage(err?.code) || err?.message || 'Ocurrió un error al enviar los correos.',
            position: 'top-right',
            icon: <IconX size={16} />,
            color: 'red',
            autoClose: 5000,
          })
        },
      },
    )
  }

  return (
    <>
      <Paper withBorder p="lg" radius="lg">
        <form onSubmit={form.onSubmit(abrirConfirmacion)} noValidate>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: requiereRango ? 2 : 1 }} spacing="md">
              <Select
                label="Segmento"
                withAsterisk
                data={SEGMENTOS}
                allowDeselect={false}
                disabled={isPending}
                {...form.getInputProps('segmento')}
              />

              {requiereRango && (
                <DatePickerInput
                  type="range"
                  label="Período de turnos"
                  placeholder="Desde — Hasta"
                  withAsterisk
                  locale="es"
                  valueFormat="DD/MM/YYYY"
                  allowSingleDateInRange
                  leftSection={<IconCalendarEvent size={16} />}
                  value={form.values.rango}
                  onChange={(val) => form.setFieldValue('rango', val ?? [null, null])}
                  error={form.errors.rango}
                  disabled={isPending}
                />
              )}
            </SimpleGrid>

            <Paper withBorder p="md" radius="md">
              <Stack gap="xs">
                <Group gap="xs" align="center">
                  <ThemeIcon variant="light" color="brand" size="sm" radius="md">
                    <IconEye size={14} />
                  </ThemeIcon>
                  <Text fw={600} fz="sm">Vista previa del segmento</Text>
                </Group>

                {requiereRango && (!desde || !hasta) && (
                  <Text fz="sm" c="dimmed">
                    Elegí las fechas de inicio y fin para calcular los destinatarios.
                  </Text>
                )}

                {cargandoPreview && (
                  <Group py="sm">
                    <Loader size="sm" />
                    <Text fz="sm" c="dimmed">Calculando destinatarios…</Text>
                  </Group>
                )}

                {errorPreview && (
                  <QueryError
                    message={errPreview?.message || 'No se pudo previsualizar el segmento'}
                    onRetry={refetchPreview}
                  />
                )}

                {!cargandoPreview && !errorPreview && (!requiereRango || (desde && hasta)) && (
                  <>
                    <Group align="baseline" gap="xs">
                      <Text fz={40} fw={700} lh={1.1}>
                        {cantidad}
                      </Text>
                      <Text fz="sm" c="dimmed" fw={500}>
                        destinatarios
                      </Text>
                    </Group>

                    {cantidad > 0 ? (
                      <Text fz="sm" c="dimmed">
                        Muestra: {muestra.join(', ')}
                        {restoMuestra > 0 ? ` (+${restoMuestra} más)` : ''}
                      </Text>
                    ) : (
                      <Alert
                        variant="light"
                        color="yellow"
                        icon={<IconAlertTriangle size={18} />}
                      >
                        Este segmento no tiene destinatarios todavía.
                      </Alert>
                    )}
                  </>
                )}
              </Stack>
            </Paper>

            <TextInput
              label="Asunto"
              placeholder="Ej.: Nuevo horario de atención en feriados"
              withAsterisk
              maxLength={255}
              disabled={isPending}
              {...form.getInputProps('asunto')}
            />

            <Textarea
              label="Mensaje"
              placeholder="Escribí el comunicado para todo el segmento..."
              withAsterisk
              autosize
              minRows={4}
              maxRows={10}
              maxLength={10000}
              disabled={isPending}
              {...form.getInputProps('mensaje')}
            />

            <Group justify="flex-end">
              <Button
                type="submit"
                leftSection={<IconSend size={16} />}
                disabled={cantidad <= 0 || !formListo || cargandoPreview}
                loading={isPending}
              >
                {`Enviar a ${cantidad} personas`}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <ConfirmarEnvioModal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        onConfirm={confirmarEnvioMasivo}
        tipo="masivo"
        asunto={form.values.asunto.trim()}
        cantidad={cantidad}
        isPending={isPending}
      />
    </>
  )
}
