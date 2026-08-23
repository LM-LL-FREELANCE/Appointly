import { useState } from 'react'
import { Avatar, Box, Group, Table, Text, Menu, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { TurnoDetailModal } from './TurnoDetailModal.jsx'
import { CancelarTurnoModal } from './CancelarTurnoModal.jsx'
import useCancelTurno from '../../../hooks/useCancelTurno.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'
import { IconDotsVertical, IconEye, IconX } from '@tabler/icons-react'

const COLUMNS = ['Fecha', 'Hora', 'Profesional', 'Especialidad', 'Estado', ''];

export default function TurnosTable({ turno }) {
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [cancelFromDetail, setCancelFromDetail] = useState(false)

  const queryClient = useQueryClient()


  const { mutate: mutateCancelTurno, isPending: isCancelling } = useCancelTurno()
  const onConfirmCancel = () => {
    mutateCancelTurno({
      id: selectedItem.id_turno,
      motivo: ""
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['turnos'] })
        closeCancel()
        setCancelFromDetail(false)
        setSelectedItem(null)
      },
      onError: (err) => {
        if (err.status === 409 && err.code === 'ALREADY_CANCELLED') {
          queryClient.invalidateQueries({ queryKey: ['turnos'] })
          closeCancel()
          setCancelFromDetail(false)
        }
      }
    })
  }
  /*const { mutate: cancelTurno, isPending: isCancelling } = useMutation({
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
  })*/

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
    return (
      <Table.Tr key={item.id_turno}>
        <Table.Td><Text fz="sm">{item.fecha_turno}</Text></Table.Td>
        <Table.Td><Text fz="sm">{item.hora_turno}</Text></Table.Td>
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar size={32} radius="xl" src={item.avatarSrc ?? null} />
            <Text fz="sm" fw={500}>{item.nombre} {item.apellido}</Text>
          </Group>
        </Table.Td>
        <Table.Td><Text fz="sm">{item.tipo}</Text></Table.Td>
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
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => handleOpenDetail(item)}
              >
                Ver detalle
              </Menu.Item>

              {item.estado === 'activo' && (
                <Menu.Item
                  color="red"
                  leftSection={<IconX size={14} />}
                  onClick={() => handleOpenCancel(item)}
                >
                  Cancelar turno
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <Box>
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="lg">
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
            onConfirm={onConfirmCancel}
            turno={selectedItem}
            isPending={isCancelling}
          />
        </>
      )}
    </Box>
  )
}
