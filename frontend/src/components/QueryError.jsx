import { Alert, Button, Group, Text, Center } from '@mantine/core'
import { IconExclamationCircle, IconRefresh } from '@tabler/icons-react'

export default function QueryError({
  message = 'Ocurrió un error inesperado.',
  title = 'No pudimos cargar los datos',
  onRetry, }) {
  return (
    <Center h="70vh">
      <Alert color="red" variant="light" icon={<IconExclamationCircle size={18} />} title={title} m="sm">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="sm">{message}</Text>
          {onRetry && (
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Reintentar
            </Button>
          )}
        </Group>
      </Alert>
    </Center>
  )
}