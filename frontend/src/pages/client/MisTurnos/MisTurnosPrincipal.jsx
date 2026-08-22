import { useState } from "react"
import { useLocation } from "react-router-dom"
import { PageHeader } from "../../../components/PageHeader.jsx"
import { Stack, Group, SegmentedControl, Box, Alert, Loader } from "@mantine/core"
import { TurnoCard } from "./TurnoCard.jsx"
import TurnosTable from "./TurnosTable.jsx"
import { useQuery } from "@tanstack/react-query"
import { getTurnosClienteByDni } from "../../../api/clientes.js"
import { useAuth } from "../../../hooks/useAuth.js"
import { useIsDesktop } from "../../../hooks/useIsDesktop.js"

export default function MisTurnos() {
  const { user } = useAuth()

  const { state } = useLocation()
  const [estado, setEstado] = useState(state?.tab ?? 'activo')
  const isDesktop = useIsDesktop()

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
      <PageHeader
        title="Mis Turnos"
        actions={isDesktop && (
          <SegmentedControl
            size="md"
            radius="lg"
            value={estado}
            onChange={setEstado}
            data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]}
            disabled={!user}
          />
        )}
      />

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
          {isDesktop && (
            <Box px={{ base: 0, md: 'xl' }}>
              {estado === 'activo' ? (
                <TurnosTable turno={activos} dni={user?.dni} />
              ) : (
                <TurnosTable turno={pasados} dni={user?.dni} />
              )}
            </Box>
          )}

          {!isDesktop && (
            <Stack gap="sm" pb={10}>
              <SegmentedControl fullWidth size="lg" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]} />
              {(estado === 'activo' ? activos : pasados).map((turno, index) => (
                <TurnoCard key={index} turno={turno} estado={estado} />
              ))}
            </Stack>
          )}
        </>
      )}
    </>
  )
}
