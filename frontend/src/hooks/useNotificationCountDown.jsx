import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { useState, useEffect } from 'react';
import { IconCheck } from '@tabler/icons-react';
export default function useNotificationCountDown() {
  const [time, setTime] = useState(0)
  const [config, setConfig] = useState(null)
  const clockActive = time > 0
  useEffect(() => {
    if (!clockActive || !config) return;

    const clock = setInterval(() => {
      setTime(prev => {
        const newTime = prev - 1
        if (newTime > 0) {
          notifications.update({
            id: config.id,
            title: config.title,
            message: config.message(newTime),
            position: 'top-right',
            icon: <IconCheck />,
            withCloseButton: false,
            autoClose: false,
            color: 'green'
          })
        } else {
          notifications.hide(config.id);
        }
        return newTime
      })
    }, 1000)
    return () => clearInterval(clock)
  }, [clockActive, config])

  const startCountDown = ({ initialTime, notificationConfig }) => {
    setConfig(notificationConfig)
    setTime(initialTime)
  }

  const stopCountDown = () => {
    setTime(0)
    setConfig(null)
  }

  return { startCountDown, stopCountDown, setTime, time }
}