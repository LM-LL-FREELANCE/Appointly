import { useMutation } from "@tanstack/react-query";
import { updateByDni } from "../api/profesionales";

export default function useUpdateProfesional() {
  return useMutation({
    mutationFn: updateByDni
  })
}