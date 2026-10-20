import { Menu } from '@mantine/core'
import {
  IconArrowsExchange,
  IconCalendarEvent,
  IconCalendarX,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconHistory,
  IconUserX,
} from '@tabler/icons-react'
import { esAbierto, esCancelable, esReprogramable } from '../../../utils/estadosTurno.js'
import { fechaISODeApi } from '../../../utils/fechas.utils.js'

export function TurnoRowMenu({
  turno,
  ahora,
  target,
  cambiandoEstado,
  onConfirmar,
  onMarcarEnEspera,
  onReprogramar,
  onVerHistorial,
  onReasignar,
  onCompletar,
  onMarcarAusente,
  onCancelar,
}) {
  const { estado } = turno
  const fecha = fechaISODeApi(turno.fecha_turno)
  const hora = String(turno.hora_turno ?? '00:00').slice(0, 5)
  const esHoy = fecha === ahora.fecha
  const esHoyOFuturo = fecha >= ahora.fecha
  const yaComenzo = `${fecha}T${hora}` <= `${ahora.fecha}T${ahora.hora}`
  const enAtencion = estado === 'confirmado' || estado === 'en_espera'

  const puedeConfirmar = estado === 'pendiente_confirmacion'
  const puedeEnEspera = estado === 'confirmado' && esHoy
  const puedeReprogramar = esReprogramable(estado)
  const puedeReasignar = esAbierto(estado) && esHoyOFuturo
  const puedeCompletar = (estado === 'en_curso' || enAtencion) && yaComenzo
  const puedeAusente = enAtencion && yaComenzo
  const puedeCancelar = esCancelable(estado)

  return (
    <Menu shadow="md" position="bottom-end" withinPortal>
      <Menu.Target>{target}</Menu.Target>
      <Menu.Dropdown>
        {puedeConfirmar && (
          <Menu.Item
            leftSection={<IconCheck size={14} />}
            disabled={cambiandoEstado}
            onClick={() => onConfirmar(turno)}
          >
            Confirmar
          </Menu.Item>
        )}

        {puedeEnEspera && (
          <Menu.Item
            leftSection={<IconClock size={14} />}
            disabled={cambiandoEstado}
            onClick={() => onMarcarEnEspera(turno)}
          >
            Marcar en espera
          </Menu.Item>
        )}

        {puedeReprogramar && (
          <Menu.Item
            leftSection={<IconCalendarEvent size={14} />}
            onClick={() => onReprogramar(turno)}
          >
            Reprogramar
          </Menu.Item>
        )}

        <Menu.Item
          leftSection={<IconHistory size={14} />}
          onClick={() => onVerHistorial(turno)}
        >
          Ver historial
        </Menu.Item>

        {puedeReasignar && (
          <Menu.Item
            leftSection={<IconArrowsExchange size={14} />}
            onClick={() => onReasignar(turno)}
          >
            Reasignar profesional
          </Menu.Item>
        )}

        {puedeCompletar && (
          <Menu.Item
            leftSection={<IconCircleCheck size={14} />}
            onClick={() => onCompletar(turno)}
          >
            Marcar completado
          </Menu.Item>
        )}

        {puedeAusente && (
          <Menu.Item
            leftSection={<IconUserX size={14} />}
            onClick={() => onMarcarAusente(turno)}
          >
            Marcar ausente
          </Menu.Item>
        )}

        {puedeCancelar && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconCalendarX size={14} />}
              onClick={() => onCancelar(turno)}
            >
              Cancelar turno
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
