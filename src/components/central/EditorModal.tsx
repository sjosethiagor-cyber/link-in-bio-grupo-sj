import React, { useState } from "react"
import { createPortal } from "react-dom"
import { Product, Marketplace, EditorForm, Validation } from "./types"
import { parseFullRawProductText } from "./smartTextParser"

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
  parseTitleBlock,
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

  if (!editorOpen) return null

  const handleSmartImport = () => {
    if (!smartRawText.trim()) return

    const result = parseFullRawProductText(smartRawText)
    const titlesList = result.titles.length > 0 ? result.titles : []
    const paddedTitles = [...titlesList, ...Array(10).fill("")].slice(0, 10)
    const bulkText = titlesList.join("\n")

    setForm((prev) => {
      const updated: EditorForm = { ...prev }

      if (applyToAllMarketplaces) {
        updated.mlTitles = [...paddedTitles]
        updated.mlBulkText = bulkText
        if (result.description) updated.mlDescription = result.description

        updated.shopeeTitles = [...paddedTitles]
        updated.shopeeBulkText = bulkText
        if (result.description) updated.shopeeDescription = result.description

        updated.tiktokTitles = [...paddedTitles]
        updated.tiktokBulkText = bulkText
        if (result.description) updated.tiktokDescription = result.description

        updated.temuTitles = [...paddedTitles]
        updated.temuBulkText = bulkText
        if (result.description) updated.temuDescription = result.description
      } else {
        if (prev.marketplace === "mercado-livre") {
          updated.mlTitles = [...paddedTitles]
          updated.mlBulkText = bulkText
          if (result.description) updated.mlDescription = result.description
        } else if (prev.marketplace === "shopee") {
          updated.shopeeTitles = [...paddedTitles]
          updated.shopeeBulkText = bulkText
          if (result.description) updated.shopeeDescription = result.description
        } else if (prev.marketplace === "tiktok") {
          updated.tiktokTitles = [...paddedTitles]
          updated.tiktokBulkText = bulkText
          if (result.description) updated.tiktokDescription = result.description
        } else if (prev.marketplace === "temu") {
          updated.temuTitles = [...paddedTitles]
          updated.temuBulkText = bulkText
          if (result.description) updated.temuDescription = result.description
        }
      }

      if (result.sku && !prev.sku) updated.sku = result.sku
      if (result.name && !prev.name) updated.name = result.name
      if (result.brand && !prev.brand) updated.brand = result.brand
      if (result.category && !prev.category) updated.category = result.category

      return updated
    })

    const countTitles = titlesList.length
    const hasDesc = !!result.description.trim()
    setSmartFeedback({
      type: "success",
      message: `✓ Separado com sucesso: ${countTitles} título(s) e descrição completa identificados e preenchidos!${
        applyToAllMarketplaces ? " (Aplicado em todos os canais)" : ""
      }`,
    })
  }

  const currentTitles =
    form.marketplace === "mercado-livre"
      ? form.mlTitles
      : form.marketplace === "shopee"
        ? form.shopeeTitles
        : form.marketplace === "tiktok"
          ? form.tiktokTitles
          : form.temuTitles

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

  const descField =
    form.marketplace === "mercado-livre"
      ? "mlDescription"
      : form.marketplace === "shopee"
        ? "shopeeDescription"
        : form.marketplace === "tiktok"
          ? "tiktokDescription"
          : "temuDescription"

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
                    <span className="smart-badge">⚡ NOVO</span>
                    <h4>Importador Inteligente de Texto Completo</h4>
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
                  Cole todo o texto gerado (ChatGPT, fornecedor ou documento). O sistema identifica e separa <strong>títulos</strong> e <strong>descrição</strong> automaticamente em seus respectivos campos.
                </p>

                <textarea
                  rows={4}
                  value={smartRawText}
                  onChange={(e) => {
                    setSmartRawText(e.target.value)
                    if (smartFeedback) setSmartFeedback(null)
                  }}
                  placeholder={"Exemplo:\nTÍTULOS:\n1. Argamassa Polimérica Impermeabilizante 18kg Cola Mix\n2. Cola Mix Argamassa Impermeável 18kg Balde\n\nDESCRIÇÃO:\nA Argamassa Polimérica Cola Mix é indicada para..."}
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
                        // Clipboard permission fallback
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
                  <p>Ajuste títulos e descrição para cada canal específico.</p>
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
                  Opções de títulos individuais (Max 10)
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

              {/* Description field */}
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
