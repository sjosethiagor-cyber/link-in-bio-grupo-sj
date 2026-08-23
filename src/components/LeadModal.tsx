import { useState, useEffect } from "react"
import { saveLead } from "../services/storeService"
import { LeadChatbot } from "./LeadChatbot"

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
}

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const [viewMode, setViewMode] = useState<"chat" | "form">("chat")
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const [formError, setFormError] = useState<string | null>(null)
  // Anti-bot honeypot and timing
  const [honeypot, setHoneypot] = useState("")
  const [modalOpenTime, setModalOpenTime] = useState<number>(Date.now())

  useEffect(() => {
    if (isOpen) {
      setModalOpenTime(Date.now())
      setHoneypot("")
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Honeypot check: If filled, quietly reject bot
    if (honeypot.trim().length > 0) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
      return
    }

    // Bot submission speed check (must take at least 1.5 seconds)
    if (Date.now() - modalOpenTime < 1500) {
      setFormError("Por favor, preencha as informações com calma.")
      return
    }

    // Rate Limiting Cooldown (15 seconds)
    const lastSubmit = sessionStorage.getItem("grupo_sj_last_lead_submit")
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < 15000) {
      setFormError(
        "Por favor, aguarde alguns segundos antes de enviar outra solicitação.",
      )
      return
    }

    const trimmedName = name.trim()
    const rawDigits = whatsapp.replace(/\D/g, "")
    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedName.length < 2) {
      setFormError("Por favor, insira o seu nome completo.")
      return
    }

    if (rawDigits.length < 10 || rawDigits.length > 11) {
      setFormError("Por favor, insira um número de WhatsApp válido com DDD.")
      return
    }

    // RFC-compliant email regex
    if (
      trimmedEmail &&
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
        trimmedEmail,
      )
    ) {
      setFormError("Por favor, insira um endereço de e-mail válido.")
      return
    }

    setLoading(true)
    try {
      await saveLead({
        name: trimmedName,
        whatsapp,
        email: trimmedEmail,
        message: message.trim() || "Solicitação de contato via Link na Bio",
      })
      sessionStorage.setItem("grupo_sj_last_lead_submit", Date.now().toString())
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setName("")
        setWhatsapp("")
        setEmail("")
        setMessage("")
        onClose()
      }, 2000)
    } catch (err) {
      console.error(err)
      setFormError(
        "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="store-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Solicitar Orçamento"
    >
      <div
        className="store-drawer-panel"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unified Clean Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Top Row: Avatar + Title & Badge in 1 straight line + Mode Tabs + Close Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {/* Left: Avatar + Title in one straight line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff7a59, #e8451f)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                    boxShadow: "0 3px 10px rgba(232, 69, 31, 0.35)",
                  }}
                >
                  SJ
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    border: "2px solid #0f172a",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Assistente Loja SJ
                </h3>
              </div>
            </div>

            {/* Right: Mode Tabs + Close Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: 2,
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("chat")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background:
                      viewMode === "chat"
                        ? "linear-gradient(135deg, #e8451f, #ff7a59)"
                        : "transparent",
                    color:
                      viewMode === "chat" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                    boxShadow:
                      viewMode === "chat"
                        ? "0 2px 8px rgba(232, 69, 31, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("form")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background:
                      viewMode === "form"
                        ? "linear-gradient(135deg, #e8451f, #ff7a59)"
                        : "transparent",
                    color:
                      viewMode === "form" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                    boxShadow:
                      viewMode === "form"
                        ? "0 2px 8px rgba(232, 69, 31, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Formulário
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sub Row: Info in one single straight line with address and working hours */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--muted-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              paddingLeft: 46,
              marginTop: -2,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 7px",
                borderRadius: 6,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#34d399",
                fontSize: 10,
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.25)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "#34d399",
                  display: "inline-block",
                }}
              />
              09h às 17h
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 11,
                color: "var(--muted-foreground)",
              }}
            >
              Av. Portugal, 6759 · Umuarama - PR
            </span>
          </div>
        </div>

        {/* Content */}
        {viewMode === "chat" ? (
          <div style={{ paddingTop: 10 }}>
            <LeadChatbot
              onClose={onClose}
              onSwitchToForm={() => setViewMode("form")}
            />
          </div>
        ) : success ? (
          <div style={{ padding: "36px 12px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(37, 211, 102, 0.15)",
                color: "#25D366",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 16px",
              }}
            >
              ✓
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
              Solicitação Enviada!
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--muted-foreground)",
              }}
            >
              Obrigado! Entraremos em contato via WhatsApp em breve.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              paddingTop: 18,
            }}
          >
            {/* Honeypot field for bot/crawler spam protection */}
            <div
              aria-hidden="true"
              style={{
                opacity: 0,
                position: "absolute",
                top: 0,
                left: 0,
                height: 0,
                width: 0,
                zIndex: -1,
                pointerEvents: "none",
              }}
            >
              <input
                type="text"
                name="user_website_trap"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            {formError && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(238, 77, 45, 0.12)",
                  border: "1px solid rgba(238, 77, 45, 0.3)",
                  color: "#EE4D2D",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ⚠️ {formError}
              </div>
            )}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "var(--foreground)",
                }}
              >
                Nome completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "var(--foreground)",
                }}
              >
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "var(--foreground)",
                }}
              >
                E-mail (Opcional)
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "var(--foreground)",
                }}
              >
                Como podemos ajudar?
              </label>
              <textarea
                rows={3}
                placeholder="Descreva o produto ou linha de interesse..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "#e8451f",
                color: "#ffffff",
                border: "none",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                marginTop: 6,
                boxShadow: "0 8px 24px rgba(232, 69, 31, 0.3)",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
            >
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
