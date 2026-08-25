import React from "react"
import { Product, SearchIcon } from "./types"
import { ProductCard } from "./ProductCard"

export interface SidebarProps {
  products: Product[]
  filtered: Product[]
  categories: string[]
  brands?: string[]
  selectedId: string | number | null
  query: string
  setQuery: (query: string) => void
  statusFilter: "all" | "published" | "review"
  setStatusFilter: (filter: "all" | "published" | "review") => void
  categoryFilter: string
  setCategoryFilter: (cat: string) => void
  brandFilter?: string
  setBrandFilter?: (brand: string) => void
  loading: boolean
  loadError: string
  loadProducts: () => Promise<void>
  canEdit: boolean
  canDelete: boolean
  deletingId: string | number | null
  onSelectProduct: (id: string | number) => void
  onEditProduct: (product: Product) => void
  onDuplicateProduct?: (product: Product) => void
  onDeleteProduct: (product: Product) => Promise<void>
}

export const Sidebar: React.FC<SidebarProps> = ({
  products,
  filtered,
  categories,
  brands = [],
  selectedId,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  brandFilter = "all",
  setBrandFilter,
  loading,
  loadError,
  loadProducts,
  canEdit,
  canDelete,
  deletingId,
  onSelectProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
}) => {
  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    brandFilter !== "all"

  const clearAllFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
    if (setBrandFilter) setBrandFilter("all")
  }

  const exportProductsToCsv = () => {
    if (products.length === 0) return
    const headers = [
      "ID",
      "SKU",
      "Nome",
      "Marca",
      "Categoria",
      "Status",
      "Titulos_Mercado_Livre",
      "Titulos_Shopee",
      "Descricao_ML",
      "Descricao_Shopee",
      "Link_Drive",
      "Data_Atualizacao",
    ]
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.brand || "").replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.status}"`,
      `"${(p.mlTitles || []).filter(Boolean).join(" | ").replace(/"/g, '""')}"`,
      `"${(p.shopeeTitles || []).filter(Boolean).join(" | ").replace(/"/g, '""')}"`,
      `"${(p.mlDescription || "").replace(/"/g, '""')}"`,
      `"${(p.shopeeDescription || "").replace(/"/g, '""')}"`,
      `"${p.driveUrl || ""}"`,
      `"${p.updatedAt || ""}"`,
    ])
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `catalogo_grupo_sj_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <aside className="library" aria-label="Biblioteca de produtos">
      <div className="library-heading">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h1>Produtos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportProductsToCsv}
            disabled={products.length === 0}
            className="p-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            title="Exportar todos os produtos para planilha CSV"
          >
            📥 CSV
          </button>
          <span className="count">{products.length}</span>
        </div>
      </div>

      <label className="search">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto, SKU ou marca"
          aria-label="Buscar produto, SKU ou marca"
        />
      </label>

      {/* Segmented Filter Control */}
      <div className="filter-row" aria-label="Filtrar produtos por situação">
        <button
          type="button"
          className={`filter ${statusFilter === "all" ? "active" : ""}`}
          aria-pressed={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          Todos
        </button>
        <button
          type="button"
          className={`filter ${statusFilter === "published" ? "active" : ""}`}
          aria-pressed={statusFilter === "published"}
          onClick={() => setStatusFilter("published")}
        >
          Publicados
        </button>
        <button
          type="button"
          className={`filter ${statusFilter === "review" ? "active" : ""}`}
          aria-pressed={statusFilter === "review"}
          onClick={() => setStatusFilter("review")}
        >
          Em revisão
        </button>
      </div>

      {/* Category & Brand Filters Grid */}
      <div className="filters-dropdowns-grid">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`filter-select category-select ${categoryFilter !== "all" ? "is-filtered" : ""}`}
          aria-label="Filtrar por categoria"
        >
          <option value="all">Todas as categorias ({products.length})</option>
          {categories.map((cat) => {
            const count = products.filter(
              (p) =>
                p.category.trim().toLocaleLowerCase("pt-BR") ===
                cat.toLocaleLowerCase("pt-BR"),
            ).length
            return (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            )
          })}
        </select>

        {setBrandFilter && (
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className={`filter-select brand-select ${brandFilter !== "all" ? "is-filtered" : ""}`}
            aria-label="Filtrar por marca"
          >
            <option value="all">
              Todas as marcas {brands.length > 0 ? `(${brands.length})` : ""}
            </option>
            {brands.map((b) => {
              const count = products.filter(
                (p) =>
                  p.brand &&
                  p.brand.trim().toLocaleLowerCase("pt-BR") ===
                    b.toLocaleLowerCase("pt-BR"),
              ).length
              return (
                <option key={b} value={b}>
                  {b} ({count})
                </option>
              )
            })}
          </select>
        )}
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar">
          <span className="text-[11px] text-slate-500 font-medium">
            Exibindo {filtered.length} de {products.length}
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="clear-filters-btn"
          >
            Limpar filtros ×
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="product-list">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="skeleton-item">
              <div className="skeleton skeleton-thumb" />
              <div className="skeleton-text">
                <div className="skeleton skeleton-line w-3-4" />
                <div className="skeleton skeleton-line w-1-2" />
                <div className="skeleton skeleton-line w-1-4" />
              </div>
            </div>
          ))}

        {loadError && (
          <div className="inline-error">
            <p>{loadError}</p>
            <button onClick={() => void loadProducts()}>
              Tentar novamente
            </button>
          </div>
        )}

        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedId === product.id}
            canEdit={canEdit}
            canDelete={canDelete}
            deletingId={deletingId}
            onSelect={() => onSelectProduct(product.id)}
            onEdit={() => onEditProduct(product)}
            onDuplicate={
              onDuplicateProduct
                ? () => onDuplicateProduct(product)
                : undefined
            }
            onDelete={() => void onDeleteProduct(product)}
          />
        ))}

        {!loading &&
          !loadError &&
          products.length > 0 &&
          filtered.length === 0 && (
            <div className="no-content" style={{ padding: "24px 0" }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p>Nenhum produto neste filtro.</p>
            </div>
          )}
      </div>
    </aside>
  )
}
