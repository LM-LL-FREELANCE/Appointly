const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

export function escapeCSVCell(valor) {
  if (valor === null || valor === undefined) return ""
  let str = String(valor)

  // CSV injection protection (PLAN_ADMIN.md §13.3): prefix cells starting with =, +, -, @
  if (FORMULA_PREFIX_RE.test(str)) {
    str = `'${str}`
  }

  if (/[",\r\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Generates a UTF-8 CSV string with BOM ("\uFEFF") so Excel opens accents properly.
 * `columns`: array of `{ key, label }`
 * `rows`: array of objects
 */
export function buildCSV(columns, rows) {
  const headerLine = columns.map((col) => escapeCSVCell(col.label)).join(",")
  const bodyLines = rows.map((row) =>
    columns
      .map((col) => {
        const val = typeof col.get === "function" ? col.get(row) : row[col.key]
        return escapeCSVCell(val)
      })
      .join(","),
  )

  return "\uFEFF" + [headerLine, ...bodyLines].join("\r\n") + "\r\n"
}
