import { useState } from 'react'
import { ActionIcon, Box, Group, Menu, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCircleCheck,
  IconDotsVertical,
  IconHistory,
  IconPlayerPlay,
  IconUserOff,
  IconX,
} from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { accionesProfesional } from '../../utils/estadosTurno.js'
import { CancelarTurnoProfModal } from './CancelarTurnoProfModal.jsx'
import { ConfirmarEstadoModal } from './ConfirmarEstadoModal.jsx'
import { TurnoHistorialModal } from './TurnoHistorialModal.jsx'
import { useAccionesTurnoProf } from './useAccionesTurnoProf.js'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'

const COLUMNS = ['Fecha', 'Hora', 'Paciente', 'Estado', 'Acciones']

// Icon of each action of accionesProfesional(), keyed by target estado.
const ICONO_ACCION = {
  en_curso: <IconPlayerPlay size={14} />,
  ausente: <IconUserOff size={14} />,
  completado: <IconCircleCheck size={14} />,
}

export default function TurnosTableProf({ turnos, ahora }) {
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const acciones = useAccionesTurnoProf()
  const { cancelar: cancelTurno } = acciones
  const isCancelling = cancelTurno.isPending

  const handleOpenCancel = (item) => {
    setSelectedItem(item)
    openCancel()
  }

  const handleCloseCancel = () => {
    if (isCancelling) return
    closeCancel()
    setSelectedItem(null)
  }

  const handleConfirmCancel = (motivo) => {
    cancelTurno.mutate(
      { id: selectedItem.id_turno, motivo },
      { onSuccess: () => { closeCancel(); setSelectedItem(null) } },
    )
  }

  const rows = turnos?.map((item) => {
    return (
      <Table.Tr key={item.id_turno}>
        <Table.Td><Text fz="sm">{fechaCorta(item.fecha_turno)}</Text></Table.Td>
        <Table.Td><Text fz="sm">{horaCorta(item.hora_turno)}</Text></Table.Td>
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <UserAvatar
              size={32}
              radius="100%"
              withLink={false}
              src={item.foto_url}
              name={`${item.nombre ?? ''} ${item.apellido ?? ''}`.trim()}
            />
            <Text fz="sm" fw={500}>{item.nombre} {item.apellido}</Text>
          </Group>
        </Table.Td>
        <Table.Td>
          <EstadoTurnoBadge estado={item.estado} />
        </Table.Td>
        <Table.Td>
          <Menu shadow="md" position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label="Opciones de turno">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {accionesProfesional(item, ahora).map((accion) => accion.cancelar ? (
                <Menu.Item
                  key="cancelar"
                  color="red"
                  leftSection={<IconX size={14} />}
                  onClick={() => handleOpenCancel(item)}
                >
                  {accion.label}
                </Menu.Item>
              ) : (
                <Menu.Item
                  key={accion.estado}
                  leftSection={ICONO_ACCION[accion.estado]}
                  disabled={acciones.cambiandoEstado}
                  onClick={() => acciones.ejecutar(item, accion)}
                >
                  {accion.label}
                </Menu.Item>
              ))}

              <Menu.Divider />
              <Menu.Item leftSection={<IconHistory size={14} />} onClick={() => acciones.abrirHistorial(item)}>
                Ver historial
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <Box>
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {COLUMNS.map((col) => (
                <Table.Th key={col}>
                  <Text fz="xs" fw={700} tt="uppercase" c="dimmed">{col}</Text>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <CancelarTurnoProfModal
        opened={cancelOpened}
        onClose={handleCloseCancel}
        onConfirm={handleConfirmCancel}
        turno={selectedItem}
        isPending={isCancelling}
      />

      <ConfirmarEstadoModal
        opened={!!acciones.confirmacion}
        onClose={acciones.cerrarConfirmacion}
        onConfirm={acciones.confirmar}
        turno={acciones.confirmacion?.turno}
        accion={acciones.confirmacion?.accion}
        isPending={acciones.cambiandoEstado}
      />

      <TurnoHistorialModal
        opened={acciones.historialId !== null}
        onClose={acciones.cerrarHistorial}
        turnoId={acciones.historialId}
      />
    </Box>
  )
}
