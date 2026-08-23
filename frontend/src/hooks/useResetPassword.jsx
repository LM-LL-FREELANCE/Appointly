import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../api/api.js";

export default function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword
  })
}