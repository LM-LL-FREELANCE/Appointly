/**
 * Runs a side effect (e.g. a notification email) without ever failing or
 * delaying the request that triggered it: errors are logged and swallowed.
 */
export const bestEffort = (task) => {
  Promise.resolve()
    .then(task)
    .catch((error) => console.error("Best-effort task failed:", error.message))
}
