import { Box, Button, Group, Modal, Text } from '@mantine/core'
import { IconAlertTriangle, IconSend } from '@tabler/icons-react'

const ROL_LABEL = {
  cliente: 'Cliente',
  profesional: 'Profesional',
  admin: 'Administrador',
}

export function ConfirmarEnvioModal({
  opened,
  onClose,
  onConfirm,
  tipo = 'individual',
  dni,
  rol,
  asunto,
  cantidad = 0,
  isPending,
}) {
  const esMasivo = tipo === 'masivo'

  return (
    <Modal
      opened={opened}
      onClose={() => !isPending && onClose()}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Group gap="sm" mb="md" align="center" wrap="nowrap">
          {esMasivo ? (
            <IconAlertTriangle size={28} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
          ) : (
            <IconSend size={26} color="var(--mantine-color-brand-6)" style={{ flexShrink: 0 }} />
          )}
          <Text fw={700} fz="xl">
            {esMasivo ? `¿Enviar a ${cantidad} personas?` : '¿Enviar este correo?'}
          </Text>
        </Group>

        {esMasivo ? (
          <>
            <Text c="dimmed" fz="sm" lh={1.6} mb="xs">
              Se envía en lotes y no se puede deshacer. El resultado queda en el Historial.
            </Text>
            <Text fz="sm" fw={500}>
              Asunto: «{asunto}»
            </Text>
          </>
        ) : (
          <Text c="dimmed" fz="sm" lh={1.6}>
            Se le va a enviar a la cuenta {dni} ({ROL_LABEL[rol] ?? rol}). Asunto: «{asunto}».
          </Text>
        )}
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="md" onClick={onClose} disabled={isPending}>
            No, volver
          </Button>
          <Button
            color={esMasivo ? 'red' : 'brand'}
            radius="md"
            onClick={onConfirm}
            loading={isPending}
          >
            {esMasivo ? `Sí, enviar a ${cantidad}` : 'Sí, enviar'}
          </Button>
        </Group>
      </Box>
    </Modal>
  )
}
