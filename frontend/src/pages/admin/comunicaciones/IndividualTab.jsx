import { useState } from 'react'
import { Button, Group, Paper, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconSend, IconX } from '@tabler/icons-react'
import { useEnviarIndividual } from '../../../hooks/useAdminComunicaciones.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'
import { ConfirmarEnvioModal } from './ConfirmarEnvioModal.jsx'

const ROLES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'admin', label: 'Administrador' },
]

export function IndividualTab() {
  const [confirmOpened, setConfirmOpened] = useState(false)
  const { mutate: enviar, isPending } = useEnviarIndividual()
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    initialValues: {
      dni: '',
      rol: 'cliente',
      asunto: '',
      mensaje: '',
    },
    validate: {
      dni: (v) => (/^\d{7,8}$/.test(String(v).trim()) ? null : 'Ingresá un DNI válido de 7 u 8 dígitos.'),
      rol: (v) => (v ? null : 'Elegí un rol.'),
      asunto: (v) => {
        const s = v.trim()
        if (!s) return 'El asunto es obligatorio.'
        if (s.length > 255) return 'El asunto no puede superar los 255 caracteres.'
        return null
      },
      mensaje: (v) => (v.trim() ? null : 'El mensaje es obligatorio.'),
    },
  })

  const abrirConfirmacion = () => {
    setConfirmOpened(true)
  }

  const confirmarEnvio = () => {
    const payload = {
      dni: Number(String(form.values.dni).trim()),
      rol: form.values.rol,
      asunto: form.values.asunto.trim(),
      mensaje: form.values.mensaje.trim(),
    }

    enviar(payload, {
      onSuccess: () => {
        setConfirmOpened(false)
        form.reset()
        notifications.show({
          title: 'Correo enviado',
          message: 'Correo enviado.',
          position: 'top-right',
          icon: <IconCheck size={16} />,
          color: 'green',
          autoClose: 3500,
        })
      },
      onError: (err) => {
        setConfirmOpened(false)
        if (err?.status === 404 || err?.code === 'NOT_FOUND') {
          form.setFieldError('dni', 'No existe una cuenta con ese DNI y ese rol.')
          return
        }
        notifications.show({
          title: 'No se pudo enviar el correo',
          message: errorMessage(err?.code) || err?.message || 'Ocurrió un error al enviar el correo.',
          position: 'top-right',
          icon: <IconX size={16} />,
          color: 'red',
          autoClose: 5000,
        })
      },
    })
  }

  return (
    <>
      <Paper withBorder p="lg" radius="lg">
        <form onSubmit={form.onSubmit(abrirConfirmacion)} noValidate>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="DNI"
                placeholder="Ej.: 22456789"
                withAsterisk
                maxLength={8}
                disabled={isPending}
                {...form.getInputProps('dni')}
              />

              <Select
                label="Rol"
                withAsterisk
                data={ROLES}
                allowDeselect={false}
                disabled={isPending}
                {...form.getInputProps('rol')}
              />
            </SimpleGrid>

            <TextInput
              label="Asunto"
              placeholder="Ej.: Recordatorio sobre tu turno"
              withAsterisk
              maxLength={255}
              disabled={isPending}
              {...form.getInputProps('asunto')}
            />

            <Textarea
              label="Mensaje"
              placeholder="Escribí el mensaje que va a recibir la persona..."
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
                loading={isPending}
              >
                Enviar correo
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <ConfirmarEnvioModal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        onConfirm={confirmarEnvio}
        tipo="individual"
        dni={String(form.values.dni).trim()}
        rol={form.values.rol}
        asunto={form.values.asunto.trim()}
        isPending={isPending}
      />
    </>
  )
}
