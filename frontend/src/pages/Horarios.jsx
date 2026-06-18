import { useState, useMemo } from "react";
import { PageHeader } from "../components/PageHeader.jsx";
import { Alert, Avatar, Box, Button, Group, Loader, Paper, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import TimeSlot from "../components/TimeSlot.jsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHorariosByDni, createHorario, updateHorario, deleteHorario } from "../services/profesionales.js";

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DNI = '27845123';

export default function Horarios() {
  // Local mutations
  const [added, setAdded] = useState([])
  const [deleted, setDeleted] = useState([])
  const [edited, setEdited] = useState({})
  const [dayToggled, setDayToggled] = useState({}) // overrides explícitos del switch por día

  const { data, isPending, isError } = useQuery({
    queryKey: ['horarios', DNI],
    queryFn: () => getHorariosByDni({ dni: DNI, rol: 'profesional' }),
  });

  // Asignar _localId estable a los slots del servidor
  const serverSlots = useMemo(
    () => (data || []).map(s => ({ ...s, _localId: `server-${s.id_horario}` })),
    [data]);

  // Slots finales: servidor + añadidos, filtrando borrados y aplicando ediciones
  const allSlots = useMemo(() => (
    [...serverSlots, ...added]
      .filter(s => !deleted.includes(s._localId))
      .map(s => edited[s._localId] ? { ...s, ...edited[s._localId] } : s)
  ), [serverSlots, added, deleted, edited]);

  // Agrupar por dia
  const slotsByDay = useMemo(() => {
    const result = {};
    DIAS.forEach((_, i) => { result[i] = []; });
    allSlots.forEach(s => result[s.dia_semana].push(s));
    return result;
  }, [allSlots]);

  // Estado efectivo del switch: override explicito si existe, si no derivado del servidor
  const dayEnabled = useMemo(() => {
    const result = {};
    DIAS.forEach((_, i) => {
      result[i] = i in dayToggled
        ? dayToggled[i]
        : (data || []).some(s => s.dia_semana === i);
    });
    return result;
  }, [data, dayToggled]);

  const addSlot = (dia) => {
    setAdded(prev => [...prev, {
      _localId: crypto.randomUUID(),
      id_horario: null,
      dia_semana: dia,
      hora_inicio: '',
      hora_fin: '',
    }]);
  };

  const removeSlot = (localId) => {
    setDeleted(prev => [...prev, localId]);
  };

  const updateSlot = (localId, field, value) => {
    setEdited(prev => ({
      ...prev,
      [localId]: { ...(prev[localId] || {}), [field]: value },
    }));
  };

  const toggleDay = (dia) => {
    const isCurrentlyEnabled = dayEnabled[dia];
    if (!isCurrentlyEnabled && slotsByDay[dia].length === 0) {
      addSlot(dia);
    }
    setDayToggled(prev => ({ ...prev, [dia]: !isCurrentlyEnabled }));
  };

  const buildSavePayload = () => {
    const toDelete = [];
    const toPost = [];
    const toPut = [];

    DIAS.forEach((_, dia) => {
      const serverSlotsForDay = (data || []).filter(s => s.dia_semana === dia);

      if (!dayEnabled[dia]) {
        serverSlotsForDay.forEach(s => toDelete.push(s.id_horario));
        return;
      }

      serverSlotsForDay.forEach(s => {
        const localId = `server-${s.id_horario}`;
        if (deleted.includes(localId)) {
          toDelete.push(s.id_horario);
        } else if (edited[localId]) {
          toPut.push({
            id: s.id_horario,
            dia_semana: s.dia_semana,
            hora_inicio: edited[localId].hora_inicio ?? s.hora_inicio,
            hora_fin: edited[localId].hora_fin ?? s.hora_fin,
          });
        }
      });

      added
        .filter(s => s.dia_semana === dia && !deleted.includes(s._localId))
        .forEach(s => {
          const edits = edited[s._localId] || {};
          const hora_inicio = edits.hora_inicio ?? s.hora_inicio;
          const hora_fin = edits.hora_fin ?? s.hora_fin;
          if (hora_inicio && hora_fin) {
            toPost.push({ dia_semana: s.dia_semana, hora_inicio, hora_fin });
          }
        });
    });

    return { toDelete, toPost, toPut };
  };

  const queryClient = useQueryClient();

  const { mutate: saveHorarios, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const { toDelete, toPost, toPut } = buildSavePayload();
      await Promise.all([
        ...toDelete.map(id => deleteHorario({ id, dni: DNI })),
        ...toPut.map(slot => updateHorario({ ...slot, dni: DNI })),
        ...toPost.map(slot => createHorario({ ...slot, dni: DNI })),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios', DNI] });
      setAdded([]);
      setDeleted([]);
      setEdited({});
      setDayToggled({});
    },
    onError: (err) => {
      console.error('[Horarios] Error al guardar:', err.message);
    },
  });

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Horarios de Atención</Text>
            <Text c="dimmed" visibleFrom="md" fz={{ base: 'md', sm: 'sm' }}>define los slots reservables</Text>
          </Stack>
          <Group>
            <Button visibleFrom="md" disabled={isPending} loading={isSaving} onClick={saveHorarios}>Guardar cambios</Button>
            <Avatar radius="xl" alt="" />
          </Group>
        </Group>
      </PageHeader>

      {isPending && (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      )}

      {isError && (
        <Alert color="red" mt="md">
          <Text fw={500} c="red">
            Error al cargar los horarios
          </Text>
        </Alert>
      )}

      {!isPending && !isError && (
        <Stack gap="sm" pb={10}>
          {DIAS.map((nombre, dia) => (
            <Paper key={dia} withBorder p="sm" radius="md">
              <Group wrap="wrap" gap="md" align="center">
                {/* DAY SWITCH */}
                <Group justify="space-between" w={{ base: '100%', md: 160 }}>
                  <Switch
                    size="lg"
                    hiddenFrom="md"
                    checked={dayEnabled[dia]}
                    onChange={() => toggleDay(dia)}
                    withThumbIndicator={false}
                    label={nombre}
                    radius="xl"
                  />
                  <Switch
                    size="md"
                    visibleFrom="md"
                    checked={dayEnabled[dia]}
                    onChange={() => toggleDay(dia)}
                    withThumbIndicator={false}
                    label={<Text fw={600} size="inherit">{nombre}</Text>}
                    radius="xl"
                  />
                  {/*SHOW SLOT COUNT IF DAY IS ENABLED */}
                  {dayEnabled[dia] && slotsByDay[dia].length > 0 && (
                    <Text c="dimmed" size="md" hiddenFrom="md">
                      {slotsByDay[dia].length} {slotsByDay[dia].length === 1 ? 'franja' : 'franjas'}
                    </Text>
                  )}
                </Group>

                {dayEnabled[dia] ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 5 }} spacing="xs" style={{ flex: 1 }}>
                    {/* SLOT ITEMS */}
                    {slotsByDay[dia].map(slot => (
                      <TimeSlot
                        key={slot._localId}
                        horaInicio={slot.hora_inicio}
                        horaFin={slot.hora_fin}
                        onDelete={() => removeSlot(slot._localId)}
                        onChangeInicio={(val) => updateSlot(slot._localId, 'hora_inicio', val)}
                        onChangeFin={(val) => updateSlot(slot._localId, 'hora_fin', val)}
                      />
                    ))}
                    <Box hiddenFrom="md" style={{ display: 'flex', alignItems: 'center' }}>
                      <Button variant="outline" size="md" w="100%" onClick={() => addSlot(dia)}>
                        + Agregar franja
                      </Button>
                    </Box>
                    <Box visibleFrom="md" style={{ display: 'flex', alignItems: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => addSlot(dia)}>
                        + Agregar franja
                      </Button>
                    </Box>
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" fz="md" style={{ alignSelf: 'center' }}>Día inactivo</Text>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <Box hiddenFrom="md" h={60} />

      <Box
        hiddenFrom="md"
        p="md"
        bg="var(--mantine-color-body)"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      >
        <Button fullWidth size="lg" disabled={isPending || isError} loading={isSaving} onClick={saveHorarios}>Guardar cambios</Button>
      </Box>
    </>
  );
}
