import { usePWAInstall } from "../lib/usePWAInstall"

export function PWAInstallBanner() {
  const { isInstallable, isIOS, dismissed, promptInstall, dismiss } =
    usePWAInstall()

  if (!isInstallable || dismissed) return null

  return (
    <>
      {/* Backdrop blur overlay */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(11,11,13,0.6) 0%, transparent 100%)",
          height: 180,
        }}
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Instalar atalho do Grupo SJ"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: "0 16px 20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background:
              "linear-gradient(135deg, rgba(30,28,26,0.97) 0%, rgba(20,18,16,0.98) 100%)",
            border: "1px solid rgba(232,69,31,0.22)",
            borderRadius: 20,
            boxShadow:
              "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,69,31,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: "18px 18px 16px",
            backdropFilter: "blur(24px)",
            animation: "slideUpBanner 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              marginBottom: 14,
            }}
          >
            {/* SJ Icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #e8451f 0%, #c83214 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(232,69,31,0.4)",
                fontWeight: 900,
                fontSize: 20,
                color: "#fff",
                fontFamily: "Montserrat, sans-serif",
                letterSpacing: "-0.03em",
              }}
            >
              SJ
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#f2f0ea",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}
              >
                Instalar Grupo SJ
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12,
                  color: "rgba(216,212,203,0.65)",
                  lineHeight: 1.4,
                }}
              >
                {isIOS
                  ? "Toque em Compartilhar ⎋ e depois "Adicionar à Tela de Início" +"
                  : "Adicione o atalho à tela inicial para acesso rápido"}
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              id="pwa-banner-close"
              onClick={dismiss}
              aria-label="Fechar"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 99,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(216,212,203,0.55)",
                fontSize: 14,
                flexShrink: 0,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              ✕
            </button>
          </div>

          {/* Action */}
          {!isIOS && (
            <button
              type="button"
              id="pwa-install-btn"
              onClick={promptInstall}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(232,69,31,0.9) 0%, rgba(200,50,20,0.9) 100%)",
                border: "1px solid rgba(232,69,31,0.3)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(232,69,31,0.25)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(232,69,31,0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(232,69,31,0.25)"
              }}
            >
              <span style={{ fontSize: 16 }}>📲</span>
              Instalar Atalho Grátis
            </button>
          )}

          {/* iOS pill hint */}
          {isIOS && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "rgba(232,69,31,0.08)",
                borderRadius: 10,
                border: "1px solid rgba(232,69,31,0.15)",
              }}
            >
              <span style={{ fontSize: 20 }}>⎋</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#d8d4cb",
                    lineHeight: 1.4,
                  }}
                >
                  No Safari: toque em{" "}
                  <strong style={{ color: "#e8451f" }}>Compartilhar</strong>
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11.5,
                    color: "rgba(216,212,203,0.6)",
                    lineHeight: 1.4,
                  }}
                >
                  Depois toque em{" "}
                  <strong style={{ color: "#d8d4cb" }}>
                    "Adicionar à Tela de Início"
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframe via style tag */}
      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
