import { useState } from "react"
import { useLocation } from "react-router-dom"
import { PageHeader } from "../../../components/PageHeader.jsx"
import { Text, Stack, Group, Avatar, SegmentedControl, Box, Alert, Loader } from "@mantine/core"
import { TurnoCard } from "./TurnoCard.jsx"
import TurnosTable from "./TurnosTable.jsx"
import { useQuery } from "@tanstack/react-query"
import { getTurnosClienteByDni } from "../../../api/clientes.js"
import { useAuth } from "../../../hooks/useAuth.js"
import { Link } from "react-router-dom"

export default function MisTurnos() {
  const { user } = useAuth()

  const { state } = useLocation()
  const [estado, setEstado] = useState(state?.tab ?? 'activo')

  const { data: [activos, pasados] = [[], []], isLoading, isError } = useQuery({
    queryKey: ['turnos', user?.dni, ""],
    queryFn: () => getTurnosClienteByDni({ dni: user.dni, estado: "" }),
    enabled: !!user?.dni,
    select: (data) => {
      const now = new Date()
      return data.reduce(
        ([activos, pasados], t) => {
          const baseDate = new Date(t.fecha_turno)
          const [h, m] = t.hora_turno.split(':')
          const turnoDate = new Date(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate(),
            +h, +m
          )

          const mapped = {
            ...t,
            fecha_turno: baseDate.toLocaleDateString('es-AR', {
              timeZone: 'UTC',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
            hora_turno: t.hora_turno.slice(0, 5),
          }

          if (t.estado === 'cancelado' || turnoDate < now) {
            const estado = t.estado === 'cancelado' ? 'cancelado' : 'completado'
            return [activos, [...pasados, { ...mapped, estado }]]
          }

          return [[...activos, mapped], pasados]
        },
        [[], []]
      )
    }
  })
  console.log(activos)
  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Mis Turnos</Text>
          </Stack>
          <Group>
            <SegmentedControl visibleFrom="md" size="md" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]} disabled={!user} />
            <Avatar radius="xl" alt="" component={Link} to="/miperfil" />
          </Group>
        </Group>
      </PageHeader>

      {!user && (
        <Alert color="yellow" mt="md">
          Debes iniciar sesión para ver tus turnos
        </Alert>
      )}

      {isLoading && (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      )}

      {isError && (
        <Alert color="red" mt="md">
          Error al cargar los turnos
        </Alert>
      )}

      {user && !isLoading && !isError && (
        <>
          <Box px={{ base: 0, md: 'xl' }} visibleFrom="md">
            {estado === 'activo' ? (
              <TurnosTable turno={activos} dni={user?.dni} />
            ) : (
              <TurnosTable turno={pasados} dni={user?.dni} />
            )}
          </Box>

          <Stack gap="sm" pb={10} hiddenFrom="md">
            <SegmentedControl fullWidth size="xl" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]} />
            {(estado === 'activo' ? activos : pasados).map((turno, index) => (
              <TurnoCard key={index} turno={turno} estado={estado} />
            ))}
          </Stack>
        </>
      )}
    </>
  )
}