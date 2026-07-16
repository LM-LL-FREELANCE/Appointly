import { PageHeader } from "../components/PageHeader";
import { Stack, Title, Group, Grid, Avatar, Paper, SimpleGrid, Loader, Container, Skeleton } from "@mantine/core";
import { StatCard } from "./professional/Dashboard/StatCard.jsx";
import useGetTurnosActivos from "../hooks/useGetTurnosActivos.jsx";
import useGetTurnosMes from "../hooks/useGetTurnosMes.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ButtonLay from "../components/Button.jsx";

const PRIMARY_COL_HEIGHT = '500px';
const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

export default function Inicio() {
  const [user, setUser] = useState("Luca")
  const dni = 20232778
  const navigate = useNavigate()
  const { data: turnosHistorial, isLoading: isLoadingHistorial } = useGetTurnosActivos({ dni })
  const { data: turnosActivos, isLoading: isLoadingActivos } = useGetTurnosActivos({ dni, estado: "activo" })
  const { data: turnosMes, isLoading: isLoadingMes } = useGetTurnosMes({ dni })
  const btnData = [
    { label: "Buscar Doctores", link: () => navigate("/buscar"), type: "variant" },
    { label: "Reservar Turno", link: () => navigate("/reservar"), type: "subtle" },
    { label: "Mis Turnos", link: () => navigate("/misturnos/*"), type: "subtle" },
  ]


  const fecha = new Date(fechaIso);

  // 1. Crear la variable de la fecha con el nombre del día y el número (ej: "miércoles 15")
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric'
  }).replace(',', ''); // replace para quitar la coma que viene por defecto

  // Si quieres que la primera letra sea mayúscula ("Miércoles 15"):
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  // 2. Crear la variable solo con el horario (ej: "00:00")
  const horaFormateada = fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  console.log(turnosActivos)
  console.log(fechaCapitalizada)
  console.log(horaFormateada)
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
      <Container my="lg" maw={1200}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Paper withBorder radius="lg" py="1rem" px="lg">
            <Title size="h2">Proximos turnos</Title>
          </Paper>
          <Grid gap="md">
            <Grid.Col mah={PRIMARY_COL_HEIGHT} span={6}>
              <StatCard height={SECONDARY_COL_HEIGHT} label={"Turnos de este mes"} value={isLoadingMes ? <Loader /> : turnosMes.data.length} />
            </Grid.Col>
            <Grid.Col span={6}>
              <StatCard height={SECONDARY_COL_HEIGHT} label={"Historial de turnos"} value={isLoadingHistorial ? <Loader /> : turnosHistorial.length} />
            </Grid.Col>
            <Grid.Col>
              <Paper withBorder radius="lg" py="1rem" px="lg" h={SECONDARY_COL_HEIGHT}>
                <Title size="h3" >Accesos Rápidos</Title>
                <Group mt="xl" gap="lg">
                  {btnData.map((btn, index) => (
                    <ButtonLay key={index} label={btn.label} type={btn.type} link={btn.link} />
                  ))}
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>
        </SimpleGrid>
      </Container >
    </>
  )
}