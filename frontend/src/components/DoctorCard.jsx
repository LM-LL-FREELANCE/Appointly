import { Card, Group, Avatar, Stack, Text, Badge, Button } from '@mantine/core'
import { IconMapPin, IconArrowRight } from '@tabler/icons-react'

export function DoctorCard({ doctor, onVerDisponibilidad }) {
    const { nombre, especialidad, sede, obrasSociales = [], foto } = doctor

    return (
        <Card withBorder radius="md" padding="md">
            <Stack gap="sm">
                <Group wrap="nowrap" align="flex-start">
                    <Avatar src={foto} alt={nombre} size="lg" radius="xl" />
                    <Stack gap={2}>
                        <Text fw={600}>{nombre}</Text>
                        <Text size="sm" c="dimmed">{especialidad}</Text>
                        {sede && (
                            <Group gap={4} c="dimmed">
                                <IconMapPin size={14} />
                                <Text size="sm">{sede}</Text>
                            </Group>
                        )}
                    </Stack>
                </Group>

                {obrasSociales.length > 0 && (
                    <Group gap="xs">
                        {obrasSociales.map(os => (
                            <Badge key={os} variant="outline" color="gray" radius="sm">
                                {os}
                            </Badge>
                        ))}
                    </Group>
                )}

                <Button
                    rightSection={<IconArrowRight size={16} />}
                    onClick={() => onVerDisponibilidad?.(doctor)}>
                    Disponibilidad
                </Button>
            </Stack>
        </Card>
    )
}