import React, { useState } from "react"
import { Lead, updateLeadTags } from "../../services/storeService"
import { IcoWhatsApp } from "../Icons"
import {
  Search,
  Download,
  Phone,
  Mail,
  Tag as TagIcon,
  MessageSquare,
  Check,
  Copy,
  Plus,
  ChevronDown,
  Bot,
  Filter,
  X,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react"

interface LeadsManagerProps {
  leads: Lead[]
  handleStatusChange: (
    leadId: string,
    newStatus: "Novo" | "Em Atendimento" | "Concluído",
  ) => Promise<void>
}

export const AVAILABLE_TAGS = [
  {
    name: "Atacado",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    bgDark: "dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
    dot: "bg-amber-500",
    icon: "📦",
  },
  {
    name: "Urgente",
    bgLight: "bg-rose-50 text-rose-700 border-rose-200",
    bgDark: "dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
    dot: "bg-rose-500",
    icon: "🔥",
  },
  {
    name: "Balcão",
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    bgDark: "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
    dot: "bg-blue-500",
    icon: "🏪",
  },
  {
    name: "Orçamento Grande",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bgDark: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
    icon: "💰",
  },
  {
    name: "Follow-up",
    bgLight: "bg-purple-50 text-purple-700 border-purple-200",
    bgDark: "dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50",
    dot: "bg-purple-500",
    icon: "⏰",
  },
]

function getWhatsAppUrl(name: string, phone: string, tags?: string[]) {
  const digits = phone.replace(/\D/g, "")
  const fullPhone = digits.startsWith("55") ? digits : `55${digits}`
  const firstName = name.trim().split(" ")[0] || "Cliente"
  const tagContext =
    tags && tags.length > 0 ? ` referente a (${tags.join(", ")})` : ""
  const message = `Olá, ${firstName}! Sou da equipe do Grupo SJ. Recebemos seu contato através da nossa página${tagContext} e estou à disposição para ajudar com seu orçamento e tirar todas as suas dúvidas.`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

export function LeadsManager({ leads, handleStatusChange }: LeadsManagerProps) {
  const [localTagsMap, setLocalTagsMap] = useState<Record<string, string[]>>({})
  const [leadSearch, setLeadSearch] = useState("")
  const [leadStatusFilter, setLeadStatusFilter] =
    useState<"Todos" | "Novo" | "Em Atendimento" | "Concluído">("Todos")
  const [leadTagFilter, setLeadTagFilter] = useState<string>("Todas")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTagDropdownId, setActiveTagDropdownId] = useState<string | null>(null)

  const copyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getLeadTags = (lead: Lead): string[] => {
    return localTagsMap[lead.id] ?? lead.tags ?? []
  }

  const toggleLeadTag = async (lead: Lead, tagName: string) => {
    const current = getLeadTags(lead)
    const next = current.includes(tagName)
      ? current.filter((t) => t !== tagName)
      : [...current, tagName]

    setLocalTagsMap((prev) => ({ ...prev, [lead.id]: next }))
    await updateLeadTags(lead.id, next)
  }

  // Counts
  const countTotal = leads.length
  const countNovos = leads.filter((l) => l.status === "Novo").length
  const countAtendimento = leads.filter((l) => l.status === "Em Atendimento").length
  const countConcluidos = leads.filter((l) => l.status === "Concluído").length

  const filteredLeads = leads.filter((lead) => {
    const term = leadSearch.toLowerCase()
    const matchesSearch =
      lead.name.toLowerCase().includes(term) ||
      lead.whatsapp.includes(leadSearch) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.message && lead.message.toLowerCase().includes(term))
    const matchesStatus =
      leadStatusFilter === "Todos" || lead.status === leadStatusFilter

    const currentTags = getLeadTags(lead)
    const matchesTag =
      leadTagFilter === "Todas" || currentTags.includes(leadTagFilter)

    return matchesSearch && matchesStatus && matchesTag
  })

  const exportToCsv = () => {
    if (leads.length === 0) return

    const headers = [
      "ID",
      "Nome",
      "WhatsApp",
      "E-mail",
      "Status",
      "Tags",
      "Data",
      "Mensagem",
    ]
    const rows = filteredLeads.map((l) => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.whatsapp}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${getLeadTags(l).join(" | ")}"`,
      `"${new Date(l.createdAt).toLocaleString("pt-BR")}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`,
    ])

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `leads_grupo_sj_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse message for chatbot tags
  const parseMessage = (msg?: string) => {
    if (!msg) return null
    const isBot = msg.includes("[Assistente Chatbot]")
    const cleanMsg = msg.replace("[Assistente Chatbot]", "").trim()
    return { isBot, text: cleanMsg }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setLeadStatusFilter("Todos")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            leadStatusFilter === "Todos"
              ? "bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-slate-900 dark:border-white"
              : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
              Total de Leads
            </span>
            <span className="text-2xl font-black">{countTotal}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLeadStatusFilter("Novo")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            leadStatusFilter === "Novo"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 shadow-sm"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
              Novos
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {countNovos}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLeadStatusFilter("Em Atendimento")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            leadStatusFilter === "Em Atendimento"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 shadow-sm"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
              Em Atendimento
            </span>
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400">
              {countAtendimento}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock3 className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLeadStatusFilter("Concluído")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            leadStatusFilter === "Concluído"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 shadow-sm"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
              Concluídos
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {countConcluidos}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* ── Main Container Card ── */}
      <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* ── Filter Toolbar ── */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar por nome, whatsapp, e-mail ou mensagem..."
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-2xs"
            />
            {leadSearch && (
              <button
                type="button"
                onClick={() => setLeadSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Select */}
            <div className="relative">
              <select
                value={leadStatusFilter}
                onChange={(e) =>
                  setLeadStatusFilter(
                    e.target
                      .value as "Todos" | "Novo" | "Em Atendimento" | "Concluído",
                  )
                }
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value="Todos">Todos os Status ({countTotal})</option>
                <option value="Novo">Novos ({countNovos})</option>
                <option value="Em Atendimento">Em Atendimento ({countAtendimento})</option>
                <option value="Concluído">Concluídos ({countConcluidos})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <select
                value={leadTagFilter}
                onChange={(e) => setLeadTagFilter(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value="Todas">Todas as Tags</option>
                {AVAILABLE_TAGS.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={exportToCsv}
              disabled={filteredLeads.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
              title="Exportar dados filtrados para arquivo Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* ── Table Header & Body (Desktop) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Lead / Nome
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Contato WhatsApp
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  E-mail
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Tags & Categorias
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 max-w-[240px]">
                  Mensagem / Interesse
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">
                  Data
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">
                  Ações Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Users className="w-10 h-10 opacity-30 stroke-[1.5]" />
                      <p className="text-sm font-semibold">
                        Nenhum lead encontrado com os filtros atuais.
                      </p>
                      {(leadSearch || leadStatusFilter !== "Todos" || leadTagFilter !== "Todas") && (
                        <button
                          type="button"
                          onClick={() => {
                            setLeadSearch("")
                            setLeadStatusFilter("Todos")
                            setLeadTagFilter("Todas")
                          }}
                          className="text-xs text-orange-600 hover:underline font-bold"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const currentTags = getLeadTags(lead)
                  const isTagPickerOpen =
                    activeTagDropdownId === `desktop-${lead.id}`
                  const parsedMsg = parseMessage(lead.message)

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Lead / Nome */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e8451f] to-[#ff7a59] text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block truncate">
                              {lead.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 font-mono tracking-tight">
                            {lead.whatsapp}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyPhone(lead.id, lead.whatsapp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copiar número"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="py-4 px-4 align-middle">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-xs text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5 truncate max-w-[170px]"
                            title={`Enviar e-mail para ${lead.email}`}
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 pl-2">
                            —
                          </span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                          {currentTags.map((tagName) => {
                            const tagDef = AVAILABLE_TAGS.find(
                              (t) => t.name === tagName,
                            )
                            return (
                              <span
                                key={tagName}
                                onClick={() => void toggleLeadTag(lead, tagName)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  tagDef
                                    ? `${tagDef.bgLight} ${tagDef.bgDark}`
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                                title="Clique para remover tag"
                              >
                                <span>{tagDef?.icon || "🏷️"}</span>
                                <span>{tagName}</span>
                                <span className="opacity-40 hover:opacity-100 ml-0.5">
                                  ×
                                </span>
                              </span>
                            )
                          })}

                          {/* + Tag Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTagDropdownId(
                                  isTagPickerOpen ? null : `desktop-${lead.id}`,
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Adicionar tag ao lead"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Tag</span>
                            </button>

                            {isTagPickerOpen && (
                              <div className="absolute top-full left-0 mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 flex flex-col gap-1 min-w-[160px] animate-in fade-in-50 zoom-in-95">
                                <span className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Tags Rápidas
                                </span>
                                {AVAILABLE_TAGS.map((t) => {
                                  const isSelected = currentTags.includes(t.name)
                                  return (
                                    <button
                                      key={t.name}
                                      type="button"
                                      onClick={() => {
                                        void toggleLeadTag(lead, t.name)
                                        setActiveTagDropdownId(null)
                                      }}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-all ${
                                        isSelected
                                          ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span>{t.icon}</span>
                                        <span>{t.name}</span>
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-orange-500" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mensagem / Interesse */}
                      <td className="py-4 px-4 align-middle max-w-[220px]">
                        {parsedMsg ? (
                          <div className="space-y-1">
                            {parsedMsg.isBot && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                                <Bot className="w-2.5 h-2.5" />
                                Chatbot
                              </span>
                            )}
                            <p
                              className="text-xs text-slate-600 dark:text-slate-300 truncate"
                              title={parsedMsg.text}
                            >
                              {parsedMsg.text || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 pl-2">
                            —
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4 align-middle text-center">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              lead.id,
                              e.target
                                .value as "Novo" | "Em Atendimento" | "Concluído",
                            )
                          }
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border cursor-pointer transition-all shadow-2xs ${
                            lead.status === "Novo"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50"
                              : lead.status === "Em Atendimento"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50"
                          }`}
                        >
                          <option value="Novo">🔵 Novo</option>
                          <option value="Em Atendimento">🟠 Atendimento</option>
                          <option value="Concluído">🟢 Concluído</option>
                        </select>
                      </td>

                      {/* Data */}
                      <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-4 px-5 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={getWhatsAppUrl(
                              lead.name,
                              lead.whatsapp,
                              currentTags,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center gap-1.5 no-underline shadow-2xs transition-all active:scale-95"
                            title="Abrir WhatsApp com mensagem pronta"
                          >
                            <IcoWhatsApp s={14} />
                            <span>Conversar</span>
                          </a>

                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                              title="Enviar e-mail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Cards View for Mobile ── */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Nenhum lead encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const currentTags = getLeadTags(lead)
              const isTagPickerOpen = activeTagDropdownId === `mobile-${lead.id}`
              const parsedMsg = parseMessage(lead.message)

              return (
                <div key={lead.id} className="p-4 space-y-3.5">
                  {/* Header: Avatar, Name, Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8451f] to-[#ff7a59] text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {lead.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <select
                      value={lead.status}
                      onChange={(e) =>
                        void handleStatusChange(
                          lead.id,
                          e.target
                            .value as "Novo" | "Em Atendimento" | "Concluído",
                        )
                      }
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                        lead.status === "Novo"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                          : lead.status === "Em Atendimento"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      <option value="Novo">Novo</option>
                      <option value="Em Atendimento">Atendimento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>

                  {/* WhatsApp & Email info */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        WhatsApp:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {lead.whatsapp}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyPhone(lead.id, lead.whatsapp)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {lead.email && (
                      <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          E-mail:
                        </span>
                        <a
                          href={`mailto:${lead.email}`}
                          className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                        >
                          {lead.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Message preview */}
                  {parsedMsg && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/30 p-2.5 rounded-xl">
                      {parsedMsg.isBot && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 mb-1">
                          <Bot className="w-2.5 h-2.5" />
                          Chatbot
                        </span>
                      )}
                      <p className="line-clamp-2 italic">"{parsedMsg.text}"</p>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentTags.map((tagName) => {
                      const tagDef = AVAILABLE_TAGS.find((t) => t.name === tagName)
                      return (
                        <span
                          key={tagName}
                          onClick={() => void toggleLeadTag(lead, tagName)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            tagDef
                              ? `${tagDef.bgLight} ${tagDef.bgDark}`
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span>{tagDef?.icon}</span>
                          <span>{tagName}</span>
                          <span className="opacity-50">×</span>
                        </span>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTagDropdownId(
                          isTagPickerOpen ? null : `mobile-${lead.id}`,
                        )
                      }
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      + Tag
                    </button>
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-1 flex gap-2">
                    <a
                      href={getWhatsAppUrl(lead.name, lead.whatsapp, currentTags)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 no-underline shadow-2xs"
                    >
                      <IcoWhatsApp s={15} />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadsManager
