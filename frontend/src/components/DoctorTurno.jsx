import { useNavigate } from 'react-router-dom'
import { Card, Stack, Text, Badge, Group, Avatar, Anchor } from '@mantine/core'

export default function DoctorTurno({ doctor }) {
  const navigate = useNavigate()
  const { nombre, apellido, especialidades = [], obrasSociales = [], foto, foto_url } = doctor
  const avatarPhoto = foto_url || foto || undefined

  return (
    <Card withBorder radius="md" padding="md" h="100%">
      <Stack gap="sm">
        <Avatar
          src={avatarPhoto}
          name={`${nombre ?? ''} ${apellido ?? ''}`.trim()}
          color="initials"
          h={140}
          w="100%"
          radius="sm"
          style={{ fontSize: '2.5rem' }}
        />

        <Stack gap={4}>
          <Text fw={700}>{`${nombre} ${apellido}`}</Text>
          <Text size="sm" c="dimmed">
            {especialidades.join(' · ')}
          </Text>
        </Stack>

        {obrasSociales.length > 0 && (
          <Group gap="xs">
            {obrasSociales.map((os) => (
              <Badge key={os} variant="outline" color="gray" radius="xl">
                {os}
              </Badge>
            ))}
          </Group>
        )}

        <Anchor
          size="sm"
          ta="center"
          onClick={() => navigate('/buscar')}
          style={{ cursor: 'pointer' }}
        >
          ← Cambiar profesional
        </Anchor>
      </Stack>
    </Card>
  )
}
