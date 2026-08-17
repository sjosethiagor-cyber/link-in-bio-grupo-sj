import React from "react"
import { Product } from "./types"

export interface ProductCardProps {
  product: Product
  isSelected: boolean
  canEdit: boolean
  canDelete: boolean
  deletingId: string | number | null
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  canEdit,
  canDelete,
  deletingId,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const isDeleting = deletingId === product.id
  const formattedSku = product.sku ? product.sku.replace(/-$/, "") : "SEM-SKU"
  const categoryText = product.category || "Sem categoria"
  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")

  return (
    <div className={`product-item ${isSelected ? "selected" : ""}`}>
      <div className="product-thumb" onClick={onSelect}>
        {product.coverUrl ? (
          <img
            className="image-thumb"
            src={product.coverUrl}
            alt={`Foto de ${product.name}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="fallback-thumb"
            style={{ background: product.coverColor }}
          >
            <b>{initials}</b>
          </div>
        )}
      </div>

      <div className="product-card-content">
        <button
          className="product-select"
          onClick={onSelect}
          aria-label={`Abrir ${product.name}`}
        >
          <span className="product-info">
            <strong>{product.name}</strong>
            <small>
              {formattedSku} · {categoryText}
            </small>
            <span
              className={`status ${
                product.status === "Publicado" ? "live" : "review"
              }`}
            >
              {product.status}
            </span>
          </span>
        </button>

        {canEdit && (
          <div className="library-item-actions">
            <button className="library-edit" onClick={onEdit}>
              Editar
            </button>
            {canDelete && (
              <button
                className="library-delete"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo…" : "Excluir"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
