import { PageHeader } from "../components/PageHeader";
import { Stack, Title, Group, Grid, Avatar, Paper, SimpleGrid, Loader, Container, Center } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { StatCard } from "./professional/Dashboard/StatCard.jsx";
import useGetTurnosActivos from "../hooks/useGetTurnosActivos.jsx";
import useGetTurnosMes from "../hooks/useGetTurnosMes.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ButtonLay from "../components/Button.jsx";
import TurnoCard from "../components/TurnoActivoCard.jsx";
import { useAuth } from "../hooks/useAuth.js";

const PRIMARY_COL_HEIGHT = '500px';
const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

export default function Inicio() {
  const { user } = useAuth()
  const dni = user ? user.dni : ""
  const userName = user ? `${user.nombre} ${user.apellido}` : "invitado"
  const [detailModal, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const navigate = useNavigate()
  const { data: turnosHistorial, isLoading: isLoadingHistorial } = useGetTurnosActivos({ dni })
  const { data: turnosActivos, isLoading: isLoadingActivos } = useGetTurnosActivos({ dni, estado: "activo" })
  const { data: turnosMes, isLoading: isLoadingMes } = useGetTurnosMes({ dni })
  const formatedTurno = (turnosActivos || []).map(turno => ({
    ...turno,
    especialidades: turno.especialidades ? turno.especialidades.split('|') : [],
    fecha: new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  }));
  const btnData = [
    { label: "Buscar Doctores", link: () => navigate("/buscar"), type: "variant" },
    { label: "Reservar Turno", link: () => navigate("/reservar"), type: "subtle" },
    { label: "Mis Turnos", link: () => navigate("/misturnos/*"), type: "subtle" },
  ]

  console.log(turnosActivos)
  const prueba = () => {
    alert("prueba exitosa")
  }
  return (
    <>
      <Stack gap="md">
        <PageHeader>
          <Group justify="space-between" style={{ flex: 1 }}>
            <Title order={2}>Hola, {userName}</Title>
            <Group>
              <Avatar radius="xl" alt="" component={Link} to="/user" />
            </Group>
          </Group>
        </PageHeader>
      </Stack>
      <Container my="lg" maw={1200}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Paper withBorder mah={PRIMARY_COL_HEIGHT} radius="lg" py="1rem" px="lg">
            <Title size="h2">Proximo turno</Title>
            <Paper my="xl">
              {isLoadingActivos ? (
                <Center>
                  <Loader />
                </Center>
              ) : (
                <TurnoCard data={formatedTurno[0]} openedModal={prueba} cancelarTurno={prueba} />
              )}
            </Paper>
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