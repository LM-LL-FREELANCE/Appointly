export const buildInvitacionLink = (token, role = "admin") =>
  `${process.env.WEB_FROM}/registro/${role === "profesional" ? "profesional" : "admin"}/${token}`
