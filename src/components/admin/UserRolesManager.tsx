import React, { useState } from "react"
import { DashboardRole, DashboardUserRecord } from "../../types/dashboardUser"

interface UserRolesManagerProps {
  authorizedEmail: string
  dashboardUsers: DashboardUserRecord[]
  loadingUsers: boolean
  addDashboardUser: (
    email: string,
    role: DashboardRole,
    displayName?: string,
  ) => Promise<void>
  updateUserRole: (email: string, role: DashboardRole) => Promise<void>
  approveUserAccess: (email: string, role: DashboardRole) => Promise<void>
  deleteDashboardUser: (email: string) => Promise<void>
}

export function UserRolesManager({
  authorizedEmail,
  dashboardUsers,
  loadingUsers,
  addDashboardUser,
  updateUserRole,
  approveUserAccess,
  deleteDashboardUser,
}: UserRolesManagerProps) {
  const [manualEmail, setManualEmail] = useState("")
  const [manualRole, setManualRole] = useState<DashboardRole>("viewer")
  const [pendingRoles, setPendingRoles] = useState<Record<string, DashboardRole>>({})
  const [savingEmail, setSavingEmail] = useState<string | null>(null)

  const pendingUsers = dashboardUsers.filter((u) => u.status === "pending")
  const approvedUsers = dashboardUsers.filter((u) => u.status === "approved")

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualEmail.trim()) return
    setSavingEmail("manual")
    try {
      await addDashboardUser(manualEmail.trim(), manualRole)
      setManualEmail("")
      setManualRole("viewer")
    } finally {
      setSavingEmail(null)
    }
  }

  const handleApprove = async (user: DashboardUserRecord) => {
    const role = pendingRoles[user.email] || user.role || "viewer"
    setSavingEmail(user.email)
    try {
      await approveUserAccess(user.email, role)
    } finally {
      setSavingEmail(null)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* ── 1. SOLICITAÇÕES PENDENTES (Se houver) ── */}
      {pendingUsers.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/30 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl animate-bounce">🔔</span>
            <h4 className="text-md font-extrabold text-amber-700 dark:text-amber-400">
              Solicitações de Acesso Pendentes ({pendingUsers.length})
            </h4>
          </div>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mb-5">
            Os seguintes usuários fizeram login e solicitaram autorização para acessar o painel. Escolha o nível de acesso e aprove:
          </p>

          <div className="flex flex-col gap-3">
            {pendingUsers.map((pUser) => {
              const selectedRole =
                pendingRoles[pUser.email] || pUser.role || "viewer"

              return (
                <div
                  key={pUser.email}
                  className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {pUser.photoURL ? (
                      <img
                        src={pUser.photoURL}
                        alt={pUser.displayName || pUser.email}
                        className="w-10 h-10 rounded-full border border-amber-500/20 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 font-extrabold flex items-center justify-center text-sm">
                        {pUser.displayName?.[0] || pUser.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                        {pUser.displayName || "Usuário Google"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {pUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setPendingRoles({
                          ...pendingRoles,
                          [pUser.email]: e.target.value as DashboardRole,
                        })
                      }
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="viewer">👀 Leitor (Somente Leitura)</option>
                      <option value="admin">⚡ Administrador (Acesso Total)</option>
                    </select>

                    <button
                      type="button"
                      disabled={savingEmail === pUser.email}
                      onClick={() => handleApprove(pUser)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>✓ Aprovar Acesso</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingEmail === pUser.email}
                      onClick={() => deleteDashboardUser(pUser.email)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-colors cursor-pointer"
                      title="Recusar solicitação"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 2. CONCEDER ACESSO MANUALMENTE ── */}
      <div className="premium-card">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h4 className="text-md font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              👥 Conceder Acesso Antecipado
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Adicione e-mails para pré-autorizar novos membros antes mesmo de fazerem o primeiro login.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="email"
            placeholder="Digite o e-mail Google do colaborador..."
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-[#e8451f] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
          />

          <select
            value={manualRole}
            onChange={(e) => setManualRole(e.target.value as DashboardRole)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="viewer">👀 Leitor (Somente Leitura)</option>
            <option value="admin">⚡ Administrador (Acesso Total)</option>
          </select>

          <button
            type="submit"
            disabled={savingEmail === "manual"}
            className="bg-[#e8451f] hover:bg-[#c83214] font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-white disabled:opacity-50"
          >
            + Conceder Acesso
          </button>
        </form>

        {/* ── 3. LISTA DE USUÁRIOS ATIVOS / AUTORIZADOS ── */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 overflow-hidden">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Usuário / E-mail</th>
                <th>Nível de Acesso</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Master Owner Row */}
              <tr>
                <td className="font-extrabold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{authorizedEmail}</span>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                      PROPRIETÁRIO / MASTER
                    </span>
                  </div>
                </td>
                <td className="text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-extrabold">
                    👑 Administrador Total
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>-</td>
              </tr>

              {loadingUsers ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                    Carregando usuários autorizados...
                  </td>
                </tr>
              ) : (
                approvedUsers.map((aUser) => (
                  <tr key={aUser.email}>
                    <td>
                      <div className="flex items-center gap-3">
                        {aUser.photoURL ? (
                          <img
                            src={aUser.photoURL}
                            alt={aUser.displayName || aUser.email}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold flex items-center justify-center text-xs">
                            {aUser.displayName?.[0] || aUser.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                            {aUser.displayName || aUser.email}
                          </p>
                          {aUser.displayName && (
                            <p className="text-[11px] text-slate-400">{aUser.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={aUser.role}
                        onChange={(e) =>
                          updateUserRole(aUser.email, e.target.value as DashboardRole)
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold border focus:outline-none cursor-pointer transition-all ${
                          aUser.role === "admin"
                            ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                            : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        <option value="admin">⚡ Administrador (Total)</option>
                        <option value="viewer">👀 Leitor (Visualização)</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => deleteDashboardUser(aUser.email)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
                      >
                        Remover Acesso
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {!loadingUsers && approvedUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                    Nenhum outro usuário autorizado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserRolesManager
