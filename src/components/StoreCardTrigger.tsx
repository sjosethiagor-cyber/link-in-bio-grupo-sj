import { ReactNode } from "react"
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
      <div className="store-card-top">
        <span
          className="store-card-icon"
          style={{ background: iconBg }}
        >
          {icon}
        </span>
        <span className="store-card-action">
          <span>Ver lojas</span>
          <IcoArrow s={13} />
        </span>
      </div>

      <div className="store-card-info">
        <span className="store-card-title">{name}</span>
        <span className="store-card-subtitle">{subtitle}</span>
      </div>
    </button>
  )
}

