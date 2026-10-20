import { useEffect } from 'react'
import {
  Alert, Button, Group, Modal, SegmentedControl, Stack, Text, Textarea, TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconSpeakerphone } from '@tabler/icons-react'
import { AvisoIcon } from '../../../components/AvisoIcon.jsx'
import { useCrearAviso, useEditarAviso } from '../../../hooks/useAvisos.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'
import { avisoTipo } from '../../../utils/avisos.js'

const TIPOS = [
  { value: 'info', label: 'Info' },
  { value: 'advertencia', label: 'Advertencia' },
  { value: 'critico', label: 'Crítico' },
]

const aFormulario = (aviso) => ({
  titulo: aviso?.titulo ?? '',
  tipo: aviso?.tipo ?? 'info',
  mensaje: aviso?.mensaje ?? '',
  vigencia: [
    aviso?.vigente_desde ?? null,
    aviso?.vigente_hasta ?? null,
  ],
})

const aPayload = (values, activo = true) => ({
  titulo: values.titulo.trim(),
  tipo: values.tipo,
  mensaje: values.mensaje.trim(),
  activo,
  vigente_desde: values.vigencia?.[0] ?? null,
  vigente_hasta: values.vigencia?.[1] ?? null,
})

export function AvisoModal({ opened, onClose, aviso }) {
  const esEdicion = Boolean(aviso)
  const { mutate: crear, isPending: isCreating } = useCrearAviso()
  const { mutate: editar, isPending: isEditing } = useEditarAviso()
  const isPending = isCreating || isEditing
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    initialValues: aFormulario(aviso),
    validate: {
      titulo: (value) => {
        if (!value.trim()) return 'El título es obligatorio'
        return value.trim().length > 150 ? 'El título no puede superar los 150 caracteres' : null
      },
      mensaje: (value) => (value.trim() ? null : 'El mensaje es obligatorio'),
      vigencia: (value) => (
        value?.[0] && value?.[1] && value[0] > value[1]
          ? 'La fecha hasta no puede ser anterior a la fecha desde'
          : null
      ),
    },
  })

  useEffect(() => {
    if (!opened) return
    form.setValues(aFormulario(aviso))
    form.clearErrors()
    // `form` es estable: solo re-sincronizamos al abrir o cambiar de aviso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, aviso])

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  const guardar = (values) => {
    const payload = aPayload(values, aviso?.activo ?? true)
    const opciones = {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          title: esEdicion ? 'Aviso actualizado.' : 'Aviso publicado.',
          message: 'El cambio ya está disponible para el centro.',
          position: 'top-right',
        })
        onClose()
      },
      onError: (err) => {
        const fieldErrors = err?.fieldErrors && typeof err.fieldErrors === 'object'
          ? Object.entries(err.fieldErrors).filter(([, mensajes]) => mensajes?.length > 0)
          : []

        if (fieldErrors.length > 0) {
          for (const [campo, mensajes] of fieldErrors) form.setFieldError(campo, mensajes[0])
          return
        }

        notifications.show({
          color: 'red',
          title: 'No se pudo guardar el aviso',
          message: errorMessage(err.code),
          position: 'top-right',
        })
      },
    }

    if (esEdicion) editar({ id: aviso.id, ...payload }, opciones)
    else crear(payload, opciones)
  }

  const tipo = avisoTipo(form.values.tipo)

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      size="md"
      title={esEdicion ? 'Editar aviso' : 'Nuevo aviso'}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      withCloseButton={!isPending}
    >
      <form onSubmit={form.onSubmit(guardar)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Título"
            placeholder="Ej: Corte de luz programado"
            required
            maxLength={150}
            {...form.getInputProps('titulo')}
          />

          <Stack gap={6}>
            <Text fz="sm" fw={500}>Tipo</Text>
            <SegmentedControl
              fullWidth
              data={TIPOS}
              {...form.getInputProps('tipo')}
            />
          </Stack>

          <Textarea
            label="Mensaje"
            placeholder="Contale al centro qué está pasando y qué tiene que hacer."
            required
            autosize
            minRows={3}
            maxRows={8}
            maxLength={20000}
            {...form.getInputProps('mensaje')}
          />

          <DatePickerInput
            type="range"
            label="Vigencia (opcional)"
            description="Sin fechas, el aviso se muestra mientras esté activo."
            placeholder="Elegí el rango de fechas"
            clearable
            valueFormat="DD/MM/YYYY"
            locale="es"
            value={form.values.vigencia}
            onChange={(value) => form.setFieldValue('vigencia', value ?? [null, null])}
            error={form.errors.vigencia}
          />

          <Stack gap={6}>
            <Text fz="sm" fw={500}>Así se va a ver</Text>
            <Alert
              color={tipo.color}
              variant="light"
              icon={<AvisoIcon tipo={form.values.tipo} />}
              title={form.values.titulo.trim() || 'Título del aviso'}
            >
              <Text fz="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {form.values.mensaje.trim() || 'Mensaje del aviso.'}
              </Text>
            </Alert>
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrar} disabled={isPending}>Cancelar</Button>
            <Button
              type="submit"
              leftSection={esEdicion ? <IconDeviceFloppy size={18} /> : <IconSpeakerphone size={18} />}
              loading={isPending}
            >
              {esEdicion ? 'Guardar cambios' : 'Publicar aviso'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
