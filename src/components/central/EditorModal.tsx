import React, { useState } from "react"
import { createPortal } from "react-dom"
import { Product, Marketplace, EditorForm, Validation } from "./types"
import { parseMultiMarketplaceProductText } from "./smartTextParser"

export interface EditorModalProps {
  editorOpen: boolean
  setEditorOpen: (open: boolean) => void
  saving: boolean
  saveError?: string
  form: EditorForm
  setForm: React.Dispatch<React.SetStateAction<EditorForm>>
  products: Product[]
  categories: string[]
  brands?: string[]
  changeEditorProduct: (id: string) => void
  changeEditorMarketplace: (m: Marketplace) => void
  coverPreview: string | null
  chooseCover: (file: File | null) => void
  addTitleField: () => void
  updateTitleField: (index: number, val: string) => void
  removeTitleField: (index: number) => void
  applyTitleBlock: (val: string) => void
  parseTitleBlock: (val: string) => string[]
  addKeywordField: () => void
  updateKeywordField: (index: number, val: string) => void
  removeKeywordField: (index: number) => void
  applyKeywordBlock: (val: string) => void
  saveProduct: (e: React.FormEvent) => Promise<void>
  getMarketplaceValidation: (
    title: string,
    market: Marketplace,
  ) => Validation | null
  cleanForMarketplace: (text: string) => string
}

export const EditorModal: React.FC<EditorModalProps> = ({
  editorOpen,
  setEditorOpen,
  saving,
  saveError,
  form,
  setForm,
  products,
  categories,
  brands = [],
  changeEditorProduct,
  changeEditorMarketplace,
  coverPreview,
  chooseCover,
  addTitleField,
  updateTitleField,
  removeTitleField,
  applyTitleBlock,
  addKeywordField,
  updateKeywordField,
  removeKeywordField,
  applyKeywordBlock,
  saveProduct,
  getMarketplaceValidation,
  cleanForMarketplace,
}) => {
  const [smartRawText, setSmartRawText] = useState("")
  const [smartFeedback, setSmartFeedback] = useState<{
    type: "success" | "info"
    message: string
  } | null>(null)
  const [applyToAllMarketplaces, setApplyToAllMarketplaces] = useState(true)
  const [activeTabMode, setActiveTabMode] = useState<"columns" | "titles" | "keywords" | "description">("columns")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!editorOpen) return null

  const handleSmartImport = () => {
    if (!smartRawText.trim()) return

    const result = parseMultiMarketplaceProductText(smartRawText)
    const isMultiChannel = result.detectedMarketplaces.length > 0

    setForm((prev) => {
      const updated: EditorForm = { ...prev }

      if (isMultiChannel) {
        // Multi-marketplace specific parsing
        if (result["mercado-livre"]) {
          const t = result["mercado-livre"].titles
          const k = result["mercado-livre"].keywords || []
          updated.mlTitles = [...t, ...Array(10).fill("")].slice(0, 10)
          updated.mlBulkText = t.join("\n")
          updated.mlKeywords = [...k, ...Array(10).fill("")].slice(0, Math.max(10, k.length))
          updated.mlBulkKeywords = k.join(", ")
          if (result["mercado-livre"].description) {
            updated.mlDescription = result["mercado-livre"].description
          }
        }
        if (result.shopee) {
          const t = result.shopee.titles
          const k = result.shopee.keywords || []
          updated.shopeeTitles = [...t, ...Array(10).fill("")].slice(0, 10)
          updated.shopeeBulkText = t.join("\n")
          updated.shopeeKeywords = [...k, ...Array(10).fill("")].slice(0, Math.max(10, k.length))
          updated.shopeeBulkKeywords = k.join(", ")
          if (result.shopee.description) {
            updated.shopeeDescription = result.shopee.description
          }
        }
        if (result.tiktok) {
          const t = result.tiktok.titles
          const k = result.tiktok.keywords || []
          updated.tiktokTitles = [...t, ...Array(10).fill("")].slice(0, 10)
          updated.tiktokBulkText = t.join("\n")
          updated.tiktokKeywords = [...k, ...Array(10).fill("")].slice(0, Math.max(10, k.length))
          updated.tiktokBulkKeywords = k.join(", ")
          if (result.tiktok.description) {
            updated.tiktokDescription = result.tiktok.description
          }
        }
        if (result.temu) {
          const t = result.temu.titles
          const k = result.temu.keywords || []
          updated.temuTitles = [...t, ...Array(10).fill("")].slice(0, 10)
          updated.temuBulkText = t.join("\n")
          updated.temuKeywords = [...k, ...Array(10).fill("")].slice(0, Math.max(10, k.length))
          updated.temuBulkKeywords = k.join(", ")
          if (result.temu.description) {
            updated.temuDescription = result.temu.description
          }
        }
      } else if (result.generic) {
        // Generic single block
        const t = result.generic.titles
        const k = result.generic.keywords || []
        const paddedTitles = [...t, ...Array(10).fill("")].slice(0, 10)
        const paddedKeywords = [...k, ...Array(10).fill("")].slice(0, Math.max(10, k.length))
        const bulkText = t.join("\n")
        const bulkKw = k.join(", ")
        const desc = result.generic.description

        if (applyToAllMarketplaces) {
          updated.mlTitles = [...paddedTitles]
          updated.mlBulkText = bulkText
          updated.mlKeywords = [...paddedKeywords]
          updated.mlBulkKeywords = bulkKw
          if (desc) updated.mlDescription = desc

          updated.shopeeTitles = [...paddedTitles]
          updated.shopeeBulkText = bulkText
          updated.shopeeKeywords = [...paddedKeywords]
          updated.shopeeBulkKeywords = bulkKw
          if (desc) updated.shopeeDescription = desc

          updated.tiktokTitles = [...paddedTitles]
          updated.tiktokBulkText = bulkText
          updated.tiktokKeywords = [...paddedKeywords]
          updated.tiktokBulkKeywords = bulkKw
          if (desc) updated.tiktokDescription = desc

          updated.temuTitles = [...paddedTitles]
          updated.temuBulkText = bulkText
          updated.temuKeywords = [...paddedKeywords]
          updated.temuBulkKeywords = bulkKw
          if (desc) updated.temuDescription = desc
        } else {
          if (prev.marketplace === "mercado-livre") {
            updated.mlTitles = [...paddedTitles]
            updated.mlBulkText = bulkText
            updated.mlKeywords = [...paddedKeywords]
            updated.mlBulkKeywords = bulkKw
            if (desc) updated.mlDescription = desc
          } else if (prev.marketplace === "shopee") {
            updated.shopeeTitles = [...paddedTitles]
            updated.shopeeBulkText = bulkText
            updated.shopeeKeywords = [...paddedKeywords]
            updated.shopeeBulkKeywords = bulkKw
            if (desc) updated.shopeeDescription = desc
          } else if (prev.marketplace === "tiktok") {
            updated.tiktokTitles = [...paddedTitles]
            updated.tiktokBulkText = bulkText
            updated.tiktokKeywords = [...paddedKeywords]
            updated.tiktokBulkKeywords = bulkKw
            if (desc) updated.tiktokDescription = desc
          } else if (prev.marketplace === "temu") {
            updated.temuTitles = [...paddedTitles]
            updated.temuBulkText = bulkText
            updated.temuKeywords = [...paddedKeywords]
            updated.temuBulkKeywords = bulkKw
            if (desc) updated.temuDescription = desc
          }
        }
      }

      if (result.sku && !prev.sku) updated.sku = result.sku
      if (result.name && !prev.name) updated.name = result.name
      if (result.brand && !prev.brand) updated.brand = result.brand
      if (result.category && !prev.category) updated.category = result.category

      return updated
    })

    if (isMultiChannel) {
      setSmartFeedback({
        type: "success",
        message: `✓ Reconhecido e preenchido individualmente para cada canal: ${result.detectedMarketplaces.join(
          ", ",
        )}!`,
      })
    } else {
      const countTitles = result.generic?.titles.length ?? 0
      const countKw = result.generic?.keywords?.length ?? 0
      setSmartFeedback({
        type: "success",
        message: `✓ Separado com sucesso: ${countTitles} título(s), ${countKw} palavra(s)-chave e descrição identificados!${
          applyToAllMarketplaces ? " (Aplicado em todos os canais)" : ""
        }`,
      })
    }
  }

  const currentTitles =
    form.marketplace === "mercado-livre"
      ? form.mlTitles
      : form.marketplace === "shopee"
        ? form.shopeeTitles
        : form.marketplace === "tiktok"
          ? form.tiktokTitles
          : form.temuTitles

  const currentKeywords =
    form.marketplace === "mercado-livre"
      ? form.mlKeywords
      : form.marketplace === "shopee"
        ? form.shopeeKeywords
        : form.marketplace === "tiktok"
          ? form.tiktokKeywords
          : form.temuKeywords

  const currentDescription =
    form.marketplace === "mercado-livre"
      ? form.mlDescription
      : form.marketplace === "shopee"
        ? form.shopeeDescription
        : form.marketplace === "tiktok"
          ? form.tiktokDescription
          : form.temuDescription

  const currentBulkText =
    form.marketplace === "mercado-livre"
      ? form.mlBulkText
      : form.marketplace === "shopee"
        ? form.shopeeBulkText
        : form.marketplace === "tiktok"
          ? form.tiktokBulkText
          : form.temuBulkText

  const currentBulkKeywords =
    form.marketplace === "mercado-livre"
      ? form.mlBulkKeywords
      : form.marketplace === "shopee"
        ? form.shopeeBulkKeywords
        : form.marketplace === "tiktok"
          ? form.tiktokBulkKeywords
          : form.temuBulkKeywords

  const descField =
    form.marketplace === "mercado-livre"
      ? "mlDescription"
      : form.marketplace === "shopee"
        ? "shopeeDescription"
        : form.marketplace === "tiktok"
          ? "tiktokDescription"
          : "temuDescription"

  const handleCopyInModal = async (key: string, text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(cleanForMarketplace(text))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1600)
  }

  const handleCopyAllKeywordsInModal = async () => {
    const validKeywords = currentKeywords.filter(Boolean)
    if (validKeywords.length === 0) return
    const textToCopy = validKeywords.join(", ")
    await navigator.clipboard.writeText(textToCopy)
    setCopiedKey("all-kw")
    setTimeout(() => setCopiedKey(null), 1600)
  }

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) setEditorOpen(false)
      }}
    >
      <section
        className="editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header className="editor-header">
          <div>
            <p className="eyebrow">Gerenciar biblioteca</p>
            <h2 id="editor-title">
              {form.id ? "Editar produto" : "Adicionar produto"}
            </h2>
          </div>
          <button
            className="close-button"
            onClick={() => setEditorOpen(false)}
            disabled={saving}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <form onSubmit={saveProduct}>
          <div className="editor-scroll">
            <div className="editor-grid">
              <label className="field full">
                <span>Produto que deseja editar</span>
                <select
                  value={form.id ?? "new"}
                  onChange={(e) => changeEditorProduct(e.target.value)}
                >
                  <option value="new">+ Novo produto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.sku}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Nome do produto *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Tinta Emborrachada Premium"
                />
              </label>

              <label className="field">
                <span>SKU *</span>
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Ex.: SKU-123"
                />
              </label>

              <label className="field">
                <span>Marca do produto</span>
                <input
                  list="existing-brand-options"
                  value={form.brand || ""}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Ex.: Cola Mix, RevCollor, Maximper"
                />
                <datalist id="existing-brand-options">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </label>

              <label className="field">
                <span>Categoria</span>
                <input
                  list="existing-category-options"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Ex.: Tintas, Revestimento"
                />
                <datalist id="existing-category-options">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </label>

              <label className="field">
                <span>Situação</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Publicado">Publicado</option>
                  <option value="Em revisão">Em revisão</option>
                </select>
              </label>

              <label className="field full">
                <span>Link da pasta de fotos no Google Drive</span>
                <input
                  value={form.driveUrl}
                  onChange={(e) =>
                    setForm({ ...form, driveUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </label>

              {/* Cover Image Upload Area */}
              <label className="field full cover-field">
                <span>Imagem de capa</span>
                {coverPreview || form.coverUrl ? (
                  <div className="cover-preview-box">
                    <img
                      src={coverPreview ?? form.coverUrl ?? ""}
                      alt="Prévia da capa"
                    />
                    <div className="cover-preview-overlay">
                      <span>Alterar foto</span>
                    </div>
                  </div>
                ) : (
                  <div className="cover-empty-dropzone">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <b>Adicionar capa</b>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => chooseCover(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Marketplace Content Editor Section */}
            <div className="editor-section">
              {/* Smart Full-Text Auto-Split Importer */}
              <div className="smart-importer-card">
                <div className="smart-importer-header">
                  <div className="smart-importer-title-group">
                    <span className="smart-badge">⚡ INTELIGENTE</span>
                    <h4>Importador Completo (Títulos, Palavras-chave e Descrição)</h4>
                  </div>
                  <label
                    className="smart-apply-all-checkbox"
                    title="Preencher automaticamente todos os canais (Mercado Livre, Shopee, TikTok Shop e Temu)"
                  >
                    <input
                      type="checkbox"
                      checked={applyToAllMarketplaces}
                      onChange={(e) => setApplyToAllMarketplaces(e.target.checked)}
                    />
                    <span>Preencher todos os canais</span>
                  </label>
                </div>

                <p className="smart-importer-desc">
                  Cole todo o texto bruto com <strong>títulos</strong>, <strong>palavras-chave (keywords / tags)</strong> e <strong>descrição</strong>. Suporta tags por canal (<code>[MERCADO LIVRE]</code>, <code>[SHOPEE]</code>, <code>[TIKTOK]</code>, <code>[TEMU]</code>) ou texto único geral.
                </p>

                <textarea
                  rows={5}
                  value={smartRawText}
                  onChange={(e) => {
                    setSmartRawText(e.target.value)
                    if (smartFeedback) setSmartFeedback(null)
                  }}
                  placeholder={
                    "Exemplo:\n\n[MERCADO LIVRE]\nTÍTULOS (até 60 carac.):\n1. Argamassa Polimérica Impermeabilizante 18kg Cola Mix\n2. Cola Bloco Massa Pronta 18kg\n\nPALAVRAS-CHAVE:\nargamassa polimerica, cola bloco, impermeabilizante, massa pronta, assentamento tijolo\n\nDESCRIÇÃO:\nA Argamassa Polimérica..."
                  }
                  className="smart-textarea"
                />

                <div className="smart-importer-actions">
                  <button
                    type="button"
                    className="smart-process-btn"
                    onClick={handleSmartImport}
                    disabled={!smartRawText.trim()}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Processar e Separar Texto</span>
                  </button>

                  <button
                    type="button"
                    className="smart-paste-btn"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        if (text) {
                          setSmartRawText(text)
                          if (smartFeedback) setSmartFeedback(null)
                        }
                      } catch {
                        // Clipboard fallback
                      }
                    }}
                    title="Colar texto da área de transferência"
                  >
                    📋 Colar
                  </button>

                  {smartRawText && (
                    <button
                      type="button"
                      className="smart-clear-btn"
                      onClick={() => {
                        setSmartRawText("")
                        setSmartFeedback(null)
                      }}
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {smartFeedback && (
                  <div className={`smart-feedback ${smartFeedback.type}`}>
                    {smartFeedback.message}
                  </div>
                )}
              </div>

              <div className="section-title marketplace-editor-title">
                <div>
                  <h3>Conteúdo por Marketplace</h3>
                  <p>Ajuste títulos, palavras-chave e descrição para cada canal específico.</p>
                </div>
                <div className="mini-tabs" role="tablist" aria-label="Escolher marketplace do anúncio">
                  <button
                    type="button"
                    className={
                      form.marketplace === "mercado-livre" ? "active ml-mini" : "ml-mini"
                    }
                    onClick={() => changeEditorMarketplace("mercado-livre")}
                  >
                    <span className="mini-tab-logo ml">ML</span>
                    <span>Mercado Livre</span>
                  </button>
                  <button
                    type="button"
                    className={
                      form.marketplace === "shopee"
                        ? "active shopee-mini"
                        : "shopee-mini"
                    }
                    onClick={() => changeEditorMarketplace("shopee")}
                  >
                    <span className="mini-tab-logo sh">SH</span>
                    <span>Shopee</span>
                  </button>
                  <button
                    type="button"
                    className={
                      form.marketplace === "tiktok"
                        ? "active tiktok-mini"
                        : "tiktok-mini"
                    }
                    onClick={() => changeEditorMarketplace("tiktok")}
                  >
                    <span className="mini-tab-logo tt">TT</span>
                    <span>TikTok Shop</span>
                  </button>
                  <button
                    type="button"
                    className={
                      form.marketplace === "temu"
                        ? "active temu-mini"
                        : "temu-mini"
                    }
                    onClick={() => changeEditorMarketplace("temu")}
                  >
                    <span className="mini-tab-logo tm">TM</span>
                    <span>Temu</span>
                  </button>
                </div>
              </div>

              {/* Layout Mode Sub-Tabs (2 Colunas vs Abas Focadas) */}
              <div className="editor-subtabs-nav">
                <button
                  type="button"
                  className={`editor-subtab ${activeTabMode === "columns" ? "active" : ""}`}
                  onClick={() => setActiveTabMode("columns")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="3" x2="12" y2="21" />
                  </svg>
                  <span>2 Colunas (Títulos e Palavras-chave lado a lado)</span>
                </button>
                <button
                  type="button"
                  className={`editor-subtab ${activeTabMode === "titles" ? "active" : ""}`}
                  onClick={() => setActiveTabMode("titles")}
                >
                  <span>📝 Títulos ({currentTitles.filter(Boolean).length})</span>
                </button>
                <button
                  type="button"
                  className={`editor-subtab ${activeTabMode === "keywords" ? "active" : ""}`}
                  onClick={() => setActiveTabMode("keywords")}
                >
                  <span>🔑 Palavras-chave ({currentKeywords.filter(Boolean).length})</span>
                </button>
                <button
                  type="button"
                  className={`editor-subtab ${activeTabMode === "description" ? "active" : ""}`}
                  onClick={() => setActiveTabMode("description")}
                >
                  <span>📋 Descrição</span>
                </button>
              </div>

              {/* 2-Column or Single Tab Content Grid */}
              <div className={`mkt-content-layout-wrapper mode-${activeTabMode}`}>
                {/* Column 1: Titles */}
                {(activeTabMode === "columns" || activeTabMode === "titles") && (
                  <div className="mkt-col mkt-titles-column">
                    <div className="mkt-column-header">
                      <div className="mkt-column-title">
                        <span className="col-icon">📝</span>
                        <div>
                          <strong>Títulos Otimizados</strong>
                          <span className="col-hint">Max 10 opções</span>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Text Import Card */}
                    <div className="bulk-title-import">
                      <label className="field full">
                        <span>
                          Bloco de Títulos (Cole e processe vários títulos juntos)
                        </span>
                        <textarea
                          rows={3}
                          value={currentBulkText}
                          onChange={(e) => applyTitleBlock(e.target.value)}
                          placeholder={
                            form.marketplace === "mercado-livre"
                              ? "Exemplo:\n1. Título do meu anúncio 1\n2. Segunda opção de título (até 60 carac.)..."
                              : form.marketplace === "shopee"
                                ? "Dica: Títulos devem ter entre 20 e 120 caracteres para Shopee."
                                : form.marketplace === "tiktok"
                                  ? "Dica: Títulos para TikTok Shop (até 255 caracteres)."
                                  : "Dica: Títulos para Temu (até 100 caracteres)."
                          }
                        />
                      </label>
                    </div>

                    {/* Single Titles List */}
                    <div className="individual-titles">
                      <p className="editor-subtitle">
                        Opções de títulos individuais (1 a 10)
                      </p>
                      <div className="titles-editor-list">
                        {currentTitles.map((title, index) => {
                          const validation = getMarketplaceValidation(
                            title,
                            form.marketplace,
                          )
                          return (
                            <div key={index} className="title-edit-row">
                              <span className="row-number">{index + 1}</span>
                              <div className="title-edit-input-wrapper">
                                <input
                                  value={title}
                                  onChange={(e) =>
                                    updateTitleField(index, e.target.value)
                                  }
                                  placeholder={`Título opção ${index + 1}`}
                                />
                                {validation && (
                                  <span
                                    className={`validation-indicator ${validation.status}`}
                                  >
                                    {validation.label}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="remove-title-row"
                                onClick={() => removeTitleField(index)}
                                title="Remover título"
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}

                        {currentTitles.length < 10 && (
                          <button
                            type="button"
                            className="add-title-row-btn"
                            onClick={addTitleField}
                          >
                            + Adicionar nova opção de título
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Column 2: Keywords */}
                {(activeTabMode === "columns" || activeTabMode === "keywords") && (
                  <div className="mkt-col mkt-keywords-column">
                    <div className="mkt-column-header">
                      <div className="mkt-column-title">
                        <span className="col-icon">🔑</span>
                        <div>
                          <strong>Palavras-chave (SEO / Tags)</strong>
                          <span className="col-hint">Pelo menos 10 palavras-chave</span>
                        </div>
                      </div>
                      {currentKeywords.some(Boolean) && (
                        <button
                          type="button"
                          className="modal-copy-all-kw-btn"
                          onClick={handleCopyAllKeywordsInModal}
                          title="Copiar todas as palavras-chave separadas por vírgula"
                        >
                          {copiedKey === "all-kw" ? "Copiadas! ✓" : "📋 Copiar Todas"}
                        </button>
                      )}
                    </div>

                    {/* Bulk Keywords Import Card */}
                    <div className="bulk-keywords-import">
                      <label className="field full">
                        <span>
                          Bloco de Palavras-chave (Cole termos separados por vírgula ou por linha)
                        </span>
                        <textarea
                          rows={3}
                          value={currentBulkKeywords}
                          onChange={(e) => applyKeywordBlock(e.target.value)}
                          placeholder="Exemplo:\nargamassa polimerica, cola bloco, impermeabilizante, massa pronta alvenaria, tijolo ecologico, selante..."
                        />
                      </label>
                    </div>

                    {/* Single Keywords List */}
                    <div className="individual-keywords">
                      <p className="editor-subtitle">
                        Palavras-chave individuais ({currentKeywords.filter(Boolean).length} cadastradas)
                      </p>
                      <div className="keywords-editor-list">
                        {currentKeywords.map((kw, index) => {
                          const isCopied = copiedKey === `kw-${index}`
                          return (
                            <div key={index} className="keyword-edit-row">
                              <span className="row-number">{index + 1}</span>
                              <div className="keyword-edit-input-wrapper">
                                <input
                                  value={kw}
                                  onChange={(e) =>
                                    updateKeywordField(index, e.target.value)
                                  }
                                  placeholder={`Palavra-chave ${index + 1}`}
                                />
                              </div>
                              {kw.trim() && (
                                <button
                                  type="button"
                                  className={`copy-kw-item-btn ${isCopied ? "copied" : ""}`}
                                  onClick={() => handleCopyInModal(`kw-${index}`, kw)}
                                  title="Copiar esta palavra-chave"
                                >
                                  {isCopied ? "✓" : "📋"}
                                </button>
                              )}
                              <button
                                type="button"
                                className="remove-title-row"
                                onClick={() => removeKeywordField(index)}
                                title="Remover palavra-chave"
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}

                        <button
                          type="button"
                          className="add-title-row-btn"
                          onClick={addKeywordField}
                        >
                          + Adicionar nova palavra-chave
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description field (Visible in all or focused tab) */}
              {(activeTabMode === "columns" || activeTabMode === "description") && (
                <div className="description-editor" style={{ marginTop: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Descrição do produto
                    </span>
                    {currentDescription && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((curr) => ({
                            ...curr,
                            [descField]: cleanForMarketplace(curr[descField] || ""),
                          }))
                        }
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--border-color, #e2e8f0)",
                          background: "var(--bg-sunken, #f8fafc)",
                          color: "#e8451f",
                          cursor: "pointer",
                        }}
                        title="Remove hashtags (#), asteriscos (*) e formata marcadores para o marketplace ativo"
                      >
                        ✨ Limpar formatação (# e *)
                      </button>
                    )}
                  </div>
                  <label className="field full" style={{ marginTop: 0 }}>
                    <textarea
                      rows={8}
                      value={currentDescription}
                      onChange={(e) =>
                        setForm((curr) => ({
                          ...curr,
                          [descField]: e.target.value,
                        }))
                      }
                      placeholder="Cole aqui a descrição completa de vendas do produto..."
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {saveError && <div className="modal-error-bar">⚠️ {saveError}</div>}

          <footer className="editor-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? "Salvando..." : "Salvar produto"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  )
}
