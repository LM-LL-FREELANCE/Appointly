import { useMutation } from "@tanstack/react-query";
import { deleteAccProfesional } from "../api/profesionales";

export default function useDeleteProfesional() {
  return useMutation({
    mutationFn: deleteAccProfesional
  })
}