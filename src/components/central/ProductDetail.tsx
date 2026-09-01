import React from "react"
import { Product, Marketplace, Validation } from "./types"
import { generateEAN13 } from "./barcode"

export interface ProductDetailProps {
  selected?: Product | null
  loading: boolean
  canEdit: boolean
  marketplace: Marketplace
  chooseMarketplace: (m: Marketplace) => void
  titles: string[]
  selectedTitle: number
  setSelectedTitle: (index: number) => void
  keywords?: string[]
  description: string
  copied: string | null
  copyText: (key: string, text: string) => void
  titlesOpen: boolean
  setTitlesOpen: (open: boolean) => void
  descriptionOpen: boolean
  setDescriptionOpen: (open: boolean) => void
  openEditor: (product?: Product) => void
  onDuplicate?: (product: Product) => void
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
  keywords = [],
  description,
  copied,
  copyText,
  titlesOpen,
  setTitlesOpen,
  descriptionOpen,
  setDescriptionOpen,
  openEditor,
  onDuplicate,
  handleGoogleSignIn,
  getMarketplaceValidation,
  cleanForMarketplace,
  onClose,
  isMobileOpen = false,
}) => {
  const [keywordsOpen, setKeywordsOpen] = React.useState(true)
  const [detailTab, setDetailTab] = React.useState<"titles" | "keywords" | "description">("titles")
  const [generatedBarcode, setGeneratedBarcode] = React.useState<string | null>(
    null,
  )
  const [viewMode, setViewMode] = React.useState<"workspace" | "mockup">(
    "workspace",
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

  const activeTitle =
    titles[selectedTitle] || titles[0] || selected.name

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
          <button
            className="mobile-close-detail"
            onClick={onClose}
            aria-label="Voltar para a lista"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Voltar aos produtos</span>
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="product-status-tag">{selected.status}</span>
        </div>
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
            <p className="eyebrow">
              {selected.brand ? `${selected.brand} · ${selected.category}` : selected.category}
            </p>
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

        {/* Hero Actions Row (Symmetrical Grid with Edit, Duplicate and Drive) */}
        <div className="product-hero-actions">
          {canEdit && (
            <button
              type="button"
              className="hero-action-btn edit-btn"
              onClick={() => openEditor(selected)}
              title="Editar dados e fotos deste produto"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Editar</span>
            </button>
          )}

          {canEdit && onDuplicate && (
            <button
              type="button"
              className="hero-action-btn duplicate-btn"
              onClick={() => onDuplicate(selected)}
              title="Clonar anúncio para criar uma variação rápida"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Duplicar</span>
            </button>
          )}

          {selected.driveUrl ? (
            <a
              className="hero-action-btn drive-btn"
              href={selected.driveUrl}
              target="_blank"
              rel="noreferrer"
              title="Abrir pasta de fotos e arquivos no Google Drive"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                title="Vincular pasta do Google Drive"
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
            <span>
              {copied === "barcode"
                ? "Código Gerado e Copiado! ✓"
                : "Gerar Código EAN-13"}
            </span>
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

      {/* Mode View Switcher: Workspace vs Live Mockup Preview */}
      <div className="detail-view-mode-tabs">
        <button
          type="button"
          className={`view-mode-tab ${viewMode === "workspace" ? "active" : ""}`}
          onClick={() => setViewMode("workspace")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Títulos & Textos</span>
        </button>
        <button
          type="button"
          className={`view-mode-tab ${viewMode === "mockup" ? "active" : ""}`}
          onClick={() => setViewMode("mockup")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span>Prévia (Mockup)</span>
        </button>
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
          <span className="market-tab-badge">60 carac.</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={marketplace === "shopee"}
          className={marketplace === "shopee" ? "shopee active" : "shopee"}
          onClick={() => chooseMarketplace("shopee")}
        >
          <div className="market-tab-left">
            <span className="market-logo">SH</span>
            <strong>Shopee</strong>
          </div>
          <span className="market-tab-badge">120 carac.</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={marketplace === "tiktok"}
          className={marketplace === "tiktok" ? "tiktok active" : "tiktok"}
          onClick={() => chooseMarketplace("tiktok")}
        >
          <div className="market-tab-left">
            <span className="market-logo">TT</span>
            <strong>TikTok Shop</strong>
          </div>
          <span className="market-tab-badge">255 carac.</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={marketplace === "temu"}
          className={marketplace === "temu" ? "temu active" : "temu"}
          onClick={() => chooseMarketplace("temu")}
        >
          <div className="market-tab-left">
            <span className="market-logo">TM</span>
            <strong>Temu</strong>
          </div>
          <span className="market-tab-badge">100 carac.</span>
        </button>
      </div>

      {/* Conditional Content: Workspace Mode vs Live Mockup Preview */}
      {viewMode === "mockup" ? (
        <div className="marketplace-mockup-container">
          <div className="mockup-header-bar">
            <div className="mockup-header-top-row">
              <div className="mockup-header-left">
                <span className="mockup-live-dot" />
                <div>
                  <strong>
                    Simulador de Anúncio (
                    {marketplace === "mercado-livre"
                      ? "Mercado Livre App"
                      : marketplace === "shopee"
                        ? "Shopee App"
                        : marketplace === "tiktok"
                          ? "TikTok Shop Live"
                          : "Temu App"}
                    )
                  </strong>
                  <span className="mockup-subtitle">
                    Visualização em tempo real do anúncio no marketplace
                  </span>
                </div>
              </div>

              {/* Title Cycle Switcher Toolbar */}
              {titles.length > 0 && (
                <div className="mockup-title-nav-controls">
                  <button
                    type="button"
                    className="title-nav-btn"
                    onClick={() => {
                      if (titles.length <= 1) return
                      setSelectedTitle((selectedTitle - 1 + titles.length) % titles.length)
                    }}
                    disabled={titles.length <= 1}
                    title="Título Anterior"
                    aria-label="Título Anterior"
                  >
                    ‹
                  </button>

                  <span className="title-nav-counter">
                    Opção <strong>{selectedTitle + 1}</strong> de <strong>{titles.length}</strong>
                  </span>

                  <button
                    type="button"
                    className="title-nav-btn"
                    onClick={() => {
                      if (titles.length <= 1) return
                      setSelectedTitle((selectedTitle + 1) % titles.length)
                    }}
                    disabled={titles.length <= 1}
                    title="Próximo Título"
                    aria-label="Próximo Título"
                  >
                    ›
                  </button>

                  <button
                    type="button"
                    className="title-cycle-action-btn"
                    onClick={() => {
                      if (titles.length <= 1) return
                      setSelectedTitle((selectedTitle + 1) % titles.length)
                    }}
                    disabled={titles.length <= 1}
                    title="Alternar para o próximo título cadastrado"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span>Trocar Título</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Title Option Pills */}
            {titles.length > 1 && (
              <div className="mockup-titles-pills-row">
                <span className="pills-label">Escolher Título:</span>
                <div className="pills-scroll">
                  {titles.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`mockup-title-pill ${idx === selectedTitle ? "active" : ""}`}
                      onClick={() => setSelectedTitle(idx)}
                      title={t}
                    >
                      <span className="pill-num">#{idx + 1}</span>
                      <span className="pill-text">
                        {t.length > 32 ? t.slice(0, 32) + "..." : t}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {marketplace === "mercado-livre" && (
            <div className="ml-mockup-card">
              <div className="ml-mockup-top-banner">
                <span className="ml-tag-mas-vendido">MAIS VENDIDO</span>
                <span className="ml-seller-reputation">
                  🏆 MercadoLíder Platinum
                </span>
              </div>

              <div className="ml-mockup-main">
                <div className="ml-mockup-image-box">
                  {selected.coverUrl ? (
                    <img src={selected.coverUrl} alt={selected.name} />
                  ) : (
                    <div
                      className="ml-mockup-fallback-img"
                      style={{ background: selected.coverColor }}
                    >
                      <b>{coverInitials}</b>
                    </div>
                  )}
                  <span className="ml-badge-full">⚡ FULL</span>
                </div>

                <div className="ml-mockup-body">
                  <div className="mockup-body-header">
                    <span className="ml-condition-sales">
                      Novo | +500 vendidos
                    </span>
                    {titles.length > 1 && (
                      <button
                        type="button"
                        className="mockup-inline-switch-btn ml-style"
                        onClick={() => setSelectedTitle((selectedTitle + 1) % titles.length)}
                        title="Alternar para o próximo título"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Trocar Título ({selectedTitle + 1}/{titles.length})</span>
                      </button>
                    )}
                  </div>

                  <h4 className="ml-product-title">{activeTitle}</h4>

                  <div className="ml-rating-row">
                    <span className="ml-stars">★★★★★</span>
                    <span className="ml-rating-number">4.9</span>
                    <span className="ml-rating-count">(324 avaliações)</span>
                  </div>

                  <div className="ml-price-box">
                    <div className="ml-price-row">
                      <span className="ml-currency">R$</span>
                      <span className="ml-price-value">89</span>
                      <span className="ml-price-cents">90</span>
                      <span className="ml-discount">10% OFF</span>
                    </div>
                    <p className="ml-installments">
                      em <strong>12x de R$ 8,72</strong> sem juros
                    </p>
                  </div>

                  <div className="ml-shipping-badge">
                    <span className="ml-truck-icon">🚚</span>
                    <span className="ml-free-ship-text">
                      <strong>Chegará grátis amanhã</strong> com Envio Full
                    </span>
                  </div>

                  <div className="ml-action-buttons">
                    <button
                      type="button"
                      className="ml-btn-buy"
                      onClick={() => copyText("title-mockup", activeTitle)}
                    >
                      {copied === "title-mockup"
                        ? "Título Copiado! ✓"
                        : "Copiar Este Título"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketplace === "shopee" && (
            <div className="shopee-mockup-card">
              <div className="shopee-mockup-top-banner">
                <span className="shopee-mall-tag">OFICIAL</span>
                <span className="shopee-guarantee">
                  🛡️ Garantia Shopee · Devolução Grátis
                </span>
              </div>

              <div className="shopee-mockup-main">
                <div className="shopee-mockup-image-box">
                  {selected.coverUrl ? (
                    <img src={selected.coverUrl} alt={selected.name} />
                  ) : (
                    <div
                      className="shopee-mockup-fallback-img"
                      style={{ background: selected.coverColor }}
                    >
                      <b>{coverInitials}</b>
                    </div>
                  )}
                  <span className="shopee-badge-indicado">Indicado</span>
                  <span className="shopee-badge-frete">Frete Grátis</span>
                </div>

                <div className="shopee-mockup-body">
                  <div className="mockup-body-header">
                    <span className="shopee-brand-tag">Oficial Grupo SJ</span>
                    {titles.length > 1 && (
                      <button
                        type="button"
                        className="mockup-inline-switch-btn shopee-style"
                        onClick={() => setSelectedTitle((selectedTitle + 1) % titles.length)}
                        title="Alternar para o próximo título"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Trocar Título ({selectedTitle + 1}/{titles.length})</span>
                      </button>
                    )}
                  </div>

                  <h4 className="shopee-product-title">{activeTitle}</h4>

                  <div className="shopee-rating-row">
                    <span className="shopee-stars">⭐ 4.9</span>
                    <span className="shopee-sep">|</span>
                    <span className="shopee-sales">1,8mil vendidos</span>
                  </div>

                  <div className="shopee-price-box">
                    <span className="shopee-old-price">R$ 99,90</span>
                    <div className="shopee-current-price">
                      <span className="shopee-currency">R$</span>
                      <span className="shopee-price-value">84,90</span>
                    </div>
                  </div>

                  <div className="shopee-voucher-badge">
                    <span>🎟️ Cupom de R$ 5 OFF disponível na loja</span>
                  </div>

                  <div className="shopee-action-buttons">
                    <button
                      type="button"
                      className="shopee-btn-buy"
                      onClick={() => copyText("title-mockup", activeTitle)}
                    >
                      {copied === "title-mockup"
                        ? "Título Copiado! ✓"
                        : "Copiar Este Título"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketplace === "tiktok" && (
            <div className="tiktok-mockup-card">
              <div className="tiktok-mockup-top-banner">
                <span className="tiktok-shop-tag">🛍️ TikTok Shop Oficial</span>
                <span className="tiktok-live-tag">🔴 Oferta de Vídeo/Live</span>
              </div>

              <div className="tiktok-mockup-main">
                <div className="tiktok-mockup-image-box">
                  {selected.coverUrl ? (
                    <img src={selected.coverUrl} alt={selected.name} />
                  ) : (
                    <div
                      className="tiktok-mockup-fallback-img"
                      style={{ background: selected.coverColor }}
                    >
                      <b>{coverInitials}</b>
                    </div>
                  )}
                  <span className="tiktok-badge-viral">🔥 Viral</span>
                  <span className="tiktok-badge-frete">Frete Grátis</span>
                </div>

                <div className="tiktok-mockup-body">
                  <div className="mockup-body-header">
                    <div className="tiktok-creator-row">
                      <span className="tiktok-creator-badge">@gruposj</span>
                      <span className="tiktok-sales-count">2.4k vendidos</span>
                    </div>
                    {titles.length > 1 && (
                      <button
                        type="button"
                        className="mockup-inline-switch-btn tiktok-style"
                        onClick={() => setSelectedTitle((selectedTitle + 1) % titles.length)}
                        title="Alternar para o próximo título"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Trocar Título ({selectedTitle + 1}/{titles.length})</span>
                      </button>
                    )}
                  </div>

                  <h4 className="tiktok-product-title">{activeTitle}</h4>

                  <div className="tiktok-rating-row">
                    <span className="tiktok-stars">⭐⭐⭐⭐⭐</span>
                    <span className="tiktok-rating-text">5.0 (840 avaliações)</span>
                  </div>

                  <div className="tiktok-price-box">
                    <span className="tiktok-old-price">R$ 109,90</span>
                    <div className="tiktok-current-price">
                      <span className="tiktok-currency">R$</span>
                      <span className="tiktok-price-value">79,90</span>
                      <span className="tiktok-discount-badge">-27%</span>
                    </div>
                  </div>

                  <div className="tiktok-voucher-pill">
                    <span>⚡ Cupom Primeira Compra: -R$ 15 no checkout</span>
                  </div>

                  <div className="tiktok-action-buttons">
                    <button
                      type="button"
                      className="tiktok-btn-buy"
                      onClick={() => copyText("title-mockup", activeTitle)}
                    >
                      {copied === "title-mockup"
                        ? "Título Copiado! ✓"
                        : "Copiar Este Título"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketplace === "temu" && (
            <div className="temu-mockup-card">
              <div className="temu-mockup-top-banner">
                <span className="temu-lightning-tag">⚡ OFERTA RELÂMPAGO</span>
                <span className="temu-stock-alert">🔥 Quase Esgotado</span>
              </div>

              <div className="temu-mockup-main">
                <div className="temu-mockup-image-box">
                  {selected.coverUrl ? (
                    <img src={selected.coverUrl} alt={selected.name} />
                  ) : (
                    <div
                      className="temu-mockup-fallback-img"
                      style={{ background: selected.coverColor }}
                    >
                      <b>{coverInitials}</b>
                    </div>
                  )}
                  <span className="temu-badge-bestseller">#1 Mais Vendido</span>
                  <span className="temu-badge-frete">Envio Grátis</span>
                </div>

                <div className="temu-mockup-body">
                  <div className="mockup-body-header">
                    <div className="temu-brand-row">
                      <span className="temu-orange-badge">TEMU DIRETO</span>
                      <span className="temu-reviews-stat">⭐ 4.9 · 1.2k+</span>
                    </div>
                    {titles.length > 1 && (
                      <button
                        type="button"
                        className="mockup-inline-switch-btn temu-style"
                        onClick={() => setSelectedTitle((selectedTitle + 1) % titles.length)}
                        title="Alternar para o próximo título"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Trocar Título ({selectedTitle + 1}/{titles.length})</span>
                      </button>
                    )}
                  </div>

                  <h4 className="temu-product-title">{activeTitle}</h4>

                  <div className="temu-price-box">
                    <span className="temu-old-price">R$ 115,00</span>
                    <div className="temu-current-price">
                      <span className="temu-currency">R$</span>
                      <span className="temu-price-value">69,99</span>
                      <span className="temu-tag-off">-40%</span>
                    </div>
                  </div>

                  <div className="temu-guarantee-box">
                    <span>🛡️ Devolução Grátis em até 90 dias · Garantia de Ajuste</span>
                  </div>

                  <div className="temu-action-buttons">
                    <button
                      type="button"
                      className="temu-btn-buy"
                      onClick={() => copyText("title-mockup", activeTitle)}
                    >
                      {copied === "title-mockup"
                        ? "Título Copiado! ✓"
                        : "Copiar Este Título"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Instructional Copy Notice */}
          <div className="notice">
            <span>✓</span>
            <p>
              <strong>Escolha uma opção e copie.</strong> Todos os textos são
              limpos automaticamente antes de irem para a área de transferência.
            </p>
          </div>

          {/* Top Segmented Navigation Menu for Product Content (Titles, Keywords, Description) */}
          <div className="workspace-section-tabs-nav" role="tablist" aria-label="Navegar por seções do anúncio">
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "titles"}
              className={`workspace-section-tab ${detailTab === "titles" ? "active" : ""}`}
              onClick={() => setDetailTab("titles")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>📝 Títulos ({titles.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "keywords"}
              className={`workspace-section-tab ${detailTab === "keywords" ? "active" : ""}`}
              onClick={() => setDetailTab("keywords")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>🔑 Palavras-chave ({keywords.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "description"}
              className={`workspace-section-tab ${detailTab === "description" ? "active" : ""}`}
              onClick={() => setDetailTab("description")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>📋 Descrição</span>
            </button>
          </div>

          {/* Titles & Keywords Container */}
          <div className={`workspace-content-wrapper mode-${detailTab}`}>
            {/* Titles Card */}
            {detailTab === "titles" && (
              <article className="copy-card titles-card full-focus-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="col-icon-circle blue" style={{ width: 32, height: 32 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3>Títulos Otimizados</h3>
                      <span className="col-hint" style={{ marginTop: 2 }}>
                        {marketplace === "mercado-livre"
                          ? "Até 60 caracteres por título"
                          : marketplace === "shopee"
                            ? "De 20 a 120 caracteres por título"
                            : marketplace === "tiktok"
                              ? "Até 255 caracteres por título"
                              : "Até 100 caracteres por título"}
                      </span>
                    </div>
                    {titles.length > 0 && (
                      <span className="count-badge">{titles.length}</span>
                    )}
                  </div>

                  {titles[selectedTitle] && (
                    <div className="card-heading-actions">
                      <button
                        type="button"
                        className={`copy-all ${copied === `title-${selectedTitle}` ? "copied" : ""}`}
                        onClick={() => copyText(`title-${selectedTitle}`, titles[selectedTitle])}
                        title="Copiar título selecionado"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>{copied === `title-${selectedTitle}` ? "Copiado ✓" : `Copiar Título #${selectedTitle + 1}`}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="card-content">
                  {titles.length === 0 ? (
                    <p className="empty-text">
                      Nenhum título cadastrado para este canal. Clique em Editar para cadastrar opções.
                    </p>
                  ) : (
                    <div className="title-options-list">
                      {titles.map((title, index) => {
                        const validation = getMarketplaceValidation(
                          title,
                          marketplace,
                        )
                        const isSelected = selectedTitle === index
                        const isCopied = copied === `title-${index}`
                        return (
                          <div
                            key={index}
                            className={`title-option-row ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => setSelectedTitle(index)}
                          >
                            <div className="title-option-left">
                              <span className="title-number">#{index + 1}</span>
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
                                className={`copy-btn ${isCopied ? "copied" : ""}`}
                              >
                                {isCopied ? "Copiado ✓" : "Copiar"}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </article>
            )}

            {/* Keywords Card */}
            {detailTab === "keywords" && (
              <article className="copy-card keywords-card full-focus-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="col-icon-circle amber" style={{ width: 32, height: 32 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </div>
                    <div>
                      <h3>Palavras-chave (SEO / Tags)</h3>
                      <span className="col-hint" style={{ marginTop: 2 }}>
                        Termos de busca de alta conversão
                      </span>
                    </div>
                    {keywords.length > 0 && (
                      <span className="count-badge">{keywords.length}</span>
                    )}
                  </div>

                  {keywords.length > 0 && (
                    <div className="card-heading-actions">
                      <button
                        type="button"
                        className={`copy-all ${copied === "all-kw-comma" ? "copied" : ""}`}
                        onClick={() => copyText("all-kw-comma", keywords.join(", "))}
                        title="Copiar todas as palavras-chave separadas por vírgula"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>
                          {copied === "all-kw-comma" ? "Copiadas! ✓" : "Copiar Todas (com vírgula)"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="card-content">
                  {keywords.length === 0 ? (
                    <p className="empty-text">
                      Nenhuma palavra-chave cadastrada para este canal. Clique em Editar para cadastrar termos de busca.
                    </p>
                  ) : (
                    <>
                      {/* Interactive Keywords Pills Cloud */}
                      <div className="keyword-pills-cloud-wrapper">
                        <div className="keyword-cloud-header">
                          <span className="cloud-tip">💡 Clique em qualquer tag abaixo para copiar individualmente:</span>
                        </div>
                        <div className="keyword-pills-cloud">
                          {keywords.map((kw, index) => {
                            const isCopied = copied === `kw-pill-${index}`
                            return (
                              <button
                                key={index}
                                type="button"
                                className={`keyword-pill ${isCopied ? "copied" : ""}`}
                                onClick={() => copyText(`kw-pill-${index}`, kw)}
                                title={`Clique para copiar "${kw}"`}
                              >
                                <span className="kw-pill-num">#{index + 1}</span>
                                <span className="kw-pill-text">{kw}</span>
                                <span className="kw-pill-copy-icon">
                                  {isCopied ? "✓" : "📋"}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Detailed Numbered List of Keywords */}
                      <div className="keyword-options-list" style={{ marginTop: 16 }}>
                        {keywords.map((kw, index) => {
                          const isCopied = copied === `kw-${index}`
                          return (
                            <div key={index} className="keyword-option-row">
                              <div className="keyword-option-left">
                                <span className="keyword-number">#{index + 1}</span>
                                <p className="keyword-text">{kw}</p>
                              </div>
                              <button
                                onClick={() => copyText(`kw-${index}`, kw)}
                                className={`copy-btn ${isCopied ? "copied" : ""}`}
                              >
                                {isCopied ? "Copiado ✓" : "Copiar"}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </article>
            )}
          </div>

          {/* Description Card */}
          {detailTab === "description" && (
            <article className="copy-card description-card full-focus-card" style={{ marginTop: 0 }}>
              <div className="card-heading">
                <div className="card-heading-title">
                  <div className="col-icon-circle blue" style={{ width: 32, height: 32 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h3>Descrição do Anúncio</h3>
                    <span className="col-hint" style={{ marginTop: 2 }}>
                      Texto completo formatado para conversão
                    </span>
                  </div>
                </div>

                {description && (
                  <button
                    type="button"
                    className={`copy-all ${copied === "desc" ? "copied" : ""}`}
                    onClick={() => copyText("desc", description)}
                    title="Copiar texto da descrição para a área de transferência"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copied === "desc" ? "Copiado ✓" : "Copiar Descrição Completa"}</span>
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
          )}
        </>
      )}
    </section>
  )
}
