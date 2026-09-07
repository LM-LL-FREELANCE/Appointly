import { useState, useRef } from 'react'
import { Group, Stack, Button, Paper, TextInput, Grid, Select, Flex, FileButton } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconLock, IconCalendar, IconCheck, IconX } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { MultiSelectCombobox } from '../components/MultiSelectCombobox.jsx'
import { UserAvatar } from '../components/UserAvatar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import useGetCliente from '../hooks/useGetClienteData.jsx'
import useGetProfesional from '../hooks/useGetProfesionalData.jsx'
import { EliminarCuentaModal } from '../components/EliminarCuentaModal.jsx'
import { useDisclosure } from '@mantine/hooks'
import useUpdateCliente from '../hooks/useUpdateAccCliente.jsx'
import useUpdateProfesional from '../hooks/useUpdateAccProfesional.jsx'
import useDeleteCliente from '../hooks/useDeleteCliente.jsx'
import useDeleteProfesional from '../hooks/useDeleteProfesional.jsx'
import useUploadAvatar from '../hooks/useUploadAvatar.jsx'
import useDeleteAvatar from '../hooks/useDeleteAvatar.jsx'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import { notifications } from '@mantine/notifications'
import useSentEmailPassword from '../hooks/useSentEmailPassword.jsx'
import useNotificationCountDown from '../hooks/useNotificationCountDown.jsx'
import { EnviarCorreo } from '../components/EmailModal.jsx'

const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']

function MiPerfilContent({ user, perfilData }) {
  const { logout } = useAuth()
  const isDesktop = useIsDesktop('sm')
  const inputSize = isDesktop ? 'sm' : 'md'

  const { mutate: mutateProfesional, isPending: isPendingProfesional } = useUpdateProfesional()
  const { mutate: mutateCliente, isPending: isPendingCliente } = useUpdateCliente()
  const { mutate: mutateDeleteCliente, isPending: isPendingDeleCliente } = useDeleteCliente()
  const { mutate: mutateDeleteProfesional, isPending: isPendingDeleProfesional } = useDeleteProfesional()
  const { mutate: mutateUploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar()
  const { mutate: mutateDeleteAvatar, isPending: isDeletingAvatar } = useDeleteAvatar()

  const [eliminar, { open: openEliminar, close: closeEliminar }] = useDisclosure(false)
  const [openedEmailModal, { open: openEmailModal, close: closeEmailModal }] = useDisclosure(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const resetRef = useRef(null)

  const [nombre, setNombre] = useState(perfilData?.nombre || '')
  const [apellido, setApellido] = useState(perfilData?.apellido || '')
  const [correo, setCorreo] = useState(perfilData?.correo || '')
  const [genero, setGenero] = useState(() => {
    if (perfilData?.genero === 'M') return 'Masculino'
    if (perfilData?.genero === 'F') return 'Femenino'
    if (perfilData?.genero === 'X') return 'Prefiero no decirlo'
    return null
  })
  const [fechaNacimiento, setFechaNacimiento] = useState(() => {
    return perfilData?.fecha_nacimiento ? new Date(perfilData.fecha_nacimiento) : null
  })
  const [especialidadesSel, setEspecialidadesSel] = useState(() => {
    return perfilData?.especialidad ? perfilData.especialidad.map((e) => e.especialidad) : []
  })
  const [obraSocialSel, setObraSocialSel] = useState(() => {
    if (perfilData?.obraSociales) {
      return perfilData.obraSociales.map((o) => o.obra_sociales)
    }
    if (user?.role === 'cliente') {
      return perfilData?.obra_social ? [perfilData.obra_social] : ['Sin obra social']
    }
    return []
  })

  const { mutate: mutateEmail, isPending } = useSentEmailPassword()
  const { startCountDown, time, stopCountDown } = useNotificationCountDown()
  const notAvailable = time > 0

  const handleCloseEmailModal = () => {
    stopCountDown()
    closeEmailModal()
  }

  const handleSentEmail = () => {
    notifications.show({
      id: 'volverEnviar',
      title: 'Espera un momento...',
      message: 'Estamos enviando tu correo.',
      position: 'top-right',
      withCloseButton: false,
      autoClose: false,
      loading: true,
    })
    setTimeout(() => {
      mutateEmail({
        correo: correo || user?.correo,
        role: user?.role,
      }, {
        onSuccess: () => {
          startCountDown({
            initialTime: 31,
            notificationConfig: {
              id: 'volverEnviar',
              title: 'Correo Enviado',
              message: (tiempoRestante) => `Podras enviar otro correo en ${tiempoRestante}s`,
            },
          })
        },
        onError: (err) => {
          notifications.update({
            id: 'volverEnviar',
            title: 'Error al enviar',
            message: err?.message || 'No se pudo enviar el correo, intenta nuevamente.',
            color: 'red',
            icon: <IconX size={16} />,
            autoClose: 4000,
            withCloseButton: true,
            position: 'top-right',
            loading: false,
          })
        },
      })
    }, 2000)
  }

  const handleDeleteConfirm = () => {
    if (user?.role === 'profesional') {
      mutateDeleteProfesional({
        dni: user?.dni,
      }, {
        onSuccess: logout,
      })
    } else {
      mutateDeleteCliente({
        dni: user?.dni,
      }, { onSuccess: logout })
    }
  }

  const handleSave = () => {
    let generoFinal = undefined
    if (genero === 'Masculino') generoFinal = 'M'
    if (genero === 'Femenino') generoFinal = 'F'
    if (genero === 'Prefiero no decirlo') generoFinal = 'X'

    let fechaFinal = undefined
    if (fechaNacimiento) {
      if (typeof fechaNacimiento === 'string') {
        fechaFinal = fechaNacimiento.split('T')[0]
      } else if (typeof fechaNacimiento.getFullYear === 'function') {
        const year = fechaNacimiento.getFullYear()
        const month = String(fechaNacimiento.getMonth() + 1).padStart(2, '0')
        const day = String(fechaNacimiento.getDate()).padStart(2, '0')
        fechaFinal = `${year}-${month}-${day}`
      }
    }

    const baseData = {
      nombre,
      apellido,
      correo,
      genero: generoFinal,
      fecha_nacimiento: fechaFinal,
    }

    if (user?.role === 'profesional') {
      mutateProfesional({
        dni: user.dni,
        data: {
          ...baseData,
          especialidades: especialidadesSel,
          obras_sociales: obraSocialSel,
        },
      }, {
        onSuccess: () => {
          notifications.show({
            id: 'actualizado',
            title: 'Cambios realizados con exito',
            position: 'top-right',
            icon: <IconCheck />,
            withCloseButton: false,
            autoClose: 3000,
            close: true,
            color: 'green',
          })
        },
      })
    } else {
      mutateCliente({
        dni: user.dni,
        data: {
          ...baseData,
          obra_social: obraSocialSel.length > 0 && obraSocialSel[0] !== 'Sin obra social' ? obraSocialSel[0] : undefined,
        },
      }, {
        onSuccess: () => {
          notifications.show({
            id: 'actualizado',
            title: 'Cambios realizados con exito',
            position: 'top-right',
            icon: <IconCheck />,
            withCloseButton: false,
            autoClose: 3000,
            allowClose: true,
            color: 'green',
          })
        },
      })
    }
  }

  const handleFileChange = (file) => {
    if (!file || !user?.dni) return
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    mutateUploadAvatar(
      { dni: user.dni, file },
      {
        onSuccess: () => {
          URL.revokeObjectURL(objectUrl)
          setPreviewUrl(null)
          resetRef.current?.()
        },
        onError: () => {
          URL.revokeObjectURL(objectUrl)
          setPreviewUrl(null)
          resetRef.current?.()
        },
      }
    )
  }

  const handleDeleteAvatar = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      resetRef.current?.()
      return
    }
    if (user?.dni && perfilData?.foto_url) {
      mutateDeleteAvatar({ dni: user.dni })
    }
  }

  const avatarSrc = previewUrl || perfilData?.foto_url || undefined
  const currentName = `${nombre || user?.nombre || ''} ${apellido || user?.apellido || ''}`.trim()
  const hasPhoto = Boolean(previewUrl || perfilData?.foto_url)

  return (
    <>
      <PageHeader title="Mi perfil" withAvatar={false} />

      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'flex-start' }}
        gap="lg"
        p="md"
        pb="xl"
      >
        <Stack align="center" w={{ base: '100%', md: 220 }} gap="md">
          <Stack align="center" gap="sm">
            <UserAvatar
              size={120}
              withLink={false}
              src={avatarSrc}
              name={currentName || undefined}
            />
            <Group gap="xs">
              <FileButton resetRef={resetRef} onChange={handleFileChange} accept="image/png,image/jpeg,image/webp">
                {(props) => (
                  <Button {...props} variant="outline" size={inputSize} color="dark" loading={isUploadingAvatar}>
                    Cambiar foto
                  </Button>
                )}
              </FileButton>
              <Button
                variant="subtle"
                size={inputSize}
                color="red"
                disabled={!hasPhoto}
                loading={isDeletingAvatar}
                onClick={handleDeleteAvatar}
              >
                Eliminar
              </Button>
            </Group>
          </Stack>
          <TextInput
            label="DNI"
            size={inputSize}
            value={user?.dni ?? ''}
            readOnly
            w="100%"
            rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
          />
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md" w="100%">
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
            {user?.role === 'profesional' && (
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
              label={user?.role === 'profesional' ? 'Obras sociales' : 'Obra Social'}
              size={inputSize}
              data={obraSocialSel}
              value={obraSocialSel}
              onChange={setObraSocialSel}
              placeholder="+ agregar..."
              maxSelected={user?.role === 'profesional' ? undefined : 1}
            />
          </Stack>
          <Group gap="sm" mt="xl" wrap="wrap" justify="space-between">
            <Group w={{ base: '100%', sm: 'auto' }}>
              <Button size={inputSize} w={{ base: '100%', sm: 'auto' }} onClick={openEmailModal} loading={isPendingProfesional || isPendingCliente}>
                Cambiar contraseña
              </Button>
            </Group>
            <Group w={{ base: '100%', sm: 'auto' }} justify="flex-end">
              <Button color="red" onClick={openEliminar} variant="outline" size={inputSize} w={{ base: '100%', sm: 'auto' }}>
                Eliminar cuenta
              </Button>
              <Button size={inputSize} w={{ base: '100%', sm: 'auto' }} onClick={handleSave} loading={isPendingProfesional || isPendingCliente}>
                Guardar
              </Button>
            </Group>
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
      {openedEmailModal && (
        <EnviarCorreo
          opened={openedEmailModal}
          onClose={handleCloseEmailModal}
          email={correo || user?.correo}
          setEmail={setCorreo}
          onSettings={true}
          onConfirm={handleSentEmail}
          isPending={isPending}
          isNotAvailble={notAvailable}
        />
      )}
    </>
  )
}

export default function MiPerfil() {
  const { user } = useAuth()

  const { data: perfil } = useGetProfesional({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined,
  })

  const { data: perfilCliente } = useGetCliente({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined,
  })

  const perfilData = user?.role === 'profesional' ? perfil : perfilCliente
  const formKey = `${user?.dni || 'guest'}-${perfilData ? 'loaded' : 'loading'}`

  return <MiPerfilContent key={formKey} user={user} perfilData={perfilData} />
}
