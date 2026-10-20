import { useEffect } from 'react'
import { Button, Group, Modal, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy } from '@tabler/icons-react'
import { useEditarUsuario } from '../../../hooks/useAdminUsuarios.jsx'
import useObrasSociales from '../../../hooks/useObraSociales.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'

const valoresIniciales = (usuario) => ({
  telefono: usuario?.telefono ?? '',
  obra_social: usuario?.perfil?.obra_social ?? null,
  numero_afiliado: usuario?.perfil?.numero_afiliado ?? '',
  numero_matricula: usuario?.perfil?.numero_matricula ?? '',
  duracion_turno_min: usuario?.perfil?.duracion_turno_min ?? '',
})

export function EditarUsuarioModal({ opened, onClose, usuario }) {
  const esCliente = usuario?.rol === 'cliente'
  const esProfesional = usuario?.rol === 'profesional'

  const { mutate: editar, isPending } = useEditarUsuario()
  const { data: obrasSociales = [] } = useObrasSociales({ enabled: opened && esCliente })
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    initialValues: valoresIniciales(usuario),
    validate: {
      telefono: (value) => (value.length > 30 ? 'El teléfono es demasiado largo' : null),
      numero_afiliado: (value) => (value.length > 30 ? 'El número de afiliado es demasiado largo' : null),
      numero_matricula: (value) => {
        if (!esProfesional) return null
        if (!value.trim()) return 'La matrícula es obligatoria'
        return value.trim().length > 30 ? 'La matrícula es demasiado larga' : null
      },
      duracion_turno_min: (value) => {
        if (!esProfesional) return null
        const minutos = Number(value)
        if (!Number.isInteger(minutos) || minutos < 5 || minutos > 240) {
          return 'La duración debe estar entre 5 y 240 minutos'
        }
        return null
      },
    },
  })

  useEffect(() => {
    if (!opened) return
    form.setValues(valoresIniciales(usuario))
    form.clearErrors()
    // `form` es estable: solo re-sincronizamos al abrir o cambiar de cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, usuario])

  if (!usuario) return null

  const nombre = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()

  // La obra social actual puede estar inactiva: se incluye igual en el Select
  // para poder conservarla sin cambiarla.
  const opcionesObraSocial = obrasSociales
    .filter((obra) => obra.activo === 1 || obra.obra_social === usuario.perfil?.obra_social)
    .map((obra) => ({
      value: obra.obra_social,
      label: obra.activo === 1 ? obra.obra_social : `${obra.obra_social} (inactiva)`,
    }))

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  const guardar = (values) => {
    const payload = {
      telefono: values.telefono.trim() || null,
    }

    if (esCliente) {
      payload.obra_social = values.obra_social || null
      payload.numero_afiliado = values.numero_afiliado.trim() || null
    }

    if (esProfesional) {
      payload.numero_matricula = values.numero_matricula.trim()
      payload.duracion_turno_min = Number(values.duracion_turno_min)
    }

    editar({ dni: usuario.dni, rol: usuario.rol, data: payload }, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          title: 'Datos actualizados.',
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
          title: 'No se pudieron guardar los cambios',
          message: err?.message || errorMessage(err?.code),
          position: 'top-right',
        })
      },
    })
  }

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      centered
      size="md"
      title={`Editar datos de ${nombre}`}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <form onSubmit={form.onSubmit(guardar)} noValidate>
        <Stack gap="md">
          <TextInput label="Teléfono" placeholder="Ej: 11 5555-0000" maxLength={30} {...form.getInputProps('telefono')} />

          {esCliente && (
            <>
              <Select
                label="Obra social"
                placeholder="Sin obra social"
                data={opcionesObraSocial}
                searchable
                clearable
                nothingFoundMessage="No hay obras sociales cargadas"
                {...form.getInputProps('obra_social')}
              />
              <TextInput
                label="N° de afiliado"
                placeholder="Ej: OS1-22456789/00"
                maxLength={30}
                {...form.getInputProps('numero_afiliado')}
              />
            </>
          )}

          {esProfesional && (
            <>
              <TextInput
                label="N° de matrícula"
                placeholder="Ej: MP-10234"
                required
                maxLength={30}
                {...form.getInputProps('numero_matricula')}
              />
              <NumberInput
                label="Duración del turno (min)"
                min={5}
                max={240}
                step={5}
                required
                {...form.getInputProps('duracion_turno_min')}
              />
            </>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>Cancelar</Button>
            <Button type="submit" radius="md" leftSection={<IconDeviceFloppy size={18} />} loading={isPending}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
