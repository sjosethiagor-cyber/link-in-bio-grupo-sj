import { useState, useEffect, useRef } from "react"
import { saveLead, getStoredSocialLinks } from "../services/storeService"
import { IcoWhatsApp, IcoArrow } from "./Icons"

interface LeadChatbotProps {
  onClose: () => void
  onSwitchToForm: () => void
}

interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: number
  chips?: { label: string; action: () => void }[]
}

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function LeadChatbot({ onClose, onSwitchToForm }: LeadChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep] = useState<
    "welcome" | "interest" | "name" | "whatsapp" | "details" | "completed"
  >("welcome")

  // Collected Lead data
  const [leadData, setLeadData] = useState({
    interest: "",
    name: "",
    whatsapp: "",
    details: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initial welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "msg_1",
          sender: "bot",
          text: "Olá! 👋 Seja bem-vindo(a) ao Grupo SJ. Eu sou o seu assistente virtual.",
          timestamp: Date.now(),
        },
        {
          id: "msg_2",
          sender: "bot",
          text: "Como posso ajudar você hoje?",
          timestamp: Date.now() + 50,
          chips: [
            {
              label: "⚡ Solicitar Orçamento",
              action: () => handleSelectOption("Solicitar Orçamento", "orcamento"),
            },
            {
              label: "📦 Comprar Produtos",
              action: () => handleSelectOption("Comprar Produtos", "produtos"),
            },
            {
              label: "💬 Falar com Vendedor",
              action: () => handleSelectOption("Falar com Vendedor", "vendedor"),
            },
            {
              label: "🏬 Dúvidas sobre Lojas / Envio",
              action: () => handleSelectOption("Dúvidas sobre Lojas / Envio", "lojas"),
            },
          ],
        },
      ])
      setStep("interest")
    }, 400)

    return () => clearTimeout(timer)
  }, [])

  const botReply = (
    text: string,
    chips?: { label: string; action: () => void }[],
    delay = 600,
  ) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_" + Date.now() + Math.random(),
          sender: "bot",
          text,
          timestamp: Date.now(),
          chips,
        },
      ])
    }, delay)
  }

  const handleSelectOption = (label: string, categoryKey: string) => {
    // User response
    setMessages((prev) => [
      ...prev,
      {
        id: "msg_" + Date.now(),
        sender: "user",
        text: label,
        timestamp: Date.now(),
      },
    ])

    if (step === "interest" || step === "welcome") {
      setLeadData((prev) => ({ ...prev, interest: label }))

      if (categoryKey === "orcamento" || categoryKey === "produtos") {
        botReply(
          "Perfeito! Qual é a categoria principal dos itens que você procura?",
          [
            {
              label: "🛡️ Impermeabilizantes & Químicos",
              action: () => handleSelectProductCategory("Impermeabilizantes & Químicos"),
            },
            {
              label: "🎨 Tintas & Complementos",
              action: () => handleSelectProductCategory("Tintas & Complementos"),
            },
            {
              label: "🔧 Ferragens & Ferramentas",
              action: () => handleSelectProductCategory("Ferragens & Ferramentas"),
            },
            {
              label: "💡 Materiais de Construção / Elétrica",
              action: () => handleSelectProductCategory("Materiais de Construção / Elétrica"),
            },
            {
              label: "Outros itens gerais",
              action: () => handleSelectProductCategory("Outros itens gerais"),
            },
          ],
        )
      } else {
        botReply("Excelente! Para iniciarmos seu atendimento exclusivo, qual é o seu nome?")
        setStep("name")
      }
    }
  }

  const handleSelectProductCategory = (cat: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: "msg_" + Date.now(),
        sender: "user",
        text: cat,
        timestamp: Date.now(),
      },
    ])
    setLeadData((prev) => ({ ...prev, interest: `${prev.interest} - ${cat}` }))
    botReply("Ótima escolha! Para prepararmos as melhores condições, qual é o seu nome completo?")
    setStep("name")
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setInputValue("")

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: "msg_" + Date.now(),
        sender: "user",
        text: trimmed,
        timestamp: Date.now(),
      },
    ])

    if (step === "name") {
      setLeadData((prev) => ({ ...prev, name: trimmed }))
      botReply(
        `Muito prazer, ${trimmed}! 👋\nQual é o seu número de WhatsApp com DDD para enviarmos as propostas e detalhes?`,
      )
      setStep("whatsapp")
    } else if (step === "whatsapp") {
      const raw = trimmed.replace(/\D/g, "")
      if (raw.length < 10 || raw.length > 11) {
        botReply(
          "⚠️ Por favor, digite um número de WhatsApp válido com DDD (ex: 11 99999-9999).",
        )
        return
      }

      setLeadData((prev) => ({ ...prev, whatsapp: formatWhatsApp(trimmed) }))
      botReply(
        "Gostaria de detalhar quantidades, produtos específicos ou deixar alguma observação?",
        [
          {
            label: "👍 Pode enviar assim mesmo!",
            action: () => finalizeLead(trimmed, "Solicitação direta via Chatbot"),
          },
        ],
      )
      setStep("details")
    } else if (step === "details") {
      finalizeLead(leadData.whatsapp, trimmed)
    } else {
      // General question fallback
      botReply("Entendi! Vamos direcionar essa informação para a nossa equipe comercial.")
    }
  }

  const finalizeLead = async (phone: string, detailsText: string) => {
    setIsSaving(true)
    setIsTyping(true)

    const finalLead = {
      name: leadData.name || "Cliente Interessado",
      whatsapp: phone || leadData.whatsapp,
      email: "",
      message: `Interesse: ${leadData.interest} | Detalhes: ${detailsText}`,
    }

    try {
      await saveLead(finalLead)
      setIsSaving(false)
      setIsTyping(false)
      setStep("completed")

      setMessages((prev) => [
        ...prev,
        {
          id: "msg_final",
          sender: "bot",
          text: `Perfeito, ${finalLead.name}! 🎉 Seu atendimento foi registrado com sucesso em nosso sistema comercial.`,
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      console.error(err)
      setIsSaving(false)
      setIsTyping(false)
      botReply("Houve uma instabilidade ao salvar, mas você pode nos chamar direto pelo WhatsApp!")
      setStep("completed")
    }
  }

  const social = getStoredSocialLinks()
  const rawWa = (social.whatsapp || "5511999999999").replace(/\D/g, "")
  const waMsg = encodeURIComponent(
    `Olá Grupo SJ! Me chamo ${leadData.name || "Cliente"} e iniciei um contato pelo site.\nInteresse: ${leadData.interest || "Geral"}\nWhatsApp: ${leadData.whatsapp}`,
  )
  const waUrl = `https://wa.me/${rawWa}?text=${waMsg}`

  return (
    <div className="flex flex-col h-[460px] max-h-[75vh] w-full bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-700/50">
      {/* Bot Chat Header Info */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff7a59] to-[#e8451f] flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              SJ
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-100">Assistente Grupo SJ</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Atendimento e Orçamentos Rápidos</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToForm}
          className="text-[11px] text-[#ff7a59] hover:underline font-bold bg-[#e8451f]/10 border border-[#e8451f]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          📝 Formulário
        </button>
      </div>

      {/* Messages Scrollable Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-[#e8451f] to-[#ff7a59] text-white rounded-br-none"
                  : "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-none"
              }`}
            >
              {m.text.split("\n").map((line, idx) => (
                <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              ))}
            </div>

            {/* Quick Action Chips */}
            {m.chips && m.chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                {m.chips.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={chip.action}
                    className="text-[11px] font-bold bg-slate-800 hover:bg-[#e8451f]/20 hover:border-[#e8451f]/40 hover:text-white text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 text-slate-400 px-3 py-2 rounded-2xl rounded-bl-none w-fit text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        {/* Completed Stage Buttons */}
        {step === "completed" && (
          <div className="flex flex-col gap-2 mt-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl animate-fadeIn">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
            >
              <IcoWhatsApp s={16} />
              <span>Continuar no WhatsApp Agora</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white py-1 font-bold transition-colors cursor-pointer"
            >
              Fechar atendimento
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {step !== "completed" && (
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 bg-slate-800/90 border-t border-slate-700/60 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type={step === "whatsapp" ? "tel" : "text"}
            placeholder={
              step === "name"
                ? "Digite seu nome..."
                : step === "whatsapp"
                  ? "Digite seu WhatsApp (DDD)..."
                  : step === "details"
                    ? "Observação ou itens desejados..."
                    : "Digite sua mensagem..."
            }
            value={step === "whatsapp" ? formatWhatsApp(inputValue) : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSaving || isTyping}
            className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e8451f] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSaving || isTyping}
            className="bg-gradient-to-r from-[#e8451f] to-[#ff7a59] disabled:opacity-40 hover:opacity-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Enviar</span>
            <IcoArrow s={12} />
          </button>
        </form>
      )}
    </div>
  )
}
