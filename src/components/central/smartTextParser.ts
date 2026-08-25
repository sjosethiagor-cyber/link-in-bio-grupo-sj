export interface MarketplaceContent {
  titles: string[]
  description: string
}

export interface MultiMarketplaceParseResult {
  name?: string
  sku?: string
  brand?: string
  category?: string
  "mercado-livre"?: MarketplaceContent
  shopee?: MarketplaceContent
  tiktok?: MarketplaceContent
  temu?: MarketplaceContent
  generic?: MarketplaceContent
  detectedMarketplaces: string[]
}

/**
 * Intelligent Multi-Marketplace Parser:
 * Detects whether the pasted text has separate sections for Mercado Livre, Shopee, TikTok Shop, Temu,
 * or a single generic block, and separates titles, descriptions, and metadata accordingly.
 */
export function parseMultiMarketplaceProductText(
  rawText: string,
): MultiMarketplaceParseResult {
  if (!rawText || !rawText.trim()) {
    return { detectedMarketplaces: [] }
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

  // 1. Extract Top-level Metadata (SKU, Marca, Categoria, Nome)
  const lines = normalized.split("\n")
  const remainingLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const nameMatch = trimmed.match(
      /^(?:nome(?:\s+do\s+produto)?|produto)\s*:\s*(.+)$/i,
    )
    const skuMatch = trimmed.match(
      /^(?:sku|c[oó]digo(?:\s+do\s+produto)?|ref(?:er[eê]ncia)?)\s*:\s*(.+)$/i,
    )
    const brandMatch = trimmed.match(/^(?:marca|fabricante)\s*:\s*(.+)$/i)
    const categoryMatch = trimmed.match(
      /^(?:categoria|departamento|linha)\s*:\s*(.+)$/i,
    )

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

  // 2. Check for Marketplace Section Markers (e.g. [Mercado Livre], ### Shopee, Mercado Livre:, etc.)
  // Marketplaces to look for:
  // - Mercado Livre (ML)
  // - Shopee (SH)
  // - TikTok Shop / TikTok (TT)
  // - Temu (TM)
  const mktPatterns: {
    key: "mercado-livre" | "shopee" | "tiktok" | "temu"
    label: string
    regex: RegExp
  }[] = [
    {
      key: "mercado-livre",
      label: "Mercado Livre",
      regex: /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:mercado\s*livre|mercadolivre|\bml\b)(?:\s*\]|\s*\*+)?\s*(?:\([^\)]*\))?\s*:?\s*(?:\n|$)/i,
    },
    {
      key: "shopee",
      label: "Shopee",
      regex: /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:shopee|\bsh\b)(?:\s*\]|\s*\*+)?\s*(?:\([^\)]*\))?\s*:?\s*(?:\n|$)/i,
    },
    {
      key: "tiktok",
      label: "TikTok Shop",
      regex: /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:tiktok(?:\s*shop)?|\btt\b)(?:\s*\]|\s*\*+)?\s*(?:\([^\)]*\))?\s*:?\s*(?:\n|$)/i,
    },
    {
      key: "temu",
      label: "Temu",
      regex: /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:temu|\btm\b)(?:\s*\]|\s*\*+)?\s*(?:\([^\)]*\))?\s*:?\s*(?:\n|$)/i,
    },
  ]

  // Find all marketplace matches and their starting index in text
  interface FoundSection {
    key: "mercado-livre" | "shopee" | "tiktok" | "temu"
    label: string
    startIndex: number
    contentStart: number
  }

  const foundSections: FoundSection[] = []

  for (const mkt of mktPatterns) {
    const match = contentText.match(mkt.regex)
    if (match && match.index !== undefined) {
      foundSections.push({
        key: mkt.key,
        label: mkt.label,
        startIndex: match.index,
        contentStart: match.index + match[0].length,
      })
    }
  }

  // Sort by index in text
  foundSections.sort((a, b) => a.startIndex - b.startIndex)

  const result: MultiMarketplaceParseResult = {
    name: extractedName,
    sku: extractedSku,
    brand: extractedBrand,
    category: extractedCategory,
    detectedMarketplaces: [],
  }

  if (foundSections.length > 0) {
    // We found specific marketplace sections!
    for (let i = 0; i < foundSections.length; i++) {
      const current = foundSections[i]
      const next = foundSections[i + 1]
      const sectionText = contentText
        .slice(current.contentStart, next ? next.startIndex : undefined)
        .trim()

      const parsedBlock = parseSingleBlockTitlesAndDescription(sectionText)
      result[current.key] = parsedBlock
      result.detectedMarketplaces.push(current.label)

      if (!result.name && parsedBlock.titles.length > 0) {
        result.name = parsedBlock.titles[0]
      }
    }
  } else {
    // 3. No specific marketplace headers found; parse as single unified block
    const parsedGeneric = parseSingleBlockTitlesAndDescription(contentText)
    result.generic = parsedGeneric
    if (!result.name && parsedGeneric.titles.length > 0) {
      result.name = parsedGeneric.titles[0]
    }
  }

  return result
}

/**
 * Parses a single block of text (either for a specific marketplace or generic)
 * into titles (up to 10) and clean description.
 */
export function parseSingleBlockTitlesAndDescription(
  text: string,
): MarketplaceContent {
  if (!text || !text.trim()) {
    return { titles: [], description: "" }
  }

  const normalized = text.trim()

  // Look for title marker vs description marker
  const titleMarkerRegex = /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:(?:opç(?:õ|o)es\s+de\s+)?t[ií]tulos?(?:\s*(?:do|para)?\s*[a-zA-Z\s]+)?(?:\s*\([^\)]*\))?)\s*(?:\]|\*+)?\s*:?\s*(?:\n|$)/i
  const descMarkerRegex = /(?:^|\n)(?:#{1,6}\s*|\*+\s*|\[\s*)?(?:descriç(?:ã|a)o(?:\s*(?:do|completa|do\s+produto)?|\s+para\s+[a-zA-Z\s]+)?(?:\s*\([^\)]*\))?|sobre\s+o\s+produto|texto\s+do\s+an[uú]ncio|detalhes\s+do\s+produto)\s*(?:\]|\*+)?\s*:?\s*(?:\n|$)/i

  const titleMatch = normalized.match(titleMarkerRegex)
  const descMatch = normalized.match(descMarkerRegex)

  let rawTitlesSection = ""
  let rawDescSection = ""

  if (titleMatch && descMatch) {
    const titleIndex = titleMatch.index!
    const descIndex = descMatch.index!

    if (titleIndex < descIndex) {
      rawTitlesSection = normalized.slice(
        titleIndex + titleMatch[0].length,
        descIndex,
      )
      rawDescSection = normalized.slice(descIndex + descMatch[0].length)
    } else {
      rawDescSection = normalized.slice(
        descIndex + descMatch[0].length,
        titleIndex,
      )
      rawTitlesSection = normalized.slice(titleIndex + titleMatch[0].length)
    }
  } else if (titleMatch && !descMatch) {
    const titleIndex = titleMatch.index!
    const textBefore = normalized.slice(0, titleIndex).trim()
    const textAfter = normalized.slice(titleIndex + titleMatch[0].length).trim()

    if (textBefore.length > 80) {
      rawDescSection = textBefore
      rawTitlesSection = textAfter
    } else {
      rawTitlesSection = textAfter
    }
  } else if (!titleMatch && descMatch) {
    const descIndex = descMatch.index!
    const textBefore = normalized.slice(0, descIndex).trim()
    const textAfter = normalized.slice(descIndex + descMatch[0].length).trim()

    rawTitlesSection = textBefore
    rawDescSection = textAfter
  } else {
    // Fallback: heuristic line-by-line inspection
    const allLines = normalized.split("\n")
    const potentialTitleLines: string[] = []
    const potentialDescLines: string[] = []
    let inDescription = false

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim()
      if (!line) {
        if (potentialTitleLines.length > 0 && !inDescription) {
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

  const parsedTitles = parseRawTitlesSection(rawTitlesSection)
  let cleanedDescription = cleanDescriptionText(rawDescSection)

  if (!cleanedDescription && parsedTitles.length > 0) {
    const longTitles = parsedTitles.filter((t) => t.length > 140)
    if (longTitles.length > 0) {
      cleanedDescription = rawTitlesSection
    }
  }

  return {
    titles: parsedTitles.slice(0, 10),
    description: cleanedDescription,
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

  // Convert markdown list items to clean bullets
  cleaned = cleaned.replace(/^[\t ]*[\*\+\-]\s+/gm, "• ")
  cleaned = cleaned.replace(/^[\t ]*\*([^\*\s])/gm, "• $1")

  // Remove bold / italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1")
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1")
  cleaned = cleaned.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "$1")
  cleaned = cleaned.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")

  // Remove markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, "")

  // Clean extra spaces & blank lines
  cleaned = cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return cleaned
}
