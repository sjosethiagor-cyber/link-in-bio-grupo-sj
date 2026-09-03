export interface SimpleCalc3DState {
  // 1. Filamento
  spoolPrice: number // Preço pago no rolo (R$)
  usedGrams: number // Filamento usado nesta peça (g)

  // 2. Impressora e Energia
  printerPowerPreset: string // "120" | "200" | "350" | "custom"
  customWatts: number
  printHours: number
  printMinutes: number
  kwhRate: number // R$ por kWh (ex: 0.95)

  // 3. Custo Fixo e Mão de Obra
  fixedCost: number // Desgaste, manutenção etc. (R$)
  packagingCost: number // Embalagem (caixas, plástico bolha, fita etc.) (R$)
  laborCost: number // Mão de obra / valor do seu trabalho (R$)
}

export interface SimpleCalc3DResult {
  filamentCost: number
  energyCost: number
  fixedCost: number
  laborCost: number
  totalKWh: number
  totalHours: number
  totalPrice: number
  costPerGram: number
  costPerHour: number
}
