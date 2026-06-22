import { SimpleGrid, Button, Text } from "@mantine/core";

export default function SlotBox({ slots = [], seleccionado, onSelect }) {
  if (slots.length === 0) {
    return (
      <Text c="dimmed" size="sm" py="md">
        No hay horarios disponibles para este día.
      </Text>
    );
  }
  return (
    <SimpleGrid cols={4} spacing="xs">
      {slots.map((hora) => (
        <Button
          key={hora}
          variant={seleccionado === hora ? "filled" : "default"}
          onClick={() => onSelect(hora)}
          size="sm"
          fullWidth
        >
          {hora}
        </Button>
      ))}
    </SimpleGrid>
  );
}
