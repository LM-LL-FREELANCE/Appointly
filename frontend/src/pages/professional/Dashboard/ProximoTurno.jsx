import { Group, Text, Stack, Avatar, Paper, Button } from "@mantine/core"

export function ProximoTurno() {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Stack style={{ flex: 1 }} justify="space-between">
        <Text fw={700} fz="lg">Próximo turno</Text>
        <Group gap="lg">
          <Avatar radius="xl" size="xl" />
          <Stack gap={4}>
            <Text fw={700} fz="md">J. Gómez</Text>
            <Text c="dimmed" fz="sm">09:00 · Kinesiología</Text>
          </Stack>
        </Group>
        <Group grow gap="md">
          <Button variant="default" radius="md">Detalle</Button>
          <Button variant="light" color="red" radius="md">Cancelar</Button>
        </Group>
      </Stack>
    </Paper>
  )
}
