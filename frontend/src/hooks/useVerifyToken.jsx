import { useQuery } from "@tanstack/react-query";
import { verifyToken } from "../api/api.js";

export default function useVerifyToken(token) {
  return useQuery({
    queryKey: ['verify-reset-token', token],
    queryFn: () => verifyToken(token),
    retry: false,
    enabled: !!token
  })
}