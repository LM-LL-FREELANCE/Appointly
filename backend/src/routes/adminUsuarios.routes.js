import { Router } from "express"
import { AdminUsuariosController } from "../controllers/adminUsuarios.controller.js"

// WS1 — Gestion de usuarios y cuentas (PLAN §8.3, U1–U7).
// Montado en /api/admin/usuarios con requireAuth + grantAccess(["admin"]) (admin.routes.js).
export const adminUsuariosRouter = Router()

adminUsuariosRouter.get("/", AdminUsuariosController.list) // U1
adminUsuariosRouter.get("/:dni/:rol", AdminUsuariosController.getFicha) // U2
adminUsuariosRouter.patch("/:dni/:rol", AdminUsuariosController.update) // U3
adminUsuariosRouter.post("/:dni/:rol/suspension", AdminUsuariosController.suspender) // U4
adminUsuariosRouter.post("/:dni/:rol/reactivacion", AdminUsuariosController.reactivar) // U5
adminUsuariosRouter.delete("/:dni/:rol", AdminUsuariosController.darDeBaja) // U6
adminUsuariosRouter.post("/:dni/:rol/reset-password", AdminUsuariosController.resetPassword) // U7
