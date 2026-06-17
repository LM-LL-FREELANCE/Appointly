import { PageHeader } from "../components/PageHeader.jsx";
import { Avatar, Button, Group, Paper, SimpleGrid, Stack, Switch, Text, Box } from "@mantine/core";
import TimeSlot from "../components/TimeSlot.jsx";

export default function Horarios() {
  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <div>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Horarios de Atención</Text>
            <Text c="dimmed" visibleFrom="md" fz={{ base: 'md', sm: 'sm' }}>define los slots reservables</Text>
          </div>
          <Group>
            <Button visibleFrom="md">Guardar cambios</Button>
            <Avatar radius="xl" alt="" />
          </Group>
        </Group>
      </PageHeader>

      {/*STACK DIAS*/}
      <Stack gap="sm" pb={{ base: 10, md: 10 }}>
        <Paper withBorder p="sm" radius="md">
          <Group wrap="wrap" gap="md" align="flex-start">
            <Group justify="space-between" w={{ base: '100%', md: 'auto' }}>
              <Switch size="lg" hiddenFrom="md" defaultChecked withThumbIndicator={false} label="Lunes" radius="xl" />
              <Switch size="md" pt="10px" visibleFrom="md" defaultChecked withThumbIndicator={false} label={<Text fw={600} size="inherit">Lunes</Text>} radius="xl" />
              <Text c="dimmed" size="md" hiddenFrom="md">2 franjas</Text>
            </Group>
            {/*TIME SLOTS GROUP */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 5 }} spacing="xs" style={{ flex: 1 }}>
              <TimeSlot />
              <TimeSlot />
              <TimeSlot />
              <TimeSlot />
              <TimeSlot />
              <Button variant="outline" size="md" hiddenFrom="md" w="100%">+ Agregar franja</Button>
              <Button variant="outline" size="sm" visibleFrom="md">+ Agregar franja</Button>
            </SimpleGrid>
          </Group>
        </Paper>
      </Stack>

      <Box hiddenFrom="md" h={60} />

      <Box
        hiddenFrom="md"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'var(--mantine-spacing-md)',
          background: 'var(--mantine-color-body)',
        }}
      >
        <Button fullWidth size="lg">Guardar cambios</Button>
      </Box>
    </>
  );
}