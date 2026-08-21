import { Button, Container, Title, Anchor, Group, Center, Modal, Text, TextInput, Stack } from '@mantine/core'
import ButtonLay from './Button.jsx';
export function EnviarCorreo({ opened, onClose, onConfirm, isPending, isNotAvailble, email, setEmail, size = 'sm', ...props }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={size}
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
      {...props}
    >
      <Container size={460} my={30}>
        <Stack gap="md">
          <Title ta="center">
            ¿Olvido su contraseña?
          </Title>
          <Text c="dimmed" fz="sm" ta="center">
            Ingrese su mail y va a recibir un correo con un link, dirigiendose a ese link
            usted podra restablecer su contraseña.
          </Text>
          <TextInput placeholder="Ingrese su correo aqui" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Group justify="space-between" mt="lg">
            <Anchor c="dimmed" size="sm" >
              <Center inline>
                <ButtonLay label={"Volver"} type={"subtle"} onClick={onClose} />
              </Center>
            </Anchor>
            <Button onClick={onConfirm} disabled={isPending || isNotAvailble}>Enviar correo</Button>
          </Group>
        </Stack>
      </Container>
    </Modal>
  )
}
