import { useMutation } from "@tanstack/react-query";
import { sentEmailPassword } from "../api/api";

export default function useSentEmailPassword() {
  return useMutation({
    mutationFn: sentEmailPassword,
    meta: { silent: true }
  })
}