import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelTurnoById } from '../../api/clientes.js'
import useCambiarEstadoTurno from '../../hooks/useCambiarEstadoTurno.jsx'
import { invalidarTurnosProfesional } from '../../hooks/useTurnosDia.jsx'

// Shared by the desktop table and the mobile detail: runs an action from
// `accionesProfesional` and owns the state of the confirm and history modals.
// To add another action, give it a branch in `ejecutar`.
export function useAccionesTurnoProf() {
  const queryClient = useQueryClient()
  const cambiarEstado = useCambiarEstadoTurno()
  const cancelar = useMutation({
    mutationFn: ({ id, motivo }) => cancelTurnoById({ id, motivo }),
    onSettled: (_data, _err, { id }) => invalidarTurnosProfesional(queryClient, id),
  })

  const [confirmacion, setConfirmacion] = useState(null) // { turno, accion }
  const [historialId, setHistorialId] = useState(null)
  const [reprogramando, setReprogramando] = useState(null) // turno being reprogrammed

  // Cancel is not handled here: each view has its own cancel UI (modal / drawer).
  const ejecutar = (turno, accion) => {
    if (accion.reprogramar) {
      setReprogramando(turno)
      return
    }
    if (accion.confirmar) {
      setConfirmacion({ turno, accion })
      return
    }
    cambiarEstado.mutate({ id: turno.id_turno, estado: accion.estado })
  }

  const confirmar = (motivo) => {
    const { turno, accion } = confirmacion
    cambiarEstado.mutate(
      { id: turno.id_turno, estado: accion.estado, motivo },
      { onSuccess: () => setConfirmacion(null), onError: () => setConfirmacion(null) },
    )
  }

  return {
    ejecutar,
    cambiandoEstado: cambiarEstado.isPending,
    confirmacion,
    confirmar,
    cerrarConfirmacion: () => !cambiarEstado.isPending && setConfirmacion(null),
    cancelar,
    historialId,
    abrirHistorial: (turno) => setHistorialId(typeof turno === 'number' ? turno : (turno?.id_turno ?? turno?.id)),
    cerrarHistorial: () => setHistorialId(null),
    reprogramando,
    cerrarReprogramar: () => setReprogramando(null),
  }
}
