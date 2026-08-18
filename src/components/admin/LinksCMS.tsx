import React from "react"
import { StoreLink, SocialLinks } from "../../services/storeService"

interface LinksCMSProps {
  mlLinks: StoreLink[]
  setMlLinks: React.Dispatch<React.SetStateAction<StoreLink[]>>
  shopeeLinks: StoreLink[]
  setShopeeLinks: React.Dispatch<React.SetStateAction<StoreLink[]>>
  tiktokLinks: StoreLink[]
  setTiktokLinks: React.Dispatch<React.SetStateAction<StoreLink[]>>
  socialLinks: SocialLinks
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLinks>>
  handleSaveCms: () => void
  cmsSavedSuccess: boolean
}

export function LinksCMS({
  mlLinks,
  setMlLinks,
  shopeeLinks,
  setShopeeLinks,
  tiktokLinks,
  setTiktokLinks,
  socialLinks,
  setSocialLinks,
  handleSaveCms,
  cmsSavedSuccess,
}: LinksCMSProps) {
  const handleAddMlStore = () => {
    const newStore: StoreLink = {
      id: "ml_" + Date.now(),
      name: "Nova Loja Mercado Livre",
      desc: "Descrição da loja",
      href: "https://www.mercadolivre.com.br",
      storeType: "ml",
    }
    setMlLinks((prev) => [...prev, newStore])
  }

  const handleDeleteMlStore = (id: string) => {
    setMlLinks((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddShopeeStore = () => {
    const newStore: StoreLink = {
      id: "sp_" + Date.now(),
      name: "Nova Loja Shopee",
      desc: "Descrição da loja",
      href: "https://shopee.com.br",
      storeType: "shopee",
    }
    setShopeeLinks((prev) => [...prev, newStore])
  }

  const handleDeleteShopeeStore = (id: string) => {
    setShopeeLinks((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddTiktokStore = () => {
    const newStore: StoreLink = {
      id: "tt_" + Date.now(),
      name: "Nova Loja TikTok",
      desc: "Loja oficial no TikTok",
      href: "https://www.tiktok.com/@gruposj",
      storeType: "tiktok",
    }
    setTiktokLinks((prev) => [...prev, newStore])
  }

  const handleDeleteTiktokStore = (id: string) => {
    setTiktokLinks((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Mercado Livre Links CMS */}
      <div className="premium-card">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-md font-extrabold text-[#e8451f] flex items-center gap-2">
            🛍️ Lojas Mercado Livre ({mlLinks.length})
          </h4>
          <button
            type="button"
            onClick={handleAddMlStore}
            className="bg-[#e8451f]/10 hover:bg-[#e8451f]/20 text-[#e8451f] border border-[#e8451f]/25 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            + Adicionar Loja
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {mlLinks.map((store, idx) => (
            <div
              key={store.id}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4"
            >
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Nome da Loja
                </span>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setMlLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, name: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Breve Descrição
                </span>
                <input
                  type="text"
                  value={store.desc}
                  onChange={(e) => {
                    const val = e.target.value
                    setMlLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, desc: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
                />
              </label>
              <label className="flex-[2] flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  URL da Loja
                </span>
                <input
                  type="url"
                  value={store.href}
                  onChange={(e) => {
                    const val = e.target.value
                    setMlLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, href: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
                />
              </label>
              <button
                type="button"
                onClick={() => handleDeleteMlStore(store.id)}
                className="self-end bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/50 px-4 py-2.5 rounded-xl font-bold text-xs h-10 transition-colors cursor-pointer"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shopee Links CMS */}
      <div className="premium-card">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-md font-extrabold text-[#ee4d2d] flex items-center gap-2">
            🛒 Lojas Shopee ({shopeeLinks.length})
          </h4>
          <button
            type="button"
            onClick={handleAddShopeeStore}
            className="bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/20 text-[#ee4d2d] border border-[#ee4d2d]/25 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            + Adicionar Loja
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {shopeeLinks.map((store, idx) => (
            <div
              key={store.id}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4"
            >
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Nome da Loja
                </span>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setShopeeLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, name: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Breve Descrição
                </span>
                <input
                  type="text"
                  value={store.desc}
                  onChange={(e) => {
                    const val = e.target.value
                    setShopeeLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, desc: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                />
              </label>
              <label className="flex-[2] flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  URL da Loja
                </span>
                <input
                  type="url"
                  value={store.href}
                  onChange={(e) => {
                    const val = e.target.value
                    setShopeeLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, href: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                />
              </label>
              <button
                type="button"
                onClick={() => handleDeleteShopeeStore(store.id)}
                className="self-end bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/50 px-4 py-2.5 rounded-xl font-bold text-xs h-10 transition-colors cursor-pointer"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TikTok Links CMS */}
      <div className="premium-card">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-md font-extrabold text-[#fe2c55] flex items-center gap-2">
            🎵 Lojas TikTok ({tiktokLinks.length})
          </h4>
          <button
            type="button"
            onClick={handleAddTiktokStore}
            className="bg-[#fe2c55]/10 hover:bg-[#fe2c55]/20 text-[#fe2c55] border border-[#fe2c55]/25 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            + Adicionar Loja
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {tiktokLinks.map((store, idx) => (
            <div
              key={store.id}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4"
            >
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Nome da Loja
                </span>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setTiktokLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, name: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#fe2c55]"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Breve Descrição
                </span>
                <input
                  type="text"
                  value={store.desc}
                  onChange={(e) => {
                    const val = e.target.value
                    setTiktokLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, desc: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#fe2c55]"
                />
              </label>
              <label className="flex-[2] flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  URL da Loja TikTok
                </span>
                <input
                  type="url"
                  value={store.href}
                  onChange={(e) => {
                    const val = e.target.value
                    setTiktokLinks((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, href: val } : item,
                      ),
                    )
                  }}
                  className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#fe2c55]"
                />
              </label>
              <button
                type="button"
                onClick={() => handleDeleteTiktokStore(store.id)}
                className="self-end bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/50 px-4 py-2.5 rounded-xl font-bold text-xs h-10 transition-colors cursor-pointer"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social contacts CMS */}
      <div className="premium-card">
        <h4 className="text-md font-extrabold text-slate-900 dark:text-slate-100 mb-6">
          💬 Redes Sociais & Contatos Diretos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Instagram URL
            </span>
            <input
              type="url"
              value={socialLinks.instagram}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  instagram: e.target.value,
                })
              }
              className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Facebook URL
            </span>
            <input
              type="url"
              value={socialLinks.facebook}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  facebook: e.target.value,
                })
              }
              className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              YouTube URL
            </span>
            <input
              type="url"
              value={socialLinks.youtube}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  youtube: e.target.value,
                })
              }
              className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              WhatsApp Link (ou wa.me)
            </span>
            <input
              type="url"
              value={socialLinks.whatsapp}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  whatsapp: e.target.value,
                })
              }
              className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              E-mail Comercial
            </span>
            <input
              type="text"
              value={socialLinks.email}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  email: e.target.value,
                })
              }
              className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8451f]"
            />
          </label>
        </div>
      </div>

      {/* Save Changes bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <button
          type="button"
          onClick={handleSaveCms}
          className="bg-[#e8451f] hover:bg-[#c83214] font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
        >
          <span className="text-white">Salvar Alterações</span>
        </button>
        {cmsSavedSuccess && (
          <span className="text-sm font-semibold text-[#25D366]">
            ✓ Links sincronizados com sucesso no Firestore!
          </span>
        )}
      </div>
    </div>
  )
}
export default LinksCMS
