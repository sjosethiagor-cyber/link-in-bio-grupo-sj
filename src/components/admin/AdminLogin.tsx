import React from "react"
import { User } from "firebase/auth"
import { IcoGoogle } from "../Icons"
import { DashboardUserRecord } from "../../types/dashboardUser"

interface AdminLoginProps {
  theme: "light" | "dark"
  user: User | null
  authError: string | null
  authLoading: boolean
  userRecord: DashboardUserRecord | null
  isRequestingAccess: boolean
  handleGoogleLogin: () => void
  handleRequestAccess: () => void
  handleLogout: () => void
  navigateBack: () => void
}

export function AdminLogin({
  theme,
  user,
  authError,
  authLoading,
  userRecord,
  isRequestingAccess,
  handleGoogleLogin,
  handleRequestAccess,
  handleLogout,
  navigateBack,
}: AdminLoginProps) {
  const isPending = userRecord?.status === "pending"

  return (
    <div
      className={`dashboard-portal-theme ${
        theme === "light" ? "light-theme" : "dark-theme"
      } flex items-center justify-center min-h-screen w-screen bg-[var(--bg-main)] relative overflow-hidden`}
    >
      {/* Ambient Glowing Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#e8451f]/15 to-[#ff7a59]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-md w-[90%] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.35)] hover:border-slate-200 dark:hover:border-slate-700">
        
        {/* Animated icon container */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative group overflow-hidden ${
            isPending
              ? "bg-amber-500/10 border border-amber-500/30 text-amber-500"
              : "bg-gradient-to-br from-[#e8451f]/10 to-[#ff7a59]/10 border border-[#e8451f]/20 dark:border-[#e8451f]/30 text-[#e8451f]"
          }`}
        >
          {isPending ? (
            <span className="text-2xl animate-pulse">⏳</span>
          ) : (
            <svg
              className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
          {isPending ? "Solicitação em Análise" : "Área Restrita"}
        </h2>

        {user ? (
          <>
            {isPending ? (
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Aguardando Liberação
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sua solicitação de acesso para a conta{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {user.email}
                  </strong>{" "}
                  foi enviada ao Administrador Principal.
                  <br />
                  <span className="text-xs text-slate-400 mt-2 block">
                    Assim que o acesso for concedido (como Administrador ou Leitor), esta tela será liberada automaticamente.
                  </span>
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Você está conectado como{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {user.email}
                  </strong>
                  , mas ainda não possui permissão de acesso ao painel.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clique no botão abaixo para solicitar aprovação de acesso ao Administrador.
                </p>
              </div>
            )}

            {authError && (
              <div className="bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl text-left mb-5">
                ⚠️ {authError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!isPending && (
                <button
                  type="button"
                  onClick={handleRequestAccess}
                  disabled={isRequestingAccess}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e8451f] to-[#ff5722] hover:opacity-95 text-white font-extrabold text-sm shadow-[0_4px_16px_rgba(232,69,31,0.3)] transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  <span>{isRequestingAccess ? "Enviando solicitação..." : "🚀 Solicitar Acesso ao Administrador"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔄 Alternar Conta do Google</span>
              </button>

              <button
                type="button"
                onClick={navigateBack}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Faça login com sua conta Google para acessar o painel de controle ou solicitar permissão.
            </p>

            {authError && (
              <div className="bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl text-left mb-5">
                ⚠️ {authError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <IcoGoogle s={20} />
                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                  {authLoading ? "Verificando..." : "Entrar com Google"}
                </span>
              </button>
              <button
                type="button"
                onClick={navigateBack}
                className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold text-sm">
                  Voltar ao Início
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default AdminLogin
