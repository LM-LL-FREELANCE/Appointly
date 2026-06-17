

const BASE_URL = "http://localhost:4000"

export const getFilteredProfesional = async ({ especialidad, obraSocial } = {}) => {
    const params = new URLSearchParams()
    if (especialidad) params.append('especialidad', especialidad)
    if (obraSocial) params.append('obrasocial', obraSocial)

    const query = params.toString()
    const url = query
        ? `${BASE_URL}/api/profesionales?${query}`
        : `${BASE_URL}/api/profesionales`

    const response = await fetch(url)
    if (!response.ok) {
        return []
    }
    const data = await response.json();
    return Array.isArray(data) ? data : []
}
export const getAllEspecialidades = async () => {
    const response = await fetch(`${BASE_URL}/api/especialidades/`)
    const data = await response.json()
    return data
}
export const getAllObraSociales = async () => {
    const response = await fetch(`${BASE_URL}/api/obra-sociales/`)
    const data = await response.json()
    return data
}
export const getProfesionalByDni = async ({ dni }) => {
    const response = await fetch(`${BASE_URL}/api/profesionales/${dni}`)
    const data = await response.json();
    return data
}