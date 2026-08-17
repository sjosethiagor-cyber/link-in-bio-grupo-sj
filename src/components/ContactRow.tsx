import React, { ReactNode } from "react"
import { recordClick } from "../services/storeService"
import { IcoChevronRight } from "./Icons"

interface ContactRowProps {
  href: string
  icon: ReactNode
  label: string
  sub: string
  isLast?: boolean
}

export function ContactRow({
  href,
  icon,
  label,
  sub,
  isLast = false,
}: ContactRowProps) {
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="link-row"
        onClick={() => recordClick(label, label, "Contato")}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--muted-foreground)",
              marginTop: 2,
            }}
          >
            {sub}
          </span>
        </span>
        <span
          style={{
            color: "var(--muted-foreground)",
            opacity: 0.5,
            display: "flex",
          }}
        >
          <IcoChevronRight />
        </span>
      </a>
      {!isLast && <div className="divider" />}
    </>
  )
}
