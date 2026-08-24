import React, { useState } from "react"
import { Lead, updateLeadTags } from "../../services/storeService"
import { IcoSearch, IcoWhatsApp } from "../Icons"

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
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: "🟡",
  },
  {
    name: "Urgente",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: "🔴",
  },
  {
    name: "Balcão",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: "🔵",
  },
  {
    name: "Orçamento Grande",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: "🟢",
  },
  {
    name: "Follow-up",
    color:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: "🟣",
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
  const [activeTagDropdownId, setActiveTagDropdownId] = useState<string | null>(
    null,
  )

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

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.whatsapp.includes(leadSearch) ||
      (lead.email &&
        lead.email.toLowerCase().includes(leadSearch.toLowerCase()))
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

  return (
    <div className="p-6">
      <div className="premium-card">
        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div
            className="flex-1 dashboard-search-bar w-full"
            style={{ width: "auto" }}
          >
            <IcoSearch />
            <input
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar por nome, whatsapp, e-mail ou mensagem..."
              className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Status:
              </span>
              <select
                value={leadStatusFilter}
                onChange={(e) =>
                  setLeadStatusFilter(
                    e.target
                      .value as "Todos" | "Novo" | "Em Atendimento" | "Concluído",
                  )
                }
                className="dashboard-select px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
              >
                <option value="Todos">Todos ({leads.length})</option>
                <option value="Novo">
                  Novo ({leads.filter((l) => l.status === "Novo").length})
                </option>
                <option value="Em Atendimento">
                  Em Atendimento (
                  {leads.filter((l) => l.status === "Em Atendimento").length})
                </option>
                <option value="Concluído">
                  Concluído (
                  {leads.filter((l) => l.status === "Concluído").length})
                </option>
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Tag:
              </span>
              <select
                value={leadTagFilter}
                onChange={(e) => setLeadTagFilter(e.target.value)}
                className="dashboard-select px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
              >
                <option value="Todas">Todas as Tags</option>
                {AVAILABLE_TAGS.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={exportToCsv}
              disabled={filteredLeads.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Baixar lista em formato CSV / Excel"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Responsive Leads cards for mobile */}
        <div className="admin-mobile-leads-cards-container">
          {filteredLeads.length === 0 ? (
            <div className="py-8 text-center text-slate-400 italic text-xs">
              Nenhum lead encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const currentTags = getLeadTags(lead)
              const isTagPickerOpen = activeTagDropdownId === `mobile-${lead.id}`

              return (
                <div
                  key={lead.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm"
                >
                  {/* Header: Avatar, Info, Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-sm">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {lead.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">
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
                      className={`shrink-0 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg border-none cursor-pointer ${
                        lead.status === "Novo"
                          ? "badge-progress"
                          : lead.status === "Em Atendimento"
                            ? "badge-pending"
                            : "badge-completed"
                      }`}
                    >
                      <option value="Novo">Novo</option>
                      <option value="Em Atendimento">Atend.</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>

                  {/* Tags Section */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {currentTags.map((tagName) => {
                      const tagDef = AVAILABLE_TAGS.find(
                        (t) => t.name === tagName,
                      )
                      return (
                        <span
                          key={tagName}
                          onClick={() => void toggleLeadTag(lead, tagName)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                            tagDef?.color || "bg-slate-100 text-slate-600"
                          }`}
                          title="Clique para remover esta tag"
                        >
                          <span>{tagDef?.icon || "🏷️"}</span>
                          <span>{tagName}</span>
                          <span className="opacity-60 hover:opacity-100 ml-0.5">
                            ×
                          </span>
                        </span>
                      )
                    })}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTagDropdownId(
                            isTagPickerOpen ? null : `mobile-${lead.id}`,
                          )
                        }
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        + Tag
                      </button>

                      {isTagPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 flex flex-col gap-1 min-w-[140px]">
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
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-left transition-all ${
                                  isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>{t.icon}</span>
                                  <span>{t.name}</span>
                                </span>
                                {isSelected && <span>✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body: Contact Details Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col gap-2.5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                        WhatsApp
                      </span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                        {lead.whatsapp}
                      </span>
                    </div>

                    {lead.email && (
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="flex flex-col overflow-hidden pr-2">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                            E-mail
                          </span>
                          <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 truncate">
                            {lead.email}
                          </span>
                        </div>
                        <a
                          href={`mailto:${lead.email}`}
                          className="p-2 shrink-0 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                          title="Enviar E-mail"
                        >
                          ✉️
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Message Box */}
                  {lead.message && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 italic px-1 line-clamp-3">
                      <span className="text-slate-300 dark:text-slate-600 mr-1">
                        "
                      </span>
                      {lead.message}
                      <span className="text-slate-300 dark:text-slate-600 ml-1">
                        "
                      </span>
                    </div>
                  )}

                  {/* Footer Actions: Symmetrical Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <a
                      href={getWhatsAppUrl(
                        lead.name,
                        lead.whatsapp,
                        currentTags,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 no-underline shadow-sm transition-all"
                    >
                      <IcoWhatsApp s={15} />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyPhone(lead.id, lead.whatsapp)}
                      className="py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>
                        {copiedId === lead.id ? "✓ Copiado" : "📋 Copiar"}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Responsive Leads table for Desktop */}
        <div className="admin-desktop-leads-table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>E-mail</th>
                <th>Tags</th>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Data</th>
                <th className="text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic text-xs"
                  >
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const currentTags = getLeadTags(lead)
                  const isTagPickerOpen =
                    activeTagDropdownId === `desktop-${lead.id}`

                  return (
                    <tr key={lead.id}>
                      <td>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {lead.name}
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400 font-bold text-xs">
                        {lead.whatsapp}
                      </td>
                      <td className="text-slate-500 dark:text-slate-400 text-xs">
                        {lead.email || "-"}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                          {currentTags.map((tagName) => {
                            const tagDef = AVAILABLE_TAGS.find(
                              (t) => t.name === tagName,
                            )
                            return (
                              <span
                                key={tagName}
                                onClick={() =>
                                  void toggleLeadTag(lead, tagName)
                                }
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                  tagDef?.color || "bg-slate-100 text-slate-600"
                                }`}
                                title="Remover tag"
                              >
                                <span>{tagDef?.icon}</span>
                                <span>{tagName}</span>
                                <span className="opacity-50 hover:opacity-100">
                                  ×
                                </span>
                              </span>
                            )
                          })}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTagDropdownId(
                                  isTagPickerOpen ? null : `desktop-${lead.id}`,
                                )
                              }
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Adicionar tag"
                            >
                              + Tag
                            </button>

                            {isTagPickerOpen && (
                              <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 flex flex-col gap-1 min-w-[140px]">
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
                                      className={`flex items-center justify-between px-2 py-1 rounded text-xs font-bold text-left transition-all ${
                                        isSelected
                                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <span>{t.icon}</span>
                                        <span>{t.name}</span>
                                      </span>
                                      {isSelected && <span>✓</span>}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-xs truncate text-slate-500 dark:text-slate-400 text-xs italic">
                        {lead.message || "-"}
                      </td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              lead.id,
                              e.target
                                .value as "Novo" | "Em Atendimento" | "Concluído",
                            )
                          }
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border-none cursor-pointer ${
                            lead.status === "Novo"
                              ? "badge-progress"
                              : lead.status === "Em Atendimento"
                                ? "badge-pending"
                                : "badge-completed"
                          }`}
                        >
                          <option value="Novo">Novo</option>
                          <option value="Em Atendimento">Atendimento</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </td>
                      <td className="text-xs text-slate-400 font-semibold">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={getWhatsAppUrl(
                              lead.name,
                              lead.whatsapp,
                              currentTags,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1 no-underline transition-all"
                            title="Abrir conversa no WhatsApp"
                          >
                            <IcoWhatsApp s={14} />
                            <span className="font-extrabold text-[11px]">
                              Conversar
                            </span>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyPhone(lead.id, lead.whatsapp)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="Copiar número"
                          >
                            {copiedId === lead.id ? "✓" : "📋"}
                          </button>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 no-underline"
                              title="Enviar E-mail"
                            >
                              ✉️
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
      </div>
    </div>
  )
}
export default LeadsManager
