import { useState } from 'react'
import {
  ActionIcon, Button, Center, Group, Loader, Paper, Stack, Switch, Table, Text, TextInput,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPencil, IconPlus, IconSearch } from '@tabler/icons-react'
import QueryError from '../../../components/QueryError.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'
import { useCambiarEstadoCatalogoItem, useCatalogo } from '../../../hooks/useAdminCatalogos.jsx'
import { CATALOGO_CONFIG } from './config.js'
import { CatalogoItemModal } from './CatalogoItemModal.jsx'
import { ProfesionalesAsociadosDrawer } from './ProfesionalesAsociadosDrawer.jsx'

const profesionalesLabel = (cantidad) => (
  cantidad === 1 ? '1 profesional' : `${cantidad} profesionales`
)

export function CatalogoTabla({ recurso }) {
  const config = CATALOGO_CONFIG[recurso]
  const { errorMessage } = useGetErrosMsg()

  const [q, setQ] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [itemDrawer, setItemDrawer] = useState(null)

  const { data: items = [], isPending, isError, error, refetch } = useCatalogo(recurso)
  const { mutate: cambiarEstado, isPending: cambiandoEstado } = useCambiarEstadoCatalogoItem()

  const busqueda = q.trim().toLowerCase()
  const filtrados = busqueda
    ? items.filter((item) => item.nombre.toLowerCase().includes(busqueda))
    : items

  const abrirCrear = () => {
    setItemEditar(null)
    setModalAbierto(true)
  }

  const abrirEditar = (item) => {
    setItemEditar(item)
    setModalAbierto(true)
  }

  const handleEstado = (item, activo) => {
    cambiarEstado({ recurso, id: item.id, activo }, {
      onSuccess: () => notifications.show({
        color: 'green',
        title: activo ? config.mensajeHabilitada : config.mensajeDeshabilitada,
        position: 'top-right',
      }),
      onError: (err) => notifications.show({
        color: 'red',
        title: 'No se pudo cambiar el estado',
        message: errorMessage(err?.code),
        position: 'top-right',
      }),
    })
  }

  let contenido

  if (isPending) {
    contenido = <Center h="30vh"><Loader /></Center>
  } else if (isError) {
    contenido = <QueryError message={error.message} onRetry={refetch} />
  } else if (items.length === 0) {
    contenido = (
      <Center h="25vh">
        <Stack align="center" gap="xs">
          <Text c="dimmed">No hay {config.plural} cargadas.</Text>
          <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={abrirCrear}>
            {config.nueva}
          </Button>
        </Stack>
      </Center>
    )
  } else if (filtrados.length === 0) {
    contenido = (
      <Center h="25vh">
        <Stack align="center" gap="xs">
          <Text c="dimmed">No hay {config.plural} que coincidan con la búsqueda.</Text>
          <Button variant="default" size="xs" onClick={() => setQ('')}>Limpiar búsqueda</Button>
        </Stack>
      </Center>
    )
  } else {
    contenido = (
      <Table.ScrollContainer minWidth={520}>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Profesionales</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtrados.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td><Text fw={500}>{item.nombre}</Text></Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Switch
                      size="sm"
                      checked={item.activo}
                      disabled={cambiandoEstado}
                      onChange={(event) => handleEstado(item, event.currentTarget.checked)}
                      aria-label={`${config.Singular} ${item.nombre}: ${item.activo ? 'activa' : 'inactiva'}`}
                    />
                    <Text fz="sm">{item.activo ? 'Activa' : 'Inactiva'}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {item.profesionales > 0 ? (
                    <Button variant="subtle" size="xs" onClick={() => setItemDrawer(item)}>
                      {profesionalesLabel(item.profesionales)}
                    </Button>
                  ) : (
                    <Text c="dimmed" fz="sm">0</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <ActionIcon
                      variant="light"
                      aria-label={`Editar ${config.singular} ${item.nombre}`}
                      onClick={() => abrirEditar(item)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    )
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end" gap="sm" wrap="wrap">
          <TextInput
            placeholder={config.buscarPlaceholder}
            leftSection={<IconSearch size={16} />}
            value={q}
            onChange={(event) => setQ(event.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={abrirCrear}>
            {config.nueva}
          </Button>
        </Group>

        {contenido}
      </Stack>

      <CatalogoItemModal
        opened={modalAbierto}
        onClose={() => setModalAbierto(false)}
        recurso={recurso}
        item={itemEditar}
      />
      <ProfesionalesAsociadosDrawer
        opened={Boolean(itemDrawer)}
        onClose={() => setItemDrawer(null)}
        recurso={recurso}
        item={itemDrawer}
      />
    </Paper>
  )
}
