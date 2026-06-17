const BASE_URL = "http://localhost:4000/"

export const getAllProfesionales = async () => {
    const response = await fetch(`${BASE_URL}/api/profesionales/`)
    const data = await response.json();
    return data
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
export const getFilteredProfesional = async ({ especialidad, obrasocial }) => {
    const response = await fetch(`${BASE_URL}/api/profesionales?especialiad=${especialidad}&obrasocial=${obrasocial}`)
    const data = await response.json();
    return data
}
export const getProfesionalByDni = async ({ dni }) => {
    const response = await fetch(`${BASE_URL}/api/profesionales/${dni}`)
    const data = await response.json();
    return data
}