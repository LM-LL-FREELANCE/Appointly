
export default function useGetErrosMsg() {
  const singingUp = ({ type }) => {
    if (type === "DUPLICATE_DNI") {
      return "Ya existe una cuenta registrada con este DNI. Si es tuyo, intenta iniciar sesión."
    } else if (type === "DUPLICATE_EMAIL") {
      return "Ya existe una cuenta registrada con este MAIL. Si es tuyo, intenta iniciar sesión"
    }
  }

  return { singingUp }
}