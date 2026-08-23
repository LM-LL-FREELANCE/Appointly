import { useLocation, Link } from 'react-router-dom'
import { Paper, Text, Button, Stack } from '@mantine/core'

export function CancelarTurnoMobile() {
  const location = useLocation()
  const { turno } = location.state || {}

  if (!turno) {
    return (
      <Paper withBorder radius="lg" p="md">
        <Stack gap="md">
          <Text>No se seleccionó ningún turno para cancelar.</Text>
          <Button variant="default" component={Link} to="/misturnos">Volver a Mis Turnos</Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Text fw={700} fz="md">Cancelar Turno</Text>
        <Text fz="sm">
          ¿Estás seguro de que querés cancelar el turno del día <b>{turno.fecha_turno}</b> a las <b>{turno.hora_turno}</b> con <b>{turno.p_nombre} {turno.p_apellido}</b>?
        </Text>
        <Button color="red" size="md" radius="md">Confirmar Cancelación</Button>
        <Button variant="default" component={Link} to="/misturnos" size="md" radius="md">Atrás</Button>
      </Stack>
    </Paper>
  )
}
