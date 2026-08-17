import React, { ReactNode } from "react"
import { recordClick } from "../services/storeService"

interface SocialPillProps {
  href: string
  icon: ReactNode
  label: string
  cls: string
}

export function SocialPill({ href, icon, label, cls }: SocialPillProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`social-pill ${cls}`}
      onClick={() => recordClick(label, label, "Rede Social")}
    >
      <span className="social-pill-icon-box">{icon}</span>
      <span className="social-pill-label">{label}</span>
    </a>
  )
}
