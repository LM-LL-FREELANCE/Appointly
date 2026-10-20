import { Group, Paper, Stack, Text, ThemeIcon, useComputedColorScheme } from '@mantine/core'

export function KpiCard({ icon, label, value, caption, color = 'brand' }) {
  const isDark = useComputedColorScheme('light') === 'dark'

  const bg = isDark
    ? `var(--mantine-color-${color}-light)`
    : `var(--mantine-color-${color}-0)`
  const border = isDark
    ? `var(--mantine-color-${color}-light-hover)`
    : `var(--mantine-color-${color}-2)`
  const textColor = isDark
    ? `var(--mantine-color-${color}-light-color)`
    : `var(--mantine-color-${color}-7)`

  return (
    <Paper
      withBorder
      radius="lg"
      p="lg"
      style={{
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <Stack gap="xs">
        <Group gap="xs" align="center" wrap="nowrap">
          <ThemeIcon variant="light" color={color} size="md" radius="md">
            {icon}
          </ThemeIcon>
          <Text
            fz="xs"
            fw={600}
            c="dimmed"
            tt="uppercase"
            lineClamp={1}
            style={{ letterSpacing: '0.06em' }}
          >
            {label}
          </Text>
        </Group>

        <Text fz={40} fw={700} lh={1} c={textColor}>
          {value}
        </Text>

        {caption && (
          <Text fz="xs" c="dimmed" lineClamp={1}>
            {caption}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
