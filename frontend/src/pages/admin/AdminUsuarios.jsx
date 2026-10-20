import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Center, Group, Loader, Paper, Select, SimpleGrid, Stack, Table, Text, TextInput, ThemeIcon,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch, IconUserSearch, IconUsers } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { useUsuarios } from '../../hooks/useAdminUsuarios.jsx'
import { useIsDesktop } from '../../hooks/useIsDesktop.js'
import { EstadoCuentaBadge } from './usuarios/EstadoCuentaBadge.jsx'
import { RolCuentaBadge } from './usuarios/RolCuentaBadge.jsx'
import { UsuarioCard } from './usuarios/UsuarioCard.jsx'

const ROLES = [
  { value: '', label: 'Todos los roles' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'admin', label: 'Admin' },
]

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'activa', label: 'Activa' },
  { value: 'suspendida', label: 'Suspendida' },
  { value: 'baja', label: 'Baja' },
]

const nombreCompleto = (usuario) => `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()

export default function AdminUsuarios() {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop('sm')

  const [q, setQ] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')
  const [qDebounced] = useDebouncedValue(q, 300)

  const filtros = { q: qDebounced.trim(), rol: rol || undefined, estado: estado || undefined }
  const hayFiltros = Boolean(q.trim() || rol || estado)

  const { data: usuarios = [], isPending, isError, error, refetch } = useUsuarios(filtros)

  const limpiarFiltros = () => {
    setQ('')
    setRol('')
    setEstado('')
  }

  const verFicha = (usuario) => navigate(`/admin/usuarios/${usuario.dni}/${usuario.rol}`)
  const contador = `${usuarios.length} ${usuarios.length === 1 ? 'cuenta' : 'cuentas'}`

  let contenido

  if (isPending) {
    contenido = <Center h="30vh"><Loader /></Center>
  } else if (isError) {
    contenido = <QueryError message={error.message} onRetry={refetch} />
  } else if (usuarios.length === 0) {
    contenido = (
      <Center h="30vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light">
            {hayFiltros ? <IconUserSearch size={26} /> : <IconUsers size={26} />}
          </ThemeIcon>
          <Text c="dimmed">
            {hayFiltros ? 'No hay cuentas que coincidan con los filtros.' : 'Todavía no hay cuentas registradas.'}
          </Text>
          {hayFiltros && <Button variant="default" size="xs" onClick={limpiarFiltros}>Limpiar filtros</Button>}
        </Stack>
      </Center>
    )
  } else if (isDesktop) {
    contenido = (
      <Stack gap="xs">
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={760}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>DNI</Table.Th>
                  <Table.Th>Correo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usuarios.map((usuario) => {
                  const nombre = nombreCompleto(usuario)

                  return (
                    <Table.Tr key={`${usuario.dni}-${usuario.rol}`}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                          <UserAvatar size={32} withLink={false} src={usuario.foto_url} name={nombre} />
                          <Text fw={500} lineClamp={1} title={nombre}>{nombre}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><RolCuentaBadge rol={usuario.rol} /></Table.Td>
                      <Table.Td>{usuario.dni}</Table.Td>
                      <Table.Td>
                        <Text fz="sm" lineClamp={1} title={usuario.correo}>{usuario.correo}</Text>
                      </Table.Td>
                      <Table.Td><EstadoCuentaBadge estado={usuario.estado} /></Table.Td>
                      <Table.Td>
                        <Group justify="flex-end">
                          <Button size="xs" variant="light" onClick={() => verFicha(usuario)}>Ver ficha</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
        <Text fz="sm" c="dimmed">{contador}</Text>
      </Stack>
    )
  } else {
    contenido = (
      <Stack gap="xs">
        {usuarios.map((usuario) => (
          <UsuarioCard
            key={`${usuario.dni}-${usuario.rol}`}
            usuario={usuario}
            onVerFicha={() => verFicha(usuario)}
          />
        ))}
        <Text fz="sm" c="dimmed">{contador}</Text>
      </Stack>
    )
  }

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Buscá y gestioná las cuentas del centro." />

      <Stack gap="lg">
        <Paper withBorder p="md" radius="md">
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 4 }}
            spacing="md"
            style={{ alignItems: 'end' }}
          >
            <TextInput
              label="Buscar"
              placeholder="Nombre, apellido, DNI o correo…"
              leftSection={<IconSearch size={16} />}
              value={q}
              onChange={(event) => setQ(event.currentTarget.value)}
            />
            <Select
              label="Rol"
              placeholder="Todos los roles"
              data={ROLES}
              value={rol}
              onChange={(value) => setRol(value ?? '')}
              allowDeselect={false}
            />
            <Select
              label="Estado"
              placeholder="Todos los estados"
              data={ESTADOS}
              value={estado}
              onChange={(value) => setEstado(value ?? '')}
              allowDeselect={false}
            />
            {hayFiltros && (
              <Button variant="default" onClick={limpiarFiltros}>Limpiar filtros</Button>
            )}
          </SimpleGrid>
        </Paper>

        {contenido}
      </Stack>
    </>
  )
}
