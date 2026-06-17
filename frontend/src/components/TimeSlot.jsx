import { getTimeRange, TimePicker } from '@mantine/dates';
import { CloseButton, Group, Paper } from '@mantine/core';
import { IconArrowNarrowRight } from '@tabler/icons-react';

export default function TimeSlot() {
  return (
    <Paper p="xs" radius="md" bg="gray.0">
      <Group
        wrap="nowrap"
        gap="xs"
      >
        <TimePicker
          size="md"
          flex={1}
          styles={{ fieldsRoot: { justifyContent: 'center' } }}
          withDropdown
          presets={getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' })} />
        <IconArrowNarrowRight stroke={1.5} style={{ flexShrink: 0 }} />
        <TimePicker
          size="md"
          flex={1}
          styles={{ fieldsRoot: { justifyContent: 'center' } }}
          withDropdown
          presets={getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' })} />
        <CloseButton size="lg" style={{ flexShrink: 0 }} />
      </Group>
    </Paper>
  );
}