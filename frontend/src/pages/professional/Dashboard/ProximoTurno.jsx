import { Group, Text, Stack, Avatar, Paper, Button, Divider } from "@mantine/core"

export function ProximoTurno() {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2 }} >
      <Stack gap="md">
        <Text fw={700} fz="lg">Próximo turno</Text>
        <Group gap="lg" pb={50}>
          <Avatar radius="xl" size="lg" />
          <Stack gap={2}>
            <Text fw={700}>J. Gómez</Text>
            <Text c="dimmed" fz="sm">09:00 · Kinesiología</Text>
          </Stack>
        </Group>
        <Divider pb="md" />
        <Group grow gap="lg">
          <Button variant="default" radius="md">Detalle</Button>
          <Button variant="light" color="red" radius="md">Cancelar</Button>
        </Group>
      </Stack>
    </Paper>
  )
}
