export interface PromptCategory {
  id: string
  name: string
  color?: string
  icon?: string
  description?: string
}

export interface PromptItem {
  id: string
  title: string
  category: string
  description?: string
  content: string
  tags: string[]
  variables?: string[]
  isFavorite?: boolean
  createdAt: number
  updatedAt: number
  author?: string
}

/**
 * Extrai automaticamente variáveis no formato {variavel} ou [variavel] de um texto de prompt
 */
export function extractPromptVariables(text: string): string[] {
  if (!text) return []
  const matches = new Set<string>()

  // Formato {variavel} ou {{variavel}}
  const curlyRegex = /\{{1,2}([^{}]+)\}{1,2}/g
  let match
  while ((match = curlyRegex.exec(text)) !== null) {
    const varName = match[1].trim()
    if (varName && varName.length <= 40) {
      matches.add(varName)
    }
  }

  // Formato [VARIAVEL]
  const bracketRegex = /\[([A-Za-z0-9_À-ÿ\s-]+)\]/g
  while ((match = bracketRegex.exec(text)) !== null) {
    const varName = match[1].trim()
    if (varName && varName.length <= 40) {
      matches.add(varName)
    }
  }

  return Array.from(matches)
}

/**
 * Substitui as variáveis no texto pelos valores preenchidos
 */
export function fillPromptVariables(
  text: string,
  values: Record<string, string>,
): string {
  let result = text
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      // Substitui {key} e {{key}}
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const curlyRegex = new RegExp(`\\{{1,2}\\s*${escapedKey}\\s*\\}{1,2}`, "gi")
      result = result.replace(curlyRegex, value)

      // Substitui [key]
      const bracketRegex = new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, "gi")
      result = result.replace(bracketRegex, value)
    }
  }
  return result
}
