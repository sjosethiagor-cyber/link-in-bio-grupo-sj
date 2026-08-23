import React, { useMemo, useState } from "react"
import { ClickEvent, Lead, StoreLink } from "../../services/storeService"

interface OverviewMetricsProps {
  clicks: ClickEvent[]
  leads: Lead[]
  mlLinks: StoreLink[]
  shopeeLinks: StoreLink[]
  tiktokLinks?: StoreLink[]
  loadData: () => Promise<void>
  setActiveTab: (tab: "metrics" | "leads" | "cms" | "ads" | "users") => void
}

type TimeRange = "all" | "today" | "7days" | "30days" | "this_month"

export function OverviewMetrics({
  clicks,
  leads,
  mlLinks,
  shopeeLinks,
  tiktokLinks = [],
  loadData,
  setActiveTab,
}: OverviewMetricsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all")

  // Filter clicks and leads based on selected time range
  const { filteredClicks, filteredLeads, timeRangeLabel } = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const startOf7Days = startOfToday - 6 * 24 * 60 * 60 * 1000
    const startOf30Days = startOfToday - 29 * 24 * 60 * 60 * 1000
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime()

    let label = "Todo o período"
    const matchTime = (timestamp: number) => {
      if (timeRange === "today") return timestamp >= startOfToday
      if (timeRange === "7days") return timestamp >= startOf7Days
      if (timeRange === "30days") return timestamp >= startOf30Days
      if (timeRange === "this_month") return timestamp >= startOfMonth
      return true
    }

    if (timeRange === "today") label = "Hoje"
    else if (timeRange === "7days") label = "Últimos 7 dias"
    else if (timeRange === "30days") label = "Últimos 30 dias"
    else if (timeRange === "this_month") label = "Este mês"

    return {
      filteredClicks: clicks.filter((c) => matchTime(c.timestamp)),
      filteredLeads: leads.filter((l) => matchTime(l.createdAt)),
      timeRangeLabel: label,
    }
  }, [clicks, leads, timeRange])

  // Memoized calculations for fast re-renders based on filtered data
  const {
    totalClicks,
    totalLeads,
    mlClicks,
    shopeeClicks,
    tiktokClicks,
    socialClicks,
    contactClicks,
    pctSocial,
    pctContact,
    pctML,
    pctShopee,
    pctTikTok,
    activeLeadsCount,
    completedLeadsCount,
    leadsProgressPct,
  } = useMemo(() => {
    const tClicks = filteredClicks.length
    const tLeads = filteredLeads.length
    const ml = filteredClicks.filter(
      (c) => c.category === "Mercado Livre",
    ).length
    const shopee = filteredClicks.filter((c) => c.category === "Shopee").length
    const tiktok = filteredClicks.filter(
      (c) => c.category === "TikTok" || c.category === "TikTok Shop",
    ).length
    const social = filteredClicks.filter(
      (c) => c.category === "Rede Social",
    ).length
    const contact = filteredClicks.filter(
      (c) => c.category === "Contato",
    ).length

    const maxClicks = Math.max(social, contact, ml, shopee, tiktok, 1)
    const pSocial = Math.round((social / maxClicks) * 100)
    const pContact = Math.round((contact / maxClicks) * 100)
    const pML = Math.round((ml / maxClicks) * 100)
    const pShopee = Math.round((shopee / maxClicks) * 100)
    const pTikTok = Math.round((tiktok / maxClicks) * 100)

    const active = filteredLeads.filter(
      (l) => l.status === "Em Atendimento",
    ).length
    const completed = filteredLeads.filter(
      (l) => l.status === "Concluído",
    ).length
    const progress =
      tLeads > 0 ? Math.round(((active + completed) / tLeads) * 100) : 0

    return {
      totalClicks: tClicks,
      totalLeads: tLeads,
      mlClicks: ml,
      shopeeClicks: shopee,
      tiktokClicks: tiktok,
      socialClicks: social,
      contactClicks: contact,
      pctSocial: pSocial,
      pctContact: pContact,
      pctML: pML,
      pctShopee: pShopee,
      pctTikTok: pTikTok,
      activeLeadsCount: active,
      completedLeadsCount: completed,
      leadsProgressPct: progress,
    }
  }, [filteredClicks, filteredLeads])

  const getMlSubLinkClicks = (subName: string) => {
    return filteredClicks.filter(
      (c) =>
        c.category === "Mercado Livre" &&
        c.linkName.toLowerCase().includes((subName || "").toLowerCase()),
    ).length
  }

  const getShopeeSubLinkClicks = (subName: string) => {
    return filteredClicks.filter(
      (c) =>
        c.category === "Shopee" &&
        c.linkName.toLowerCase().includes((subName || "").toLowerCase()),
    ).length
  }

  const getTikTokSubLinkClicks = (subName: string) => {
    return filteredClicks.filter(
      (c) =>
        (c.category === "TikTok" || c.category === "TikTok Shop") &&
        c.linkName.toLowerCase().includes((subName || "").toLowerCase()),
    ).length
  }

  return (
    <div className="dashboard-metrics-container flex flex-col gap-6">
      {/* ── Time Range Filter Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Período de Análise
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Filtrando métricas por:{" "}
              <strong className="text-[#e8451f]">{timeRangeLabel}</strong> (
              {totalClicks} cliques · {totalLeads} leads)
            </p>
          </div>
        </div>

        {/* Time range pills */}
        <div className="flex w-full sm:w-auto items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {([
            { id: "all", label: "Todo o histórico", short: "Tudo" },
            { id: "today", label: "Hoje", short: "Hoje" },
            { id: "7days", label: "7 dias", short: "7D" },
            { id: "30days", label: "30 dias", short: "30D" },
            { id: "this_month", label: "Este mês", short: "Mês" },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimeRange(item.id)}
              className={`flex-1 sm:flex-none text-center px-1 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === item.id
                  ? "bg-white dark:bg-slate-900 text-[#e8451f] shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span className="hidden sm:inline">{item.label}</span>
              <span className="inline sm:hidden">{item.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. TOP ROW: Stat Cards */}
      <div className="metrics-summary-grid">
        {/* CARD 1: Clicks Totais */}
        <div className="stat-card">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cliques no Período
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {totalClicks}
              </h3>
              {timeRange !== "all" && (
                <span className="text-[10px] font-bold text-slate-400">
                  de {clicks.length} total
                </span>
              )}
            </div>
          </div>
          <div className="stat-icon-wrapper bg-orange-50 dark:bg-orange-950/20 text-[#e8451f]">
            👆
          </div>
        </div>

        {/* CARD 2: Leads Coletados */}
        <div className="stat-card">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Leads Coletados
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {totalLeads}
            </h3>
          </div>
          <div className="stat-icon-wrapper bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            ✉️
          </div>
        </div>

        {/* CARD 3: ML Clicks */}
        <div className="stat-card">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cliques M. Livre
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {mlClicks}
            </h3>
          </div>
          <div className="stat-icon-wrapper bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            🛍️
          </div>
        </div>

        {/* CARD 4: Shopee Clicks */}
        <div className="stat-card">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cliques Shopee
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {shopeeClicks}
            </h3>
          </div>
          <div className="stat-icon-wrapper bg-red-50 dark:bg-red-950/20 text-red-500">
            🛒
          </div>
        </div>
      </div>

      {/* 2. BODY LAYOUT */}
      <div className="metrics-body-layout">
        {/* LEFT COLUMN: Chart & Store Breakdown */}
        <div className="flex flex-col gap-6">
          {/* Performance Chart */}
          <div className="premium-card">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Performance por Rede
              </h4>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cliques CTR
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              Comparação do tráfego das redes vs e-commerces.
            </p>

            {/* Chart Bar widget */}
            <div className="chart-container">
              <div className="chart-bar-wrapper">
                <div className="chart-bar-group">
                  <div
                    className="chart-bar-orange"
                    style={{ height: `${pctSocial}%` }}
                    title={`Redes: ${socialClicks}`}
                  ></div>
                  <div
                    className="chart-bar-dark"
                    style={{ height: `${pctContact}%` }}
                    title={`Contatos: ${contactClicks}`}
                  ></div>
                </div>
                <span className="chart-label">Soc/Cont</span>
              </div>

              <div className="chart-bar-wrapper">
                <div className="chart-bar-group">
                  <div
                    className="chart-bar-orange"
                    style={{ height: `${pctML}%` }}
                    title={`ML: ${mlClicks}`}
                  ></div>
                  <div
                    className="chart-bar-dark"
                    style={{ height: `${pctSocial}%` }}
                    title={`Redes: ${socialClicks}`}
                  ></div>
                </div>
                <span className="chart-label">ML vs Soc</span>
              </div>

              <div className="chart-bar-wrapper">
                <div className="chart-bar-group">
                  <div
                    className="chart-bar-orange"
                    style={{ height: `${pctShopee}%` }}
                    title={`Shopee: ${shopeeClicks}`}
                  ></div>
                  <div
                    className="chart-bar-dark"
                    style={{ height: `${pctML}%` }}
                    title={`ML: ${mlClicks}`}
                  ></div>
                </div>
                <span className="chart-label">Sho vs ML</span>
              </div>

              <div className="chart-bar-wrapper">
                <div className="chart-bar-group">
                  <div
                    className="chart-bar-orange"
                    style={{ height: `${pctML}%` }}
                    title={`ML: ${mlClicks}`}
                  ></div>
                  <div
                    className="chart-bar-dark"
                    style={{ height: `${pctShopee}%` }}
                    title={`Shopee: ${shopeeClicks}`}
                  ></div>
                </div>
                <span className="chart-label">ML/Shopee</span>
              </div>
            </div>

            {/* Legends */}
            <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-gradient-to-tr from-[#ff7a59] to-[#e8451f]"></span>
                <span className="text-slate-500 dark:text-slate-400">
                  Métrica A
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 dark:bg-slate-200"></span>
                <span className="text-slate-500 dark:text-slate-400">
                  Métrica B
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown por Loja */}
          <div className="premium-card">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Breakdown por Loja
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              Distribuição de cliques nos links específicos de cada marketplace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ML Sub-stores */}
              <div className="p-4 bg-amber-50/20 dark:bg-amber-950/5 rounded-2xl border border-amber-100/30 dark:border-amber-900/10 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 tracking-wider uppercase block">
                  🛍️ Mercado Livre ({mlClicks})
                </span>
                <div className="flex flex-col gap-2">
                  {mlLinks.map((store) => (
                    <div
                      key={store.id}
                      className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between"
                    >
                      <span>{store.name}</span>
                      <strong className="text-amber-700 dark:text-amber-400">
                        {getMlSubLinkClicks(store.name)}
                      </strong>
                    </div>
                  ))}
                  {mlLinks.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Nenhuma cadastrada
                    </span>
                  )}
                </div>
              </div>

              {/* Shopee Sub-stores */}
              <div className="p-4 bg-red-50/20 dark:bg-red-950/5 rounded-2xl border border-red-100/30 dark:border-red-900/10 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold text-red-700 dark:text-red-400 tracking-wider uppercase block">
                  🛒 Shopee ({shopeeClicks})
                </span>
                <div className="flex flex-col gap-2">
                  {shopeeLinks.map((store) => (
                    <div
                      key={store.id}
                      className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between"
                    >
                      <span>{store.name}</span>
                      <strong className="text-red-700 dark:text-red-400">
                        {getShopeeSubLinkClicks(store.name)}
                      </strong>
                    </div>
                  ))}
                  {shopeeLinks.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Nenhuma cadastrada
                    </span>
                  )}
                </div>
              </div>

              {/* TikTok Sub-stores */}
              <div className="p-4 bg-rose-50/20 dark:bg-rose-950/5 rounded-2xl border border-rose-100/30 dark:border-rose-900/10 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 tracking-wider uppercase block">
                  🎵 TikTok Shop ({tiktokClicks})
                </span>
                <div className="flex flex-col gap-2">
                  {tiktokLinks.map((store) => (
                    <div
                      key={store.id}
                      className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between"
                    >
                      <span>{store.name}</span>
                      <strong className="text-rose-600 dark:text-rose-400">
                        {getTikTokSubLinkClicks(store.name)}
                      </strong>
                    </div>
                  ))}
                  {tiktokLinks.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Nenhuma cadastrada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions, Leads, Access Cards */}
        <div className="flex flex-col gap-6">
          {/* Actions & Leads Progress */}
          <div className="premium-card flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Atendimento de Leads
                </h4>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeLeadsCount + completedLeadsCount}/{totalLeads} Leads
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#ff7a59] to-[#e8451f] rounded-full transition-all"
                  style={{ width: `${leadsProgressPct}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                Porcentagem de leads atendidos ou concluídos.
              </p>
            </div>

            {/* Quick Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const headers = "ID,Nome,WhatsApp,Email,Status,Data\n"
                  const rows = leads
                    .map(
                      (l) =>
                        `${l.id},"${l.name}",${l.whatsapp},${l.email || ""},${l.status},${new Date(l.createdAt).toLocaleDateString()}\n`,
                    )
                    .join("")
                  const blob = new Blob([headers + rows], {
                    type: "text/csv;charset=utf-8;",
                  })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.setAttribute("href", url)
                  link.setAttribute(
                    "download",
                    `leads_grupo_sj_${Date.now()}.csv`,
                  )
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="text-white font-extrabold text-xs">
                  ⚡ Exportar Leads
                </span>
              </button>
              <button
                onClick={loadData}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                  🔄 Atualizar
                </span>
              </button>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="premium-card">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Leads Recentes
              </h4>
              <button
                onClick={() => setActiveTab("leads")}
                className="text-xs font-bold text-[#e8451f] hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {leads.slice(0, 3).map((lead, idx) => {
                const initials = lead.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                const gradients = [
                  "from-sky-500 to-blue-600",
                  "from-emerald-500 to-teal-600",
                  "from-purple-500 to-indigo-600",
                ]
                const gradient = gradients[idx % gradients.length]
                return (
                  <div
                    key={lead.id}
                    className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between border border-slate-100/50 dark:border-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`avatar-initials bg-gradient-to-tr ${gradient}`}
                      >
                        {initials}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                          {lead.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                          {lead.whatsapp}
                        </span>
                      </div>
                    </div>
                    <span
                      className={
                        lead.status === "Novo"
                          ? "badge-progress"
                          : lead.status === "Em Atendimento"
                            ? "badge-pending"
                            : "badge-completed"
                      }
                    >
                      {lead.status}
                    </span>
                  </div>
                )
              })}
              {leads.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
                  Nenhum lead coletado ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default OverviewMetrics
