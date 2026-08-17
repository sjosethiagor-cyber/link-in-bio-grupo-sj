import React, { ReactNode } from "react"
import { IcoArrow } from "./Icons"

interface StoreCardTriggerProps {
  icon: ReactNode
  name: string
  subtitle: string
  cls: string
  iconBg: string
  onClick: () => void
}

export function StoreCardTrigger({
  icon,
  name,
  subtitle,
  cls,
  iconBg,
  onClick,
}: StoreCardTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`store-card ${cls}`}
      aria-haspopup="dialog"
      aria-label={`Abrir lista de lojas ${name}`}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 14,
            background: iconBg,
            flexShrink: 0,
            padding: 8,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {icon}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--muted-foreground)",
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        </span>
      </span>

      <span className="store-card-action">
        <span>Ver lojas</span>
        <IcoArrow s={13} />
      </span>
    </button>
  )
}
