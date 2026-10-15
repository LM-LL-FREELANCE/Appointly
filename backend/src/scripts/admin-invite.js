// Issues an admin invitation from the console and prints the link.
// Used to create the FIRST admin (nobody exists yet to invite from the panel)
// and does not depend on email delivery.
//
//   pnpm admin:invite <dni> <correo>
import { pool } from "../config/db.js"
import { InvitacionesService } from "../services/invitaciones.service.js"
import { crearInvitacionSchema } from "../schemas/invitacion.schema.js"
import { buildInvitacionLink } from "../utils/invitacionLink.js"

const [dni, correo] = process.argv.slice(2)
const parsed = crearInvitacionSchema.safeParse({ dni, correo })

if (!parsed.success) {
  console.error("Uso: pnpm admin:invite <dni> <correo>")
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
  process.exit(1)
}

try {
  const invitacion = await InvitacionesService.emitir(parsed.data)
  console.log(`Invitación creada para ${invitacion.correo} (DNI ${invitacion.dni}).`)
  console.log(`Válida por ${invitacion.horas} horas y de un solo uso:`)
  console.log(buildInvitacionLink(invitacion.token))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
