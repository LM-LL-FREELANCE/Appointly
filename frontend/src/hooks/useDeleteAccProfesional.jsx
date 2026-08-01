import { useMutation } from "@tanstack/react-query"
import { deleteAccProfesional } from "../api/profesionales"

export default function useDeleteAccProfesional() {
  return useMutation({
    mutationFn: deleteAccProfesional
  })
}