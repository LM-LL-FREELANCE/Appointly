import { getTimeRange, TimePicker } from '@mantine/dates';
import { CloseButton, Group, Paper } from '@mantine/core';
import { IconArrowNarrowRight } from '@tabler/icons-react';
import { useIsDesktop } from '../hooks/useIsDesktop.js';

const presets = getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' });

export default function TimeSlot({ horaInicio, horaFin, onChangeInicio, onChangeFin, onDelete }) {
  const isDesktop = useIsDesktop();
  const size = isDesktop ? 'xs' : 'md';

  const pickerStyle = {
    fieldsRoot: {
      justifyContent: 'center',
    },
    flexGrow: 1,
    flexShrink: 1,
  }

  const noPickerStyle = {
    flexGrow: 0,
    flexShrink: 1,
  }

  return (
    <Paper withBorder p="5" radius="sm" w="100%" miw={isDesktop ? 180 : 200} maw={isDesktop ? 200 : 600}>
      <Group wrap="nowrap" gap="5" pl={isDesktop ? 0 : 50} style={{ justifyContent: 'space-evenly' }}>
        <TimePicker size={size} styles={pickerStyle} withDropdown closeDropdownOnPresetSelect presets={presets} value={horaInicio} onChange={onChangeInicio} />
        <IconArrowNarrowRight stroke={1} color="var(--mantine-color-dimmed)" style={noPickerStyle} />
        <TimePicker size={size} styles={pickerStyle} withDropdown closeDropdownOnPresetSelect presets={presets} value={horaFin} onChange={onChangeFin} />
        <CloseButton size={size} c="dimmed" onClick={onDelete} style={noPickerStyle} />
      </Group>
    </Paper>
  );
}
