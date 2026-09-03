import React, { useState, useEffect, useRef, lazy, Suspense } from "react"
import {
  getClicks,
  getLeads,
  updateLeadStatus,
  getStoredMLStoreLinks,
  getStoredShopeeStoreLinks,
  getStoredTikTokStoreLinks,
  getStoredSocialLinks,
  getMLStoreLinks,
  getShopeeStoreLinks,
  getTikTokStoreLinks,
  getSocialLinks,
  saveStoredMLStoreLinks,
  saveStoredShopeeStoreLinks,
  saveStoredTikTokStoreLinks,
  saveStoredSocialLinks,
  type ClickEvent,
  type Lead,
  type StoreLink,
  type SocialLinks,
  DEFAULT_SOCIAL_LINKS,
} from "../services/storeService"
import {
  auth as mainAuth,
  googleProvider as mainGoogleProvider,
  isFirebaseConfigured,
  db,
} from "../lib/firebase"
import { centralAuth, centralGoogleProvider } from "../lib/centralFirebase"
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore"
import "./DashboardPortal.css"
import { lazyWithRetry } from "../utils/lazyWithRetry"

// Modular sub-components with Lazy Loading for maximum performance
import { AdminLogin } from "./admin/AdminLogin"
const OverviewMetrics = lazyWithRetry(
  () => import("./admin/OverviewMetrics").then((m) => ({ default: m.OverviewMetrics })),
  "OverviewMetrics",
)
const LeadsManager = lazyWithRetry(
  () => import("./admin/LeadsManager").then((m) => ({ default: m.LeadsManager })),
  "LeadsManager",
)
const LinksCMS = lazyWithRetry(
  () => import("./admin/LinksCMS").then((m) => ({ default: m.LinksCMS })),
  "LinksCMS",
)
const UserRolesManager = lazyWithRetry(
  () =>
    import("./admin/UserRolesManager").then((m) => ({
      default: m.UserRolesManager,
    })),
  "UserRolesManager",
)
const CentralDeAnuncios = lazyWithRetry(
  () => import("./CentralDeAnuncios"),
  "CentralDeAnuncios",
)
const PromptsManager = lazyWithRetry(
  () =>
    import("./admin/PromptsManager").then((m) => ({
      default: m.PromptsManager,
    })),
  "PromptsManager",
)
const Calculator3D = lazyWithRetry(
  () => import("./calculator3d/Calculator3D"),
  "Calculator3D",
)
import { DashboardRole, DashboardUserRecord } from "../types/dashboardUser"

// Import icons
import {
  IcoLogout,
  IcoGrid,
  IcoInbox,
  IcoDatabase,
  IcoLayers,
  IcoUsers,
  IcoChevronDown,
  IcoSearch,
  IcoBell,
  IcoInfo,
  IcoSparkles,
  IcoPrinter3D,
} from "./Icons"

const AUTHORIZED_EMAIL = "sjosethiago.r@gmail.com"

interface DashboardPortalProps {
  navigateBack: () => void
  initialTab?: "metrics" | "leads" | "cms" | "ads" | "prompts" | "calc3d" | "users"
}

// ── Main Dashboard Portal Component ───────────────────────────────────────────

export default function DashboardPortal({
  navigateBack,
  initialTab = "metrics",
}: DashboardPortalProps) {
  const [activeTab, setActiveTab] =
    useState<"metrics" | "leads" | "cms" | "ads" | "prompts" | "calc3d" | "users">(
      initialTab,
    )
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [mlLinks, setMlLinks] = useState<StoreLink[]>([])
  const [shopeeLinks, setShopeeLinks] = useState<StoreLink[]>([])
  const [tiktokLinks, setTiktokLinks] = useState<StoreLink[]>([])
  const [socialLinks, setSocialLinks] =
    useState<SocialLinks>(DEFAULT_SOCIAL_LINKS)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [loading, setLoading] = useState(true)
  const [cmsSavedSuccess, setCmsSavedSuccess] = useState(false)

  const centralRef = useRef<any>(null)
  const [, setCentralSession] = useState<any>(null)

  // Authentication & Access Control State
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isMainAdminAuthorized, setIsMainAdminAuthorized] =
    useState<boolean>(false)
  const [currentUserRole, setCurrentUserRole] =
    useState<"owner" | "admin" | "viewer" | null>(null)
  const [currentUserRecord, setCurrentUserRecord] =
    useState<DashboardUserRecord | null>(null)
  const [isRequestingAccess, setIsRequestingAccess] = useState(false)

  const [dashboardUsers, setDashboardUsers] = useState<DashboardUserRecord[]>(
    [],
  )
  const [loadingUsers, setLoadingUsers] = useState(false)

  const isReadOnly = currentUserRole === "viewer"

  const loadDashboardUsers = async () => {
    if (!db || !isFirebaseConfigured) return
    setLoadingUsers(true)
    try {
      const snap = await getDocs(collection(db, "dashboard_users"))
      const records: DashboardUserRecord[] = []
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        records.push({
          email: docSnap.id,
          displayName: data.displayName || "",
          photoURL: data.photoURL || "",
          role: data.role || "viewer",
          status: data.status || "approved",
          requestedAt: data.requestedAt || "",
          approvedAt: data.approvedAt || "",
        })
      })
      setDashboardUsers(records)
    } catch (e) {
      console.error("Error loading dashboard users:", e)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleRequestAccess = async () => {
    if (!user || !db || !isFirebaseConfigured) return
    setIsRequestingAccess(true)
    setAuthError(null)
    const cleanEmail = user.email?.trim().toLowerCase() || ""

    try {
      const newRecord: DashboardUserRecord = {
        email: cleanEmail,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        status: "pending",
        role: "viewer",
        requestedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, "dashboard_users", cleanEmail), newRecord)
      setCurrentUserRecord(newRecord)
    } catch (e: any) {
      console.error("Error requesting access:", e)
      setAuthError("Erro ao enviar solicitação: " + (e.message || ""))
    } finally {
      setIsRequestingAccess(false)
    }
  }

  const addDashboardUser = async (
    email: string,
    role: DashboardRole,
    displayName?: string,
  ) => {
    if (!db || !isFirebaseConfigured || !email.trim()) return
    const cleanEmail = email.trim().toLowerCase()
    try {
      const record: DashboardUserRecord = {
        email: cleanEmail,
        displayName: displayName || "",
        role: role || "viewer",
        status: "approved",
        approvedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, "dashboard_users", cleanEmail), record, {
        merge: true,
      })
      await loadDashboardUsers()
    } catch (e) {
      console.error("Error adding user:", e)
    }
  }

  const updateUserRole = async (email: string, role: DashboardRole) => {
    if (!db || !isFirebaseConfigured) return
    const cleanEmail = email.trim().toLowerCase()
    try {
      await updateDoc(doc(db, "dashboard_users", cleanEmail), {
        role,
        updatedAt: new Date().toISOString(),
      })
      await loadDashboardUsers()
    } catch (e) {
      console.error("Error updating user role:", e)
    }
  }

  const approveUserAccess = async (email: string, role: DashboardRole) => {
    if (!db || !isFirebaseConfigured) return
    const cleanEmail = email.trim().toLowerCase()
    try {
      await updateDoc(doc(db, "dashboard_users", cleanEmail), {
        status: "approved",
        role: role || "viewer",
        approvedAt: new Date().toISOString(),
      })
      await loadDashboardUsers()
    } catch (e) {
      console.error("Error approving user:", e)
    }
  }

  const deleteDashboardUser = async (email: string) => {
    if (!db || !isFirebaseConfigured) return
    if (
      !window.confirm(`Remover as permissões de acesso do usuário "${email}"?`)
    )
      return
    const cleanEmail = email.trim().toLowerCase()
    try {
      await deleteDoc(doc(db, "dashboard_users", cleanEmail))
      await loadDashboardUsers()
    } catch (e) {
      console.error("Error deleting user:", e)
    }
  }

  useEffect(() => {
    const firebaseAuth = mainAuth
    if (!firebaseAuth) {
      setAuthLoading(false)
      return
    }

    let unsubUserDoc: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        if (unsubUserDoc) {
          unsubUserDoc()
          unsubUserDoc = null
        }

        if (currentUser) {
          setUser(currentUser)
          setAuthError(null)

          const cleanEmail = currentUser.email?.toLowerCase().trim() || ""
          if (cleanEmail === AUTHORIZED_EMAIL.toLowerCase()) {
            setIsMainAdminAuthorized(true)
            setCurrentUserRole("owner")
            void loadDashboardUsers()
            setAuthLoading(false)
          } else {
            // Watch user status in real-time
            if (db) {
              unsubUserDoc = onSnapshot(
                doc(db, "dashboard_users", cleanEmail),
                (docSnap) => {
                  if (docSnap.exists()) {
                    const data = docSnap.data() as DashboardUserRecord
                    setCurrentUserRecord(data)
                    if (data.status === "approved" || !data.status) {
                      setIsMainAdminAuthorized(true)
                      setCurrentUserRole(data.role || "viewer")
                    } else {
                      setIsMainAdminAuthorized(false)
                      setCurrentUserRole(null)
                    }
                  } else {
                    setCurrentUserRecord(null)
                    setIsMainAdminAuthorized(false)
                    setCurrentUserRole(null)
                  }
                  setAuthLoading(false)
                },
                (err) => {
                  console.error("Error checking user access:", err)
                  setIsMainAdminAuthorized(false)
                  setAuthLoading(false)
                },
              )
            } else {
              setAuthLoading(false)
            }
          }
        } else {
          setUser(null)
          setCurrentUserRecord(null)
          setIsMainAdminAuthorized(false)
          setCurrentUserRole(null)
          setAuthLoading(false)
        }
      },
    )

    return () => {
      unsubscribeAuth()
      if (unsubUserDoc) unsubUserDoc()
    }
  }, [])

  const handleGoogleLogin = async () => {
    if (!mainAuth || !mainGoogleProvider) {
      setAuthError(
        "Erro: Configuração do Firebase Authentication não encontrada.",
      )
      return
    }
    setAuthError(null)
    setAuthLoading(true)
    try {
      mainGoogleProvider.setCustomParameters({ prompt: "select_account" })
      const result = await signInWithPopup(mainAuth, mainGoogleProvider)
      setUser(result.user)
    } catch (err: any) {
      console.error("Google Auth error:", err)
      const code = err?.code || ""
      if (code === "auth/unauthorized-domain") {
        setAuthError(
          `O domínio "${window.location.hostname}" precisa ser autorizado no Firebase Console (Authentication > Settings > Authorized domains).`,
        )
      } else if (code === "auth/popup-blocked") {
        setAuthError(
          "O navegador bloqueou a janela pop-up do Google. Por favor, permita pop-ups para este site e tente novamente.",
        )
      } else if (code === "auth/popup-closed-by-user") {
        setAuthError(
          "A janela de login do Google foi fechada antes da conclusão.",
        )
      } else if (code === "auth/operation-not-allowed") {
        setAuthError(
          "O provedor Google não está ativado no Firebase Console (Authentication > Sign-in method).",
        )
      } else if (code === "auth/network-request-failed") {
        setAuthError("Erro de conexão de rede com o Firebase/Google.")
      } else {
        setAuthError(
          err?.message || "Falha na autenticação via Google. Tente novamente.",
        )
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    if (mainAuth) {
      await signOut(mainAuth)
      setUser(null)
      setCurrentUserRecord(null)
      setIsMainAdminAuthorized(false)
      setCurrentUserRole(null)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const fetchedClicks = await getClicks()
      const fetchedLeads = await getLeads()
      setClicks(fetchedClicks)
      setLeads(fetchedLeads)

      const [ml, sp, tt, sc] = await Promise.all([
        getMLStoreLinks(),
        getShopeeStoreLinks(),
        getTikTokStoreLinks(),
        getSocialLinks(),
      ])
      setMlLinks(ml)
      setShopeeLinks(sp)
      setTiktokLinks(tt)
      setSocialLinks(sc)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isMainAdminAuthorized) return

    loadData()

    // Real-time live synchronization for clicks & leads
    let unsubClicks: (() => void) | null = null
    let unsubLeads: (() => void) | null = null

    import("../services/firebaseStoreService")
      .then(({ subscribeToClicksInFirebase, subscribeToLeadsInFirebase }) => {
        unsubClicks = subscribeToClicksInFirebase((liveClicks) => {
          if (liveClicks.length > 0) {
            setClicks(liveClicks)
          }
        }, 200)

        unsubLeads = subscribeToLeadsInFirebase((liveLeads) => {
          if (liveLeads.length > 0) {
            setLeads(liveLeads)
          }
        }, 100)
      })
      .catch((e) => console.warn("Realtime subscription fallback:", e))

    return () => {
      if (unsubClicks) unsubClicks()
      if (unsubLeads) unsubLeads()
    }
  }, [isMainAdminAuthorized])

  const handleStatusChange = async (
    leadId: string,
    newStatus: "Novo" | "Em Atendimento" | "Concluído",
  ) => {
    if (isReadOnly) {
      alert("Atenção: Seu nível de acesso é de Leitor (somente visualização).")
      return
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    )
    await updateLeadStatus(leadId, newStatus)
  }

  const handleSaveCms = () => {
    if (isReadOnly) {
      alert("Atenção: Seu nível de acesso é de Leitor (somente visualização).")
      return
    }
    saveStoredMLStoreLinks(mlLinks)
    saveStoredShopeeStoreLinks(shopeeLinks)
    saveStoredTikTokStoreLinks(tiktokLinks)
    saveStoredSocialLinks(socialLinks)
    setCmsSavedSuccess(true)
    setTimeout(() => setCmsSavedSuccess(false), 2500)
  }

  if (!isMainAdminAuthorized) {
    return (
      <AdminLogin
        theme={theme}
        user={user}
        authError={authError}
        authLoading={authLoading}
        userRecord={currentUserRecord}
        isRequestingAccess={isRequestingAccess}
        handleGoogleLogin={handleGoogleLogin}
        handleRequestAccess={handleRequestAccess}
        handleLogout={handleLogout}
        navigateBack={navigateBack}
      />
    )
  }

  return (
    <div
      className={`dashboard-portal-theme ${
        theme === "light" ? "light-theme" : "dark-theme"
      }`}
    >
      {/* ── Overlay for Mobile Sidebar ── */}
      {isSidebarOpen && (
        <div
          className="dashboard-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Lateral Sidebar (Vertical Icons) ── */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Top brand circle logo & light theme mode indicators */}
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#e8451f] to-[#ff7a59] flex items-center justify-center text-white font-extrabold text-lg shadow-md"
            style={{ letterSpacing: "-0.05em" }}
          >
            SJ
          </div>

          {/* Sun / Moon selector */}
          <div
            className={`flex flex-col gap-2 p-1.5 rounded-xl border transition-colors ${
              theme === "light"
                ? "bg-[#f3f4f6] border-slate-100"
                : "bg-[#111827] border-slate-700"
            }`}
          >
            <button
              onClick={() => setTheme("light")}
              className={`p-1 rounded-lg transition-all ${
                theme === "light"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
              aria-label="Modo Claro"
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-1 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-500"
              }`}
              aria-label="Modo Escuro"
            >
              🌙
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex flex-col gap-4">
          <button
            onClick={() => {
              setActiveTab("metrics")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn ${
              activeTab === "metrics" ? "active" : ""
            }`}
            title="Métricas & Analytics"
          >
            <IcoGrid />
          </button>
          <button
            onClick={() => {
              setActiveTab("leads")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn relative ${
              activeTab === "leads" ? "active" : ""
            }`}
            title="Leads Coletados"
          >
            <IcoInbox />
            {leads.filter((l) => l.status === "Novo").length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#e8451f] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse">
                {leads.filter((l) => l.status === "Novo").length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("cms")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn ${
              activeTab === "cms" ? "active" : ""
            }`}
            title="CMS Links"
          >
            <IcoDatabase />
          </button>
          <button
            onClick={() => {
              setActiveTab("ads")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn ${
              activeTab === "ads" ? "active" : ""
            }`}
            title="Central de Anúncios"
          >
            <IcoLayers />
          </button>
          <button
            onClick={() => {
              setActiveTab("prompts")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn ${
              activeTab === "prompts" ? "active" : ""
            }`}
            title="Biblioteca de Prompts"
          >
            <IcoSparkles />
          </button>
          <button
            onClick={() => {
              setActiveTab("calc3d")
              setIsSidebarOpen(false)
            }}
            className={`sidebar-icon-btn ${
              activeTab === "calc3d" ? "active" : ""
            }`}
            title="Calculadora de Impressão 3D"
          >
            <IcoPrinter3D />
          </button>
          {user?.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase() && (
            <button
              onClick={() => {
                setActiveTab("users")
                setIsSidebarOpen(false)
              }}
              className={`sidebar-icon-btn relative ${
                activeTab === "users" ? "active" : ""
              }`}
              title="Gerenciar Acessos & Permissões"
            >
              <IcoUsers />
              {dashboardUsers.filter((u) => u.status === "pending").length >
                0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          )}
        </nav>

        {/* Bottom Back button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={navigateBack}
            className="sidebar-icon-btn"
            title="Voltar ao Site"
          >
            <IcoLogout />
          </button>
        </div>
      </aside>

      {/* ── Main View Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── Top Header Bar ── */}
        <header className="dashboard-header">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir Menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {/* Logo Name & Role Badge */}
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
              Grupo SJ{" "}
              {currentUserRole === "owner" ? (
                <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600">
                  PROPRIETÁRIO
                </span>
              ) : currentUserRole === "admin" ? (
                <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                  ADMINISTRADOR
                </span>
              ) : (
                <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                  LEITOR (SOMENTE LEITURA)
                </span>
              )}
            </h1>
          </div>

          {/* Central de Anuncios Header Actions */}
          {activeTab === "ads" && !isReadOnly && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => centralRef.current?.openNewProduct()}
                className="px-4 py-2 bg-[#e8451f] hover:bg-[#c83214] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + Novo Produto
              </button>
            </div>
          )}

          {/* Right Area: Search, Alerts, Info & Profile */}
          <div className="flex items-center gap-3 md:gap-6 ml-auto">
            <div 
              className={`header-search-bar ${isSearchExpanded ? 'expanded' : ''}`}
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true)
                  setTimeout(() => searchInputRef.current?.focus(), 50)
                }
              }}
            >
              <IcoSearch />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Buscar no painel..." 
                onBlur={(e) => {
                  if (!e.target.value) setIsSearchExpanded(false)
                }}
              />
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer"
                aria-label="Notificações"
              >
                <IcoBell />
                {leads.filter((l) => l.status === "Novo").length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#e8451f] ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Notificações de Leads
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#e8451f]/10 text-[#e8451f]">
                        {leads.filter((l) => l.status === "Novo").length} novos
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {leads.filter((l) => l.status === "Novo").length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic">
                          Nenhum lead pendente no momento.
                        </div>
                      ) : (
                        leads
                          .filter((l) => l.status === "Novo")
                          .slice(0, 5)
                          .map((nLead) => (
                            <div
                              key={nLead.id}
                              onClick={() => {
                                setShowNotifications(false)
                                setActiveTab("leads")
                              }}
                              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                  {nLead.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {new Date(nLead.createdAt).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                WhatsApp: {nLead.whatsapp}
                              </span>
                              {nLead.message && (
                                <p className="text-[10px] text-slate-400 truncate italic">
                                  "{nLead.message}"
                                </p>
                              )}
                            </div>
                          ))
                      )}
                    </div>

                    <div className="pt-2 px-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setShowNotifications(false)
                          setActiveTab("leads")
                        }}
                        className="w-full py-1.5 text-center text-xs font-extrabold text-[#e8451f] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Ver todos os leads →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="text-slate-400 hover:text-slate-600 transition-colors hidden md:block"
              aria-label="Informações"
              onClick={() => {
                alert("Grupo SJ Dashboard v1.2 · Painel de Gestão Integrada")
              }}
            >
              <IcoInfo />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            {/* Authorized Admin User Card */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer text-left focus:outline-none"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Admin"}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white font-extrabold flex items-center justify-center text-sm">
                      {user.displayName?.[0] || "A"}
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {currentUserRole === "owner"
                        ? "Administrador Master"
                        : currentUserRole === "admin"
                          ? "Administrador"
                          : "Leitor"}
                    </p>
                  </div>
                  <IcoChevronDown />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                          Conta ativa
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate mt-0.5">
                          {user.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          void handleLogout()
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border-none bg-transparent cursor-pointer flex items-center gap-2"
                      >
                        🚪 Sair do Painel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Main View Viewport ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="fade-up">
            {loading &&
            activeTab !== "ads" &&
            activeTab !== "prompts" &&
            activeTab !== "calc3d" ? (
              <div className="flex justify-center items-center py-24 text-slate-400 font-bold">
                Carregando dados do Firebase...
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Carregando módulo...</span>
                  </div>
                }
              >
                {/* ── VIEW 1: OVERVIEW / METRICAS ── */}
                {activeTab === "metrics" && (
                  <OverviewMetrics
                    clicks={clicks}
                    leads={leads}
                    mlLinks={mlLinks}
                    shopeeLinks={shopeeLinks}
                    tiktokLinks={tiktokLinks}
                    loadData={loadData}
                    setActiveTab={setActiveTab}
                  />
                )}

                {/* ── VIEW 2: LEADS LIST ── */}
                {activeTab === "leads" && (
                  <LeadsManager
                    leads={leads}
                    handleStatusChange={handleStatusChange}
                  />
                )}

                {/* ── VIEW 3: LINKS CMS ── */}
                {activeTab === "cms" && (
                  <LinksCMS
                    mlLinks={mlLinks}
                    setMlLinks={setMlLinks}
                    shopeeLinks={shopeeLinks}
                    setShopeeLinks={setShopeeLinks}
                    tiktokLinks={tiktokLinks}
                    setTiktokLinks={setTiktokLinks}
                    socialLinks={socialLinks}
                    setSocialLinks={setSocialLinks}
                    handleSaveCms={handleSaveCms}
                    cmsSavedSuccess={cmsSavedSuccess}
                  />
                )}

                {/* ── VIEW 4: ADS / CENTRAL DE ANUNCIOS ── */}
                {activeTab === "ads" && (
                  <CentralDeAnuncios
                    ref={centralRef}
                    onSessionChange={(session) => setCentralSession(session)}
                  />
                )}

                {/* ── VIEW 5: PROMPTS LIBRARY & MANAGEMENT ── */}
                {activeTab === "prompts" && (
                  <PromptsManager isReadOnly={isReadOnly} />
                )}

                {/* ── VIEW 6: CALCULADORA DE IMPRESSÃO 3D (GRUPO SJ) ── */}
                {activeTab === "calc3d" && <Calculator3D />}

                {/* ── VIEW 7: DASHBOARD USERS / ACCESS CONTROL ── */}
                {activeTab === "users" &&
                  user?.email?.toLowerCase() ===
                    AUTHORIZED_EMAIL.toLowerCase() && (
                    <UserRolesManager
                      authorizedEmail={AUTHORIZED_EMAIL}
                      dashboardUsers={dashboardUsers}
                      loadingUsers={loadingUsers}
                      addDashboardUser={addDashboardUser}
                      updateUserRole={updateUserRole}
                      approveUserAccess={approveUserAccess}
                      deleteDashboardUser={deleteDashboardUser}
                    />
                  )}
              </Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
