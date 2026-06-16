import { getTimeRange, TimePicker } from '@mantine/dates';

export default function TimeSlot() {
  return (
    <div className="flex flex-row space-x-2 bg-amber-500 p-2">
      <TimePicker
        className="w-20"
        withDropdown
        presets={getTimeRange({ startTime: '08:00:00', endTime: '20:00:00', interval: '01:30:00' })} />
        <TimePicker
        className="w-20"
        withDropdown
        presets={getTimeRange({ startTime: '08:00:00', endTime: '20:00:00', interval: '01:30:00' })} />
    </div>
  );
}