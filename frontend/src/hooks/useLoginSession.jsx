import { useMutation } from "@tanstack/react-query";
import { login } from "../api/api";


export default function useLoginSession() {
  return useMutation({
    mutationFn: login,
  })
}