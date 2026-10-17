import { useState } from 'react'
import { Group, Text, Paper, Table, Anchor, Divider, Menu, ActionIcon } from '@mantine/core'
import { Link } from 'react-router-dom'
import {
  IconTable,
  IconDotsVertical,
  IconCalendarEvent,
  IconPlayerPlay,
  IconUserOff,
  IconCircleCheck,
  IconX,
  IconHistory,
} from '@tabler/icons-react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'
import { accionesProfesional, claveAccion } from '../../../utils/estadosTurno.js'
import { useAccionesTurnoProf } from '../../turnos/useAccionesTurnoProf.js'
import { ConfirmarEstadoModal } from '../../turnos/ConfirmarEstadoModal.jsx'
import { ReprogramarTurnoModal } from '../../turnos/ReprogramarTurnoModal.jsx'
import { TurnoHistorialModal } from '../../turnos/TurnoHistorialModal.jsx'
import { CancelarTurnoProfModal } from '../../turnos/CancelarTurnoProfModal.jsx'

const ICONO_ACCION = {
  reprogramar: <IconCalendarEvent size={14} />,
  en_curso: <IconPlayerPlay size={14} />,
  ausente: <IconUserOff size={14} />,
  completado: <IconCircleCheck size={14} />,
}

export function TurnosDeHoy({ turnos = [], dniProfesional }) {
  const acciones = useAccionesTurnoProf()
  const [cancelModalItem, setCancelModalItem] = useState(null)

  const handleOpenCancel = (turno) => {
    setCancelModalItem(turno)
  }

  const handleCloseCancel = () => {
    if (acciones.cancelar.isPending) return
    setCancelModalItem(null)
  }

  const handleConfirmCancel = (motivo) => {
    if (!cancelModalItem) return
    acciones.cancelar.mutate(
      { id: cancelModalItem.id_turno, motivo },
      { onSuccess: () => setCancelModalItem(null) },
    )
  }

  return (
    <Paper
      className="col-span-3"
      withBorder
      radius="lg"
      p="lg"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Group mb="md" align="center" justify="end">
        <Group gap="xs" style={{ flex: 1 }}>
          <IconTable stroke={2} size={16} />
          <Text fw={700} fz="lg">Turnos de hoy</Text>
        </Group>
        <Anchor
          component={Link}
          to="/agenda"
          fz="sm"
          fw={500}
          visibleFrom="sm"
          style={{ width: 120, textAlign: 'center' }}
        >
          Ver agenda →
        </Anchor>
      </Group>
      <Divider size="xs" mt="xs" />

      {turnos.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No hay turnos para hoy</Text>
      ) : (
        <div style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Table verticalSpacing="sm">
            <Table.Tbody>
              {turnos.map((t) => {
                const accionesItem = accionesProfesional(t)

                return (
                  <Table.Tr key={t.id_turno ?? t.id}>
                    <Table.Td w={80}>
                      <Text fw={700} fz="sm">{t.hora ?? t.hora_turno?.slice(0, 5)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <UserAvatar
                          size={32}
                          radius="100%"
                          withLink={false}
                          src={t.foto_url}
                          name={t.paciente ?? `${t.nombre} ${t.apellido}`}
                        />
                        <Text fz="sm">{t.paciente ?? `${t.nombre} ${t.apellido}`}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td w={180} ta="center">
                      <EstadoTurnoBadge
                        estado={t.estado}
                        style={{ minWidth: 90, justifyContent: 'center' }}
                      />
                    </Table.Td>
                    <Table.Td w={50} ta="right">
                      <Menu shadow="md" position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" aria-label="Opciones de turno">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          {accionesItem.map((accion) => accion.cancelar ? (
                            <Menu.Item
                              key="cancelar"
                              color="red"
                              leftSection={<IconX size={14} />}
                              onClick={() => handleOpenCancel(t)}
                            >
                              {accion.label}
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              key={claveAccion(accion)}
                              leftSection={ICONO_ACCION[claveAccion(accion)]}
                              disabled={acciones.cambiandoEstado}
                              onClick={() => acciones.ejecutar(t, accion)}
                            >
                              {accion.label}
                            </Menu.Item>
                          ))}

                          {accionesItem.length > 0 && <Menu.Divider />}
                          <Menu.Item
                            leftSection={<IconHistory size={14} />}
                            onClick={() => acciones.abrirHistorial(t)}
                          >
                            Ver historial
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <ConfirmarEstadoModal
        opened={Boolean(acciones.confirmacion)}
        confirmacion={acciones.confirmacion}
        turno={acciones.confirmacion?.turno}
        accion={acciones.confirmacion?.accion}
        onClose={acciones.cerrarConfirmacion}
        onConfirm={acciones.confirmar}
        isPending={acciones.cambiandoEstado}
      />

      <ReprogramarTurnoModal
        opened={Boolean(acciones.reprogramando)}
        turno={acciones.reprogramando}
        dniProfesional={dniProfesional}
        onClose={acciones.cerrarReprogramar}
      />

      <TurnoHistorialModal
        opened={Boolean(acciones.historialId)}
        turnoId={acciones.historialId}
        onClose={acciones.cerrarHistorial}
      />

      <CancelarTurnoProfModal
        opened={Boolean(cancelModalItem)}
        onClose={handleCloseCancel}
        onConfirm={handleConfirmCancel}
        turno={cancelModalItem}
        isPending={acciones.cancelar.isPending}
      />
    </Paper>
  )
}
