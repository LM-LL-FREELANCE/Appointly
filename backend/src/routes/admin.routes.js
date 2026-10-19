import { Router } from "express"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"
import { adminUsuariosRouter } from "./adminUsuarios.routes.js"
import { adminTurnosRouter } from "./adminTurnos.routes.js"
import { adminBloqueosRouter } from "./adminBloqueos.routes.js"
import { adminComunicacionesRouter } from "./adminComunicaciones.routes.js"
import { adminMetricasRouter } from "./adminMetricas.routes.js"
import { adminReportesRouter } from "./adminReportes.routes.js"
import { adminConfiguracionRouter } from "./adminConfiguracion.routes.js"
import { adminAvisosRouter } from "./adminAvisos.routes.js"

export const adminRouter = Router()

// Toda la seccion /api/admin/* exige sesion con rol admin (PLAN §3.3).
adminRouter.use(requireAuth, grantAccess(["admin"]))

adminRouter.use("/usuarios", adminUsuariosRouter)
adminRouter.use("/turnos", adminTurnosRouter)
adminRouter.use("/bloqueos", adminBloqueosRouter)
adminRouter.use("/comunicaciones", adminComunicacionesRouter)
adminRouter.use("/metricas", adminMetricasRouter)
adminRouter.use("/reportes", adminReportesRouter)
adminRouter.use("/configuracion", adminConfiguracionRouter)
adminRouter.use("/avisos", adminAvisosRouter)
