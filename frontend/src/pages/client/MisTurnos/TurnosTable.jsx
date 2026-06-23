import { useState } from 'react'
import { Avatar, Badge, Box, Button, Group, Table, Text, Anchor } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { TurnoDetailModal } from './TurnoDetailModal.jsx'

const COLUMNS = ['Fecha', 'Hora', 'Profesional', 'Especialidad', 'Estado', 'Acciones'];

export default function TurnosTable({ turno, dni }) {
  const [opened, { open, close }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const handleOpen = (item) => {
    setSelectedItem(item)
    open()
  }

  const handleClose = () => {
    close()
    setSelectedItem(null)
  }

  const rows = turno?.map((item) => {
    const badgeColor = item.estado === 'activo' ? 'green' : 'red'
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
          <Group gap={4} wrap="nowrap">
            <Anchor component="button" size="sm" pr="sm" onClick={() => handleOpen(item)}>
              Detalle
            </Anchor>
            {item.estado === 'activo' && (
              <Button variant="light" color="red" radius="md" size="compact-sm">Cancelar</Button>
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
        <TurnoDetailModal
          opened={opened}
          onClose={handleClose}
          turno={selectedItem}
          dni={dni}
        />
      )}
    </Box>
  )
}
