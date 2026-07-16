import { Card, Badge, Avatar, Group, Stack, Title, Text } from "@mantine/core";

export default function TurnoCard({ data, Link }) {
  return (
    <>
      <Card key={keyDoctor} withBorder radius="md" padding="md">
        <Group justify="space-between" gap="md">
          <Avatar size="lg" radius="xl" alt="" component={Link} to="/user" />
          <Stack gap="md">
            <Title size="h3">{data.genero === "M" ? "Dr. " : "Dra. "}{data.nombre}</Title>
            {data.especialidades.map((esp, index) => (
              <Text key={index} size="sm" c="dimmed">{esp.tipo}</Text>
            ))}
          </Stack>
        </Group>
      </Card>
    </>
  )
}
