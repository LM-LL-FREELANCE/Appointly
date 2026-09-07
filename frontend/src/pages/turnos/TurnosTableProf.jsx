import { useState } from 'react'
import { Badge, Box, Button, Group, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelTurnoById } from '../../api/clientes.js'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { CancelarTurnoProfModal } from './CancelarTurnoProfModal.jsx'
import { UserAvatar } from '../../components/UserAvatar.jsx'

const COLUMNS = ['Fecha', 'Hora', 'Paciente', 'Estado', 'Acciones']

export default function TurnosTableProf({ turnos, dniProfesional, onCancelled }) {
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const queryClient = useQueryClient()
  const { mutate: cancelTurno, isPending: isCancelling } = useMutation({
    mutationFn: ({ id_turno, motivo }) => cancelTurnoById({ id: id_turno, motivo }),
    onSuccess: (_data, { id_turno }) => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      onCancelled?.(id_turno)
      closeCancel()
      setSelectedItem(null)
    },
  })

  const handleOpenCancel = (item) => {
    setSelectedItem(item)
    openCancel()
  }

  const handleCloseCancel = () => {
    if (isCancelling) return
    closeCancel()
    setSelectedItem(null)
  }

  const rows = turnos?.map((item) => {
    const badgeColor = item.estado === 'activo' ? 'green' : item.estado === 'cancelado' ? 'red' : 'gray'
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
          <Badge variant="dot" color={badgeColor} size="md" radius="xl" tt="capitalize">
            {item.estado}
          </Badge>
        </Table.Td>
        <Table.Td>
          {item.estado === 'activo' ? (
            <Button variant="light" color="red" radius="md" size="compact-sm" onClick={() => handleOpenCancel(item)}>
              Cancelar
            </Button>
          ) : (
            <Text fz="sm" c="dimmed">—</Text>
          )}
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
        onConfirm={(motivo) => cancelTurno({ id_turno: selectedItem.id_turno, motivo })}
        turno={selectedItem}
        isPending={isCancelling}
      />
    </Box>
  )
}
