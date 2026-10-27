import React, { useState, useMemo } from "react"
import { SimpleCalc3DState } from "../../types/calc3d"
import {
  INITIAL_CALC3D_STATE,
  calculateSimpleCosts,
  formatCurrencyBRL,
} from "../../utils/calc3dEngine"
import grupoSjLogo from "../../imports/grupo-sj-logo.png"
import "./Calculator3D.css"
import { IcoCopy, IcoCheck, IcoReset } from "../Icons"

export default function Calculator3D() {
  const [form, setForm] = useState<SimpleCalc3DState>(INITIAL_CALC3D_STATE)
  const [copied, setCopied] = useState(false)

  // Cálculos reativos em tempo real
  const results = useMemo(() => calculateSimpleCosts(form), [form])

  const handleClear = () => {
    setForm({
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
    })
  }

  const handleCopy = () => {
    const summary =
      `*CALCULADORA DE IMPRESSÃO 3D · GRUPO SJ*\n\n` +
      `• Custo do filamento: ${formatCurrencyBRL(results.filamentCost)}\n` +
      `• Custo de energia: ${formatCurrencyBRL(results.energyCost)}\n` +
      `• Custo fixo: ${formatCurrencyBRL(results.fixedCost)}\n` +
      `• Embalagem: ${formatCurrencyBRL(results.packagingCost)}\n` +
      `• Mão de obra: ${formatCurrencyBRL(results.laborCost)}\n\n` +
      `*PREÇO DE VENDA DA PEÇA: ${formatCurrencyBRL(results.totalPrice)}*\n\n` +
      `• Custo por grama: ${formatCurrencyBRL(results.costPerGram)}/g\n` +
      `• Custo por hora: ${formatCurrencyBRL(results.costPerHour)}/h`

    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sj-calc-wrapper">
      {/* ─── Header ─── */}
      <header className="sj-calc-header">
        <div className="sj-calc-brand-title">
          <img
            src={grupoSjLogo}
            alt="Grupo SJ - Calculadora de Impressão 3D"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              objectFit: "cover",
            }}
          />
          <span>Grupo SJ</span>
        </div>
        <h1 className="sj-calc-brand-subtitle">
          CALCULADORA DE CUSTOS DE IMPRESSÃO 3D
        </h1>
      </header>

      {/* ─── Card 1: Filamento ─── */}
      <div className="sj-calc-card">
        <div className="sj-calc-card-header">
          <h2 className="sj-calc-card-title">
            <span>🧵</span> Filamento
          </h2>
          <span className="sj-calc-badge">Custo de material</span>
        </div>
        <p className="sj-calc-desc">
          Informe o valor pago no rolo e a quantidade usada nesta peça.
        </p>

        <div className="sj-calc-grid-2">
          <div className="sj-calc-field">
            <label className="sj-calc-label">Preço pago pelo rolo</label>
            <span className="sj-calc-sublabel">
              Valor total em reais pago no rolo
            </span>
            <div className="sj-calc-input-wrapper">
              <span className="sj-calc-input-prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="sj-calc-input has-prefix"
                value={form.spoolPrice || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    spoolPrice: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="sj-calc-field">
            <label className="sj-calc-label">Filamento usado nesta peça</label>
            <span className="sj-calc-sublabel">
              Quanto foi consumido, em gramas
            </span>
            <div className="sj-calc-input-wrapper">
              <input
                type="number"
                min="0"
                step="1"
                className="sj-calc-input has-suffix"
                value={form.usedGrams || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usedGrams: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="0"
              />
              <span className="sj-calc-input-suffix">g</span>
            </div>
          </div>
        </div>

        <div className="sj-calc-footnote">
          <span>📦</span>
          <span>Cálculo considera rolo padrão de 1 kg (1000 g).</span>
        </div>
      </div>

      {/* ─── Card 2: Impressora e Energia ─── */}
      <div className="sj-calc-card">
        <div className="sj-calc-card-header">
          <h2 className="sj-calc-card-title">
            <span>⚡</span> Impressora e Energia
          </h2>
          <span className="sj-calc-badge">Custo de energia</span>
        </div>
        <p className="sj-calc-desc">
          Selecione o consumo da sua impressora e o tempo de impressão da peça.
        </p>

        <div className="sj-calc-grid-2">
          <div className="sj-calc-field">
            <label className="sj-calc-label">Consumo da impressora</label>
            <span className="sj-calc-sublabel">
              Potência média durante a impressão
            </span>
            <select
              className="sj-calc-select"
              value={form.printerPowerPreset}
              onChange={(e) =>
                setForm({ ...form, printerPowerPreset: e.target.value })
              }
            >
              <option value="120">Ender 3 / Básica — 120 W</option>
              <option value="200">Bambu Lab / K1 / Média — 200 W</option>
              <option value="350">Mesa aquecida alta / Grande — 350 W</option>
              <option value="custom">Outra potência (Personalizado)</option>
            </select>

            {form.printerPowerPreset === "custom" && (
              <div
                className="sj-calc-input-wrapper"
                style={{ marginTop: 8 }}
              >
                <input
                  type="number"
                  min="10"
                  step="10"
                  className="sj-calc-input has-suffix"
                  value={form.customWatts || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customWatts: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  placeholder="200"
                />
                <span className="sj-calc-input-suffix">Watts</span>
              </div>
            )}
          </div>

          <div className="sj-calc-field">
            <label className="sj-calc-label">Tempo de impressão</label>
            <span className="sj-calc-sublabel">
              Duração estimada no fatiador
            </span>
            <div className="sj-calc-time-grid">
              <div className="sj-calc-input-wrapper">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="sj-calc-input has-suffix"
                  value={form.printHours || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      printHours: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                />
                <span className="sj-calc-input-suffix">h</span>
              </div>
              <div className="sj-calc-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  className="sj-calc-input has-suffix"
                  value={form.printMinutes || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      printMinutes: Math.max(
                        0,
                        Math.min(59, parseInt(e.target.value) || 0),
                      ),
                    })
                  }
                  placeholder="0"
                />
                <span className="sj-calc-input-suffix">m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sj-calc-field" style={{ maxWidth: 300 }}>
          <label className="sj-calc-label">Valor do kWh</label>
          <span className="sj-calc-sublabel">
            Tarifa de energia da sua cidade
          </span>
          <div className="sj-calc-input-wrapper">
            <span className="sj-calc-input-prefix">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="sj-calc-input has-prefix"
              value={form.kwhRate || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  kwhRate: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              placeholder="0,95"
            />
          </div>
        </div>
      </div>

      {/* ─── Card 3: Custo Fixo e Mão de Obra ─── */}
      <div className="sj-calc-card">
        <div className="sj-calc-card-header">
          <h2 className="sj-calc-card-title">
            <span>💰</span> Custo Fixo e Mão de Obra
          </h2>
          <span className="sj-calc-badge">Precificação</span>
        </div>
        <p className="sj-calc-desc">
          Inclua os custos adicionais para fechar o preço final da peça.
        </p>

        <div className="sj-calc-grid-2">
          <div className="sj-calc-field">
            <label className="sj-calc-label">Custo fixo</label>
            <span className="sj-calc-sublabel">
              Desgaste, manutenção etc.
            </span>
            <div className="sj-calc-input-wrapper">
              <span className="sj-calc-input-prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                className="sj-calc-input has-prefix"
                value={form.fixedCost || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fixedCost: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="sj-calc-field">
            <label className="sj-calc-label">Embalagem</label>
            <span className="sj-calc-sublabel">
              Caixa, plástico bolha, fita, saco etc.
            </span>
            <div className="sj-calc-input-wrapper">
              <span className="sj-calc-input-prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                className="sj-calc-input has-prefix"
                value={form.packagingCost || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    packagingCost: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="sj-calc-field">
            <label className="sj-calc-label">Mão de obra</label>
            <span className="sj-calc-sublabel">
              Valor do seu trabalho na peça
            </span>
            <div className="sj-calc-input-wrapper">
              <span className="sj-calc-input-prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                className="sj-calc-input has-prefix"
                value={form.laborCost || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    laborCost: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Card 4: Resultado do Cálculo (Destaque SJ) ─── */}
      <div className="sj-calc-result-card">
        <h3 className="sj-calc-result-title">
          <span>📊</span> Resultado do cálculo
        </h3>

        <div className="sj-calc-result-list">
          <div className="sj-calc-result-row">
            <span>Custo do filamento</span>
            <strong>{formatCurrencyBRL(results.filamentCost)}</strong>
          </div>
          <div className="sj-calc-result-row">
            <span>Custo de energia</span>
            <strong>{formatCurrencyBRL(results.energyCost)}</strong>
          </div>
          <div className="sj-calc-result-row">
            <span>Custo fixo</span>
            <strong>{formatCurrencyBRL(results.fixedCost)}</strong>
          </div>
          <div className="sj-calc-result-row">
            <span>Embalagem</span>
            <strong>{formatCurrencyBRL(results.packagingCost)}</strong>
          </div>
          <div className="sj-calc-result-row">
            <span>Mão de obra</span>
            <strong>{formatCurrencyBRL(results.laborCost)}</strong>
          </div>
        </div>

        <hr className="sj-calc-divider" />

        {/* Preço de Venda da Peça */}
        <div className="sj-calc-price-box">
          <span className="sj-calc-price-label">PREÇO DE VENDA DA PEÇA</span>
          <span className="sj-calc-price-value">
            {formatCurrencyBRL(results.totalPrice)}
          </span>
        </div>

        {/* Custo por Grama e por Hora */}
        <div className="sj-calc-kpi-row">
          <div className="sj-calc-kpi-card">
            <span className="sj-calc-kpi-val">
              {formatCurrencyBRL(results.costPerGram)}
            </span>
            <span className="sj-calc-kpi-sub">CUSTO / GRAMA</span>
          </div>

          <div className="sj-calc-kpi-card">
            <span className="sj-calc-kpi-val">
              {formatCurrencyBRL(results.costPerHour)}
            </span>
            <span className="sj-calc-kpi-sub">CUSTO / HORA</span>
          </div>
        </div>
      </div>

      {/* ─── Botões de Ação ─── */}
      <div className="sj-calc-actions">
        <button
          type="button"
          onClick={handleCopy}
          className="sj-calc-btn sj-calc-btn-copy"
        >
          {copied ? <IcoCheck s={15} /> : <IcoCopy s={15} />}
          <span>{copied ? "Copiado!" : "Copiar Resumo"}</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="sj-calc-btn"
        >
          <IcoReset s={14} />
          <span>Limpar Campos</span>
        </button>
      </div>

      {/* ─── Rodapé ─── */}
      <footer className="sj-calc-footer">
        <strong style={{ color: "var(--text-title)", fontSize: 12 }}>
          Grupo SJ
        </strong>
        <span>Calculadora de Custos de Impressão 3D</span>
      </footer>
    </div>
  )
}
