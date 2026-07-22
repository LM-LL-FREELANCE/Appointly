import { Paper, Stack, Text, useComputedColorScheme } from '@mantine/core';

export function StatCard({ label, value, color = 'brand', height = "100%" }) {
  const isDark = useComputedColorScheme('light') === 'dark';

  const bg = isDark ? `var(--mantine-color-${color}-light)` : `var(--mantine-color-${color}-0)`;
  const border = isDark ? `var(--mantine-color-${color}-light-hover)` : `var(--mantine-color-${color}-2)`;
  const text = isDark ? `var(--mantine-color-${color}-light-color)` : `var(--mantine-color-${color}-7)`;

  return (
    <Paper
      withBorder
      radius="lg"
      pt="2rem"
      pb="4rem"
      px="lg"
      h={height}
      style={{
        backgroundColor: bg,
        borderColor: border,
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
          c={text}
        >
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}
