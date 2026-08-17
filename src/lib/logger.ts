/**
 * Safe logger for client-side execution.
 * Prevents sensitive leakages in production consoles while keeping useful diagnostics in development.
 */
const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log("[GrupoSJ:info]", ...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn("[GrupoSJ:warn]", ...args)
    }
  },
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error("[GrupoSJ:error]", message, error)
    } else {
      // In production, keep a sanitized log without dumping sensitive memory or credentials
      console.error(`[GrupoSJ:error] ${message}`)
    }
  },
}
