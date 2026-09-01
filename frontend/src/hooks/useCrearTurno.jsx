import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNewTurno } from "../api/turnos.js";


export default function useCreateTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNewTurno,
    meta: { silent: true },
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