import { Card, Group, Stack, Text, Badge, Button } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { UserAvatar } from './UserAvatar'

export function DoctorCard({ doctor, onVerDisponibilidad }) {
  const { nombre, apellido, especialidades = [], correo, obrasSociales = [], foto, foto_url } = doctor
  const avatarPhoto = foto_url || foto || undefined

  return (
    <Card withBorder radius="md" padding="md">
      <Stack gap="sm">
        <Group wrap="nowrap" align="flex-start">
          <UserAvatar
            size="lg"
            radius="100%"
            withLink={false}
            src={avatarPhoto}
            name={`${nombre ?? ''} ${apellido ?? ''}`.trim()}
          />
          <Stack gap={2}>
            <Text fw={600}>{`${nombre} ${apellido}`}</Text>
            {especialidades.map((esp) => (
              <Text key={esp} size="sm" c="dimmed">{esp}</Text>
            ))}
            <Text size="sm" c="dimmed">{correo}</Text>
          </Stack>
        </Group>

        {obrasSociales.length > 0 && (
          <Group gap="xs">
            {obrasSociales.map((os) => (
              <Badge key={os} variant="outline" color="gray" radius="sm">
                {os}
              </Badge>
            ))}
          </Group>
        )}

        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={() => onVerDisponibilidad?.(doctor)}
        >
          Reservar
        </Button>
      </Stack>
    </Card>
  )
}
