import { getTimeRange, TimePicker } from '@mantine/dates';
import { CloseButton } from '@mantine/core';
import { IconArrowNarrowRight} from '@tabler/icons-react';

export default function TimeSlot() {
  return (
    <div style={{
      background: 'var(--mantine-color-default)',
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 'var(--mantine-radius-md)'
    }} className="flex w-65 flex-row space-x-2 justify-center items-center p-2">
      <TimePicker
        className="w-20"
        withDropdown
        presets={getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' })} />
        <IconArrowNarrowRight stroke={1}/>
        <TimePicker
        className="w-20"
        withDropdown
        presets={getTimeRange({ startTime: '08:00:00', endTime: '22:00:00', interval: '01:00:00' })} />
        <CloseButton size={{ base: 'sm', md: 'md' }}/>
    </div>
  );
}