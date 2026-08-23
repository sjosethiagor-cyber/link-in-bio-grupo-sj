import React from "react"
import { createPortal } from "react-dom"
import { Product, Marketplace, EditorForm, Validation } from "./types"

export interface EditorModalProps {
  editorOpen: boolean
  setEditorOpen: (open: boolean) => void
  saving: boolean
  saveError?: string
  form: EditorForm
  setForm: React.Dispatch<React.SetStateAction<EditorForm>>
  products: Product[]
  categories: string[]
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
  if (!editorOpen) return null

  const currentTitles =
    form.marketplace === "mercado-livre" ? form.mlTitles : form.shopeeTitles
  const currentDescription =
    form.marketplace === "mercado-livre"
      ? form.mlDescription
      : form.shopeeDescription

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
                  <option>Publicado</option>
                  <option>Em revisão</option>
                </select>
              </label>

              <label className="field full drive-field">
                <span>Link da pasta de imagens no Google Drive</span>
                <input
                  type="url"
                  value={form.driveUrl}
                  onChange={(e) =>
                    setForm({ ...form, driveUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                />
                <small>
                  Cole o link da pasta onde estão as artes e os vídeos deste
                  produto.
                </small>
              </label>
            </div>

            {/* Cover Image Section */}
            <div className="editor-section">
              <div className="section-title">
                <div>
                  <h3>Imagem de capa</h3>
                  <p>JPG, PNG ou WebP de até 5 MB.</p>
                </div>
              </div>
              <label className="cover-uploader">
                {coverPreview || form.coverUrl ? (
                  <div className="cover-preview-box">
                    <img
                      src={coverPreview || form.coverUrl || ""}
                      alt="Prévia da capa"
                      decoding="async"
                    />
                    <div className="cover-preview-info">
                      <b>Imagem de capa selecionada</b>
                      <small>Clique para alterar a imagem</small>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
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
                    <small>Clique para selecionar arquivo</small>
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
              <div className="section-title marketplace-editor-title">
                <div>
                  <h3>Conteúdo do anúncio</h3>
                  <p>O conteúdo é salvo separadamente para cada marketplace.</p>
                </div>
                <div className="mini-tabs">
                  <button
                    type="button"
                    className={
                      form.marketplace === "mercado-livre" ? "active" : ""
                    }
                    onClick={() => changeEditorMarketplace("mercado-livre")}
                  >
                    Mercado Livre
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
                    Shopee
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
                    rows={4}
                    value={
                      form.marketplace === "mercado-livre"
                        ? form.mlBulkText
                        : form.shopeeBulkText
                    }
                    onChange={(e) => applyTitleBlock(e.target.value)}
                    placeholder={
                      form.marketplace === "mercado-livre"
                        ? "Exemplo:\n1. Título do meu anúncio 1\n2. Segunda opção de título\nTítulo 3..."
                        : "Dica: Títulos devem ter entre 20 e 120 caracteres para Shopee."
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
                        setForm((curr) => {
                          const isML = curr.marketplace === "mercado-livre"
                          const field = isML
                            ? "mlDescription"
                            : "shopeeDescription"
                          return {
                            ...curr,
                            [field]: cleanForMarketplace(curr[field] || ""),
                          }
                        })
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
                      title="Remove hashtags (#), asteriscos (*) e formata marcadores para Mercado Livre e Shopee"
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
                      setForm((curr) => {
                        const isML = curr.marketplace === "mercado-livre"
                        return {
                          ...curr,
                          [isML ? "mlDescription" : "shopeeDescription"]:
                            e.target.value,
                        }
                      })
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
