import { withTransaction } from "../config/db.js"
import { SolicitudesModel } from "../models/solicitudes.model.js"
import { AppError } from "../utils/AppError.js"

export class SolicitudesService {
  static listPendientes() {
    return SolicitudesModel.listPendientes()
  }

  /**
   * Resolves a pending request.
   * - aprobar: the account becomes active ('aprobado').
   * - rechazar: the account is deleted (frees the DNI, correo and matricula so
   *   the person can apply again); the person row goes too if it has no other role.
   * Returns the data of the resolved account so callers can notify the person.
   */
  static async resolver({ dni, role, accion }) {
    return withTransaction(async (db) => {
      const solicitud = await SolicitudesModel.findPendienteForUpdate({ dni, role }, db)

      if (!solicitud) {
        throw new AppError("No hay una solicitud pendiente para esa cuenta.", 404, "NOT_FOUND")
      }

      if (accion === "aprobar") {
        await SolicitudesModel.aprobar({ dni, role }, db)
      } else {
        await SolicitudesModel.deleteCuenta({ dni, role }, db)
        await SolicitudesModel.deletePersonaIfOrphan(dni, db)
      }

      return { ...solicitud, accion }
    })
  }
}
