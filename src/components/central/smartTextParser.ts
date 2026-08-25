export interface SmartParseResult {
  titles: string[]
  description: string
  name?: string
  sku?: string
  brand?: string
  category?: string
}

/**
 * Intelligent parser that takes a full raw text (e.g. from ChatGPT, supplier notes, or doc)
 * and automatically separates titles, description, and metadata (SKU, brand, category).
 */
export function parseFullRawProductText(rawText: string): SmartParseResult {
  if (!rawText || !rawText.trim()) {
    return { titles: [], description: "" }
  }

  const normalized = rawText
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()

  let extractedName: string | undefined
  let extractedSku: string | undefined
  let extractedBrand: string | undefined
  let extractedCategory: string | undefined

  // 1. Check for metadata line patterns:
  // e.g. "SKU: MIX-18KG", "Marca: Cola Mix", "Categoria: Argamassa", "Produto: Argamassa..."
  const lines = normalized.split("\n")
  const remainingLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const nameMatch = trimmed.match(/^(?:nome(?:\s+do\s+produto)?|produto)\s*:\s*(.+)$/i)
    const skuMatch = trimmed.match(/^(?:sku|c[oó]digo(?:\s+do\s+produto)?|ref(?:er[eê]ncia)?)\s*:\s*(.+)$/i)
    const brandMatch = trimmed.match(/^(?:marca|fabricante)\s*:\s*(.+)$/i)
    const categoryMatch = trimmed.match(/^(?:categoria|departamento|linha)\s*:\s*(.+)$/i)

    if (nameMatch && !extractedName) {
      extractedName = cleanTitleLine(nameMatch[1])
    } else if (skuMatch && !extractedSku) {
      extractedSku = skuMatch[1].trim().toUpperCase()
    } else if (brandMatch && !extractedBrand) {
      extractedBrand = brandMatch[1].trim()
    } else if (categoryMatch && !extractedCategory) {
      extractedCategory = categoryMatch[1].trim()
    } else {
      remainingLines.push(line)
    }
  }

  const contentText = remainingLines.join("\n").trim()

  // 2. Identify Titles vs Description sections using section markers
  // Markers for titles: TÍTULOS:, OPÇÕES DE TÍTULOS:, TÍTULOS MERCADO LIVRE:, etc.
  // Markers for description: DESCRIÇÃO:, SOBRE O PRODUTO:, CARACTERÍSTICAS:, FICHA TÉCNICA:, etc.
  const titleMarkerRegex = /(?:^|\n)(?:#{1,6}\s*)?(?:(?:opç(?:õ|o)es\s+de\s+)?t[ií]tulos?(?:\s*(?:do|para)?\s*[a-zA-Z\s]+)?)\s*:?\s*(?:\n|$)/i
  const descMarkerRegex = /(?:^|\n)(?:#{1,6}\s*)?(?:descriç(?:ã|a)o(?:\s*(?:do|completa|do\s+produto)?|\s+para\s+[a-zA-Z\s]+)?|sobre\s+o\s+produto|texto\s+do\s+an[uú]ncio|detalhes\s+do\s+produto)\s*:?\s*(?:\n|$)/i

  const titleMatch = contentText.match(titleMarkerRegex)
  const descMatch = contentText.match(descMarkerRegex)

  let rawTitlesSection = ""
  let rawDescSection = ""

  if (titleMatch && descMatch) {
    const titleIndex = titleMatch.index!
    const descIndex = descMatch.index!

    if (titleIndex < descIndex) {
      // Titles section comes first, then Description
      rawTitlesSection = contentText.slice(
        titleIndex + titleMatch[0].length,
        descIndex,
      )
      rawDescSection = contentText.slice(descIndex + descMatch[0].length)
    } else {
      // Description section comes first, then Titles
      rawDescSection = contentText.slice(
        descIndex + descMatch[0].length,
        titleIndex,
      )
      rawTitlesSection = contentText.slice(titleIndex + titleMatch[0].length)
    }
  } else if (titleMatch && !descMatch) {
    // Only title marker found
    const titleIndex = titleMatch.index!
    const textBefore = contentText.slice(0, titleIndex).trim()
    const textAfter = contentText.slice(titleIndex + titleMatch[0].length).trim()

    // If there's text before the title marker, it might be description
    if (textBefore.length > 80) {
      rawDescSection = textBefore
      rawTitlesSection = textAfter
    } else {
      rawTitlesSection = textAfter
    }
  } else if (!titleMatch && descMatch) {
    // Only description marker found
    const descIndex = descMatch.index!
    const textBefore = contentText.slice(0, descIndex).trim()
    const textAfter = contentText.slice(descIndex + descMatch[0].length).trim()

    rawTitlesSection = textBefore
    rawDescSection = textAfter
  } else {
    // 3. Fallback: No explicit markers found.
    // Analyze line structures: check if starting lines look like numbered titles (e.g. 1. Title, 2. Title)
    // or short lines followed by longer paragraph blocks.
    const allLines = contentText.split("\n")
    const potentialTitleLines: string[] = []
    const potentialDescLines: string[] = []
    let inDescription = false

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim()
      if (!line) {
        if (potentialTitleLines.length > 0 && !inDescription) {
          // A blank line after some short title lines might indicate transition to description
          // if subsequent lines are long or contain bullet lists
          const nextNonEmpty = allLines.slice(i + 1).find((l) => l.trim().length > 0)
          if (
            nextNonEmpty &&
            (nextNonEmpty.trim().length > 120 ||
              /^(?:•|[-*+]|\d+\.)\s+[A-Z]/.test(nextNonEmpty.trim()) ||
              /^(?:aplicaç|indicaç|caracter|ficha|especific|dimens|conte[uú]do|modo)/i.test(
                nextNonEmpty.trim(),
              ))
          ) {
            inDescription = true
          }
        }
        if (inDescription) {
          potentialDescLines.push(allLines[i])
        }
        continue
      }

      const isNumberedTitle = /^\s*(?:t[ií]tulo\s*(?:\d{1,2})?\s*[:.)-]\s*|\d{1,2}\s*[:.)-]\s*)/i.test(
        line,
      )

      if (!inDescription) {
        if (isNumberedTitle && potentialTitleLines.length < 10) {
          potentialTitleLines.push(line)
        } else if (
          potentialTitleLines.length < 10 &&
          line.length <= 130 &&
          !line.endsWith(".") &&
          !line.includes(":") &&
          !line.startsWith("•") &&
          !line.startsWith("-")
        ) {
          potentialTitleLines.push(line)
        } else {
          inDescription = true
          potentialDescLines.push(line)
        }
      } else {
        potentialDescLines.push(allLines[i])
      }
    }

    rawTitlesSection = potentialTitleLines.join("\n")
    rawDescSection = potentialDescLines.join("\n")
  }

  // 4. Clean and parse individual titles
  const parsedTitles = parseRawTitlesSection(rawTitlesSection)

  // 5. Clean description
  let cleanedDescription = cleanDescriptionText(rawDescSection)

  // If no description was separated and we have more than 10 lines of titles,
  // or if titles section contains full paragraphs, adjust:
  if (!cleanedDescription && parsedTitles.length > 0) {
    const longTitles = parsedTitles.filter((t) => t.length > 140)
    if (longTitles.length > 0) {
      cleanedDescription = rawTitlesSection
    }
  }

  return {
    titles: parsedTitles.slice(0, 10),
    description: cleanedDescription,
    name: extractedName || (parsedTitles.length > 0 ? parsedTitles[0] : undefined),
    sku: extractedSku,
    brand: extractedBrand,
    category: extractedCategory,
  }
}

function cleanTitleLine(line: string): string {
  return line
    .replace(
      /^\s*(?:t[ií]tulo\s*(?:\d{1,2})?\s*[:.)-]\s*|\d{1,2}\s*[:.)-]\s*|[-•*]\s*)/i,
      "",
    )
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/^(?:opç(?:ã|a)o\s*\d+\s*[:.)-]\s*)/i, "")
    .trim()
}

function parseRawTitlesSection(text: string): string[] {
  if (!text || !text.trim()) return []

  const lines = text.split(/\n+/)
  const result: string[] = []

  for (const line of lines) {
    const cleaned = cleanTitleLine(line.trim())
    if (cleaned && cleaned.length >= 3) {
      result.push(cleaned)
    }
  }

  return result
}

function cleanDescriptionText(text: string): string {
  if (!text || !text.trim()) return ""

  let cleaned = text
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")

  // Remove markdown headings
  cleaned = cleaned.replace(/^#{1,6}\s*(.+)$/gm, "$1")

  // Convert markdown list items to bullets
  cleaned = cleaned.replace(/^[\t ]*[\*\+\-]\s+/gm, "• ")
  cleaned = cleaned.replace(/^[\t ]*\*([^\*\s])/gm, "• $1")

  // Remove bold / italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1")
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1")
  cleaned = cleaned.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "$1")
  cleaned = cleaned.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")

  // Remove links
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, "")

  // Remove trailing spaces & redundant newlines
  cleaned = cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return cleaned
}
