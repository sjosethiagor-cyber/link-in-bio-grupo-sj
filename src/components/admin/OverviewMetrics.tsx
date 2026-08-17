import React, { useMemo } from "react"
import { ClickEvent, Lead, StoreLink } from "../../services/storeService"

interface OverviewMetricsProps {
  clicks: ClickEvent[]
  leads: Lead[]
  mlLinks: StoreLink[]
  shopeeLinks: StoreLink[]
  loadData: () => Promise<void>
  setActiveTab: (tab: "metrics" | "leads" | "cms" | "ads" | "users") => void
}

export function OverviewMetrics({
  clicks,
  leads,
  mlLinks,
  shopeeLinks,
  loadData,
  setActiveTab,
}: OverviewMetricsProps) {
  // Memoized calculations for fast re-renders
  const {
    totalClicks,
    totalLeads,
    mlClicks,
    shopeeClicks,
    socialClicks,
    contactClicks,
    pctSocial,
    pctContact,
    pctML,
    pctShopee,
    activeLeadsCount,
    completedLeadsCount,
    leadsProgressPct,
  } = useMemo(() => {
    const tClicks = clicks.length
    const tLeads = leads.length
    const ml = clicks.filter((c) => c.category === "Mercado Livre").length
    const shopee = clicks.filter((c) => c.category === "Shopee").length
    const social = clicks.filter((c) => c.category === "Rede Social").length
    const contact = clicks.filter((c) => c.category === "Contato").length

    const maxClicks = Math.max(social, contact, ml, shopee, 1)
    const pSocial = Math.round((social / maxClicks) * 100)
    const pContact = Math.round((contact / maxClicks) * 100)
    const pML = Math.round((ml / maxClicks) * 100)
    const pShopee = Math.round((shopee / maxClicks) * 100)

    const active = leads.filter((l) => l.status === "Em Atendimento").length
    const completed = leads.filter((l) => l.status === "Concluído").length
    const progress =
      tLeads > 0 ? Math.round(((active + completed) / tLeads) * 100) : 0

    return {
      totalClicks: tClicks,
      totalLeads: tLeads,
      mlClicks: ml,
      shopeeClicks: shopee,
      socialClicks: social,
      contactClicks: contact,
      pctSocial: pSocial,
      pctContact: pContact,
      pctML: pML,
      pctShopee: pShopee,
      activeLeadsCount: active,
      completedLeadsCount: completed,
      leadsProgressPct: progress,
    }
  }, [clicks, leads])

  const getMlSubLinkClicks = (subName: string) => {
    return clicks.filter(
      (c) =>
        c.category === "Mercado Livre" &&
        c.linkName.toLowerCase().includes((subName || "").toLowerCase()),
    ).length
  }

  const getShopeeSubLinkClicks = (subName: string) => {
    return clicks.filter(
      (c) =>
        c.category === "Shopee" &&
        c.linkName.toLowerCase().includes((subName || "").toLowerCase()),
    ).length
  }

  return (
    <div className="dashboard-metrics-container">
      {/* 1. TOP ROW: Stat Cards */}
      <div className="metrics-summary-grid">
        {/* CARD 1: Clicks Totais */}
        <div className="stat-card">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cliques Totais
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {totalClicks}
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                ↑ 14%
              </span>
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

            <div className="grid grid-cols-2 gap-4">
              {/* ML Sub-stores */}
              <div className="p-4 bg-amber-50/20 dark:bg-amber-950/5 rounded-2xl border border-amber-100/30 dark:border-amber-900/10 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 tracking-wider uppercase block">
                  🛍️ Lojas Mercado Livre
                </span>
                <div className="flex flex-col gap-2">
                  {mlLinks.slice(0, 3).map((store) => (
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
                  🛒 Lojas Shopee
                </span>
                <div className="flex flex-col gap-2">
                  {shopeeLinks.slice(0, 3).map((store) => (
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
