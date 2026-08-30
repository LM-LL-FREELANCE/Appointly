import { useMutation } from "@tanstack/react-query";
import { cancelTurnoById } from "../api/clientes";

export default function useCancelTurno() {
  return useMutation({
    mutationFn: cancelTurnoById,
    meta: { silent: true },
  })
}