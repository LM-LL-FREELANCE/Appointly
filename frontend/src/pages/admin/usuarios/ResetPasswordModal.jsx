import { Button, Group, Modal, Stack, Text } from '@mantine/core'

export function ResetPasswordModal({ opened, onClose, onConfirm, usuario, isPending, size = 'sm' }) {
  if (!usuario) return null

  const cerrar = () => {
    if (isPending) return
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={cerrar}
      centered
      size={size}
      title="¿Enviar correo de restablecimiento?"
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Stack gap="lg">
        <Text c="dimmed" fz="sm" lh={1.6}>
          Le vamos a enviar a <Text span fw={600} c="var(--mantine-color-text)">{usuario.correo}</Text> un
          enlace para crear una nueva contraseña. Vence en 10 minutos.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={cerrar} disabled={isPending}>
            Cancelar
          </Button>
          <Button radius="md" onClick={onConfirm} loading={isPending}>
            Enviar correo
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
