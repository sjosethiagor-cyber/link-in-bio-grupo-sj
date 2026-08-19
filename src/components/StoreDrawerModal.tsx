import React, { ReactNode, useEffect } from "react"
import { StoreLink, recordClick } from "../services/storeService"
import { IcoClose, IcoArrow } from "./Icons"

export interface StoreModalData {
  name: string
  subtitle: string
  icon: ReactNode
  iconBg: string
  tagColor: string
  category: "Mercado Livre" | "Shopee" | "TikTok" | "TikTok Shop"
  lojas: StoreLink[]
}

interface StoreDrawerModalProps {
  data: StoreModalData
  onClose: () => void
}

export function StoreDrawerModal({ data, onClose }: StoreDrawerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const handleLinkClick = (loja: StoreLink) => {
    recordClick(loja.id, `${data.name} - ${loja.name}`, data.category)
  }

  return (
    <div
      className="store-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lojas oficiais de ${data.name}`}
    >
      <div className="store-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header do Painel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: data.iconBg,
                flexShrink: 0,
              }}
            >
              {data.icon}
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--foreground)",
                }}
              >
                {data.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  marginTop: 2,
                }}
              >
                Selecione a loja que deseja acessar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
          >
            <IcoClose s={18} />
          </button>
        </div>

        {/* Lista de Lojas */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 18,
          }}
        >
          {data.lojas.map((loja, i) => (
            <a
              key={loja.id || i}
              href={loja.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(loja)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                borderRadius: 14,
                textDecoration: "none",
                color: "var(--foreground)",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid var(--border)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)"
                e.currentTarget.style.borderColor = "var(--border-strong)"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.035)"
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: data.tagColor,
                  boxShadow: `0 0 10px ${data.tagColor}`,
                }}
              />
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {loja.name}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "var(--muted-foreground)",
                    marginTop: 2,
                  }}
                >
                  {loja.desc}
                </span>
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: data.tagColor,
                  background: "rgba(255,255,255,0.06)",
                  padding: "6px 12px",
                  borderRadius: 8,
                }}
              >
                <span>Acessar</span>
                <IcoArrow s={13} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
