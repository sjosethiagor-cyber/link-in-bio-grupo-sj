import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/**
 * Wraps React.lazy with automatic reload/retry on chunk load failures.
 * This occurs when a new version of the app is deployed and the browser tries to fetch
 * an older chunk hash that is no longer on the server (404).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key?: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = `retry_lazy_${key || "chunk"}`
    try {
      const module = await factory()
      sessionStorage.removeItem(storageKey)
      return module
    } catch (error: any) {
      const isDynamicImportError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("error loading dynamically imported module") ||
        error?.name === "ChunkLoadError"

      if (isDynamicImportError) {
        const hasRetried = sessionStorage.getItem(storageKey)
        if (!hasRetried) {
          sessionStorage.setItem(storageKey, "true")
          // Reload page to get fresh HTML & chunk references
          window.location.reload()
          return new Promise(() => {}) as any
        }
      }
      throw error
    }
  })
}
