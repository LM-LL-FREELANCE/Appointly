import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Anchor, Box, Button, Center, Grid, Group, Loader, Paper, Stack, Table, Text, ThemeIcon, Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle, IconArrowLeft, IconHistory, IconId, IconKey, IconMail, IconPencil, IconPhone,
} from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import {
  useDarDeBajaUsuario, useReactivarUsuario, useResetPasswordUsuario, useSuspenderUsuario, useUsuario,
} from '../../hooks/useAdminUsuarios.jsx'
import useGetErrosMsg from '../../hooks/useGetErrosMsg.jsx'
import { formatFecha, formatFechaHora } from '../../utils/fechas.admin.js'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { EstadoCuentaBadge } from './usuarios/EstadoCuentaBadge.jsx'
import { RolCuentaBadge } from './usuarios/RolCuentaBadge.jsx'
import { EditarUsuarioModal } from './usuarios/EditarUsuarioModal.jsx'
import { SuspenderUsuarioModal } from './usuarios/SuspenderUsuarioModal.jsx'
import { BajaUsuarioModal } from './usuarios/BajaUsuarioModal.jsx'
import { ResetPasswordModal } from './usuarios/ResetPasswordModal.jsx'

const GENERO = { M: 'Masculino', F: 'Femenino', X: 'Prefiero no decirlo' }

function Dato({ label, value }) {
  return (
    <Group gap="md" align="flex-start" wrap="nowrap">
      <Text fz="sm" c="dimmed" w={140} style={{ flexShrink: 0 }}>{label}</Text>
      <Text fz="sm">{value ?? '—'}</Text>
    </Group>
  )
}

function DatoContacto({ icon, value }) {
  return (
    <Group gap={4} wrap="nowrap">
      {icon}
      <Text fz="sm" c="dimmed" lineClamp={1}>{value || '—'}</Text>
    </Group>
  )
}

export default function AdminUsuarioDetalle() {
  const { dni, rol } = useParams()
  const { user: actor } = useAuth()
  const { errorMessage } = useGetErrosMsg()

  const [modal, setModal] = useState(null)

  const { data: usuario, isPending, isError, error, refetch } = useUsuario({ dni, rol })
  const { mutate: suspender, isPending: suspendiendo } = useSuspenderUsuario()
  const { mutate: reactivar, isPending: reactivando } = useReactivarUsuario()
  const { mutate: darDeBaja, isPending: dandoDeBaja } = useDarDeBajaUsuario()
  const { mutate: resetearPassword, isPending: reseteando } = useResetPasswordUsuario()

  if (isPending) {
    return (
      <>
        <PageHeader title="Usuario" subtitle="Ficha completa de la cuenta." />
        <Center h="60vh"><Loader /></Center>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Usuario" subtitle="Ficha completa de la cuenta." />
        <QueryError message={error.message} onRetry={refetch} />
      </>
    )
  }

  const nombre = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()
  const esBaja = usuario.estado === 'baja'
  const esActiva = usuario.estado === 'activa'
  const esPropia = String(actor?.dni) === String(usuario.dni) && actor?.role === usuario.rol
  const perfil = usuario.perfil
  const turnos = usuario.turnos ?? []

  const notificarError = (title) => (err) => notifications.show({
    color: 'red',
    title,
    message: errorMessage(err?.code),
    position: 'top-right',
  })

  const handleSuspender = () => suspender({ dni, rol }, {
    onSuccess: () => {
      setModal(null)
      notifications.show({ color: 'green', title: 'Cuenta suspendida.', position: 'top-right' })
    },
    onError: notificarError('No se pudo suspender la cuenta'),
  })

  const handleReactivar = () => reactivar({ dni, rol }, {
    onSuccess: () => notifications.show({ color: 'green', title: 'Cuenta reactivada.', position: 'top-right' }),
    onError: notificarError('No se pudo reactivar la cuenta'),
  })

  const handleDarDeBaja = () => darDeBaja({ dni, rol }, {
    onSuccess: () => {
      setModal(null)
      notifications.show({ color: 'green', title: 'Cuenta dada de baja.', position: 'top-right' })
    },
    onError: notificarError('No se pudo dar de baja la cuenta'),
  })

  const handleReset = () => resetearPassword({ dni, rol }, {
    onSuccess: () => {
      setModal(null)
      notifications.show({
        color: 'green',
        title: `Correo enviado a ${usuario.correo}.`,
        position: 'top-right',
      })
    },
    onError: notificarError('No se pudo enviar el correo'),
  })

  return (
    <>
      <Anchor
        component={Link}
        to="/admin/usuarios"
        fz="sm"
        c="dimmed"
        style={{ display: 'inline-flex', marginBottom: 4 }}
      >
        <Group gap={4}><IconArrowLeft size={16} /> Volver a Usuarios</Group>
      </Anchor>

      <PageHeader title="Usuario" subtitle="Ficha completa de la cuenta." />

      <Stack gap="lg">
        <Paper withBorder radius="lg" p="md">
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
              <UserAvatar size={64} withLink={false} src={usuario.foto_url} name={nombre} />
              <Stack gap={6} style={{ minWidth: 0 }}>
                <Group gap="sm" wrap="wrap">
                  <Text fw={700} fz="xl">{nombre}</Text>
                  <RolCuentaBadge rol={usuario.rol} />
                  <EstadoCuentaBadge estado={usuario.estado} />
                </Group>
                <Group gap="md" wrap="wrap">
                  <DatoContacto icon={<IconId size={14} />} value={usuario.dni} />
                  <DatoContacto icon={<IconMail size={14} />} value={usuario.correo} />
                  <DatoContacto icon={<IconPhone size={14} />} value={usuario.telefono} />
                </Group>
              </Stack>
            </Group>

            <Group gap="sm">
              <Tooltip label="Reactivá la cuenta para editarla" disabled={!esBaja} position="bottom">
                <Box style={{ display: 'inline-block' }}>
                  <Button
                    leftSection={<IconPencil size={16} />}
                    disabled={esBaja}
                    onClick={() => setModal('editar')}
                  >
                    Editar datos
                  </Button>
                </Box>
              </Tooltip>
              <Tooltip label="Reactivá la cuenta para editarla" disabled={!esBaja} position="bottom">
                <Box style={{ display: 'inline-block' }}>
                  <Button
                    variant="default"
                    leftSection={<IconKey size={16} />}
                    disabled={esBaja}
                    onClick={() => setModal('reset')}
                  >
                    Resetear contraseña
                  </Button>
                </Box>
              </Tooltip>
            </Group>
          </Group>
        </Paper>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Paper withBorder radius="lg" p="md">
                <Text fw={600} mb="sm">Datos personales</Text>
                <Stack gap="xs">
                  <Dato label="Nombre" value={usuario.nombre} />
                  <Dato label="Apellido" value={usuario.apellido} />
                  <Dato label="DNI" value={usuario.dni} />
                  <Dato label="Fecha de nacimiento" value={formatFecha(usuario.fecha_nacimiento)} />
                  <Dato label="Género" value={GENERO[usuario.genero] ?? null} />
                  <Dato label="Correo" value={usuario.correo} />
                  <Dato label="Teléfono" value={usuario.telefono} />
                </Stack>
              </Paper>

              <Paper withBorder radius="lg" p="md">
                <Text fw={600} mb="sm">Datos de la cuenta</Text>
                <Stack gap="xs">
                  <Group gap="md" align="flex-start" wrap="nowrap">
                    <Text fz="sm" c="dimmed" w={140} style={{ flexShrink: 0 }}>Rol</Text>
                    <RolCuentaBadge rol={usuario.rol} />
                  </Group>
                  <Group gap="md" align="flex-start" wrap="nowrap">
                    <Text fz="sm" c="dimmed" w={140} style={{ flexShrink: 0 }}>Estado</Text>
                    <EstadoCuentaBadge estado={usuario.estado} />
                  </Group>
                  <Dato label="Creada el" value={formatFechaHora(usuario.creado_en)} />
                </Stack>
              </Paper>

              {usuario.rol !== 'admin' && perfil && (
                <Paper withBorder radius="lg" p="md">
                  <Text fw={600} mb="sm">Datos del perfil</Text>
                  <Stack gap="xs">
                    {usuario.rol === 'cliente' ? (
                      <>
                        <Dato label="Obra social" value={perfil.obra_social} />
                        <Dato label="N° de afiliado" value={perfil.numero_afiliado} />
                      </>
                    ) : (
                      <>
                        <Dato label="Matrícula" value={perfil.numero_matricula} />
                        <Dato
                          label="Duración del turno"
                          value={perfil.duracion_turno_min ? `${perfil.duracion_turno_min} min` : null}
                        />
                      </>
                    )}
                  </Stack>
                </Paper>
              )}

              <Paper withBorder radius="lg" p="md">
                <Group gap="xs" mb="xs">
                  <IconAlertTriangle size={18} color="var(--mantine-color-yellow-6)" />
                  <Text fw={600}>Zona de riesgo</Text>
                </Group>
                <Text c="dimmed" fz="sm" mb="md">Acciones sensibles sobre esta cuenta.</Text>
                <Stack gap="sm">
                  {esActiva ? (
                    <Button variant="light" color="yellow" onClick={() => setModal('suspender')}>
                      Suspender cuenta
                    </Button>
                  ) : (
                    <Button variant="light" color="teal" onClick={handleReactivar} loading={reactivando}>
                      Reactivar cuenta
                    </Button>
                  )}

                  <Tooltip label="No podés dar de baja tu propia cuenta" disabled={!esPropia}>
                    <Box style={{ display: 'inline-block', width: '100%' }}>
                      <Button
                        variant="light"
                        color="red"
                        fullWidth
                        disabled={esPropia}
                        onClick={() => setModal('baja')}
                      >
                        Dar de baja
                      </Button>
                    </Box>
                  </Tooltip>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder radius="lg" p="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Historial de turnos</Text>
                <Text fz="sm" c="dimmed">Últimos 50 turnos.</Text>
              </Group>

              {turnos.length === 0 ? (
                <Center h={160}>
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={48} radius="xl" variant="light"><IconHistory size={26} /></ThemeIcon>
                    <Text c="dimmed">Sin turnos registrados.</Text>
                  </Stack>
                </Center>
              ) : (
                <Table.ScrollContainer minWidth={560}>
                  <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th>Hora</Table.Th>
                        <Table.Th>Contraparte</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Motivo</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {turnos.map((turno) => {
                        const contraparte = turno.contraparte ?? {}
                        const nombreContraparte = `${contraparte.nombre ?? ''} ${contraparte.apellido ?? ''}`.trim()

                        return (
                          <Table.Tr key={turno.id_turno}>
                            <Table.Td><Text fz="sm">{fechaCorta(turno.fecha_turno)}</Text></Table.Td>
                            <Table.Td><Text fz="sm">{horaCorta(turno.hora_turno)}</Text></Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                <UserAvatar
                                  size={32}
                                  withLink={false}
                                  src={contraparte.foto_url}
                                  name={nombreContraparte}
                                />
                                <Text fz="sm" lineClamp={1} title={nombreContraparte}>{nombreContraparte}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td><EstadoTurnoBadge estado={turno.estado} /></Table.Td>
                            <Table.Td>
                              <Text
                                fz="sm"
                                lineClamp={1}
                                title={turno.motivo_cancelacion || undefined}
                              >
                                {turno.motivo_cancelacion || '—'}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )
                      })}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>

      <EditarUsuarioModal opened={modal === 'editar'} onClose={() => setModal(null)} usuario={usuario} />
      <ResetPasswordModal
        opened={modal === 'reset'}
        onClose={() => setModal(null)}
        onConfirm={handleReset}
        usuario={usuario}
        isPending={reseteando}
      />
      <SuspenderUsuarioModal
        opened={modal === 'suspender'}
        onClose={() => setModal(null)}
        onConfirm={handleSuspender}
        usuario={usuario}
        isPending={suspendiendo}
      />
      <BajaUsuarioModal
        opened={modal === 'baja'}
        onClose={() => setModal(null)}
        onConfirm={handleDarDeBaja}
        usuario={usuario}
        isPending={dandoDeBaja}
      />
    </>
  )
}
