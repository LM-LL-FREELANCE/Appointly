import { PageHeader } from "../components/PageHeader";
import { Stack, Title, Group, Avatar, Paper, SimpleGrid, Loader } from "@mantine/core";
import { StatCard } from "./professional/Dashboard/StatCard";
import useGetTurnosActivos from "../hooks/useGetTurnosActivos";
import useGetTurnosMes from "../hooks/useGetTurnosMes";
import { useState } from "react";
import { Link } from "react-router-dom";
export default function Inicio() {
  const [user, setUser] = useState("Luca")
  const dni = 20232778
  const { data: turnosHistorial, isLoading: isLoadingTurnosActivos } = useGetTurnosActivos({ dni })
  const { data: turnosActivos, isLoading: isLoadingActivos } = useGetTurnosActivos({ dni, estado: "activo" })
  const { data: turnosMes, isLoading: isLoadingHistorial } = useGetTurnosMes({ dni })

  const numeroMes = () => {
    if (turnosMes.leght === 0) {
      return "No tiene turnos este mes"
    }
    return turnosMes
  }
  const numeroHistorial = () => {
    if (turnosActivos.leght === 0) {
      return "No tiene turnos este mes"
    }
    return turnosActivos
  }
  return (
    <>
      <Stack gap="md">
        <PageHeader>
          <Group justify="space-between" style={{ flex: 1 }}>
            <Title order={2}>Hola, {user}</Title>
            <Group>
              <Avatar radius="xl" alt="" component={Link} to="/user" />
            </Group>
          </Group>
        </PageHeader>
      </Stack>

      <Paper gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <StatCard label={"Turnos de este mes"} value={turnosMes ? turnosActivos.length : <Loader />} />
          <StatCard label={"Historial de turnos"} value={turnosHistorial ? turnosActivos.length : <Loader />} />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Paper>
            <Title order={4}>Proximos Turnos</Title>
          </Paper>
          <Paper>
            <Title>Accesos Rapidos</Title>
          </Paper>
        </SimpleGrid>
      </Paper>
    </>
  )
}