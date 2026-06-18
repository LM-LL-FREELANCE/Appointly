import { getTimeRange, TimePicker } from '@mantine/dates';
import { CloseButton, Group, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowRight } from '@tabler/icons-react';

const presets = getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' });

export default function TimeSlot({ horaInicio, horaFin, onChangeInicio, onChangeFin, onDelete }) {
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const size = isDesktop ? 'xs' : 'md';

  return (
    <Paper withBorder p="5" radius="sm" w="100%">
      <Group wrap="nowrap" gap="5">
        <TimePicker size={size} flex={1} styles={{ fieldsRoot: { justifyContent: 'center' } }} withDropdown presets={presets} value={horaInicio} onChange={onChangeInicio} />
        <IconArrowNarrowRight stroke={1} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
        <TimePicker size={size} flex={1} styles={{ fieldsRoot: { justifyContent: 'center' } }} withDropdown presets={presets} value={horaFin} onChange={onChangeFin} />
        <CloseButton size={size} c="dimmed" onClick={onDelete} />
      </Group>
    </Paper>
  );
}