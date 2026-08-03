import { useQuery } from "@tanstack/react-query";
import { getClienteByDni } from "../api/clientes";

export default function useGetCliente({ dni, rol }) {
  return useQuery({
    queryKey: ["perfil", "cliente", dni],
    queryFn: () => getClienteByDni({ dni }),
    enabled: rol === "cliente" && !!dni
  })
}