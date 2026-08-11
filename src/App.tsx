import {
  Component,
  lazy,
  Suspense,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import {
  recordClick,
  getStoredMLStoreLinks,
  getStoredShopeeStoreLinks,
  getStoredSocialLinks,
  type StoreLink,
  type SocialLinks,
  DEFAULT_SOCIAL_LINKS,
} from "./services/storeService"
import grupoSjLogo from "./imports/grupo-sj-logo.png"

const LeadModal = lazy(() => import("./components/LeadModal"))
const AdminDashboard = lazy(() => import("./components/AdminDashboard"))
import mercadoLivreLogo from "./imports/mercado-livre-logo.svg"
import shopeeLogo from "./imports/shopee-logo.svg"

// ─── Links Estáticos por Padrão ──────────────────────────────────────────────
const LINKS = {
  instagram: "https://instagram.com/[@instagram]",
  facebook: "https://facebook.com/[@facebook]",
  linkedin: "https://linkedin.com/company/[@linkedin]",
  whatsapp: "https://wa.me/[numero whatsapp]",
  email: "contato@gruposj.com.br",
}

// ─── Error boundary ───────────────────────────────────────────────────────────

interface EBState {
  error: Error | null
}
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null }
  static getDerivedStateFromError(error: Error): EBState {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 40,
            color: "#f2f0ea",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          <strong>Erro:</strong> {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoML({ s = 32 }: { s?: number }) {
  return (
    <img
      src={mercadoLivreLogo}
      alt="Mercado Livre"
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        maxHeight: s,
        objectFit: "contain",
      }}
    />
  )
}

function IcoShopee({ s = 32 }: { s?: number }) {
  return (
    <img
      src={shopeeLogo}
      alt="Shopee"
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        maxHeight: s,
        objectFit: "contain",
      }}
    />
  )
}

function IcoInstagram({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  )
}

function IcoFacebook({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function IcoLinkedIn({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function IcoWhatsApp({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

function IcoEmail({ s = 20 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  )
}

function IcoArrow({ s = 15 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IcoChevron({ s = 14 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function IcoShield({ s = 14 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

// ─── Logo mark ───────────────────────────────────────────────────────────────

function SJMark({ size = 96 }: { size?: number }) {
  return (
    <img
      src={grupoSjLogo}
      alt="Logo Grupo SJ"
      width={size}
      height={size}
      style={{
        display: "block",
        width: size,
        height: size,
        borderRadius: 22,
        objectFit: "cover",
      }}
    />
  )
}

function IcoClose({ s = 20 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Ambient background ───────────────────────────────────────────────────────

function Background() {
  return <div aria-hidden className="ambient-background" />
}

// ─── Store Trigger Card & Drawer Modal ───────────────────────────────────────

interface StoreModalData {
  name: string
  subtitle: string
  icon: ReactNode
  iconBg: string
  tagColor: string
  category: "Mercado Livre" | "Shopee"
  lojas: StoreLink[]
}

interface StoreCardTriggerProps {
  icon: ReactNode
  name: string
  subtitle: string
  cls: string
  iconBg: string
  onClick: () => void
}

function StoreCardTrigger({
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

function StoreDrawerModal({
  data,
  onClose,
}: {
  data: StoreModalData
  onClose: () => void
}) {
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

// ─── Social pill ──────────────────────────────────────────────────────────────

function SocialPill({
  href,
  icon,
  label,
  cls,
}: {
  href: string
  icon: ReactNode
  label: string
  cls: string
}) {
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

// ─── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({
  href,
  icon,
  label,
  sub,
  isLast = false,
}: {
  href: string
  icon: ReactNode
  label: string
  sub: string
  isLast?: boolean
}) {
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
          <IcoChevron />
        </span>
      </a>
      {!isLast && <div className="divider" />}
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeStore, setActiveStore] = useState<StoreModalData | null>(null)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [hasOpenedLeadModal, setHasOpenedLeadModal] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [hasOpenedAdmin, setHasOpenedAdmin] = useState(false)

  const [mlLojas, setMlLojas] = useState<StoreLink[]>([])
  const [shopeeLojas, setShopeeLojas] = useState<StoreLink[]>([])
  const [socialLinks, setSocialLinks] =
    useState<SocialLinks>(DEFAULT_SOCIAL_LINKS)

  const refreshLinks = () => {
    setMlLojas(getStoredMLStoreLinks())
    setShopeeLojas(getStoredShopeeStoreLinks())
    setSocialLinks(getStoredSocialLinks())
  }

  useEffect(() => {
    refreshLinks()
  }, [])

  return (
    <ErrorBoundary>
      <Background />

      <div className="page-wrapper">
        <div className="content-col">
          {/* ── Header ── */}
          <header
            className="fade-up"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 28,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {/* Logo com anéis */}
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -24,
                  borderRadius: 46,
                  background:
                    "radial-gradient(circle, rgba(232,69,31,0.12) 0%, transparent 70%)",
                }}
              />
              <div
                className="logo-ring"
                style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: 34,
                  border: "1.5px solid rgba(232,69,31,0.28)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -5,
                  borderRadius: 27,
                  border: "1px solid rgba(232,69,31,0.18)",
                }}
              />
              <SJMark size={96} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(14px, 3.8vw, 16px)",
                  fontWeight: 600,
                  color: "#d8d4cb",
                  lineHeight: 1.5,
                  maxWidth: 320,
                  textAlign: "center",
                  letterSpacing: "-0.01em",
                }}
              >
                Um grupo. Muitas soluções. A mesma confiança.
              </p>

              {/* Trust badge */}
              <span className="trust-badge" style={{ marginTop: 2 }}>
                <span style={{ display: "flex" }}>
                  <IcoShield s={13} />
                </span>
                <span>{"Vendedor oficial · Mercado Livre & Shopee"}</span>
              </span>
            </div>
          </header>

          {/* ── Lead Capture CTA ── */}
          <div className="fade-up" style={{ marginTop: -8 }}>
            <button
              type="button"
              onClick={() => {
                recordClick(
                  "btn_lead_cta",
                  "Solicitar Orçamento Button",
                  "Contato",
                )
                setHasOpenedLeadModal(true)
                setIsLeadModalOpen(true)
              }}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "var(--radius)",
                background:
                  "linear-gradient(135deg, rgba(232,69,31,0.95) 0%, rgba(200,50,20,0.95) 100%)",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 8px 32px rgba(232,69,31,0.28)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <span>⚡ Solicitar Orçamento / Atendimento</span>
              <IcoArrow s={16} />
            </button>
          </div>

          {/* ── Lojas ── */}
          <section className="fade-up delay-1">
            <p className="section-label">{"Nossas lojas"}</p>
            <div className="store-grid">
              <StoreCardTrigger
                icon={<IcoML s={42} />}
                name="Mercado Livre"
                subtitle={`${mlLojas.length} lojas oficiais`}
                cls="store-card-ml"
                iconBg="rgba(255,230,0,0.18)"
                onClick={() => {
                  recordClick(
                    "btn_ml_stores",
                    "Mercado Livre Modal Open",
                    "Mercado Livre",
                  )
                  setActiveStore({
                    name: "Mercado Livre",
                    subtitle: "Lojas oficiais no Mercado Livre",
                    icon: <IcoML s={38} />,
                    iconBg: "rgba(255,230,0,0.18)",
                    tagColor: "#ffe600",
                    category: "Mercado Livre",
                    lojas: mlLojas,
                  })
                }}
              />
              <StoreCardTrigger
                icon={<IcoShopee s={42} />}
                name="Shopee"
                subtitle={`${shopeeLojas.length} lojas oficiais`}
                cls="store-card-sp"
                iconBg="rgba(238,77,45,0.18)"
                onClick={() => {
                  recordClick("btn_sp_stores", "Shopee Modal Open", "Shopee")
                  setActiveStore({
                    name: "Shopee",
                    subtitle: "Lojas oficiais na Shopee",
                    icon: <IcoShopee s={38} />,
                    iconBg: "rgba(238,77,45,0.18)",
                    tagColor: "#ee4d2d",
                    category: "Shopee",
                    lojas: shopeeLojas,
                  })
                }}
              />
            </div>
          </section>

          {/* ── Redes sociais ── */}
          <section className="fade-up delay-2">
            <p className="section-label">{"Redes sociais"}</p>
            <div className="social-grid">
              <SocialPill
                href={socialLinks.instagram}
                icon={<IcoInstagram s={22} />}
                label="Instagram"
                cls="social-pill-ig"
              />
              <SocialPill
                href={socialLinks.facebook}
                icon={<IcoFacebook s={22} />}
                label="Facebook"
                cls="social-pill-fb"
              />
              <SocialPill
                href={socialLinks.linkedin}
                icon={<IcoLinkedIn s={22} />}
                label="LinkedIn"
                cls="social-pill-li"
              />
              <SocialPill
                href={socialLinks.whatsapp}
                icon={<IcoWhatsApp s={22} />}
                label="WhatsApp"
                cls="social-pill-wa"
              />
            </div>
          </section>

          {/* ── Contato ── */}
          <section className="fade-up delay-3">
            <p className="section-label">{"Contato direto"}</p>
            <div
              className="glass"
              style={{
                borderRadius: "var(--radius)",
                padding: "4px 0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ContactRow
                href={`mailto:${socialLinks.email}`}
                icon={<IcoEmail s={18} />}
                label="E-mail comercial"
                sub={socialLinks.email}
              />
              <ContactRow
                href={socialLinks.whatsapp}
                icon={<IcoWhatsApp s={18} />}
                label="WhatsApp"
                sub="Atendimento direto"
                isLast
              />
            </div>
          </section>

          {/* ── Footer ── */}
          <footer
            className="fade-up delay-4"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
              paddingTop: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--border-strong), transparent)",
                marginBottom: 2,
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                letterSpacing: "0.03em",
              }}
            >
              {"© 2026 Grupo SJ · Todos os direitos reservados"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--muted-foreground)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {"Movimento que impulsiona crescimento"}
            </p>

            <button
              type="button"
              onClick={() => {
                setHasOpenedAdmin(true)
                setIsAdminOpen(true)
              }}
              style={{
                marginTop: 10,
                padding: "6px 14px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)"
                e.currentTarget.style.color = "var(--foreground)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                e.currentTarget.style.color = "var(--muted-foreground)"
              }}
            >
              🔒 Painel Admin & Métricas
            </button>
          </footer>
        </div>
      </div>

      {/* Modal Suspenso (Drawer) de Lojas */}
      {activeStore && (
        <StoreDrawerModal
          data={activeStore}
          onClose={() => setActiveStore(null)}
        />
      )}

      {(hasOpenedLeadModal || hasOpenedAdmin) && (
        <Suspense fallback={null}>
          {/* Modal de Captura de Leads */}
          {hasOpenedLeadModal && (
            <LeadModal
              isOpen={isLeadModalOpen}
              onClose={() => setIsLeadModalOpen(false)}
            />
          )}

          {/* Modal do Painel Administrativo & Métricas */}
          {hasOpenedAdmin && (
            <AdminDashboard
              isOpen={isAdminOpen}
              onClose={() => setIsAdminOpen(false)}
              onLinksUpdated={refreshLinks}
            />
          )}
        </Suspense>
      )}
    </ErrorBoundary>
  )
}
