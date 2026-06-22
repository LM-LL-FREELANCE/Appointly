import { Table, Alert, Button, Group, Stack, Text } from '@mantine/core';

export function TableConfirmarTurno({ data, onVolver }) {
  const rows = data.map((d, index) => (
    <Table.Tr key={index}>
      <Table.Td c="dimmed" w="30%">
        {d.etiqueta}
      </Table.Td>
      <Table.Td fw={500}>
        {d.valor}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg" maw={500} mx="auto" p="md">
      <Table verticalSpacing="sm">
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <Alert variant="light" color="blue" radius="md">
        <Text size="sm" c="blue.8">
          Al confirmar recibirás un email de confirmación. No requiere aprobación.
        </Text>
      </Alert>
      <Group grow>
        <Button variant="default" radius="md" onClick={onVolver}>
          ← Volver
        </Button>
        <Button radius="md">
          Confirmar
        </Button>
      </Group>
    </Stack>
  );
}