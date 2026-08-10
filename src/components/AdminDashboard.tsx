import { useState, useEffect } from "react";
import {
  getClicks,
  getLeads,
  updateLeadStatus,
  getStoredMLStoreLinks,
  getStoredShopeeStoreLinks,
  saveStoredMLStoreLinks,
  saveStoredShopeeStoreLinks,
  type ClickEvent,
  type Lead,
  type StoreLink,
} from "../services/storeService";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onLinksUpdated?: () => void;
}

const AUTHORIZED_EMAIL = "sjosethiago.r@gmail.com";

function IcoGoogle({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function IcoML({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#FFE600" />
      <ellipse cx="24" cy="20" rx="10" ry="8" fill="white" />
      <path d="M14 28c0-4.4 4.5-8 10-8s10 3.6 10 8" fill="#009EE3" />
      <circle cx="19" cy="19" r="2.5" fill="#009EE3" />
      <circle cx="29" cy="19" r="2.5" fill="#009EE3" />
      <path d="M20 23c1.1 1.2 2.9 1.2 4 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IcoShopee({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#EE4D2D" />
      <path d="M24 9c-4.97 0-9 4.03-9 9h3c0-3.31 2.69-6 6-6s6 2.69 6 6h3c0-4.97-4.03-9-9-9z" fill="white" />
      <rect x="11" y="18" width="26" height="21" rx="3" fill="white" />
      <circle cx="19" cy="25" r="2" fill="#EE4D2D" />
      <circle cx="29" cy="25" r="2" fill="#EE4D2D" />
      <path d="M20 30c2.2 2 5.8 2 8 0" stroke="#EE4D2D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function AdminDashboard({ isOpen, onClose, onLinksUpdated }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "leads" | "cms">("metrics");
  const [clicks, setClicks] = useState<ClickEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mlLinks, setMlLinks] = useState<StoreLink[]>([]);
  const [shopeeLinks, setShopeeLinks] = useState<StoreLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmsSavedSuccess, setCmsSavedSuccess] = useState(false);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError(`Acesso negado. O e-mail "${currentUser.email}" não é um administrador autorizado.`);
          signOut(auth);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()) {
        setUser(result.user);
      } else {
        setAuthError(`Acesso negado. O e-mail "${result.user.email}" não possui permissão de administrador.`);
        await signOut(auth);
        setUser(null);
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setAuthError("Falha na autenticação via Google. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setUser(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedClicks = await getClicks();
      const fetchedLeads = await getLeads();
      setClicks(fetchedClicks);
      setLeads(fetchedLeads);
      setMlLinks(getStoredMLStoreLinks());
      setShopeeLinks(getStoredShopeeStoreLinks());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isAuthorized = user && user.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();

  // Analytics Metrics Calculations
  const totalClicks = clicks.length;
  const totalLeads = leads.length;

  const mlClicks = clicks.filter((c) => c.category === "Mercado Livre").length;
  const shopeeClicks = clicks.filter((c) => c.category === "Shopee").length;
  const socialClicks = clicks.filter((c) => c.category === "Rede Social").length;

  // Mercado Livre Sub-links Clicks
  const getMlSubLinkClicks = (subName: string) => {
    return clicks.filter(
      (c) => c.category === "Mercado Livre" && c.linkName.toLowerCase().includes((subName || "").toLowerCase())
    ).length;
  };

  // Shopee Sub-links Clicks
  const getShopeeSubLinkClicks = (subName: string) => {
    return clicks.filter(
      (c) => c.category === "Shopee" && c.linkName.toLowerCase().includes((subName || "").toLowerCase())
    ).length;
  };

  // Social Links Clicks
  const getSocialClicks = (socialName: string) => {
    return clicks.filter(
      (c) => c.category === "Rede Social" && c.linkName.toLowerCase().includes(socialName.toLowerCase())
    ).length;
  };

  const handleStatusChange = async (leadId: string, newStatus: "Novo" | "Em Atendimento" | "Concluído") => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await updateLeadStatus(leadId, newStatus);
  };

  const handleSaveCms = () => {
    saveStoredMLStoreLinks(mlLinks);
    saveStoredShopeeStoreLinks(shopeeLinks);
    setCmsSavedSuccess(true);
    if (onLinksUpdated) onLinksUpdated();
    setTimeout(() => setCmsSavedSuccess(false), 2500);
  };

  return (
    <div className="store-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="store-drawer-panel"
        style={{ maxWidth: 820, width: "95%", maxHeight: "90dvh" }}
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--foreground)" }}>Painel Administrativo</h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: isFirebaseConfigured ? "rgba(37,211,102,0.15)" : "rgba(255,193,7,0.15)",
                    color: isFirebaseConfigured ? "#25D366" : "#FFC107",
                    textTransform: "uppercase",
                  }}
                >
                  {isFirebaseConfigured ? "🔥 Firebase Conectado" : "⚡ Local Storage"}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                Acesso exclusivo para administrador: {AUTHORIZED_EMAIL}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* TELAS DE AUTENTICAÇÃO */}
        {!isAuthorized ? (
          <div style={{ padding: "36px 16px", textAlign: "center", maxWidth: 440, margin: "0 auto" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(232, 69, 31, 0.12)",
                border: "1px solid rgba(232, 69, 31, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 18px",
              }}
            >
              🔒
            </div>

            <h4 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900 }}>Autenticação de Administrador</h4>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              Para acessar o dashboard de métricas, lista de leads e gerenciar os links, faça login com sua conta do Google cadastrada:
              <br />
              <strong style={{ color: "#e8451f" }}>{AUTHORIZED_EMAIL}</strong>
            </p>

            {authError && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(238, 77, 45, 0.12)",
                  border: "1px solid rgba(238, 77, 45, 0.3)",
                  color: "#EE4D2D",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 18,
                  textAlign: "left",
                }}
              >
                ⚠️ {authError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 12,
                background: "#ffffff",
                color: "#121217",
                border: "none",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                boxShadow: "0 8px 24px rgba(255,255,255,0.15)",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
            >
              <IcoGoogle s={20} />
              <span>{authLoading ? "Verificando..." : "Entrar com Google"}</span>
            </button>
          </div>
        ) : (
          /* PAINEL LOGADO E AUTORIZADO */
          <>
            {/* User Profile Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                marginTop: 14,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Admin"}
                    style={{ width: 34, height: 34, borderRadius: "50%" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#e8451f",
                      color: "#fff",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                    }}
                  >
                    {user.displayName?.[0] || "A"}
                  </div>
                )}
                <div>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                    {user.displayName || "Administrador"}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "#25D366", fontWeight: 600 }}>
                    ✓ Autenticado ({user.email})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sair (Logout)
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <button
                onClick={() => setActiveTab("metrics")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === "metrics" ? "#e8451f" : "rgba(255,255,255,0.05)",
                  color: activeTab === "metrics" ? "#fff" : "var(--muted-foreground)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📊 Métricas & Analytics
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === "leads" ? "#e8451f" : "rgba(255,255,255,0.05)",
                  color: activeTab === "leads" ? "#fff" : "var(--muted-foreground)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📋 Leads</span>
                {totalLeads > 0 && (
                  <span
                    style={{
                      background: "#25D366",
                      color: "#000",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "1px 6px",
                      borderRadius: 99,
                    }}
                  >
                    {totalLeads}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("cms")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === "cms" ? "#e8451f" : "rgba(255,255,255,0.05)",
                  color: activeTab === "cms" ? "#fff" : "var(--muted-foreground)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ⚙️ Gerenciar Nomes & Links (CMS)
              </button>
            </div>

            {/* TAB 1: METRICS & ANALYTICS */}
            {activeTab === "metrics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* General Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Total de Cliques</span>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: "#ffffff" }}>{totalClicks}</div>
                  </div>

                  <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,230,0,0.05)", border: "1px solid rgba(255,230,0,0.2)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#FFE600", textTransform: "uppercase" }}>Mercado Livre</span>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: "#FFE600" }}>{mlClicks}</div>
                  </div>

                  <div style={{ padding: "16px", borderRadius: 14, background: "rgba(238,77,45,0.05)", border: "1px solid rgba(238,77,45,0.2)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#EE4D2D", textTransform: "uppercase" }}>Shopee</span>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: "#EE4D2D" }}>{shopeeClicks}</div>
                  </div>

                  <div style={{ padding: "16px", borderRadius: 14, background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#25D366", textTransform: "uppercase" }}>Leads Capturados</span>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: "#25D366" }}>{totalLeads}</div>
                  </div>
                </div>

                {/* Mercado Livre Sub-links Detailed Section */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 16,
                    background: "rgba(255, 230, 0, 0.04)",
                    border: "1px solid rgba(255, 230, 0, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IcoML s={22} />
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#FFE600" }}>
                        Mercado Livre — Detalhes de Cliques por Loja
                      </h4>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#FFE600" }}>
                      {mlClicks} cliques totais
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                    {mlLinks.map((loja) => {
                      const nameStr = loja.name || (loja as any).nome || "";
                      const count = getMlSubLinkClicks(nameStr);
                      const pct = mlClicks ? Math.round((count / mlClicks) * 100) : 0;
                      return (
                        <div
                          key={loja.id}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            background: "rgba(255, 230, 0, 0.06)",
                            border: "1px solid rgba(255, 230, 0, 0.15)",
                          }}
                        >
                          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                            {nameStr}
                          </span>
                          <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                            {loja.desc}
                          </span>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#FFE600" }}>{count}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255, 230, 0, 0.8)" }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shopee Sub-links Detailed Section */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 16,
                    background: "rgba(238, 77, 45, 0.04)",
                    border: "1px solid rgba(238, 77, 45, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IcoShopee s={22} />
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#EE4D2D" }}>
                        Shopee — Detalhes de Cliques por Loja
                      </h4>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#EE4D2D" }}>
                      {shopeeClicks} cliques totais
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                    {shopeeLinks.map((loja) => {
                      const nameStr = loja.name || (loja as any).nome || "";
                      const count = getShopeeSubLinkClicks(nameStr);
                      const pct = shopeeClicks ? Math.round((count / shopeeClicks) * 100) : 0;
                      return (
                        <div
                          key={loja.id}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            background: "rgba(238, 77, 45, 0.06)",
                            border: "1px solid rgba(238, 77, 45, 0.15)",
                          }}
                        >
                          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                            {nameStr}
                          </span>
                          <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                            {loja.desc}
                          </span>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#EE4D2D" }}>{count}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(238, 77, 45, 0.8)" }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Redes Sociais & Contato */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 16,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>Redes Sociais & Canais de Atendimento</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(225,48,108,0.06)", border: "1px solid rgba(225,48,108,0.18)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#E1306C" }}>Instagram</span>
                      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{getSocialClicks("Instagram")}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(24,119,242,0.06)", border: "1px solid rgba(24,119,242,0.18)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1877F2" }}>Facebook</span>
                      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{getSocialClicks("Facebook")}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(10,102,194,0.06)", border: "1px solid rgba(10,102,194,0.18)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0A66C2" }}>LinkedIn</span>
                      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{getSocialClicks("LinkedIn")}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.18)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#25D366" }}>WhatsApp</span>
                      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{getSocialClicks("WhatsApp")}</div>
                    </div>
                  </div>
                </div>

                {/* Recent Clicks Log */}
                <h4 style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800 }}>Histórico Recente de Interações</h4>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12, padding: 8 }}>
                  {clicks.length === 0 ? (
                    <p style={{ margin: 0, padding: 12, fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>
                      Nenhum clique registrado ainda.
                    </p>
                  ) : (
                    clicks.slice(0, 30).map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--foreground)" }}>{c.linkName}</strong>
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              color: c.category === "Mercado Livre" ? "#FFE600" : c.category === "Shopee" ? "#EE4D2D" : "var(--muted-foreground)",
                              fontWeight: 700,
                            }}
                          >
                            ({c.category})
                          </span>
                        </div>
                        <span style={{ color: "var(--muted-foreground)" }}>{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LEADS CAPTURADOS */}
            {activeTab === "leads" && (
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>Leads Solicitados pelo Site</h4>
                {leads.length === 0 ? (
                  <p style={{ margin: 0, padding: 32, fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>
                    Nenhum lead capturado ainda.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        style={{
                          padding: "16px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h5 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{lead.name}</h5>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                              {lead.email || "Sem e-mail registrado"} · {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              background:
                                lead.status === "Novo"
                                  ? "rgba(232,69,31,0.2)"
                                  : lead.status === "Em Atendimento"
                                  ? "rgba(255,193,7,0.2)"
                                  : "rgba(37,211,102,0.2)",
                              color: lead.status === "Novo" ? "#e8451f" : lead.status === "Em Atendimento" ? "#FFC107" : "#25D366",
                              border: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <option value="Novo" style={{ background: "#121217", color: "#fff" }}>
                              Novo
                            </option>
                            <option value="Em Atendimento" style={{ background: "#121217", color: "#fff" }}>
                              Em Atendimento
                            </option>
                            <option value="Concluído" style={{ background: "#121217", color: "#fff" }}>
                              Concluído
                            </option>
                          </select>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--foreground)",
                            background: "rgba(0,0,0,0.2)",
                            padding: 10,
                            borderRadius: 8,
                          }}
                        >
                          "{lead.message}"
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#25D366" }}>📱 {lead.whatsapp}</span>
                          <a
                            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "#25D366",
                              color: "#000",
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Falar no WhatsApp ➔
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GERENCIAR LINKS (CMS) */}
            {activeTab === "cms" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>
                      Editar Nomes, Descrições e URLs das Lojas
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                      Altere o nome visível da loja e o link de destino.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCms}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: "#25D366",
                      color: "#000",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(37,211,102,0.25)",
                    }}
                  >
                    {cmsSavedSuccess ? "✓ Salvo com Sucesso!" : "Salvar Alterações"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                  {/* Mercado Livre CMS */}
                  <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                    <h5 style={{ margin: "0 0 12px", color: "#FFE600", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                      <IcoML s={20} /> Lojas do Mercado Livre
                    </h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {mlLinks.map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "14px",
                            borderRadius: 12,
                            background: "rgba(255,230,0,0.03)",
                            border: "1px solid rgba(255,230,0,0.18)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                                Nome da Loja
                              </label>
                              <input
                                type="text"
                                value={item.name || (item as any).nome || ""}
                                onChange={(e) => {
                                  const updated = [...mlLinks];
                                  updated[idx].name = e.target.value;
                                  (updated[idx] as any).nome = e.target.value;
                                  setMlLinks(updated);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                                Descrição / Linha de Produtos
                              </label>
                              <input
                                type="text"
                                value={item.desc}
                                onChange={(e) => {
                                  const updated = [...mlLinks];
                                  updated[idx].desc = e.target.value;
                                  setMlLinks(updated);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                  fontSize: 13,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                              URL de Destino
                            </label>
                            <input
                              type="url"
                              value={item.href}
                              onChange={(e) => {
                                const updated = [...mlLinks];
                                updated[idx].href = e.target.value;
                                setMlLinks(updated);
                              }}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                fontSize: 13,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shopee CMS */}
                  <div>
                    <h5 style={{ margin: "0 0 12px", color: "#EE4D2D", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                      <IcoShopee s={20} /> Lojas da Shopee
                    </h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {shopeeLinks.map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "14px",
                            borderRadius: 12,
                            background: "rgba(238,77,45,0.03)",
                            border: "1px solid rgba(238,77,45,0.18)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                                Nome da Loja
                              </label>
                              <input
                                type="text"
                                value={item.name || (item as any).nome || ""}
                                onChange={(e) => {
                                  const updated = [...shopeeLinks];
                                  updated[idx].name = e.target.value;
                                  (updated[idx] as any).nome = e.target.value;
                                  setShopeeLinks(updated);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                                Descrição / Linha de Produtos
                              </label>
                              <input
                                type="text"
                                value={item.desc}
                                onChange={(e) => {
                                  const updated = [...shopeeLinks];
                                  updated[idx].desc = e.target.value;
                                  setShopeeLinks(updated);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                  fontSize: 13,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--foreground)" }}>
                              URL de Destino
                            </label>
                            <input
                              type="url"
                              value={item.href}
                              onChange={(e) => {
                                const updated = [...shopeeLinks];
                                updated[idx].href = e.target.value;
                                setShopeeLinks(updated);
                              }}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                fontSize: 13,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
