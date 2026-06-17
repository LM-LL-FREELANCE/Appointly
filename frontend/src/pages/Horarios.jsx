import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Group, Paper, Stack, Switch, Text } from "@mantine/core";
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
          <Button visibleFrom="md">Guardar cambios</Button>
        </Group>
      </PageHeader>

      {/*STACK DIAS*/}
      <Stack gap="sm">
        <Paper withBorder p="sm" radius="md">
          <Stack gap="xs">
            {/*SWITCH BUTTON - TITLE AND SLOT*/}
            <Group justify="space-between">
              <Switch
                defaultChecked
                withThumbIndicator={false}
                label="Lunes"
                size="lg"
                radius="xl"
              />
              <Text c="dimmed" size="md" hiddenFrom="md">2 franjas</Text>
            </Group>
            
            {/*TIME SLOTS*/}
            <Stack gap="xs">
              <Paper withBorder p="xs" radius="sm" bg="gray.0">  
                <TimeSlot />
              </Paper>
            </Stack>
            <Button variant="outline" fullWidth size="lg">+ Agregar franja</Button>
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}