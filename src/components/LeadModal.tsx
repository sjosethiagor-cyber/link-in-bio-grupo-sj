import { useState, useEffect } from "react"
import { saveLead } from "../services/storeService"

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
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 99,
                background: "rgba(232, 69, 31, 0.15)",
                color: "#e8451f",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Atendimento Especial
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: "var(--foreground)",
              }}
            >
              Solicitar Orçamento
            </h3>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: "var(--muted-foreground)",
              }}
            >
              Preencha os dados abaixo e nossa equipe entrará em contato.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {success ? (
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
