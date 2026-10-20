import { useState } from 'react'
import {
  Alert, Button, Center, Group, Loader, Paper, Stack, Text, ThemeIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSpeakerphone } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { useConfiguracion } from '../../hooks/useConfiguracion.jsx'
import { useAvisosAdmin, useEditarAviso } from '../../hooks/useAvisos.jsx'
import useGetErrosMsg from '../../hooks/useGetErrosMsg.jsx'
import { ConfiguracionForm } from './configuracion/ConfiguracionForm.jsx'
import { AvisoItem } from './configuracion/AvisoItem.jsx'
import { AvisoModal } from './configuracion/AvisoModal.jsx'
import { EliminarAvisoModal } from './configuracion/EliminarAvisoModal.jsx'

export default function AdminConfiguracion() {
  const configQuery = useConfiguracion()
  const avisosQuery = useAvisosAdmin()
  const { errorMessage } = useGetErrosMsg()

  const { mutate: editarAviso, isPending: isToggling, variables: toggleVariables } = useEditarAviso()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [avisoEditando, setAvisoEditando] = useState(null)
  const [avisoAEliminar, setAvisoAEliminar] = useState(null)

  const abrirNuevo = () => {
    setAvisoEditando(null)
    setModalAbierto(true)
  }

  const abrirEditar = (aviso) => {
    setAvisoEditando(aviso)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setAvisoEditando(null)
  }

  const alternarActivo = (aviso, activo) => {
    editarAviso({
      id: aviso.id,
      titulo: aviso.titulo,
      mensaje: aviso.mensaje,
      tipo: aviso.tipo,
      activo,
      vigente_desde: aviso.vigente_desde ?? null,
      vigente_hasta: aviso.vigente_hasta ?? null,
    }, {
      onSuccess: () => notifications.show({
        color: 'green',
        title: activo ? 'Aviso activado.' : 'Aviso desactivado.',
        message: activo
          ? 'Vuelve a mostrarse en el banner si está vigente.'
          : 'Dejó de mostrarse en el banner.',
        position: 'top-right',
      }),
      onError: (err) => notifications.show({
        color: 'red',
        title: 'No se pudo actualizar el aviso',
        message: errorMessage(err.code),
        position: 'top-right',
      }),
    })
  }

  let contenidoConfig
  if (configQuery.isPending) {
    contenidoConfig = <Center h="30vh"><Loader /></Center>
  } else if (configQuery.isError) {
    contenidoConfig = (
      <QueryError
        message={configQuery.error.message}
        onRetry={configQuery.refetch}
      />
    )
  } else {
    contenidoConfig = <ConfiguracionForm configuracion={configQuery.data} />
  }

  let contenidoAvisos
  if (avisosQuery.isPending) {
    contenidoAvisos = <Center py="xl"><Loader /></Center>
  } else if (avisosQuery.isError) {
    contenidoAvisos = (
      <Alert color="red" variant="light" title="No pudimos cargar los avisos">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text fz="sm">{avisosQuery.error.message}</Text>
          <Button size="xs" color="red" variant="light" onClick={avisosQuery.refetch}>
            Reintentar
          </Button>
        </Group>
      </Alert>
    )
  } else if (avisosQuery.data.length === 0) {
    contenidoAvisos = (
      <Center py="xl">
        <Text c="dimmed">No hay avisos. Creá uno para comunicar algo a todo el centro.</Text>
      </Center>
    )
  } else {
    contenidoAvisos = (
      <Stack gap="sm">
        {avisosQuery.data.map((aviso) => (
          <AvisoItem
            key={aviso.id}
            aviso={aviso}
            onEditar={abrirEditar}
            onEliminar={setAvisoAEliminar}
            onToggle={alternarActivo}
            togglePending={isToggling && toggleVariables?.id === aviso.id}
          />
        ))}
      </Stack>
    )
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Datos del centro, políticas de turnos y avisos."
      />

      <Stack gap="lg">
        {contenidoConfig}

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm" mb="md">
            <Group gap="sm">
              <ThemeIcon variant="light" size="lg" radius="md"><IconSpeakerphone size={20} /></ThemeIcon>
              <Stack gap={0}>
                <Text fw={600} fz="lg">Avisos</Text>
                <Text fz="sm" c="dimmed">Mensajes para todas las personas del centro.</Text>
              </Stack>
            </Group>
            <Button leftSection={<IconPlus size={18} />} onClick={abrirNuevo}>
              Nuevo aviso
            </Button>
          </Group>
          {contenidoAvisos}
        </Paper>
      </Stack>

      <AvisoModal
        opened={modalAbierto}
        onClose={cerrarModal}
        aviso={avisoEditando}
      />
      <EliminarAvisoModal
        aviso={avisoAEliminar}
        onClose={() => setAvisoAEliminar(null)}
      />
    </>
  )
}
