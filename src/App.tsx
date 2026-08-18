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
  getStoredTikTokStoreLinks,
  getStoredSocialLinks,
  getMLStoreLinks,
  getShopeeStoreLinks,
  getTikTokStoreLinks,
  getSocialLinks,
  type StoreLink,
  type SocialLinks,
  DEFAULT_SOCIAL_LINKS,
} from "./services/storeService"
import grupoSjLogo from "./imports/grupo-sj-logo.png"

const LeadModal = lazy(() => import("./components/LeadModal"))
const DashboardPortal = lazy(() => import("./components/DashboardPortal"))

import { SocialPill } from "./components/SocialPill"
import { ContactRow } from "./components/ContactRow"
import { StoreCardTrigger } from "./components/StoreCardTrigger"
import { StoreDrawerModal, StoreModalData } from "./components/StoreDrawerModal"
import {
  IcoML,
  IcoShopee,
  IcoTikTok,
  IcoInstagram,
  IcoFacebook,
  IcoYouTube,
  IcoWhatsApp,
  IcoEmail,
  IcoShield,
  IcoArrow
} from "./components/Icons"

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

// ─── Ambient background ───────────────────────────────────────────────────────

function Background() {
  return <div aria-hidden className="ambient-background" />
}

// ─── Store Trigger Card & Drawer Modal ───────────────────────────────────────



// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener("popstate", handleLocationChange)
    return () => window.removeEventListener("popstate", handleLocationChange)
  }, [])

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const [activeStore, setActiveStore] = useState<StoreModalData | null>(null)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [hasOpenedLeadModal, setHasOpenedLeadModal] = useState(false)

  const [mlLojas, setMlLojas] = useState<StoreLink[]>([])
  const [shopeeLojas, setShopeeLojas] = useState<StoreLink[]>([])
  const [tiktokLojas, setTiktokLojas] = useState<StoreLink[]>([])
  const [socialLinks, setSocialLinks] =
    useState<SocialLinks>(DEFAULT_SOCIAL_LINKS)

  const refreshLocalLinks = () => {
    setMlLojas(getStoredMLStoreLinks())
    setShopeeLojas(getStoredShopeeStoreLinks())
    setTiktokLojas(getStoredTikTokStoreLinks())
    setSocialLinks(getStoredSocialLinks())
  }

  const refreshCloudLinks = async () => {
    try {
      const [ml, sp, tt, sc] = await Promise.all([
        getMLStoreLinks(),
        getShopeeStoreLinks(),
        getTikTokStoreLinks(),
        getSocialLinks(),
      ])
      setMlLojas(ml)
      setShopeeLojas(sp)
      setTiktokLojas(tt)
      setSocialLinks(sc)
    } catch (e) {
      console.warn("Error reloading links from cloud:", e)
    }
  }

  const refreshLinks = async () => {
    refreshLocalLinks()
    await refreshCloudLinks()
  }

  useEffect(() => {
    refreshLocalLinks()
    // Non-blocking background sync for fresh cloud links
    const syncTimeout = window.setTimeout(() => {
      void refreshCloudLinks()
    }, 150)

    return () => window.clearTimeout(syncTimeout)
  }, [])

  if (currentPath === "/dashboard" || currentPath === "/admin") {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                color: "#f2f0ea",
                background: "#0b0b0d",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              Carregando Painel Administrativo...
            </div>
          }
        >
          <DashboardPortal navigateBack={() => navigateTo("/")} />
        </Suspense>
      </ErrorBoundary>
    )
  }

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
                icon={<IcoML s={40} />}
                name="Mercado Livre"
                subtitle={mlLojas.length === 1 ? "1 loja oficial" : `${mlLojas.length} lojas oficiais`}
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
                icon={<IcoShopee s={40} />}
                name="Shopee"
                subtitle={shopeeLojas.length === 1 ? "1 loja oficial" : `${shopeeLojas.length} lojas oficiais`}
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
              <StoreCardTrigger
                icon={<IcoTikTok s={36} />}
                name="TikTok"
                subtitle={tiktokLojas.length === 1 ? "1 loja oficial" : `${tiktokLojas.length} lojas oficiais`}
                cls="store-card-tt"
                iconBg="rgba(254,44,85,0.18)"
                onClick={() => {
                  recordClick("btn_tt_stores", "TikTok Modal Open", "TikTok")
                  setActiveStore({
                    name: "TikTok",
                    subtitle: "Lojas oficiais no TikTok",
                    icon: <IcoTikTok s={34} />,
                    iconBg: "rgba(254,44,85,0.18)",
                    tagColor: "#fe2c55",
                    category: "TikTok",
                    lojas: tiktokLojas,
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
                href={socialLinks.youtube}
                icon={<IcoYouTube s={22} />}
                label="YouTube"
                cls="social-pill-yt"
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
                navigateTo("/dashboard")
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

      {hasOpenedLeadModal && (
        <Suspense fallback={null}>
          {/* Modal de Captura de Leads */}
          <LeadModal
            isOpen={isLeadModalOpen}
            onClose={() => setIsLeadModalOpen(false)}
          />
        </Suspense>
      )}
    </ErrorBoundary>
  )
}
