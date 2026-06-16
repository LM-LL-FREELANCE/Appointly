import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Group, Text } from "@mantine/core";
import TimeSlot from "../components/TimeSlot.jsx";

export default function Horarios() {
  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <div>
            <Text fw={600} size="lg">Horarios de Atención</Text>
            <Text c="dimmed" size="sm">define los slots reservables</Text>
          </div>
          <Button>Guardar cambios</Button>
        </Group>
      </PageHeader>
      <TimeSlot />
    </>
  );
}