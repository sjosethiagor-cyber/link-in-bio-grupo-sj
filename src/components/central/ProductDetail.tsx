import React from "react"
import { Product, Marketplace, Validation } from "./types"
import { generateEAN13 } from "./barcode"

export interface ProductDetailProps {
  selected?: Product
  loading: boolean
  canEdit: boolean
  marketplace: Marketplace
  chooseMarketplace: (m: Marketplace) => void
  titles: string[]
  selectedTitle: number
  setSelectedTitle: (index: number) => void
  description: string
  copied: string | null
  copyText: (key: string, text: string) => void
  titlesOpen: boolean
  setTitlesOpen: (open: boolean) => void
  descriptionOpen: boolean
  setDescriptionOpen: (open: boolean) => void
  openEditor: (product?: Product) => void
  handleGoogleSignIn: () => Promise<void>
  getMarketplaceValidation: (
    title: string,
    market: Marketplace,
  ) => Validation | null
  cleanForMarketplace: (text: string) => string
  onClose?: () => void
  isMobileOpen?: boolean
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  selected,
  loading,
  canEdit,
  marketplace,
  chooseMarketplace,
  titles,
  selectedTitle,
  setSelectedTitle,
  description,
  copied,
  copyText,
  titlesOpen,
  setTitlesOpen,
  descriptionOpen,
  setDescriptionOpen,
  openEditor,
  handleGoogleSignIn,
  getMarketplaceValidation,
  cleanForMarketplace,
  onClose,
  isMobileOpen = false,
}) => {
  const [generatedBarcode, setGeneratedBarcode] = React.useState<string | null>(
    null,
  )

  if (!selected && !loading) {
    return (
      <section className="detail">
        <div className="first-product">
          <h2>
            {canEdit
              ? "Adicione o primeiro produto"
              : "Biblioteca pronta para começar"}
          </h2>
          <p>
            {canEdit
              ? "Cadastre títulos, descrição e uma imagem de capa."
              : "Entre com sua conta do Google para cadastrar e gerenciar produtos."}
          </p>
          <button
            onClick={() =>
              canEdit ? openEditor(undefined) : void handleGoogleSignIn()
            }
          >
            {canEdit ? "Adicionar produto" : "Entrar com Google"}
          </button>
        </div>
      </section>
    )
  }

  if (!selected) return <section className="detail" />

  const coverInitials = selected.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")

  const handleGenerateCode = () => {
    const newCode = generateEAN13()
    setGeneratedBarcode(newCode)
    copyText("barcode", newCode)
  }

  return (
    <section className={`detail ${isMobileOpen ? "is-open" : ""}`}>
      {/* Top Navigation Bar */}
      <div className="detail-top-nav">
        {onClose && (
          <button className="mobile-close-detail" onClick={onClose} aria-label="Voltar para a lista">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Voltar aos produtos</span>
          </button>
        )}
        <span className="product-status-tag">{selected.status}</span>
      </div>

      {/* Main Product Hero Card */}
      <div className="product-hero-card">
        <div className="product-hero-header">
          {selected.coverUrl ? (
            <img
              className="product-cover uploaded-cover"
              src={selected.coverUrl}
              alt={`Capa de ${selected.name}`}
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div
              className="product-cover fallback-cover"
              style={{ background: selected.coverColor }}
            >
              <b>{coverInitials}</b>
            </div>
          )}

          <div className="product-hero-info">
            <p className="eyebrow">{selected.category}</p>
            <h2 className="product-hero-title">{selected.name}</h2>
            
            <div className="sku-copy-row">
              <span className="sku-label">SKU</span>
              <code>{selected.sku}</code>
              <button
                type="button"
                onClick={() => copyText("sku", selected.sku)}
                className={copied === "sku" ? "copied" : ""}
              >
                {copied === "sku" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Actions Row (Symmetrical 50/50 Grid) */}
        <div className="product-hero-actions">
          {canEdit && (
            <button
              type="button"
              className="hero-action-btn edit-btn"
              onClick={() => openEditor(selected)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Editar produto</span>
            </button>
          )}

          {selected.driveUrl ? (
            <a
              className="hero-action-btn drive-btn"
              href={selected.driveUrl}
              target="_blank"
              rel="noreferrer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Abrir Drive</span>
            </a>
          ) : (
            canEdit && (
              <button
                type="button"
                className="hero-action-btn drive-btn missing-drive"
                onClick={() => openEditor(selected)}
              >
                <span>+ Link Drive</span>
              </button>
            )
          )}
        </div>

        {/* EAN-13 Section */}
        <div className="product-ean-section">
          <button
            type="button"
            className={`generate-barcode-btn ${copied === "barcode" ? "copied" : ""}`}
            onClick={handleGenerateCode}
            title="Gerar código de barras EAN-13 aleatório"
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
              <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14" />
            </svg>
            <span>{copied === "barcode" ? "Código Gerado e Copiado! ✓" : "Gerar Código EAN-13"}</span>
          </button>

          {generatedBarcode && (
            <div className="sku-copy-row barcode-result-row">
              <span className="sku-label">EAN-13</span>
              <code className="barcode-code-text">{generatedBarcode}</code>
              <button
                type="button"
                onClick={() => copyText("barcode-code", generatedBarcode)}
                className={copied === "barcode-code" ? "copied" : ""}
              >
                {copied === "barcode-code" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Selector Tabs */}
      <div
        className="market-tabs"
        role="tablist"
        aria-label="Escolha o marketplace"
      >
        <button
          type="button"
          role="tab"
          aria-selected={marketplace === "mercado-livre"}
          className={marketplace === "mercado-livre" ? "ml active" : "ml"}
          onClick={() => chooseMarketplace("mercado-livre")}
        >
          <div className="market-tab-left">
            <span className="market-logo">ML</span>
            <strong>Mercado Livre</strong>
          </div>
          <span className="market-tab-badge">
            {selected.mlTitles.length} títulos
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={marketplace === "shopee"}
          className={marketplace === "shopee" ? "shopee active" : "shopee"}
          onClick={() => chooseMarketplace("shopee")}
        >
          <div className="market-tab-left">
            <span className="market-logo">S</span>
            <strong>Shopee</strong>
          </div>
          <span className="market-tab-badge">
            {selected.shopeeTitles.length} títulos
          </span>
        </button>
      </div>

      {/* Instructional Copy Notice */}
      <div className="notice">
        <span>✓</span>
        <p>
          <strong>Escolha uma opção e copie.</strong> Todos os textos são limpos
          automaticamente antes de irem para a área de transferência.
        </p>
      </div>

      {/* Collapsible Titles Card */}
      <article
        className={`copy-card titles-card ${!titlesOpen ? "collapsed" : ""}`}
      >
        <div
          className="card-heading"
          onClick={() => setTitlesOpen(!titlesOpen)}
          style={{ cursor: "pointer" }}
        >
          <div className="card-heading-title">
            <button
              type="button"
              className="collapse-toggle-btn"
              aria-label={
                titlesOpen
                  ? "Ocultar opções de título"
                  : "Mostrar opções de título"
              }
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <h3>Títulos Otimizados</h3>
          </div>
        </div>

        <div className="card-content">
          {titles.length === 0 ? (
            <p className="empty-text">
              Nenhum título cadastrado para este canal.
            </p>
          ) : (
            <div className="title-options-list">
              {titles.map((title, index) => {
                const validation = getMarketplaceValidation(title, marketplace)
                const isSelected = selectedTitle === index
                return (
                  <div
                    key={index}
                    className={`title-option-row ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => setSelectedTitle(index)}
                  >
                    <div className="title-option-left">
                      <span className="title-number">{index + 1}</span>
                      <p className="title-text">{title}</p>
                    </div>

                    <div className="title-option-actions">
                      {validation && (
                        <span
                          className={`validation-badge ${validation.status}`}
                        >
                          {validation.label}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyText(`title-${index}`, title)
                        }}
                        className={`copy-btn ${
                          copied === `title-${index}` ? "copied" : ""
                        }`}
                      >
                        {copied === `title-${index}` ? "Copiado ✓" : "Copiar"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </article>

      {/* Collapsible Description Card */}
      <article
        className={`copy-card description-card ${
          !descriptionOpen ? "collapsed" : ""
        }`}
      >
        <div
          className="card-heading"
          onClick={() => setDescriptionOpen(!descriptionOpen)}
          style={{ cursor: "pointer" }}
        >
          <div className="card-heading-title">
            <button
              type="button"
              className="collapse-toggle-btn"
              aria-label={
                descriptionOpen ? "Ocultar descrição" : "Mostrar descrição"
              }
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <h3>Descrição do Anúncio</h3>
          </div>
          {description && (
            <button
              className={`copy-all ${copied === "desc" ? "copied" : ""}`}
              onClick={(e) => {
                e.stopPropagation()
                copyText("desc", description)
              }}
            >
              {copied === "desc" ? "Copiado ✓" : "Copiar descrição"}
            </button>
          )}
        </div>

        <div className="card-content">
          {!description ? (
            <p className="empty-text">
              Nenhuma descrição cadastrada para este canal.
            </p>
          ) : (
            <pre className="description-pre">
              {cleanForMarketplace(description)}
            </pre>
          )}
        </div>
      </article>
    </section>
  )
}
