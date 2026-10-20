import { useEffect } from 'react'
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy } from '@tabler/icons-react'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'
import { useCrearCatalogoItem, useEditarCatalogoItem } from '../../../hooks/useAdminCatalogos.jsx'
import { CATALOGO_CONFIG } from './config.js'

export function CatalogoItemModal({ opened, onClose, recurso, item }) {
  const config = CATALOGO_CONFIG[recurso]
  const esEdicion = Boolean(item)

  const { errorMessage } = useGetErrosMsg()
  const { mutate: crear, isPending: creando } = useCrearCatalogoItem()
  const { mutate: editar, isPending: editando } = useEditarCatalogoItem()
  const isPending = esEdicion ? editando : creando

  const form = useForm({
    initialValues: { nombre: '' },
    validate: {
      nombre: (value) => {
        if (!value.trim()) return 'El nombre es obligatorio'
        if (value.trim().length > config.maxLength) {
          return `El nombre no puede superar los ${config.maxLength} caracteres`
        }
        return null
      },
    },
  })

  useEffect(() => {
    if (!opened) return
    form.setValues({ nombre: item?.nombre ?? '' })
    form.clearErrors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, item])

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  const guardar = (values) => {
    const nombre = values.nombre.trim()
    const mutation = esEdicion ? editar : crear
    const variables = esEdicion
      ? { recurso, id: item.id, nombre }
      : { recurso, nombre }

    mutation(variables, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          title: esEdicion ? 'Cambios guardados.' : config.mensajeCreada,
          position: 'top-right',
        })
        onClose()
      },
      onError: (err) => {
        if (err?.code === 'DUPLICATE_NAME') {
          form.setFieldError('nombre', config.mensajeDuplicado)
          return
        }

        notifications.show({
          color: 'red',
          title: 'No se pudieron guardar los cambios',
          message: errorMessage(err?.code),
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
      size="sm"
      title={esEdicion ? config.editarTitulo : config.nuevaTitulo}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <form onSubmit={(event) => form.onSubmit(guardar)(event)} noValidate>
        <Stack gap="lg">
          <TextInput
            label="Nombre"
            placeholder={`Ej: ${recurso === 'especialidades' ? 'Cardiología' : 'OSDE'}`}
            required
            maxLength={config.maxLength}
            data-autofocus
            {...form.getInputProps('nombre')}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>Cancelar</Button>
            <Button
              type="submit"
              radius="md"
              leftSection={<IconDeviceFloppy size={18} />}
              loading={isPending}
            >
              {esEdicion ? 'Guardar cambios' : `Crear ${config.singular}`}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
