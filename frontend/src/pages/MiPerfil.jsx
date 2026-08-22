import { useState, useRef, useEffect } from 'react'
import { Group, Stack, Text, Avatar, Button, Paper, TextInput, Grid, Select, Flex, FileButton, Notification } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useMediaQuery } from '@mantine/hooks'
import { IconLock, IconCalendar } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { MultiSelectCombobox } from '../components/MultiSelectCombobox.jsx'
import { useAuth } from '../hooks/useAuth.js'
import useGetCliente from '../hooks/useGetClienteData.jsx'
import useGetProfesional from '../hooks/useGetProfesionalData.jsx'
import { EliminarCuentaModal } from '../components/EliminarCuentaModal.jsx'
import { useDisclosure } from '@mantine/hooks'
import useUpdateCliente from '../hooks/useUpdateAccCliente.jsx'
import useUpdateProfesional from '../hooks/useUpdateAccProfesional.jsx'
import useDeleteCliente from '../hooks/useDeleteCliente.jsx'
import useDeleteProfesional from '../hooks/useDeleteProfesional.jsx'

const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']


export default function MiPerfil() {
  const { logout, user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const inputSize = isMobile ? 'md' : 'sm'

  const { data: perfil } = useGetProfesional({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined
  })



  const { data: perfilCliente } = useGetCliente({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined
  })

  const [notificacion, setNotificacion] = useState(null)
  const { mutate: mutateProfesional, isPending: isPendingProfesional } = useUpdateProfesional()
  const { mutate: mutateCliente, isPending: isPendingCliente } = useUpdateCliente()
  const { mutate: mutateDeleteCliente, isPesding: isPendingDeleCliente } = useDeleteCliente()
  const { mutate: mutateDeleteProfesional, isPesding: isPendingDeleProfesional } = useDeleteProfesional()

  const handleDeleteConfirm = () => {
    if (user?.role === "profesional") {
      mutateDeleteProfesional({
        dni: user?.dni
      }, {
        onSuccess: logout
      })
    } else {
      mutateDeleteCliente({
        dni: user?.dni
      }, { onSuccess: logout })
    }
  }

  const handleSave = () => {
    let generoFinal = undefined;
    if (genero === "Masculino") generoFinal = "M";
    if (genero === "Femenino") generoFinal = "F";
    if (genero === "Prefiero no decirlo") generoFinal = "X";

    let fechaFinal = undefined;
    if (fechaNacimiento) {
      if (typeof fechaNacimiento === 'string') {
        fechaFinal = fechaNacimiento.split('T')[0];
      } else if (typeof fechaNacimiento.getFullYear === 'function') {
        const year = fechaNacimiento.getFullYear();
        const month = String(fechaNacimiento.getMonth() + 1).padStart(2, '0');
        const day = String(fechaNacimiento.getDate()).padStart(2, '0');
        fechaFinal = `${year}-${month}-${day}`;
      }
    }

    const baseData = {
      nombre,
      apellido,
      correo,
      genero: generoFinal,
      fecha_nacimiento: fechaFinal,
    }

    const handleSuccess = () => setNotificacion({ tipo: 'success', titulo: '¡Actualizado!', mensaje: 'Tus datos se guardaron correctamente.' });
    const handleError = (error) => setNotificacion({ tipo: 'error', titulo: 'Error al guardar', mensaje: error?.message || 'Hubo un problema al actualizar tu perfil.' });

    if (user?.role === "profesional") {
      mutateProfesional({
        dni: user.dni,
        data: {
          ...baseData,
          especialidades: especialidadesSel,
          obras_sociales: obraSocialSel
        }
      }, { onSuccess: handleSuccess, onError: handleError })
    } else {
      mutateCliente({
        dni: user.dni,
        data: {
          ...baseData,
          obra_social: obraSocialSel.length > 0 && obraSocialSel[0] !== "Sin obra social" ? obraSocialSel[0] : undefined
        }
      }, { onSuccess: handleSuccess, onError: handleError })
    }
  }
  const perfilData = user?.role === "profesional" ? perfil : perfilCliente
  const [eliminar, { open: openEliminar, close: closeEliminar }] = useDisclosure(false)
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [correo, setCorreo] = useState("")
  const [genero, setGenero] = useState(null)
  const [fechaNacimiento, setFechaNacimiento] = useState(null)
  const [especialidadesSel, setEspecialidadesSel] = useState([])
  const [obraSocialSel, setObraSocialSel] = useState([])

  useEffect(() => {
    if (perfilData) {
      setNombre(perfilData.nombre || "")
      setApellido(perfilData.apellido || "")
      setCorreo(perfilData.correo || "")
      if (perfilData.genero === "M") {
        setGenero("Masculino")
      } else if (perfilData.genero === "F") {
        setGenero("Femenino")
      } else if (perfilData.genero === "X") {
        setGenero("Prefiero no decirlo")
      } else {
        setGenero(null)
      }
      if (perfilData.fecha_nacimiento) {
        setFechaNacimiento(new Date(perfilData.fecha_nacimiento))
      }
      if (perfilData.especialidad) {
        setEspecialidadesSel(perfilData.especialidad.map(e => e.especialidad))
      }
      if (perfilData.obraSociales) {
        setObraSocialSel(perfilData.obraSociales.map(o => o.obra_sociales))
      } else if (user?.role === 'cliente') {
        setObraSocialSel(perfilData.obra_social ? [perfilData.obra_social] : ['Sin obra social'])
      }
    }
  }, [perfilData, user?.role])

  useEffect(() => {
    if (notificacion) {
      const timer = setTimeout(() => {
        setNotificacion(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [notificacion])

  const [foto, setFoto] = useState(null)
  const resetRef = useRef(null)
  const clearFoto = () => {
    setFoto(null)
    resetRef.current?.()
  }
  const avatarSrc = foto ? URL.createObjectURL(foto) : perfilData?.foto_url ?? undefined

  return (
    <>
      <PageHeader title="Mi perfil" withAvatar={false} />

      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'flex-start' }} gap="lg"
        p="md" pb="xl">
        <Stack align="center" w={{ base: '100%', md: 220 }} gap="md">
          <Stack align="center" gap="sm">
            <Avatar size={120} radius="50%" src={avatarSrc} />
            <Group gap="xs">
              <FileButton resetRef={resetRef} onChange={setFoto} accept="image/png,image/jpeg,image/webp">
                {(props) => (
                  <Button {...props} variant="outline" size={inputSize} color="dark">
                    Cambiar foto
                  </Button>
                )}
              </FileButton>
              <Button variant="subtle" size={inputSize} color="red" disabled={!foto} onClick={clearFoto}>
                Eliminar
              </Button>
            </Group>
          </Stack>
          <TextInput label="DNI" size={inputSize} value={user?.dni ?? ''} readOnly w="100%"
            rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
          />
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md" w="100%">
          {notificacion && (
            <Notification
              color={notificacion.tipo === 'success' ? 'green' : 'red'}
              title={notificacion.titulo}
              onClose={() => setNotificacion(null)}
              mb="md"
            >
              {notificacion.mensaje}
            </Notification>
          )}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Nombre"
                size={inputSize}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Apellido"
                size={inputSize}
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Correo"
            size={inputSize}
            mt="md"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <Grid gutter="md" mt="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Género"
                size={inputSize}
                placeholder="Ej: Masculino"
                data={OPCIONES_GENERO}
                value={genero}
                onChange={setGenero}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DatePickerInput
                label="Fecha de nacimiento"
                size={inputSize}
                placeholder="Seleccione una fecha"
                value={fechaNacimiento}
                onChange={setFechaNacimiento}
                rightSection={<IconCalendar size={16} stroke={1.5} color="gray" />}
                locale="es"
                maxDate={new Date()}
              />
            </Grid.Col>
          </Grid>

          <Stack gap="md" mt="md">
            {user?.role === "profesional" && (
              <MultiSelectCombobox
                label="Especialidades"
                size={inputSize}
                data={especialidadesSel}
                value={especialidadesSel}
                onChange={setEspecialidadesSel}
                placeholder="+ agregar..."
              />
            )}

            <MultiSelectCombobox
              label={user?.role === "profesional" ? 'Obras sociales' : 'Obra Social'}
              size={inputSize}
              data={obraSocialSel}
              value={obraSocialSel}
              onChange={setObraSocialSel}
              placeholder="+ agregar..."
              maxSelected={user?.role === "profesional" ? undefined : 1}
            />
          </Stack>

          <Group justify="flex-end" gap="sm" mt="xl" wrap="wrap">
            <Button color="red" onClick={openEliminar} variant="outline" size={inputSize} w={{ base: '100%', sm: 'auto' }}>
              Eliminar cuenta
            </Button>
            <Button size={inputSize} w={{ base: '100%', sm: 'auto' }} onClick={handleSave} loading={isPendingProfesional || isPendingCliente}>
              Guardar
            </Button>
          </Group>
        </Paper>
      </Flex>
      {eliminar && (
        <EliminarCuentaModal
          opened={eliminar}
          onClose={closeEliminar}
          onConfirm={handleDeleteConfirm}
          isPending={isPendingDeleCliente || isPendingDeleProfesional}
        />
      )}
    </>
  )
}