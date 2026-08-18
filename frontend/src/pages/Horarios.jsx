import { useState, useMemo } from "react"
import { PageHeader } from "../components/PageHeader.jsx"
import { Alert, Avatar, Box, Button, Group, Paper, SimpleGrid, Stack, Switch, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import { useIsDesktop } from "../hooks/useIsDesktop.js"
import TimeSlot from "../components/TimeSlot.jsx"
import HorariosSkeleton from "../components/skeletons/HorariosSkeleton.jsx"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getHorariosByDni, createHorario, updateHorario, deleteHorario } from "../api/profesionales.js"
import { useAuth } from "../hooks/useAuth.js"
import { IconExclamationCircle, IconCheck, IconX, IconPlus } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function Horarios() {
  const { user } = useAuth()
  const isDesktop = useIsDesktop()

  // Local mutations
  const [added, setAdded] = useState([])
  const [deleted, setDeleted] = useState([])
  const [edited, setEdited] = useState({})
  const [dayToggled, setDayToggled] = useState({}) // overrides explícitos del switch por día

  const { data, isPending, isError } = useQuery({
    queryKey: ['horarios', user?.dni],
    queryFn: () => getHorariosByDni({ dni: user.dni }),
    enabled: !!user?.dni
  })

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
        ...toDelete.map(id => deleteHorario({ id })),
        ...toPut.map(slot => updateHorario({ ...slot })),
        ...toPost.map(slot => createHorario({ ...slot, dni: user.dni })),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios', user.dni] });
      setAdded([]);
      setDeleted([]);
      setEdited({});
      setDayToggled({});
      (() => {
        const id = notifications.show({
          title: 'Espera un momento...',
          message: 'Guardando cambios en tus horarios',
          position: 'top-center',
          withCloseButton: false,
          autoClose: false,
          loading: true,
        });

        setTimeout(() => {
          notifications.update({
            id,
            title: 'Datos guardados',
            message: 'Tus horarios fueron guardados correctamente',
            icon: <IconCheck />,
            loading: false,
            autoClose: 3000,
            allowClose: true,
          });
        }, 1500);
      })();
    },
    onError: (err) => {
      console.error('[Horarios] Error al guardar:', err.message);
      notifications.show({
        title: 'Error al guardar los horarios',
        message: 'Verifica que los lapsos de tiempo no se superpongan',
        color: 'red',
        icon: <IconX />,
        allowClose: true,
        autoClose: 3000,
        withCloseButton: false,
        position: 'top-center',
      })
    }
  });

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz="xl">Horarios de Atención</Text>
            {isDesktop && <Text c="dimmed" fz="md">define los slots reservables</Text>}
          </Stack>
          <Group>
            {isDesktop && <Button onClick={saveHorarios}>Guardar cambios</Button>}
            <Avatar radius="xl" alt="" component={Link} to="/miperfil" />
          </Group>
        </Group>
      </PageHeader>

      <Box>
        {isPending && <HorariosSkeleton />}

        {isError && (
          <Alert color="red" m="md" variant="light" icon={<IconExclamationCircle />}>
            Hubo un error al cargar los horarios
          </Alert>
        )}

        {!isPending && !isError && (
          <Stack gap="sm" pb={10}>
            {DIAS.map((nombre, dia) => (
              <Paper key={dia} withBorder p="sm" radius="md">
                <Group wrap="wrap" gap="md" align={isDesktop ? 'stretch' : 'center'}>
                  {isDesktop ? (
                    <Paper radius="sm" p="lg" w={180} style={{ flexShrink: 0, display: 'flex', alignItems: 'start', justifyContent: 'start', paddingLeft: '15px' }}>
                      <Switch
                        size="md"
                        checked={dayEnabled[dia]}
                        onChange={() => toggleDay(dia)}
                        withThumbIndicator={false}
                        label={<Text fw={600} size="inherit">{nombre}</Text>}
                        radius="xl"
                      />
                    </Paper>
                  ) : (
                    <Group justify="space-between" w="100%">
                      <Switch
                        size="lg"
                        checked={dayEnabled[dia]}
                        onChange={() => toggleDay(dia)}
                        withThumbIndicator={false}
                        label={nombre}
                        radius="xl"
                      />
                      {dayEnabled[dia] && slotsByDay[dia].length > 0 && (
                        <Text c="dimmed" size="md">
                          {slotsByDay[dia].length} {slotsByDay[dia].length === 1 ? 'franja' : 'franjas'}
                        </Text>
                      )}
                    </Group>
                  )}

                  <Paper radius="sm" style={{ flex: 1, minWidth: 0, alignItems: 'center', margin: 'auto' }} h="100%">
                    {dayEnabled[dia] ? (
                      isDesktop ? (
                        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 200px))', gap: 'var(--mantine-spacing-xs)' }} >
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
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            <Button variant="default" size="sm" leftSection={<IconPlus size={16} />} onClick={() => addSlot(dia)}>
                              Agregar franja
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
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
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            <Button variant="default" size="md" w="100%" onClick={() => addSlot(dia)} leftSection={<IconPlus size={16} />} >
                              Agregar franja
                            </Button>
                          </Box>
                        </SimpleGrid>
                      )
                    ) : (
                      <Box style={{ display: 'flex', alignItems: 'center' }} h="100%" mih={{ base: 0, md: 38 }}>
                        <Text c="dimmed" fz="sm" >Día inactivo</Text>
                      </Box>
                    )}
                  </Paper>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {!isDesktop && (
        <>
          <Box h={60} />

          <Box
            p="md"
            bg="var(--mantine-color-body)"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
          >
            <Button fullWidth size="lg" /*disabled={isPending || isError || isSaving}*/ onClick={saveHorarios}>Guardar cambios</Button>
          </Box>
        </>
      )}
    </>
  );
}
