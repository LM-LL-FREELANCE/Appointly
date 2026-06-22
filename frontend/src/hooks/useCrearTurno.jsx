import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNewTurno } from "../services/turnos.service.js";


export default function useCreateTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNewTurno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
    onError: (err) => {
      if (err.code === 'SLOT_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['slots'] });
      }
    }
  })
}