const BASE_URL = import.meta.env.VITE_API_URL


export const getProfesionalesSlots = async ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ desde, hasta })
  const response = await fetch(`${BASE_URL}/api/profesionales/${dni}/slots?${params}`, {
    cache: 'no-store'
  })

  const data = await response.json()
  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data
}

export const createNewTurno = async (turno) => {
  const response = await fetch(`${BASE_URL}/api/turnos`, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(turno)
  })
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
}