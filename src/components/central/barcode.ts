/**
 * Utility to generate valid 13-digit EAN-13 barcodes (GTIN-13)
 * with accurate Modulo 10 Checksum calculation.
 */
export function generateEAN13(prefix = "789"): string {
  const cleanPrefix = prefix.replace(/\D/g, "") || "789"
  let digits = cleanPrefix

  while (digits.length < 12) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  digits = digits.slice(0, 12)

  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10)
    sum += i % 2 === 0 ? digit * 1 : digit * 3
  }
  const checksum = (10 - (sum % 10)) % 10

  return digits + checksum.toString()
}

export function generateRandomSKU(prefix = "SKU"): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `${prefix.toUpperCase()}-${randomNum}`
}
