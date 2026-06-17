import { Card, Group, Avatar, Stack, Text, Badge, Button } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'

export function DoctorCard({ keyDoctor, doctor, onVerDisponibilidad }) {


    const { nombre, apellido, especialidades = [], correo, obrasSociales = [], foto } = doctor

    return (
        <Card key={keyDoctor} withBorder radius="md" padding="md">
            <Stack gap="sm">
                <Group wrap="nowrap" align="flex-start">
                    <Avatar src={foto} alt={nombre} size="lg" radius="xl" />
                    <Stack gap={2}>
                        <Text fw={600}>{`${nombre} ${apellido}`}</Text>
                        {especialidades.map(esp => (
                            <Text key={esp} size="sm" c="dimmed">{esp}</Text>
                        ))}
                        <Text size="sm" c="dimmed">{correo}</Text>
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