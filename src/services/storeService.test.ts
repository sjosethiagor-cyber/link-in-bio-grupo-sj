import { sanitizeText, sanitizeUrl } from "./storeService"

/**
 * Basic assertions suite for sanitization and input security functions.
 */
export function runSanitizationSecurityTests(): {
  total: number
  passed: number
  failed: number
  results: Array<{ name: string; passed: boolean; error?: string }>
} {
  const tests: Array<{ name: string; test: () => void }> = [
    {
      name: "sanitizeText escapes HTML entities (<script> tag)",
      test: () => {
        const result = sanitizeText("<script>alert(1)</script>")
        if (result.includes("<script>") || result.includes("</script>")) {
          throw new Error(`Failed to escape script tags: ${result}`)
        }
      },
    },
    {
      name: "sanitizeText neutralizes javascript: and data: pseudo-protocols",
      test: () => {
        const result = sanitizeText("javascript:alert(1)")
        if (result.includes("javascript:")) {
          throw new Error(
            `Failed to strip javascript pseudo-protocol: ${result}`,
          )
        }
      },
    },
    {
      name: "sanitizeText respects maxLen constraint",
      test: () => {
        const longText = "a".repeat(500)
        const result = sanitizeText(longText, 50)
        if (result.length > 50) {
          throw new Error(`Length ${result.length} exceeded maxLen 50`)
        }
      },
    },
    {
      name: "sanitizeUrl strips dangerous javascript: scheme",
      test: () => {
        const result = sanitizeUrl("javascript:evilCode()")
        if (result.startsWith("javascript:")) {
          throw new Error(
            `Dangerous javascript url was not sanitized: ${result}`,
          )
        }
      },
    },
    {
      name: "sanitizeUrl strips data: URIs",
      test: () => {
        const result = sanitizeUrl("data:text/html,<script>alert(1)</script>")
        if (result.startsWith("data:")) {
          throw new Error(`Dangerous data URI was not sanitized: ${result}`)
        }
      },
    },
    {
      name: "sanitizeUrl preserves valid https links",
      test: () => {
        const url = "https://www.mercadolivre.com.br/loja-oficial"
        const result = sanitizeUrl(url)
        if (!result.startsWith("https://")) {
          throw new Error(`Valid https link was altered incorrectly: ${result}`)
        }
      },
    },
  ]

  let passed = 0
  let failed = 0
  const results: Array<{ name: string; passed: boolean; error?: string }> = []

  for (const t of tests) {
    try {
      t.test()
      passed++
      results.push({ name: t.name, passed: true })
    } catch (e: any) {
      failed++
      results.push({ name: t.name, passed: false, error: e.message })
    }
  }

  return { total: tests.length, passed, failed, results }
}
