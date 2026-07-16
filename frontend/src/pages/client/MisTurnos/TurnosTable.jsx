import { useState } from 'react'
import { Avatar, Badge, Box, Button, Group, Table, Text, Anchor } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TurnoDetailModal } from './TurnoDetailModal.jsx'
import { CancelarTurnoModal } from './CancelarTurnoModal.jsx'
import { cancelTurnoById } from '../../../api/clientes.js'

const COLUMNS = ['Fecha', 'Hora', 'Profesional', 'Especialidad', 'Estado', 'Acciones'];

export default function TurnosTable({ turno, dni }) {
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [cancelFromDetail, setCancelFromDetail] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: cancelTurno, isPending: isCancelling } = useMutation({
    mutationFn: (id_turno) => cancelTurnoById(id_turno, dni, 'cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', dni] })
      closeCancel()
      setCancelFromDetail(false)
      setSelectedItem(null)
    },
    onError: (err) => {
      if (err.status === 409 && err.code === 'ALREADY_CANCELLED') {
        queryClient.invalidateQueries({ queryKey: ['turnos', dni] })
        closeCancel()
        setCancelFromDetail(false)
      }
    },
  })

  const handleOpenDetail = (item) => {
    setSelectedItem(item)
    openDetail()
  }

  const handleCloseDetail = () => {
    closeDetail()
    setSelectedItem(null)
  }

  const handleOpenCancel = (item) => {
    setSelectedItem(item)
    setCancelFromDetail(false)
    openCancel()
  }

  const handleCancelRequestFromDetail = () => {
    closeDetail()
    setCancelFromDetail(true)
    openCancel()
  }

  const handleCloseCancel = () => {
    if (isCancelling) return
    closeCancel()
    if (cancelFromDetail) {
      setCancelFromDetail(false)
      openDetail()
    } else {
      setSelectedItem(null)
    }
  }

  const rows = turno?.map((item) => {
    const badgeColor = item.estado === 'activo' ? 'green' : item.estado === 'cancelado' ? 'red' : 'gray'
    return (
      <Table.Tr key={item.id_turno}>
        <Table.Td><Text fz="sm">{item.fecha_turno}</Text></Table.Td>
        <Table.Td><Text fz="sm">{item.hora_turno}</Text></Table.Td>
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar size={32} radius="xl" src={item.avatarSrc ?? null} />
            <Text fz="sm" fw={500}>{item.p_nombre} {item.p_apellido}</Text>
          </Group>
        </Table.Td>
        <Table.Td><Text fz="sm">{item.tipo}</Text></Table.Td>
        <Table.Td>
          <Badge variant="dot" color={badgeColor} size="md" radius="xl" tt="capitalize">
            {item.estado}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={4} wrap="wrap">
            <Anchor component="button" size="sm" pr="sm" onClick={() => handleOpenDetail(item)}>
              Detalle
            </Anchor>
            {item.estado === 'activo' && (
              <Button variant="light" color="red" radius="md" size="compact-sm" pr="sm" onClick={() => handleOpenCancel(item)}>
                Cancelar
              </Button>
            )}
          </Group>
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

      {selectedItem && (
        <>
          <TurnoDetailModal
            opened={detailOpened}
            onClose={handleCloseDetail}
            onCancelRequest={handleCancelRequestFromDetail}
            turno={selectedItem}
          />
          <CancelarTurnoModal
            opened={cancelOpened}
            onClose={handleCloseCancel}
            onConfirm={() => cancelTurno(selectedItem.id_turno)}
            turno={selectedItem}
            isPending={isCancelling}
          />
        </>
      )}
    </Box>
  )
}
