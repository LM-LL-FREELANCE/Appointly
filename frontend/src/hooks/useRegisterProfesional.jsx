import { useMutation } from "@tanstack/react-query"
import { registerProfesional } from "../api/profesionales.js"

export default function useRegisterProfesional() {
  return useMutation({
    mutationFn: registerProfesional,
  })
}
