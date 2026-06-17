import { getTimeRange, TimePicker } from '@mantine/dates';
import { CloseButton, Group, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowRight } from '@tabler/icons-react';

const presets = getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' });

export default function TimeSlot() {
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const size = isDesktop ? 'xs' : 'md';

  return (
    <Paper withBorder p="5" radius="sm" bg="gray.0" w="100%">
      <Group wrap="nowrap" gap="5">
        <TimePicker size={size} flex={1} styles={{ fieldsRoot: { justifyContent: 'center' } }} withDropdown presets={presets} />
        <IconArrowNarrowRight stroke={1} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
        <TimePicker size={size} flex={1} styles={{ fieldsRoot: { justifyContent: 'center' } }} withDropdown presets={presets} />
        <CloseButton size={size} c="dimmed" />
      </Group>
    </Paper>
  );
}