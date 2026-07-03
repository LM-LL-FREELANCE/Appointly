import { Paper, Stack, Text } from '@mantine/core';

export function StatCard({ label, value, color = 'brand' }) {
  return (
    <Paper
      withBorder
      radius="lg"
      pt="2rem"
      pb="4rem"
      px="lg"
      style={{
        backgroundColor: `var(--mantine-color-${color}-0)`,
        borderColor: `var(--mantine-color-${color}-2)`,
      }}
    >
      <Stack gap={4}>
        <Text
          fz="sm"
          fw={600}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {label}
        </Text>
        <Text
          fz={56}
          fw={700}
          lh={1}
          c={`${color}.7`}
        >
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}
