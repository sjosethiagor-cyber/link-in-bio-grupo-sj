import type { SimpleCalc3DState, SimpleCalc3DResult } from "../types/calc3d"

export const INITIAL_CALC3D_STATE: SimpleCalc3DState = {
  spoolPrice: 0,
  usedGrams: 0,
  printerPowerPreset: "200",
  customWatts: 200,
  printHours: 0,
  printMinutes: 0,
  kwhRate: 0.95,
  fixedCost: 0,
  packagingCost: 0,
  laborCost: 0,
}

export function formatCurrencyBRL(val: number): string {
  const safe = isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
}

export function calculateSimpleCosts(
  state: SimpleCalc3DState,
): SimpleCalc3DResult {
  const spoolPrice = Math.max(0, Number(state.spoolPrice) || 0)
  const usedGrams = Math.max(0, Number(state.usedGrams) || 0)

  // 1. Custo do filamento (rolo padrão de 1.000g)
  const filamentCost = (spoolPrice / 1000) * usedGrams

  // 2. Potência da impressora
  let watts = 200
  if (state.printerPowerPreset === "custom") {
    watts = Math.max(0, Number(state.customWatts) || 0)
  } else {
    watts = Math.max(0, Number(state.printerPowerPreset) || 200)
  }

  // 3. Tempo em horas
  const hours = Math.max(0, Number(state.printHours) || 0)
  const minutes = Math.max(0, Number(state.printMinutes) || 0)
  const totalHours = hours + minutes / 60

  // 4. Consumo de energia
  const kwhRate = Math.max(0, Number(state.kwhRate) || 0)
  const totalKWh = (watts / 1000) * totalHours
  const energyCost = totalKWh * kwhRate

  // 5. Custo fixo, embalagem e mão de obra
  const fixedCost = Math.max(0, Number(state.fixedCost) || 0)
  const packagingCost = Math.max(0, Number(state.packagingCost) || 0)
  const laborCost = Math.max(0, Number(state.laborCost) || 0)

  // 6. Preço total de venda
  const totalPrice = filamentCost + energyCost + fixedCost + packagingCost + laborCost

  // 7. Custo por grama e por hora
  const costPerGram = usedGrams > 0 ? totalPrice / usedGrams : 0
  const costPerHour = totalHours > 0 ? totalPrice / totalHours : 0

  return {
    filamentCost,
    energyCost,
    fixedCost,
    packagingCost,
    laborCost,
    totalKWh,
    totalHours,
    totalPrice,
    costPerGram,
    costPerHour,
  }
}
