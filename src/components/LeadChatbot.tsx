import { useState, useEffect, useRef } from "react"
import {
  saveLead,
  updateLeadDetails,
  type LeadUnit,
} from "../services/storeService"
import {
  SJ_STORE_INFO,
  WA_LINKS,
  buildWhatsAppLink,
  querySJKnowledge,
} from "../services/sjKnowledgeBase"
import { IcoWhatsApp, IcoArrow } from "./Icons"

interface LeadChatbotProps {
  onClose: () => void
  onSwitchToForm: () => void
  initialUnit?: LeadUnit | null
  onUnitChange?: (unit: LeadUnit | null) => void
}

interface ActionChip {
  label: string
  desc?: string
  icon?: string
  action?: () => void
  url?: string
  actionId?: string
}

export interface ChatProductCard {
  id: string
  name: string
  category: string
  subtitle: string
  rendimento?: string
  color?: string
  coverUrl?: string
  actionLabel?: string
  onAction?: () => void
  directWaUrl?: string
}

interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: number
  chips?: ActionChip[]
  productCards?: ChatProductCard[]
}

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function LeadChatbot({
  onClose,
  onSwitchToForm,
  initialUnit,
  onUnitChange,
}: LeadChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<LeadUnit | null>(
    initialUnit || null,
  )

  useEffect(() => {
    if (initialUnit !== undefined && initialUnit !== selectedUnit) {
      setSelectedUnit(initialUnit)
    }
  }, [initialUnit])

  // Step state
  const [step, setStep] =
    useState<
      | "welcome"
      | "select_unit"
      | "chat"
      | "collect_name"
      | "collect_whatsapp"
      | "collect_bairro"
      | "collect_quantity"
      | "completed"
    >("welcome")

  // Lead structured data
  const [leadData, setLeadData] = useState<{
    name: string
    whatsapp: string
    product: string
    quantity: string
    modalidade: "Entrega" | "Retirada" | "Atendimento Geral"
    bairro: string
    observacao: string
  }>({
    name: "",
    whatsapp: "",
    product: "",
    quantity: "",
    modalidade: "Atendimento Geral",
    bairro: "",
    observacao: "",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)
  const currentLeadIdRef = useRef<string | null>(null)
  const isFinalizingRef = useRef(false)
  const hasCollectedContactRef = useRef(false)
  const pendingQueryRef = useRef<string | null>(null)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  // Helper para resposta do bot com typing delay
  const botReply = (
    text: string,
    chips?: ActionChip[],
    cards?: ChatProductCard[],
    delay = 450,
  ) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    setIsTyping(true)
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_" + Date.now() + Math.random(),
          sender: "bot",
          text,
          timestamp: Date.now(),
          chips,
          productCards: cards,
        },
      ])
    }, delay)
  }

  const requireContactThen = (action: () => void, contextName?: string) => {
    if (hasCollectedContactRef.current) {
      action()
      return
    }
    pendingActionRef.current = action
    if (contextName) {
      setLeadData((prev) => ({ ...prev, product: contextName }))
    }
    if (!leadData.name) {
      botReply(
        "Para iniciarmos seu atendimento personalizado e prepararmos os detalhes para você, qual é o seu nome completo?",
      )
      setStep("collect_name")
    } else if (!leadData.whatsapp) {
      botReply(
        `Muito prazer, ${leadData.name}! 👋 Qual é o seu WhatsApp com DDD para registrarmos seu atendimento?`,
      )
      setStep("collect_whatsapp")
    }
  }

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: "user_" + Date.now(),
        sender: "user",
        text,
        timestamp: Date.now(),
      },
    ])
  }

  // 1. Menu Inicial - Direcionamento de Empresa (Loja SJ vs SJ Distribuidora)
  const getInitialChips = (): ActionChip[] => [
    {
      label: "🖨️ Loja SJ",
      desc: "Impressoras 3D, Filamentos, Peças & Manutenções",
      icon: "🖨️",
      action: () => handleSelectUnit("Loja SJ"),
    },
    {
      label: "🎨 SJ Distribuidora",
      desc: "Tintas, Impermeabilizantes, Selantes, Pedras Naturais & Grafiato",
      icon: "🎨",
      action: () => handleSelectUnit("SJ Distribuidora"),
    },
  ]

  const handleSelectUnit = (unit: LeadUnit) => {
    setSelectedUnit(unit)
    onUnitChange?.(unit)
    addUserMessage(unit === "Loja SJ" ? "🖨️ Loja SJ" : "🎨 SJ Distribuidora")

    if (unit === "Loja SJ") {
      setLeadData((prev) => ({
        ...prev,
        product: prev.product || "Loja SJ (Impressão 3D e Filamentos)",
      }))
      botReply(
        "Perfeito! Você está no atendimento da **Loja SJ** 🖨️.\n\nSomos especialistas em Impressoras 3D (Bambu Lab), Filamentos (Maxprint e Bambu Lab com grande variedade de cores), peças de reposição e manutenção técnica.\n\nPara iniciarmos seu atendimento personalizado ou tirar dúvidas, como posso te chamar? (Digite seu nome abaixo ou escolha uma opção):",
        getLojaSJChips(),
      )
    } else {
      setLeadData((prev) => ({
        ...prev,
        product: prev.product || "SJ Distribuidora (Tintas e Obras)",
      }))
      botReply(
        "Excelente! Você está no atendimento da **SJ Distribuidora** 🎨.\n\nTrabalhamos com linhas completas de Tintas, Impermeabilizantes (Blindamix e Maximper), Argamassas Poliméricas (Cola Bloco), Selantes, Pedras Naturais e Grafiato.\n\nPara iniciarmos seu atendimento personalizado ou orçamentos, como posso te chamar? (Digite seu nome abaixo ou escolha uma opção):",
        getSJDistribuidoraChips(),
      )
    }
    setStep(hasCollectedContactRef.current ? "chat" : "collect_name")
  }

  const handleSwitchCompany = () => {
    setSelectedUnit(null)
    onUnitChange?.(null)
    addUserMessage("🔄 Trocar Empresa")
    botReply(
      "É sobre impressoras ou vai ser a parte de tintas e impermeabilizantes?\n*(Loja SJ ou SJ Distribuidora?)*",
      getInitialChips(),
    )
    setStep("select_unit")
  }

  const getLojaSJChips = (): ActionChip[] => [
    {
      label: "⚡ Solicitar Orçamento 3D",
      action: () => {
        addUserMessage("Solicitar Orçamento 3D")
        requireContactThen(() => {
          botReply(
            "Com certeza! Qual item você gostaria de orçar na Loja SJ?",
            [
              {
                label: "🖨️ Impressoras Bambu Lab",
                action: () => handleBambuLabFlow(),
              },
              {
                label: "🧵 Filamentos (Maxprint & Bambu Lab)",
                action: () => handleFilamentoFlow(),
              },
              {
                label: "🔧 Peças e Manutenção",
                action: () => handlePecasFlow(),
              },
              {
                label: "🏠 Utilidades 3D (Vumora)",
                action: () => handleUtilidadesFlow(),
              },
            ],
          )
        }, "Orçamento Loja SJ (3D)")
      },
    },
    {
      label: "🖨️ Impressoras Bambu Lab",
      action: () => handleBambuLabFlow(),
    },
    {
      label: "🧵 Filamentos (Maxprint & Bambu Lab - Várias Cores)",
      action: () => handleFilamentoFlow(),
    },
    {
      label: "🔧 Peças e Manutenção Técnica",
      action: () => handlePecasFlow(),
    },
    {
      label: "💬 Falar com Especialista 3D",
      action: () => {
        addUserMessage("Falar com Especialista 3D")
        requireContactThen(() => {
          botReply(
            "Nosso atendimento comercial de impressão 3D funciona das 09h às 17h. Deseja falar com um especialista no WhatsApp?",
            [
              {
                label: "💬 FALAR NO WHATSAPP COM ESPECIALISTA 3D",
                url: WA_LINKS.produto("Impressão 3D e Filamentos", "duvida"),
              },
              {
                label: "🔎 Continuar no Chatbot",
                action: () => showInitialMenu(true),
              },
            ],
          )
        }, "Falar com Especialista 3D")
      },
    },
    {
      label: "🔄 Trocar para SJ Distribuidora",
      action: () => handleSwitchCompany(),
    },
  ]

  const getSJDistribuidoraChips = (): ActionChip[] => [
    {
      label: "⚡ Solicitar Orçamento de Obra",
      action: () => {
        addUserMessage("Solicitar Orçamento de Obra")
        requireContactThen(() => {
          botReply(
            "Com certeza! Para qual solução da SJ Distribuidora você precisa de orçamento?",
            [
              {
                label: "🛡️ Impermeabilizantes",
                action: () => handleImpermeabilizacaoFlow(),
              },
              {
                label: "🎨 Tintas e Revestimentos",
                action: () => handleTintasFlow(),
              },
              {
                label: "💎 Pedras Naturais & Grafiato",
                action: () => handlePedrasGrafiatoFlow(),
              },
              {
                label: "🧱 Argamassa / Cola Bloco",
                action: () => handleColaBlocoFlow(),
              },
              {
                label: "🔧 Linha Técnica Würth",
                action: () => handleWurthFlow(),
              },
            ],
          )
        }, "Orçamento SJ Distribuidora (Obra)")
      },
    },
    {
      label: "🛡️ Impermeabilizantes (Lajes e Piscinas)",
      action: () => handleImpermeabilizacaoFlow(),
    },
    {
      label: "🎨 Tintas, Pedras Naturais & Grafiato",
      action: () => handleTintasFlow(),
    },
    {
      label: "🧱 Argamassa Polimérica / Cola Bloco",
      action: () => handleColaBlocoFlow(),
    },
    {
      label: "🚚 Entrega e Retirada",
      action: () => handleEntregaRetiradaFlow(),
    },
    {
      label: "💬 Falar com Vendedor Técnico",
      action: () => {
        addUserMessage("Falar com Vendedor Técnico")
        requireContactThen(() => {
          botReply(
            "Nosso atendimento comercial da SJ Distribuidora funciona das 09h às 17h. Deseja continuar com um vendedor pelo WhatsApp?",
            [
              {
                label: "💬 CONTINUAR NO WHATSAPP COM VENDEDOR",
                url: WA_LINKS.falarComVendedor,
              },
              {
                label: "🔎 Continuar no Chatbot",
                action: () => showInitialMenu(true),
              },
            ],
          )
        }, "Falar com Vendedor Técnico")
      },
    },
    {
      label: "🔄 Trocar para Loja SJ",
      action: () => handleSwitchCompany(),
    },
  ]

  // Menu de Categorias (exibido apenas quando solicitado)
  const handleBrowseCategories = () => {
    addUserMessage("Conhecer Produtos e Linhas")
    if (selectedUnit === "Loja SJ") {
      botReply(
        "Trabalhamos com impressoras 3D, filamentos, peças de reposição e utilidades. Qual linha você tem interesse em ver?",
        [
          {
            label: "🖨️ Impressoras Bambu Lab",
            action: () => handleBambuLabFlow(),
          },
          {
            label: "🧵 Filamentos (Maxprint & Bambu Lab)",
            action: () => handleFilamentoFlow(),
          },
          {
            label: "🔧 Peças de Manutenção",
            action: () => handlePecasFlow(),
          },
          {
            label: "🏠 Utilidades para Casa",
            action: () => handleUtilidadesFlow(),
          },
          {
            label: "🔄 Trocar para SJ Distribuidora",
            action: () => handleSwitchCompany(),
          },
        ],
      )
    } else if (selectedUnit === "SJ Distribuidora") {
      botReply(
        "Trabalhamos com diversas soluções para obras, reformas e impermeabilização. Qual categoria você tem interesse em ver?",
        [
          {
            label: "🛡️ Impermeabilização",
            action: () => handleImpermeabilizacaoFlow(),
          },
          {
            label: "🎨 Tintas e Revestimentos",
            action: () => handleTintasFlow(),
          },
          {
            label: "💎 Pedras Naturais & Grafiato",
            action: () => handlePedrasGrafiatoFlow(),
          },
          {
            label: "🧱 Cola Bloco e Construção",
            action: () => handleColaBlocoFlow(),
          },
          {
            label: "🔧 Produtos Würth",
            action: () => handleWurthFlow(),
          },
          {
            label: "🔄 Trocar para Loja SJ",
            action: () => handleSwitchCompany(),
          },
        ],
      )
    } else {
      botReply(
        "Para te apresentar o catálogo correto, com qual das nossas empresas você gostaria de falar?",
        getInitialChips(),
      )
      setStep("select_unit")
    }
  }

  const showInitialMenu = (isReset = false) => {
    isFinalizingRef.current = false
    if (selectedUnit) {
      const activeUnit = selectedUnit
      const welcomeText = isReset
        ? `Você está no atendimento da **${activeUnit === "Loja SJ" ? "Loja SJ 🖨️" : "SJ Distribuidora 🎨"}**.\n\nComo posso ajudar você agora? (Digite sua dúvida ou escolha uma opção):`
        : `Olá! 👋 Bem-vindo ao setor da **${activeUnit === "Loja SJ" ? "Loja SJ 🖨️" : "SJ Distribuidora 🎨"}**.\n\nComo posso te ajudar hoje? (Digite seu nome abaixo ou escolha uma opção):`

      const chips =
        activeUnit === "Loja SJ"
          ? getLojaSJChips()
          : getSJDistribuidoraChips()

      if (isReset) {
        botReply(welcomeText, chips, undefined, 250)
        setStep("chat")
      } else {
        setIsTyping(false)
        setMessages([
          {
            id: "welcome_init",
            sender: "bot",
            text: welcomeText,
            timestamp: Date.now(),
            chips,
          },
        ])
        setStep(hasCollectedContactRef.current ? "chat" : "collect_name")
      }
    } else {
      const welcomeText =
        "Olá! 👋 Seja muito bem-vindo ao **Grupo SJ**!\n\n**É sobre impressoras ou vai ser a parte de tintas e impermeabilizantes?**\n*(Loja SJ ou SJ Distribuidora?)*"
      const initialChips = getInitialChips()
      if (isReset) {
        botReply(welcomeText, initialChips, undefined, 250)
        setStep("select_unit")
      } else {
        setIsTyping(false)
        setMessages([
          {
            id: "welcome_init",
            sender: "bot",
            text: welcomeText,
            timestamp: Date.now(),
            chips: initialChips,
          },
        ])
        setStep("select_unit")
      }
    }
  }

  useEffect(() => {
    showInitialMenu(false)
  }, [])

  // ── FLUXOS ESPECÍFICOS DO MANUAL ──────────────────────────────────────────

  // Fluxo 1: Impermeabilização (Item 59)
  const handleImpermeabilizacaoFlow = () => {
    addUserMessage("Impermeabilização")
    botReply(
      "Trabalhamos com linhas de alto rendimento para lajes, piscinas, baldrames e muros. Onde você precisa aplicar?",
      [
        {
          label: "🏊 Piscina",
          action: () => handlePiscinaFlow(),
        },
        {
          label: "🏠 Laje / Telhado",
          action: () => {
            addUserMessage("Laje / Telhado")
            setLeadData((p) => ({
              ...p,
              product: "Kit Blindamix 18kg + Manta VP50 (Laje/Telhado)",
            }))
            botReply(
              "Para lajes e telhados expostos, o Kit Blindamix com Manta Estrutural VP50 é a solução definitiva contra trincas, vazamentos e batida de sol/chuva.",
              [
                {
                  label: "⚡ Solicitar Orçamento de Laje",
                  action: () =>
                    startLeadCapture("Kit Blindamix 18kg + Manta VP50 (Laje)"),
                },
                {
                  label: "💬 Falar com Vendas sobre Laje",
                  url: WA_LINKS.produto(
                    "Kit Blindamix 18kg + Manta Estrutural VP50 (Laje)",
                    "orcamento",
                  ),
                },
              ],
              [
                {
                  id: "blindamix-laje",
                  name: "Kit Blindamix 18kg + Manta VP50",
                  category: "Impermeabilização",
                  subtitle:
                    "Membrana líquida elástica com fibra estruturante para lajes e telhas",
                  rendimento: "Até 25 m² por demão",
                  actionLabel: "⚡ Orçar Kit Laje",
                  onAction: () =>
                    startLeadCapture("Kit Blindamix 18kg + Manta VP50 (Laje)"),
                  directWaUrl: WA_LINKS.produto(
                    "Kit Blindamix 18kg + Manta VP50 (Laje)",
                    "compra",
                  ),
                },
              ],
            )
          },
        },
        {
          label: "🧱 Parede / Muro",
          action: () => {
            addUserMessage("Parede / Muro")
            setLeadData((p) => ({
              ...p,
              product: "Tinta Emborrachada Blindamix (Parede/Muro)",
            }))
            botReply(
              "A Tinta Emborrachada Blindamix (1kg, 3,6kg e 18kg) é excelente para proteção hidrorrepelente e elástica de paredes e alvenaria externa contra batida de chuva.",
              [
                {
                  label: "⚡ Solicitar Orçamento",
                  action: () =>
                    startLeadCapture(
                      "Tinta Emborrachada Blindamix (Parede/Muro)",
                    ),
                },
                {
                  label: "SOLICITAR ORÇAMENTO NO WHATSAPP",
                  url: WA_LINKS.produto(
                    "Tinta Emborrachada Blindamix (Parede/Muro)",
                    "orcamento",
                  ),
                },
              ],
              [
                {
                  id: "blindamix-parede",
                  name: "Tinta Emborrachada Blindamix 18kg",
                  category: "Paredes & Muros",
                  subtitle:
                    "Proteção hidrorrepelente elástica que acompanha a dilatação da parede",
                  rendimento: "Até 100 m² por demão",
                  actionLabel: "⚡ Orçar Blindamix",
                  onAction: () =>
                    startLeadCapture(
                      "Tinta Emborrachada Blindamix (Parede/Muro)",
                    ),
                  directWaUrl: WA_LINKS.produto(
                    "Tinta Emborrachada Blindamix (Parede/Muro)",
                    "compra",
                  ),
                },
              ],
            )
          },
        },
        {
          label: "🪵 Trava Pedras Decorativas",
          action: () => {
            addUserMessage("Trava Pedras Decorativas")
            setLeadData((p) => ({ ...p, product: "Trava Pedras Maximper" }))
            botReply(
              "O Trava Pedras Maximper (1L, 5L e 18L) estabiliza e une pedras soltas em jardins e caminhos decorativos sem perder a drenagem.",
              [
                {
                  label: "⚡ Solicitar Orçamento Trava Pedras",
                  action: () => startLeadCapture("Trava Pedras Maximper"),
                },
                {
                  label: "FALAR COM VENDAS NO WHATSAPP",
                  url: WA_LINKS.produto("Trava Pedras Maximper", "compra"),
                },
              ],
              [
                {
                  id: "trava-pedras",
                  name: "Trava Pedras Maximper 5L",
                  category: "Jardins & Paisagismo",
                  subtitle:
                    "Fixador de pedras decorativas para caminhos, vasos e jardins",
                  rendimento: "3 a 5 sacos de 25kg de pedras",
                  actionLabel: "⚡ Orçar Trava Pedras",
                  onAction: () => startLeadCapture("Trava Pedras Maximper"),
                  directWaUrl: WA_LINKS.produto(
                    "Trava Pedras Maximper",
                    "compra",
                  ),
                },
              ],
            )
          },
        },
        {
          label: "🛡️ Outra Superfície",
          action: () => {
            addUserMessage("Outra Superfície")
            botReply(
              "Para confirmar a compatibilidade com essa superfície específica, vou precisar verificar com nosso atendimento comercial.",
              [
                {
                  label: "💬 Consultar Especialista no WhatsApp",
                  url: WA_LINKS.produto(
                    "Impermeabilização - Consulta de Superfície Específica",
                    "duvida",
                  ),
                },
              ],
            )
          },
        },
      ],
    )
  }

  // Fluxo Piscina (Item 60)
  const handlePiscinaFlow = () => {
    addUserMessage("Piscina")
    botReply("Sua piscina é de alvenaria ou fibra?", [
      {
        label: "🏊 Alvenaria",
        action: () => {
          addUserMessage("Alvenaria")
          setLeadData((p) => ({
            ...p,
            product: "Acqua Protect Blindamix (Piscina Alvenaria)",
          }))
          botReply(
            "Temos a Acqua Protect Blindamix, desenvolvida especificamente para piscinas de alvenaria.\n\nDeseja solicitar um orçamento ou tirar dúvidas com nosso setor de vendas?",
            [
              {
                label: "SOLICITAR ORÇAMENTO ACQUA PROTECT",
                url: WA_LINKS.produto(
                  "Acqua Protect Blindamix (Piscina de Alvenaria)",
                  "orcamento",
                ),
              },
              {
                label: "COMPRAR ACQUA PROTECT NO WHATSAPP",
                url: WA_LINKS.produto(
                  "Acqua Protect Blindamix (Piscina de Alvenaria)",
                  "compra",
                ),
              },
            ],
          )
        },
      },
      {
        label: "🏊 Fibra",
        action: () => {
          addUserMessage("Fibra")
          botReply(
            "A Acqua Protect não é recomendada para piscina de fibra. Ela é destinada exclusivamente a piscinas de alvenaria.\n\nPosso encaminhar você para nosso atendimento para verificar outra solução.",
            [
              {
                label: "FALAR COM ATENDENTE SOBRE PISCINA",
                url: WA_LINKS.produto(
                  "Impermeabilização para Piscina de Fibra",
                  "duvida",
                ),
              },
              {
                label: "🛡️ Ver outros produtos",
                action: () => showInitialMenu(true),
              },
            ],
          )
        },
      },
    ])
  }

  const handlePedrasGrafiatoFlow = () => {
    addUserMessage("Pedras Naturais & Grafiato")
    setLeadData((p) => ({
      ...p,
      product: "Textura Pedra Natural / Grafiato RevGold",
    }))
    botReply(
      "Trabalhamos com Textura de Pedra Natural RevGold (5 kg e 20 kg), Grafiato mineral e Primer de aderência para acabamento rústico sofisticado e impermeável em paredes, fachadas e muros.\n\nQual a metragem estimada da sua área?",
      [
        {
          label: "⚡ Solicitar Orçamento de Pedra Natural / Grafiato",
          action: () =>
            startLeadCapture("Textura Pedra Natural / Grafiato RevGold"),
        },
        {
          label: "💬 Falar com Vendedor Técnico no WhatsApp",
          url: WA_LINKS.produto(
            "Textura Pedra Natural e Grafiato RevGold",
            "orcamento",
          ),
        },
      ],
    )
  }

  // Fluxo 2: Tintas e Revestimentos (Itens 10, 18, 19, 20, 21, 61)
  const handleTintasFlow = () => {
    addUserMessage("Tintas e Revestimentos")
    botReply("Qual tipo de acabamento você procura?", [
      {
        label: "💎 Textura Pedra Natural & Grafiato (RevGold)",
        action: () => handlePedrasGrafiatoFlow(),
      },
      {
        label: "🚗 Tinta para Piso Emborrachada",
        action: () => {
          addUserMessage("Tinta para Piso Emborrachada")
          setLeadData((p) => ({
            ...p,
            product: "Tinta Piso Emborrachada Maximper",
          }))
          botReply(
            "A Tinta para Piso Emborrachada Premium Maximper (3,6 kg e 16 kg) possui acabamento antiderrapante e alta proteção para áreas externas (16 kg rende até ~90 m² por demão como referência).",
            [
              {
                label: "SOLICITAR ORÇAMENTO TINTA PISO",
                url: WA_LINKS.produto(
                  "Tinta Piso Emborrachada Premium Maximper",
                  "orcamento",
                ),
              },
              {
                label: "COMPRAR TINTA PISO NO WHATSAPP",
                url: WA_LINKS.produto(
                  "Tinta Piso Emborrachada Premium Maximper",
                  "compra",
                ),
              },
            ],
          )
        },
      },
      {
        label: "✨ Verniz Glitter / Resina Incolor",
        action: () => {
          addUserMessage("Verniz Glitter / Resina Incolor")
          setLeadData((p) => ({
            ...p,
            product: "Verniz Glitter / Resina Incolor RevGold",
          }))
          botReply(
            "Trabalhamos com Verniz Glitter Estrelado RevGold (900 ml e 3,6 L) para acabamento decorativo brilhante e Resina Incolor (3,6 kg) para proteção de superfícies.",
            [
              {
                label: "COMPRAR VERNIZ / RESINA NO WHATSAPP",
                url: WA_LINKS.produto(
                  "Verniz Glitter Estrelado / Resina Incolor RevGold",
                  "compra",
                ),
              },
              {
                label: "TIRAR DÚVIDAS NO WHATSAPP",
                url: WA_LINKS.produto(
                  "Verniz Glitter / Resina Incolor RevGold",
                  "duvida",
                ),
              },
            ],
          )
        },
      },
    ])
  }

  // Fluxo 3: Cola Bloco (Item 16, 17, 62)
  const handleColaBlocoFlow = () => {
    addUserMessage("Cola Bloco e Construção")
    botReply(
      "Temos Cola Bloco RevGold de 6 kg e 15 kg, além de kits com Aplicador Triangular Maximper. Qual tipo de bloco você vai assentar?",
      [
        {
          label: "🧱 Tijolo Cerâmico",
          action: () => finishColaBlocoChoice("Tijolo Cerâmico"),
        },
        {
          label: "🧱 Bloco de Concreto / Estrutural",
          action: () => finishColaBlocoChoice("Bloco de Concreto"),
        },
        {
          label: "🧱 Bloco Ecológico / Celular",
          action: () => finishColaBlocoChoice("Bloco Ecológico"),
        },
        {
          label: "🔺 Ver Aplicador Triangular",
          action: () => {
            addUserMessage("Aplicador Triangular")
            setLeadData((p) => ({
              ...p,
              product: "Aplicador Triangular Maximper",
            }))
            botReply(
              "O Aplicador Triangular Maximper foi desenvolvido para facilitar a aplicação da Cola Bloco e proporcionar acabamento uniforme. Disponível avulso ou em kits com a Cola Bloco RevGold.",
              [
                {
                  label: "SOLICITAR ORÇAMENTO DO KIT COLA BLOCO",
                  url: WA_LINKS.produto(
                    "Kit Cola Bloco RevGold + Aplicador Triangular Maximper",
                    "orcamento",
                  ),
                },
                {
                  label: "COMPRAR APLICADOR TRIANGULAR",
                  url: WA_LINKS.produto(
                    "Aplicador Triangular Maximper",
                    "compra",
                  ),
                },
              ],
            )
          },
        },
      ],
    )
  }

  const finishColaBlocoChoice = (tipoBloco: string) => {
    addUserMessage(tipoBloco)
    setLeadData((p) => ({ ...p, product: `Cola Bloco RevGold (${tipoBloco})` }))
    botReply(
      `Perfeito! O rendimento da Cola Bloco varia conforme o tamanho do bloco (${tipoBloco}). Com 2 filetes de 1cm de diâmetro, uma bisnaga de 15kg assenta até ~20 a 25 m² de parede.`,
      [
        {
          label: `SOLICITAR ORÇAMENTO COLA BLOCO (${tipoBloco.toUpperCase()})`,
          url: WA_LINKS.produto(
            `Cola Bloco RevGold (${tipoBloco})`,
            "orcamento",
          ),
        },
        {
          label: "FALAR COM VENDAS COLA BLOCO",
          url: WA_LINKS.produto(`Cola Bloco RevGold (${tipoBloco})`, "compra"),
        },
      ],
      [
        {
          id: "cola-bloco-15kg",
          name: "Cola Bloco RevGold 15kg (Bisnaga)",
          category: "Alvenaria Pronta",
          subtitle:
            "Massa polimérica pronta para uso — substitui a argamassa convencional",
          rendimento: "Até 25 m² de parede",
          actionLabel: "⚡ Orçar Cola Bloco",
          onAction: () =>
            startLeadCapture(`Cola Bloco RevGold 15kg (${tipoBloco})`),
          directWaUrl: WA_LINKS.produto(
            `Cola Bloco RevGold (${tipoBloco})`,
            "compra",
          ),
        },
        {
          id: "aplicador-triangular",
          name: "Aplicador Triangular Maximper",
          category: "Ferramentas",
          subtitle:
            "Aplicador calibrador para 2 filetes uniformes sem desperdício",
          rendimento: "Reutilizável / Ergonômico",
          actionLabel: "⚡ Ver Kit com Aplicador",
          onAction: () =>
            startLeadCapture(`Kit Cola Bloco + Aplicador Triangular`),
          directWaUrl: WA_LINKS.produto(
            "Aplicador Triangular Maximper",
            "compra",
          ),
        },
      ],
    )
  }

  // Fluxo 4: Produtos Würth (Item 23, 24, 25)
  const handleWurthFlow = () => {
    addUserMessage("Produtos Würth")
    botReply(
      "Sim! Trabalhamos com diversos produtos Würth para manutenção, limpeza, reparos e uso profissional. Qual deles você procura?",
      [
        {
          label: "🔩 Rost Off (Desengripante)",
          action: () => {
            addUserMessage("Rost Off")
            setLeadData((p) => ({
              ...p,
              product: "Rost Off Würth (Desengripante)",
            }))
            botReply(
              "Temos Rost Off Würth. Ele é um produto de alta qualidade para manutenção e desengripamento profissional.",
              [
                {
                  label: "COMPRAR ROST OFF WÜRTH NO WHATSAPP",
                  url: WA_LINKS.produto(
                    "Rost Off Würth (Desengripante)",
                    "compra",
                  ),
                },
                {
                  label: "CONSULTAR ESTOQUE ROST OFF",
                  url: WA_LINKS.produto(
                    "Rost Off Würth (Desengripante)",
                    "duvida",
                  ),
                },
              ],
            )
          },
        },
        {
          label: "🧪 Epóxi Titânio",
          action: () => {
            addUserMessage("Epóxi Titânio")
            setLeadData((p) => ({ ...p, product: "Epóxi Titânio Würth" }))
            botReply(
              "Temos Epóxi Titânio Würth para colagens e reparos de alta resistência.",
              [
                {
                  label: "COMPRAR EPÓXI TITÂNIO WÜRTH",
                  url: WA_LINKS.produto("Epóxi Titânio Würth", "compra"),
                },
              ],
            )
          },
        },
        {
          label: "🧴 Espuma Limpadora / Desengraxante",
          action: () => {
            addUserMessage("Limpeza / Manutenção")
            setLeadData((p) => ({
              ...p,
              product: "Espuma Limpadora / Desengraxante Würth",
            }))
            botReply(
              "Trabalhamos com Espuma Limpadora, Pasta Desengraxante e Removedor de Ferrugem Würth.",
              [
                {
                  label: "CONSULTAR PRODUTOS DE LIMPEZA WÜRTH",
                  url: WA_LINKS.produto(
                    "Espuma Limpadora / Pasta Desengraxante Würth",
                    "duvida",
                  ),
                },
              ],
            )
          },
        },
        {
          label: "🚗 Fluido de Radiador",
          action: () => {
            addUserMessage("Fluido de Radiador")
            setLeadData((p) => ({ ...p, product: "Fluido de Radiador Würth" }))
            botReply(
              "Temos Fluido de Radiador Würth para sistema de arrefecimento.",
              [
                {
                  label: "COMPRAR FLUIDO DE RADIADOR WÜRTH",
                  url: WA_LINKS.produto("Fluido de Radiador Würth", "compra"),
                },
              ],
            )
          },
        },
      ],
    )
  }

  const handleBambuLabFlow = () => {
    addUserMessage("Impressoras Bambu Lab")
    setLeadData((p) => ({ ...p, product: "Impressora Bambu Lab" }))
    botReply(
      "Sim! Trabalhamos com impressoras 3D Bambu Lab (como A1, A1 Mini e outros modelos). Posso ajudar você a verificar os modelos disponíveis e valores no setor de vendas.",
      [
        {
          label: "⚡ Orçamento Impressora Bambu Lab",
          action: () => startLeadCapture("Impressora Bambu Lab (A1 / A1 Mini)"),
        },
        {
          label: "💬 Falar com Vendas 3D no WhatsApp",
          url: WA_LINKS.produto("Impressoras 3D Bambu Lab", "orcamento"),
        },
      ],
    )
  }

  const handleFilamentoFlow = () => {
    addUserMessage("Filamentos (Cores e Marcas)")
    setLeadData((p) => ({ ...p, product: "Filamentos (Maxprint & Bambu Lab)" }))
    botReply(
      "Trabalhamos com filamentos de alta qualidade das marcas **Maxprint** e **Bambu Lab**! 🧵✨\n\nTemos uma **variação muito grande de cores** disponíveis em pronta entrega (básicas, especiais, silk, translúcidas e metálicas).\n\nComo a variedade de cores e o estoque são muito amplos e dinâmicos, para conferir o catálogo completo e a disponibilidade das cores em tempo real, consulte diretamente nosso WhatsApp:",
      [
        {
          label: "📲 VER TODAS AS CORES NO WHATSAPP",
          url: WA_LINKS.catalogoCoresFilamento("todas"),
        },
        {
          label: "🧵 Cores Filamentos Bambu Lab",
          url: WA_LINKS.catalogoCoresFilamento("Bambu Lab"),
        },
        {
          label: "🧵 Cores Filamentos Maxprint",
          url: WA_LINKS.catalogoCoresFilamento("Maxprint"),
        },
        {
          label: "🚚 Opções de Entrega / Retirada",
          action: () => handleEntregaRetiradaFlow(),
        },
      ],
    )
  }

  const handlePecasFlow = () => {
    addUserMessage("Peças e Manutenção 3D")
    botReply(
      "Qual modelo da sua impressora Bambu Lab para verificarmos a peça compatível ou suporte técnico?",
      [
        { label: "Bambu Lab A1", action: () => selectBambuModel("A1") },
        {
          label: "Bambu Lab A1 Mini",
          action: () => selectBambuModel("A1 Mini"),
        },
        {
          label: "Outro modelo / Dúvida",
          action: () => selectBambuModel("Outro modelo"),
        },
      ],
    )
  }

  // Fluxo 5: Impressão 3D (Item 63, 64)
  const handleImpressao3DFlow = () => {
    addUserMessage("Impressão 3D")
    botReply(
      "Você procura uma impressora 3D, filamento ou peças de manutenção?",
      [
        {
          label: "🖨️ Impressoras Bambu Lab",
          action: () => handleBambuLabFlow(),
        },
        {
          label: "🧵 Filamentos (Maxprint & Bambu Lab)",
          action: () => handleFilamentoFlow(),
        },
        {
          label: "🔧 Peças de Manutenção",
          action: () => handlePecasFlow(),
        },
      ],
    )
  }

  const selectFilamentoCor = (cor: string) => {
    addUserMessage(`Filamento cor ${cor}`)
    setLeadData((p) => ({
      ...p,
      product: `Filamento ${cor} (Maxprint / Bambu Lab)`,
    }))
    botReply(
      `Temos filamentos na cor **${cor}** e uma grande variação de tonalidades das marcas **Maxprint** e **Bambu Lab**! 🧵✨\n\nClique abaixo para consultar a disponibilidade e valor no WhatsApp da loja:`,
      [
        {
          label: `📲 CONSULTAR COR ${cor.toUpperCase()} NO WHATSAPP`,
          url: buildWhatsAppLink(
            `Olá! Vim pelo site da Loja SJ e gostaria de consultar a disponibilidade do filamento na cor ${cor} (Maxprint / Bambu Lab). Vocês têm em estoque hoje?`,
          ),
        },
        {
          label: "🎨 VER TODAS AS OUTRAS CORES",
          url: WA_LINKS.catalogoCoresFilamento("todas"),
        },
      ],
    )
  }

  const selectBambuModel = (modelo: string) => {
    addUserMessage(modelo)
    setLeadData((p) => ({ ...p, product: `Peça Bambu Lab (${modelo})` }))
    botReply(
      `Vou encaminhar você para nosso atendimento técnico no WhatsApp para consultar a disponibilidade da peça para a sua Bambu Lab ${modelo}.`,
      [
        {
          label: `CONSULTAR PEÇAS BAMBU LAB ${modelo.toUpperCase()}`,
          url: WA_LINKS.produto(
            `Peça de Manutenção para Bambu Lab ${modelo}`,
            "duvida",
          ),
        },
      ],
    )
  }

  // Fluxo 6: Utilidades Vumora (Item 65)
  const handleUtilidadesFlow = () => {
    addUserMessage("Utilidades para Casa")
    botReply("Qual tipo de utilidade você procura?", [
      {
        label: "🛁 Banheiro / Porta Toalha",
        action: () => {
          addUserMessage("Porta Toalha / Banheiro")
          setLeadData((p) => ({
            ...p,
            product: "Porta Toalha / Porta Escova Vumora",
          }))
          botReply(
            "Temos Porta Toalha, Porta Escova e Porta Papel Higiênico Vumora nas cores Preto, Branco, Cinza e Marrom.",
            [
              {
                label: "COMPRAR LINHA BANHEIRO VUMORA NO WHATSAPP",
                url: WA_LINKS.produto(
                  "Linha Banheiro Vumora (Porta Toalha/Escova)",
                  "compra",
                ),
              },
            ],
          )
        },
      },
      {
        label: "💻 Suporte Notebook",
        action: () => {
          addUserMessage("Suporte Notebook")
          setLeadData((p) => ({ ...p, product: "Suporte Notebook Vumora" }))
          botReply(
            "Suporte Notebook Vumora para melhor ergonomia e organização no dia a dia.",
            [
              {
                label: "COMPRAR SUPORTE NOTEBOOK VUMORA",
                url: WA_LINKS.produto("Suporte Notebook Vumora", "compra"),
              },
            ],
          )
        },
      },
      {
        label: "🗑️ Suporte Saco de Lixo",
        action: () => {
          addUserMessage("Suporte Saco de Lixo")
          setLeadData((p) => ({ ...p, product: "Suporte Saco de Lixo Vumora" }))
          botReply(
            "Temos Suporte Fechado de 18 cm, Suporte Horizontal de 22 cm e Par de Suportes para Saco de Lixo.",
            [
              {
                label: "COMPRAR SUPORTE SACO DE LIXO VUMORA",
                url: WA_LINKS.produto(
                  "Suporte para Saco de Lixo Vumora",
                  "compra",
                ),
              },
            ],
          )
        },
      },
      {
        label: "🐱 Trava Porta Gatinho / Gancho",
        action: () => {
          addUserMessage("Trava Porta Gatinho")
          setLeadData((p) => ({ ...p, product: "Trava Porta Gatinho Vumora" }))
          botReply(
            "Trava Porta Gatinho e Gancho Gato decorativo Vumora em diversas cores.",
            [
              {
                label: "COMPRAR TRAVA PORTA GATINHO VUMORA",
                url: WA_LINKS.produto(
                  "Trava Porta Gatinho / Gancho Gato Vumora",
                  "compra",
                ),
              },
            ],
          )
        },
      },
    ])
  }

  // Fluxo 7: Entrega e Retirada (Itens 40-45, 66)
  const handleEntregaRetiradaFlow = () => {
    addUserMessage("Entrega / Retirada")
    botReply(
      `A Loja SJ possui entrega local programada até a casa do cliente com taxa padrão de ${SJ_STORE_INFO.deliveryFeeDisplay} (sujeita a confirmação do endereço) ou retirada na loja.\n\nQual opção você prefere?`,
      [
        {
          label: "🚚 Entrega Local Programada (R$ 15,00)",
          action: () => {
            addUserMessage("Entrega Local")
            setLeadData((p) => ({ ...p, modalidade: "Entrega" }))
            botReply(
              "Qual produto você deseja receber e qual é o seu bairro?",
              [
                {
                  label: "📍 Informar Bairro e Detalhes",
                  action: () => startLeadCapture("Entrega Local"),
                },
                {
                  label: "PROGRAMAR ENTREGA NO WHATSAPP",
                  url: WA_LINKS.programarEntrega,
                },
              ],
            )
          },
        },
        {
          label: "🏬 Retirada na Loja (Umuarama - PR)",
          action: () => {
            addUserMessage("Retirada na Loja")
            setLeadData((p) => ({ ...p, modalidade: "Retirada" }))
            botReply(
              `Estamos na ${SJ_STORE_INFO.address}.\n\nAtendimento ${SJ_STORE_INFO.workingHours}. Antes de vir, recomendamos confirmar a disponibilidade do produto em estoque com o setor de vendas.`,
              [
                {
                  label: "📦 Confirmar Estoque no WhatsApp",
                  url: WA_LINKS.falarComVendedor,
                },
                {
                  label: "FINALIZAR COMPRA PARA RETIRADA",
                  url: WA_LINKS.finalizarCompra,
                },
              ],
            )
          },
        },
      ],
    )
  }

  // ── CAPTURA DE LEAD QUALIFICADO (Itens 54, 55, 56) ─────────────────────────

  // ── CAPTURA DE LEAD QUALIFICADO (Itens 54, 55, 56) ─────────────────────────

  const mapKnowledgeChips = (
    chips?: { label: string; actionId?: string; url?: string; payload?: any }[],
  ): ActionChip[] => {
    return (chips || []).map((c) => {
      if (c.url) return c
      if (c.actionId === "fluxo_entrega" || c.actionId === "entrega_info") {
        return {
          label: c.label,
          action: () => {
            addUserMessage(c.label)
            requireContactThen(
              () => handleEntregaRetiradaFlow(),
              "Entrega / Retirada",
            )
          },
        }
      }
      if (c.actionId === "retirada_info" || c.actionId === "endereco_info") {
        return {
          label: c.label,
          action: () => {
            botReply(
              `Estamos na ${SJ_STORE_INFO.address}.\n\nAtendimento ${SJ_STORE_INFO.workingHours}. Antes de vir, recomendamos confirmar a disponibilidade com o setor de vendas.`,
              [
                {
                  label: "CONFIRMAR NO WHATSAPP",
                  url: WA_LINKS.falarComVendedor,
                },
              ],
            )
          },
        }
      }
      if (c.actionId === "piscina_alvenaria") {
        return {
          label: c.label,
          action: () => {
            botReply(
              "Temos a Acqua Protect Blindamix, desenvolvida para piscinas de alvenaria.",
              [
                {
                  label: "SOLICITAR ORÇAMENTO",
                  url: WA_LINKS.solicitarOrcamento,
                },
              ],
            )
          },
        }
      }
      if (c.actionId === "piscina_fibra") {
        return {
          label: c.label,
          action: () => {
            botReply(
              "A Acqua Protect não é recomendada para piscina de fibra. Posso encaminhar você para nosso atendimento para verificar outra solução.",
              [
                {
                  label: "FALAR COM ATENDENTE",
                  url: WA_LINKS.falarComVendedor,
                },
              ],
            )
          },
        }
      }
      if (
        c.actionId === "maxprint_filamentos" ||
        c.actionId === "filamentos_cores" ||
        c.actionId === "filamento" ||
        c.actionId === "filamentos"
      ) {
        return {
          label: c.label,
          action: () => handleFilamentoFlow(),
        }
      }
      if (c.actionId === "bambu_impressoras") {
        return {
          label: c.label,
          action: () => handleBambuLabFlow(),
        }
      }
      if (c.actionId === "bambu_pecas") {
        return {
          label: c.label,
          action: () => handlePecasFlow(),
        }
      }
      return {
        label: c.label,
        action: () => showInitialMenu(true),
      }
    })
  }

  const startLeadCapture = (productDesc: string) => {
    isFinalizingRef.current = false
    setLeadData((p) => ({ ...p, product: productDesc }))
    if (!hasCollectedContactRef.current) {
      botReply(
        `Para prepararmos seu orçamento personalizado de *${productDesc}*, qual é o seu nome completo?`,
      )
      setStep("collect_name")
    } else {
      botReply(
        `Ótima escolha para *${productDesc}*! Qual é o seu bairro e cidade para entrega ou retirada?`,
        [
          {
            label: "📍 Umuarama - Centro",
            action: () => {
              addUserMessage("📍 Umuarama - Centro")
              finalizeLeadWithBairro("Centro, Umuarama - PR")
            },
          },
          {
            label: "👍 Combinar no WhatsApp",
            action: () => {
              addUserMessage("👍 Combinar no WhatsApp")
              finalizeLeadWithBairro("A combinar")
            },
          },
        ],
      )
      setStep("collect_bairro")
    }
  }

  // Processamento de Entrada de Texto do Usuário
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setInputValue("")
    addUserMessage(trimmed)

    // Se o cliente ainda não selecionou a empresa / setor
    if (!selectedUnit || step === "select_unit") {
      const lower = trimmed.toLowerCase()
      const is3D =
        /\b(3d|impressora|filamento|pla|petg|abs|bambu|bambulab|a1|mini|vumora|pe[çc]a|manuten[çc][aã]o|resina|hotend|extrusora)\b/.test(
          lower,
        )
      const isDistribuidora =
        /\b(tinta|impermeabiliz|blindamix|maximper|acqua|lona|pedra|grafiato|selante|silicone|cola|argamassa|bloco|wurth|vedacit|piscina|laje|reboco|obra|baldrame)\b/.test(
          lower,
        )

      if (is3D && !isDistribuidora) {
        handleSelectUnit("Loja SJ")
        return
      } else if (isDistribuidora && !is3D) {
        handleSelectUnit("SJ Distribuidora")
        return
      } else {
        botReply(
          "É sobre impressoras ou vai ser a parte de tintas e impermeabilizantes? (Loja SJ ou SJ Distribuidora?)\n\nPor favor, escolha uma das opções abaixo para falarmos com o especialista certo:",
          getInitialChips(),
        )
        return
      }
    }

    // Se o cliente ainda não informou nome e contato
    if (!hasCollectedContactRef.current) {
      if (step === "collect_name" || step === "welcome") {
        // Se a mensagem enviada for uma dúvida/pergunta de produto em vez de um nome simples
        const isQuestionOrInquiry =
          trimmed.includes("?") ||
          /\b(quanto|qual|valor|preco|preço|entrega|frete|orcar|orçar|orcamento|orçamento|comprar|tem|vende|funciona|como|horario|horário|endereco|endereço|onde|rendimento|laje|piscina|parede|wurth|cola|tinta|filamento|cor|cores|catalogo|tabela)\b/i.test(
            trimmed,
          )

        if (isQuestionOrInquiry) {
          pendingQueryRef.current = trimmed
          botReply(
            "Com certeza! Vou te passar todos os detalhes sobre isso agora mesmo. 😊\n\nAntes, como posso te chamar? (Qual seu nome completo?)",
          )
          setStep("collect_name")
          return
        }

        // Se for um cumprimento simples como "oi", "olá", "bom dia"
        if (
          /^(oi|ol[aá]|bom dia|boa tarde|boa noite|opa|ei|ola)$/i.test(trimmed)
        ) {
          botReply(
            `Olá! Seja muito bem-vindo(a) à ${selectedUnit || "Loja SJ"}! 👋\n\nPara iniciarmos seu atendimento personalizado, como posso te chamar? (Qual seu nome?)`,
          )
          setStep("collect_name")
          return
        }

        // Caso contrário, é o nome do cliente
        const cleanedName = trimmed
          .replace(/^(meu nome [eé]|sou o|sou a|me chamo)\s+/i, "")
          .trim()
        setLeadData((p) => ({ ...p, name: cleanedName }))
        botReply(
          `Muito prazer, ${cleanedName}! 👋\nQual é o seu WhatsApp com DDD para mantermos o registro do seu atendimento?`,
        )
        setStep("collect_whatsapp")
        return
      }

      if (step === "collect_whatsapp") {
        const raw = trimmed.replace(/\D/g, "")
        if (raw.length < 10 || raw.length > 11) {
          botReply(
            "⚠️ Por favor, digite um número de WhatsApp válido com DDD (ex: 44 99915-9415).",
          )
          return
        }
        const formatted = formatWhatsApp(trimmed)
        const currentLead = { ...leadData, whatsapp: formatted }
        setLeadData(currentLead)
        hasCollectedContactRef.current = true

        const currentUnit = selectedUnit || "Loja SJ"

        // Salva imediatamente como Lead assim que o número de WhatsApp é informado
        const initialLeadMessage = pendingQueryRef.current
          ? `[Assistente ${currentUnit}] Dúvida inicial: "${pendingQueryRef.current}" | Produto: ${currentLead.product || "Geral"}`
          : `[Assistente ${currentUnit}] Produto: ${currentLead.product || "Geral"} | Modalidade: ${currentLead.modalidade || "Atendimento Geral"}`

        saveLead({
          name:
            currentLead.name ||
            (currentUnit === "SJ Distribuidora"
              ? "Cliente SJ Distribuidora"
              : "Cliente Loja SJ"),
          whatsapp: formatted,
          email: "",
          message: initialLeadMessage,
          unit: currentUnit,
          tags: [currentUnit],
          product: currentLead.product,
          modalidade: currentLead.modalidade,
          bairro: currentLead.bairro,
        })
          .then((saved) => {
            if (saved?.id) {
              currentLeadIdRef.current = saved.id
            }
          })
          .catch((err) => {
            console.error("Erro ao registrar lead prévio:", err)
          })

        // Se havia uma dúvida/pergunta pendente feita antes do cadastro:
        if (pendingQueryRef.current) {
          const query = pendingQueryRef.current
          pendingQueryRef.current = null
          const kbResult = querySJKnowledge(query)
          const mappedChips = mapKnowledgeChips(kbResult.chips)
          botReply(
            `Perfeito, ${currentLead.name}! 🎉 Seu contato foi registrado com sucesso.\n\n${kbResult.text}`,
            mappedChips,
          )
          setStep("chat")
          return
        }

        // Se havia uma ação/fluxo pendente:
        if (pendingActionRef.current) {
          const action = pendingActionRef.current
          pendingActionRef.current = null
          botReply(
            `Perfeito, ${currentLead.name}! 🎉 Seu contato foi registrado com sucesso.`,
          )
          setTimeout(() => {
            action()
          }, 350)
          setStep("chat")
          return
        }

        // Caso contrário, continua o fluxo para saber o bairro
        botReply(
          `Perfeito, ${currentLead.name}! 🎉 Seu atendimento foi iniciado.\n\nQual é o seu bairro e cidade (para entrega ou retirada)?`,
          [
            {
              label: "📍 Umuarama - Centro",
              action: () => {
                addUserMessage("📍 Umuarama - Centro")
                finalizeLeadWithBairro("Centro, Umuarama - PR")
              },
            },
            {
              label: "👍 Combinar no WhatsApp",
              action: () => {
                addUserMessage("👍 Combinar no WhatsApp")
                finalizeLeadWithBairro("A combinar")
              },
            },
          ],
        )
        setStep("collect_bairro")
        return
      }
    }

    if (step === "collect_bairro") {
      finalizeLeadWithBairro(trimmed)
      return
    }

    // Consulta Inteligente à Base de Conhecimento Oficial SJ
    const kbResult = querySJKnowledge(trimmed)
    const mappedChips = mapKnowledgeChips(kbResult.chips)
    botReply(kbResult.text, mappedChips)
  }

  const finalizeLeadWithBairro = async (bairroName: string) => {
    if (isFinalizingRef.current) return
    isFinalizingRef.current = true

    const updatedLead = { ...leadData, bairro: bairroName }
    setLeadData(updatedLead)
    setStep("completed")

    const currentUnit = selectedUnit || "Loja SJ"

    // Atualizar ou salvar no banco de dados local / Firestore
    const finalMessage = `[Assistente ${currentUnit}] Produto: ${updatedLead.product || "Geral"} | Bairro: ${bairroName} | Modalidade: ${updatedLead.modalidade || "Atendimento Geral"}`
    try {
      if (currentLeadIdRef.current) {
        await updateLeadDetails(currentLeadIdRef.current, {
          message: finalMessage,
          bairro: bairroName,
          unit: currentUnit,
        })
      } else {
        const saved = await saveLead({
          name:
            updatedLead.name ||
            (currentUnit === "SJ Distribuidora"
              ? "Cliente SJ Distribuidora"
              : "Cliente Loja SJ"),
          whatsapp: updatedLead.whatsapp,
          email: "",
          message: finalMessage,
          unit: currentUnit,
          tags: [currentUnit],
          product: updatedLead.product,
          modalidade: updatedLead.modalidade,
          bairro: bairroName,
        })
        if (saved?.id) {
          currentLeadIdRef.current = saved.id
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar lead:", e)
    }

    botReply(
      `Perfeito, ${updatedLead.name || "amigo(a)"}! 🎉 Seu atendimento foi registrado com sucesso.\n\nClique no botão abaixo para dar continuidade imediata pelo WhatsApp com nosso setor de vendas:`,
      [
        {
          label: "🚀 CONTINUAR NO WHATSAPP AGORA",
          url: WA_LINKS.customLead({
            name: updatedLead.name,
            product: updatedLead.product,
            modalidade: updatedLead.modalidade,
            bairro: bairroName,
          }),
        },
      ],
    )
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[75vh] w-full bg-slate-950/30 rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl backdrop-blur-md">
      {/* Top Company Indicator / Switcher Bar */}
      <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-400">Setor:</span>
          {selectedUnit ? (
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 ${
                selectedUnit === "Loja SJ"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
              }`}
            >
              <span>{selectedUnit === "Loja SJ" ? "🖨️" : "🎨"}</span>
              <span>{selectedUnit}</span>
            </span>
          ) : (
            <span className="text-slate-300 font-medium">Selecione a empresa abaixo</span>
          )}
        </div>
        {selectedUnit && (
          <button
            type="button"
            onClick={handleSwitchCompany}
            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer hover:text-[#ff7a59] transition-colors"
          >
            Trocar setor
          </button>
        )}
      </div>

      {/* Messages Scrollable Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            } animate-fadeIn`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-[#e8451f] to-[#ff7a59] text-white font-semibold rounded-tr-none shadow-[#e8451f]/20"
                  : "bg-slate-800/95 text-slate-100 border border-slate-700/70 rounded-tl-none font-medium backdrop-blur-sm"
              }`}
            >
              {m.text.split("\n").map((line, idx) => (
                <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                  {line}
                </p>
              ))}
            </div>

            {/* Interactive Product Cards Grid / Carousel */}
            {m.productCards && m.productCards.length > 0 && (
              <div className="flex flex-col gap-2 mt-2.5 max-w-[96%] w-full">
                {m.productCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 bg-slate-900/95 border border-slate-700/80 hover:border-[#e8451f]/50 rounded-xl flex flex-col gap-2 transition-all shadow-md backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#e8451f]/15 text-[#ff7a59] border border-[#e8451f]/30">
                            {card.category}
                          </span>
                          {card.rendimento && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                              ⚡ {card.rendimento}
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-xs text-white">
                          {card.name}
                        </h5>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {card.onAction && (
                        <button
                          type="button"
                          onClick={card.onAction}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#e8451f] to-[#ff7a59] text-white font-black text-[10px] uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 text-center cursor-pointer shadow-sm"
                        >
                          {card.actionLabel || "⚡ Fazer Orçamento"}
                        </button>
                      )}
                      {card.directWaUrl && (
                        <a
                          href={card.directWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-[10px] flex items-center justify-center gap-1 no-underline transition-all shadow-sm"
                        >
                          <IcoWhatsApp s={12} />
                          <span>Comprar</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Chips & WhatsApp direct buttons & Company selection cards */}
            {m.chips && m.chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5 max-w-[96%] w-full">
                {m.chips.map((chip, i) =>
                  chip.url ? (
                    <a
                      key={i}
                      href={chip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-xs font-black bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:brightness-110 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] uppercase tracking-wider"
                    >
                      <IcoWhatsApp s={16} />
                      <span>{chip.label}</span>
                    </a>
                  ) : chip.desc ? (
                    <button
                      key={i}
                      type="button"
                      onClick={chip.action}
                      className="w-full p-3 rounded-xl bg-slate-900/95 hover:bg-slate-850 border border-slate-700/80 hover:border-[#e8451f]/50 transition-all text-left flex items-start gap-3 shadow-sm cursor-pointer group active:scale-[0.99]"
                    >
                      {chip.icon && (
                        <div className="text-xl p-2 rounded-lg bg-slate-800 border border-slate-700/60 group-hover:border-[#e8451f]/40 group-hover:bg-[#e8451f]/10 transition-colors flex-shrink-0">
                          {chip.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white group-hover:text-[#ff7a59] transition-colors flex items-center justify-between">
                          <span>{chip.label}</span>
                          <span className="text-[10px] text-slate-400 font-semibold group-hover:text-[#ff7a59]">
                            Acessar →
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {chip.desc}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={chip.action}
                      className="text-xs font-semibold bg-slate-800/90 hover:bg-[#e8451f]/15 hover:border-[#e8451f]/50 hover:text-white text-slate-200 border border-slate-700/80 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 text-left"
                    >
                      {chip.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-slate-800/95 border border-slate-700/70 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-tl-none w-fit text-xs shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a59] animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a59] animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a59] animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-900/90 border-t border-slate-800/90 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type={step === "collect_whatsapp" ? "tel" : "text"}
          placeholder={
            !selectedUnit || step === "select_unit"
              ? "É sobre impressoras ou tintas? Escolha uma opção acima..."
              : step === "collect_name"
                ? "Digite seu nome completo..."
                : step === "collect_whatsapp"
                  ? "Digite seu WhatsApp com DDD..."
                  : step === "collect_bairro"
                    ? "Digite seu bairro e cidade..."
                    : selectedUnit === "Loja SJ"
                      ? "Pergunte sobre impressoras 3D, filamentos, cores ou peças..."
                      : "Pergunte sobre tintas, impermeabilizantes, lajes ou rendimento..."
          }
          value={
            step === "collect_whatsapp"
              ? formatWhatsApp(inputValue)
              : inputValue
          }
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isTyping}
          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#e8451f] focus:ring-1 focus:ring-[#e8451f]/40 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="bg-gradient-to-r from-[#e8451f] to-[#ff7a59] disabled:opacity-40 hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>Enviar</span>
          <IcoArrow s={13} />
        </button>
      </form>
    </div>
  )
}
