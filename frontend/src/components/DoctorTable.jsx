import { Table, Badge, Text, Group, Button } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { UserAvatar } from './UserAvatar'

export default function DoctorTable({ profesionales, onVerDisponibilidad }) {
  const rows = profesionales.map((prof) => (
    <Table.Tr key={prof.dni_profesional}>
      <Table.Td>
        <UserAvatar
          size={38}
          radius="100%"
          withLink={false}
          src={prof.foto_url || prof.foto}
          name={`${prof.nombre ?? ''} ${prof.apellido ?? ''}`.trim()}
        />
      </Table.Td>
      <Table.Td>
        <Text fw={600}>{`${prof.nombre} ${prof.apellido}`}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{prof.correo}</Text>
      </Table.Td>
      <Table.Td>
        {(prof.especialidades || []).map((esp, index) => (
          <Text key={index} size="sm" c="dimmed">{esp}</Text>
        ))}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {(prof.obrasSociales || []).map((obs) => (
            <Badge key={obs} variant="outline" color="gray" radius="sm">
              {obs}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Button
          rightSection={<IconArrowRight size={14} />}
          onClick={() => onVerDisponibilidad?.(prof)}
        >
          Reservar
        </Button>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Table.ScrollContainer minWidth={700}>
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Foto</Table.Th>
            <Table.Th>Nombre y Apellido</Table.Th>
            <Table.Th>Correo</Table.Th>
            <Table.Th>Especialidades</Table.Th>
            <Table.Th>Obras Sociales</Table.Th>
            <Table.Th>Reservar</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
