import { useState } from "react"
import { useLocation } from "react-router-dom"
import { PageHeader } from "../../../components/PageHeader.jsx"
import { Stack, Group, SegmentedControl, Box, Loader } from "@mantine/core"
import { TurnoCard } from "./TurnoCard.jsx"
import TurnosTable from "./TurnosTable.jsx"
import { useQuery } from "@tanstack/react-query"
import { getTurnosClienteByDni } from "../../../api/clientes.js"
import { useAuth } from "../../../hooks/useAuth.js"
import { useIsDesktop } from "../../../hooks/useIsDesktop.js"
import QueryError from "../../../components/QueryError.jsx"
import { esAbierto } from "../../../utils/estadosTurno.js"
export default function MisTurnos() {
  const { user } = useAuth()

  const { state } = useLocation()
  const [estado, setEstado] = useState(state?.tab ?? 'proximos')
  const isDesktop = useIsDesktop()

  const { data: [proximos, historial] = [[], []], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['turnos', user?.dni, ""],
    queryFn: () => getTurnosClienteByDni({ dni: user.dni, estado: "" }),
    enabled: !!user?.dni,
    select: (data) => {
      const now = new Date()
      return data.reduce(
        ([proximos, historial], t) => {
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
            // A turno whose time already passed can no longer be cancelled by the client.
            esPasado: turnoDate < now,
          }

          // "Próximos" = still open and not yet past; everything else is history,
          // always showing the real estado from the API.
          if (esAbierto(t.estado) && turnoDate >= now) {
            return [[...proximos, mapped], historial]
          }

          return [proximos, [...historial, mapped]]
        },
        [[], []]
      )
    }
  })

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
            data={[{ label: 'Próximos', value: 'proximos' }, { label: 'Historial', value: 'historial' }]}
          />
        )}
      />

      {isLoading && (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      )}

      {isError && (
        <QueryError message={error?.message} onRetry={refetch} />
      )}

      {!isLoading && !isError && (
        <>
          {isDesktop && (
            <Box px={{ base: 0, md: 'xl' }}>
              {estado === 'proximos' ? (
                <TurnosTable turno={proximos} dni={user?.dni} />
              ) : (
                <TurnosTable turno={historial} dni={user?.dni} />
              )}
            </Box>
          )}

          {!isDesktop && (
            <Stack gap="sm" pb={10}>
              <SegmentedControl fullWidth size="md" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'proximos' }, { label: 'Historial', value: 'historial' }]} />
              {(estado === 'proximos' ? proximos : historial).map((turno, index) => (
                <TurnoCard key={index} turno={turno} tab={estado} />
              ))}
            </Stack>
          )}
        </>
      )}
    </>
  )
}
