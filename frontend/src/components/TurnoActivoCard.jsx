import { Paper, Badge, Group, Stack, Title, Text } from '@mantine/core'
import ButtonLay from './Button'
import { UserAvatar } from './UserAvatar'

export default function TurnoCard({ data, openedModal, cancelarTurno }) {
  return (
    <Paper radius="md" p="md" my="md" mah={500}>
      <Stack gap="xl" align="center" justify="center">
        <UserAvatar
          size="xl"
          radius="100%"
          withLink={false}
          src={data.foto_url}
          name={`${data.nombre ?? ''} ${data.apellido ?? ''}`.trim()}
        />
        <Stack gap="lg" align="center" mt="md">
          <Title size="h2" ta="center">
            {data.genero === 'M' ? 'Dr. ' : 'Dra. '}
            {`${data.nombre} ${data.apellido}`}
          </Title>
          {data.especialidades ? (
            <Stack gap="xs" align="center">
              {data.especialidades.map((especialidad) => (
                <Text key={especialidad} size="xl" fw={500} c="dimmed">{especialidad}</Text>
              ))}
            </Stack>
          ) : (
            <Text size="xl" c="dimmed">Sin especialidades</Text>
          )}
          <Group gap="lg" mt="sm">
            <Badge variant="outline" color="gray" size="md" radius="md" p="md">{data.fecha}</Badge>
            <Badge variant="outline" color="gray" size="md" radius="md" p="md">{data.hora_turno}</Badge>
          </Group>
          <Group gap="xl" mt="xl">
            <ButtonLay label="Ver detalle" typeColor="light" link={openedModal} size="md" radius="md" px="md" />
            <ButtonLay label="Cancelar" typeColor="light" color="red" link={cancelarTurno} size="md" radius="md" px="md" />
          </Group>
        </Stack>
      </Stack>
    </Paper>
  )
}
