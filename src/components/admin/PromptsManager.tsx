import React, { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import {
  PromptItem,
  PromptCategory,
  extractPromptVariables,
  fillPromptVariables,
} from "../../types/prompt"
import {
  getStoredPrompts,
  getStoredCategories,
  saveStoredCategories,
  getPromptsFromFirebase,
  savePromptToFirebase,
  deletePromptFromFirebase,
  exportPromptsToJson,
  importPromptsFromJson,
} from "../../services/promptService"
import {
  IcoSparkles,
  IcoCopy,
  IcoCheck,
  IcoStar,
  IcoStarFilled,
  IcoEdit,
  IcoTrash,
  IcoPlus,
  IcoWand,
  IcoFolder,
  IcoTag,
  IcoSearch,
  IcoClose,
} from "../Icons"

interface PromptsManagerProps {
  isReadOnly?: boolean
}

export function PromptsManager({ isReadOnly = false }: PromptsManagerProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [categories, setCategories] = useState<PromptCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null)
  const [tagInput, setTagInput] = useState("")

  const [isFillModalOpen, setIsFillModalOpen] = useState(false)
  const [fillingPrompt, setFillingPrompt] = useState<PromptItem | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isCopiedFilled, setIsCopiedFilled] = useState(false)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState("#e8451f")
  const [newCatDesc, setNewCatDesc] = useState("")

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState("")
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 2800)
  }

  // Load Data
  const loadData = async () => {
    setLoading(true)
    const localCategories = getStoredCategories()
    setCategories(localCategories)

    // Load local first for immediate render
    const localPrompts = getStoredPrompts()
    setPrompts(localPrompts)

    // Then try sync with cloud
    try {
      const cloudPrompts = await getPromptsFromFirebase()
      setPrompts(cloudPrompts)
    } catch (e) {
      console.warn("Usando prompts locais:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Categories with counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: prompts.length, favorites: 0 }
    prompts.forEach((p) => {
      if (p.isFavorite) counts.favorites = (counts.favorites || 0) + 1
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [prompts])

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    prompts.forEach((p) => {
      p.tags?.forEach((t) => tagSet.add(t))
    })
    return Array.from(tagSet).sort()
  }, [prompts])

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      // Category filter
      if (selectedCategory === "favorites" && !p.isFavorite) return false
      if (
        selectedCategory !== "all" &&
        selectedCategory !== "favorites" &&
        p.category !== selectedCategory
      ) {
        return false
      }

      // Tag filter
      if (selectedTag && !p.tags?.includes(selectedTag)) {
        return false
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchDesc = p.description?.toLowerCase().includes(q)
        const matchContent = p.content.toLowerCase().includes(q)
        const matchCategory = p.category.toLowerCase().includes(q)
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q))
        return matchTitle || matchDesc || matchContent || matchCategory || matchTags
      }

      return true
    })
  }, [prompts, selectedCategory, selectedTag, searchQuery])

  // Handlers
  const handleCopyPrompt = async (prompt: PromptItem) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedPromptId(prompt.id)
      showToast(`Prompt "${prompt.title}" copiado para a área de transferência!`)
      setTimeout(() => {
        setCopiedPromptId((curr) => (curr === prompt.id ? null : curr))
      }, 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
      showToast("Não foi possível copiar automaticamente.")
    }
  }

  const handleToggleFavorite = async (prompt: PromptItem) => {
    if (isReadOnly) return
    const updated = { ...prompt, isFavorite: !prompt.isFavorite }
    setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? updated : p)))
    await savePromptToFirebase(updated)
    showToast(
      updated.isFavorite ? "⭐ Prompt adicionado aos favoritos!" : "Prompt removido dos favoritos.",
    )
  }

  const handleOpenCreate = () => {
    if (isReadOnly) return
    setEditingPrompt({
      id: "prompt_" + Date.now(),
      title: "",
      category: categories[0]?.name || "E-commerce & Anúncios",
      description: "",
      content: "",
      tags: [],
      isFavorite: false,
    })
    setTagInput("")
    setIsEditModalOpen(true)
  }

  const handleOpenEdit = (prompt: PromptItem) => {
    if (isReadOnly) return
    setEditingPrompt({ ...prompt })
    setTagInput("")
    setIsEditModalOpen(true)
  }

  const handleDuplicatePrompt = async (prompt: PromptItem) => {
    if (isReadOnly) return
    const duplicated: PromptItem = {
      ...prompt,
      id: "prompt_" + Date.now(),
      title: `${prompt.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setPrompts((prev) => [duplicated, ...prev])
    await savePromptToFirebase(duplicated)
    showToast("Prompt duplicado com sucesso!")
  }

  const handleDeletePrompt = async (id: string, title: string) => {
    if (isReadOnly) return
    if (!window.confirm(`Tem certeza que deseja excluir o prompt "${title}"?`)) {
      return
    }
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    await deletePromptFromFirebase(id)
    showToast("Prompt excluído.")
  }

  const handleSavePrompt = async () => {
    if (isReadOnly || !editingPrompt) return
    if (!editingPrompt.title?.trim()) {
      alert("Por favor, informe o nome do prompt.")
      return
    }
    if (!editingPrompt.content?.trim()) {
      alert("Por favor, insira o conteúdo do prompt.")
      return
    }

    const itemToSave: PromptItem = {
      id: editingPrompt.id || "prompt_" + Date.now(),
      title: editingPrompt.title.trim(),
      category: editingPrompt.category || categories[0]?.name || "Geral",
      description: editingPrompt.description?.trim() || "",
      content: editingPrompt.content.trim(),
      tags: editingPrompt.tags || [],
      variables: extractPromptVariables(editingPrompt.content),
      isFavorite: !!editingPrompt.isFavorite,
      createdAt: editingPrompt.createdAt || Date.now(),
      updatedAt: Date.now(),
    }

    setPrompts((prev) => {
      const idx = prev.findIndex((p) => p.id === itemToSave.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = itemToSave
        return copy
      }
      return [itemToSave, ...prev]
    })

    setIsEditModalOpen(false)
    setEditingPrompt(null)
    await savePromptToFirebase(itemToSave)
    showToast("Prompt salvo com sucesso!")
  }

  // Variable Fill Modal Handlers
  const handleOpenFillModal = (prompt: PromptItem) => {
    const vars = prompt.variables || extractPromptVariables(prompt.content)
    const initialVals: Record<string, string> = {}
    vars.forEach((v) => {
      initialVals[v] = ""
    })
    setFillingPrompt(prompt)
    setVariableValues(initialVals)
    setIsCopiedFilled(false)
    setIsFillModalOpen(true)
  }

  const filledPromptPreview = useMemo(() => {
    if (!fillingPrompt) return ""
    return fillPromptVariables(fillingPrompt.content, variableValues)
  }, [fillingPrompt, variableValues])

  const handleCopyFilledPrompt = async () => {
    if (!filledPromptPreview) return
    try {
      await navigator.clipboard.writeText(filledPromptPreview)
      setIsCopiedFilled(true)
      showToast("Prompt personalizado copiado para a área de transferência!")
      setTimeout(() => setIsCopiedFilled(false), 2200)
    } catch (err) {
      console.error(err)
    }
  }

  // Category Manager Handlers
  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const nameExists = categories.some(
      (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase(),
    )
    if (nameExists) {
      alert("Já existe uma categoria com esse nome.")
      return
    }

    const newCat: PromptCategory = {
      id: "cat_" + Date.now(),
      name: newCatName.trim(),
      color: newCatColor,
      description: newCatDesc.trim(),
    }
    const updated = [...categories, newCat]
    setCategories(updated)
    saveStoredCategories(updated)
    setNewCatName("")
    setNewCatDesc("")
    showToast(`Categoria "${newCat.name}" criada!`)
  }

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (categories.length <= 1) {
      alert("Você precisa manter pelo menos uma categoria.")
      return
    }
    if (
      !window.confirm(
        `Excluir a categoria "${catName}"? Os prompts existentes nela não serão apagados.`,
      )
    ) {
      return
    }
    const updated = categories.filter((c) => c.id !== catId)
    setCategories(updated)
    saveStoredCategories(updated)
    showToast("Categoria removida.")
  }

  // Backup / Import Handlers
  const handleDownloadBackup = () => {
    const jsonStr = exportPromptsToJson(prompts)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prompts_grupo_sj_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Download do backup concluído!")
  }

  const handleImportJson = async () => {
    try {
      setImportError(null)
      if (!importJsonText.trim()) {
        setImportError("Cole o texto JSON ou selecione um arquivo.")
        return
      }
      const imported = importPromptsFromJson(importJsonText)
      for (const item of imported) {
        await savePromptToFirebase(item)
      }
      await loadData()
      setIsBackupModalOpen(false)
      setImportJsonText("")
      showToast(`${imported.length} prompts importados com sucesso!`)
    } catch (e: any) {
      setImportError(e?.message || "Erro ao processar JSON.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setImportJsonText(text)
    }
    reader.readAsText(file)
  }

  // Find color for category badge
  const getCategoryColor = (catName: string) => {
    const found = categories.find(
      (c) => c.name.toLowerCase() === catName.toLowerCase(),
    )
    return found?.color || "#e8451f"
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-[#e8451f]">⚡</span>
          <span className="text-xs md:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ── Header Stats / Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#e8451f] flex items-center justify-center font-bold">
            <IcoSparkles s={20} />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {prompts.length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total de Prompts
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <IcoStarFilled s={20} />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {categoryCounts.favorites || 0}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Favoritos
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <IcoFolder s={20} />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {categories.length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Categorias
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <IcoTag s={20} />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {allTags.length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tags Únicas
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Control Bar: Search, Category Filters, and Action Buttons ── */}
      <div className="bg-white dark:bg-slate-800/90 p-4 md:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col gap-4">
        {/* Search Bar and Top Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IcoSearch s={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do prompt, categoria, conteúdo ou #tags..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <IcoClose s={16} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Gerenciar Categorias"
            >
              <IcoFolder s={16} />
              <span>Categorias</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Backup / Importar"
            >
              <span>💾 Backup</span>
            </button>

            {!isReadOnly && (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 rounded-xl bg-[#e8451f] hover:bg-[#c83214] text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <IcoPlus s={16} />
                <span>+ Adicionar Prompt</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Category Filter Pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#e8451f] text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span>Todos os Prompts</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                selectedCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
              }`}
            >
              {prompts.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("favorites")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedCategory === "favorites"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span>⭐ Favoritos</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                selectedCategory === "favorites"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
              }`}
            >
              {categoryCounts.favorites || 0}
            </span>
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat.name] || 0
            const isSelected = selectedCategory === cat.name
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                style={isSelected ? { backgroundColor: cat.color || "#e8451f" } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? "#fff" : cat.color || "#e8451f" }}
                />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Active Tag Filter (if any) ── */}
        {selectedTag && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Filtrando por tag:</span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-[#e8451f] flex items-center gap-1.5">
              #{selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="hover:text-red-700 cursor-pointer"
              >
                <IcoClose s={14} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ── Prompts Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs font-bold">Carregando Biblioteca de Prompts...</span>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[#e8451f] flex items-center justify-center text-2xl font-black">
            <IcoSparkles s={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Nenhum prompt encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? `Nenhum prompt corresponde à busca "${searchQuery}". Tente outros termos ou limpe o filtro.`
                : "Comece criando o seu primeiro prompt personalizado para o Grupo SJ."}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-[#e8451f] hover:bg-[#c83214] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <IcoPlus s={16} />
              <span>Adicionar Primeiro Prompt</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {filteredPrompts.map((prompt) => {
            const hasVariables =
              (prompt.variables && prompt.variables.length > 0) ||
              extractPromptVariables(prompt.content).length > 0
            const catColor = getCategoryColor(prompt.category)
            const isCopied = copiedPromptId === prompt.id

            return (
              <div
                key={prompt.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: catColor }}
                      >
                        {prompt.category}
                      </span>
                      {hasVariables && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <IcoWand s={12} />
                          Variáveis Dinâmicas
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-snug mt-1 break-words">
                      {prompt.title}
                    </h3>

                    {prompt.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {prompt.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleFavorite(prompt)}
                      className={`p-2 rounded-xl border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                        prompt.isFavorite
                          ? "text-amber-500"
                          : "text-slate-300 hover:text-amber-500"
                      }`}
                      title={prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt"}
                    >
                      {prompt.isFavorite ? <IcoStarFilled s={18} /> : <IcoStar s={18} />}
                    </button>

                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(prompt)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Editar prompt"
                        >
                          <IcoEdit s={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicatePrompt(prompt)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Duplicar prompt"
                        >
                          <IcoCopy s={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id, prompt.title)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Excluir prompt"
                        >
                          <IcoTrash s={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Prompt Content */}
                <div className="p-4 md:p-5 flex-1 flex flex-col gap-3">
                  <div className="relative bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/80 rounded-xl p-3.5 font-mono text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                    {prompt.content}
                  </div>

                  {prompt.variables && prompt.variables.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400">Variáveis:</span>
                      {prompt.variables.map((v, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono border border-purple-500/20"
                        >
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
                      {prompt.tags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            selectedTag === tag
                              ? "bg-[#e8451f] text-white"
                              : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between gap-2">
                  {hasVariables ? (
                    <button
                      onClick={() => handleOpenFillModal(prompt)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <IcoWand s={14} />
                      <span>⚡ Preencher & Copiar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => handleCopyPrompt(prompt)}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ml-auto ${
                      isCopied
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-[#e8451f] hover:bg-[#c83214] text-white shadow-md shadow-orange-500/20"
                    }`}
                  >
                    {isCopied ? <IcoCheck s={16} /> : <IcoCopy s={16} />}
                    <span>{isCopied ? "Copiado!" : "Copiar Prompt"}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL 1: Create / Edit Prompt (Mounted via Portal) ── */}
      {isEditModalOpen &&
        editingPrompt &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false)
            }}
          >
            <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#e8451f] flex items-center justify-center font-bold">
                    <IcoSparkles s={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      {editingPrompt.id && prompts.some((p) => p.id === editingPrompt.id)
                        ? "Editar Prompt"
                        : "Adicionar Novo Prompt"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Preencha o nome, categoria e o conteúdo do prompt.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                  aria-label="Fechar"
                >
                  <IcoClose s={20} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 flex-1">
                {/* Nome do Prompt */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome do Prompt *
                  </label>
                  <input
                    type="text"
                    value={editingPrompt.title || ""}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, title: e.target.value })
                    }
                    placeholder="Ex: Criador de Títulos Otimizados para Mercado Livre"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40"
                    autoFocus
                  />
                </div>

                {/* Categoria e Favorito */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Categoria *
                    </label>
                    <select
                      value={editingPrompt.category || categories[0]?.name || "Geral"}
                      onChange={(e) =>
                        setEditingPrompt({ ...editingPrompt, category: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Destaque / Favorito
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPrompt({
                          ...editingPrompt,
                          isFavorite: !editingPrompt.isFavorite,
                        })
                      }
                      className={`w-full py-2.5 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingPrompt.isFavorite
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {editingPrompt.isFavorite ? <IcoStarFilled s={16} /> : <IcoStar s={16} />}
                      <span>
                        {editingPrompt.isFavorite ? "Fixado nos Favoritos" : "Marcar como Favorito"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Descrição Curta */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Descrição / Objetivo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editingPrompt.description || ""}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex: Gera 5 opções de títulos com contagem de caracteres e SEO otimizado"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40"
                  />
                </div>

                {/* Conteúdo do Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Conteúdo do Prompt *
                    </label>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      💡 Use {"{variavel}"} para campos dinâmicos
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={editingPrompt.content || ""}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        content: e.target.value,
                      })
                    }
                    placeholder="Escreva o prompt aqui. Exemplo:&#10;Aja como especialista em e-commerce e crie um título para o produto {produto} da marca {marca}..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40 leading-relaxed"
                  />
                </div>

                {/* Variáveis Detectadas em tempo real */}
                {editingPrompt.content &&
                  extractPromptVariables(editingPrompt.content).length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-3 rounded-xl flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <IcoWand s={14} />
                        Variáveis identificadas:
                      </span>
                      {extractPromptVariables(editingPrompt.content).map((v, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold px-2 py-0.5 bg-purple-600 text-white rounded-md font-mono"
                        >
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Tags */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tags de Busca
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (tagInput.trim()) {
                            const cleanTag = tagInput.trim().replace(/^#/, "")
                            const currentTags = editingPrompt.tags || []
                            if (!currentTags.includes(cleanTag)) {
                              setEditingPrompt({
                                ...editingPrompt,
                                tags: [...currentTags, cleanTag],
                              })
                            }
                            setTagInput("")
                          }
                        }
                      }}
                      placeholder="Digite uma tag e pressione Enter..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e8451f]/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          const cleanTag = tagInput.trim().replace(/^#/, "")
                          const currentTags = editingPrompt.tags || []
                          if (!currentTags.includes(cleanTag)) {
                            setEditingPrompt({
                              ...editingPrompt,
                              tags: [...currentTags, cleanTag],
                            })
                          }
                          setTagInput("")
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {editingPrompt.tags && editingPrompt.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {editingPrompt.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-[#e8451f] flex items-center gap-1.5"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPrompt({
                                ...editingPrompt,
                                tags: editingPrompt.tags?.filter((_, i) => i !== idx),
                              })
                            }
                            className="hover:text-red-700 cursor-pointer border-none bg-transparent p-0 text-[#e8451f]"
                          >
                            <IcoClose s={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePrompt}
                  className="px-5 py-2.5 rounded-xl bg-[#e8451f] hover:bg-[#c83214] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer border-none"
                >
                  Salvar Prompt
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── MODAL 2: Preencher Variáveis Dinâmicas & Copiar (Mounted via Portal) ── */}
      {isFillModalOpen &&
        fillingPrompt &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsFillModalOpen(false)
            }}
          >
            <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-purple-50/40 dark:bg-purple-950/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <IcoWand s={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      Preencher Variáveis: {fillingPrompt.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Preencha os campos abaixo para gerar o prompt pronto para cópia.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFillModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <IcoClose s={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 flex-1">
                {/* Dynamic Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.keys(variableValues).map((varKey) => (
                    <div key={varKey}>
                      <label className="block text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">
                        {varKey.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        value={variableValues[varKey]}
                        onChange={(e) =>
                          setVariableValues({
                            ...variableValues,
                            [varKey]: e.target.value,
                          })
                        }
                        placeholder={`Digite o valor de ${varKey}...`}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Pré-visualização do Prompt Pronto:
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-mono text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed select-all">
                    {filledPromptPreview}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const cleared: Record<string, string> = {}
                    Object.keys(variableValues).forEach((k) => (cleared[k] = ""))
                    setVariableValues(cleared)
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
                >
                  Limpar Campos
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFillModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-transparent"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFilledPrompt}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-none ${
                      isCopiedFilled
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
                    }`}
                  >
                    {isCopiedFilled ? <IcoCheck s={16} /> : <IcoCopy s={16} />}
                    <span>{isCopiedFilled ? "Copiado!" : "Copiar Prompt Personalizado"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── MODAL 3: Gerenciador de Categorias (Mounted via Portal) ── */}
      {isCategoryModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsCategoryModalOpen(false)
            }}
          >
            <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#e8451f] flex items-center justify-center font-bold">
                    <IcoFolder s={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      Gerenciar Categorias
                    </h3>
                    <p className="text-xs text-slate-400">
                      Crie e organize categorias personalizadas para os seus prompts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                >
                  <IcoClose s={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 flex-1">
                {/* Add New Category Box */}
                {!isReadOnly && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                      + Nova Categoria
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nome da categoria (ex: Redes Sociais)"
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-10 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                        title="Escolher cor da categoria"
                      />
                    </div>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Descrição curta (opcional)"
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="self-end px-4 py-2 bg-[#e8451f] hover:bg-[#c83214] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                    >
                      Adicionar Categoria
                    </button>
                  </div>
                )}

                {/* List of Existing Categories */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Categorias Ativas ({categories.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {categories.map((cat) => {
                      const count = categoryCounts[cat.name] || 0
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color || "#e8451f" }}
                            />
                            <div>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block">
                                {cat.name}
                              </span>
                              {cat.description && (
                                <span className="text-[11px] text-slate-400 block line-clamp-1">
                                  {cat.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {count} {count === 1 ? "prompt" : "prompts"}
                            </span>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer border-none bg-transparent"
                                title="Excluir Categoria"
                              >
                                <IcoTrash s={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white dark:bg-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── MODAL 4: Backup / Importar (Mounted via Portal) ── */}
      {isBackupModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsBackupModalOpen(false)
            }}
          >
            <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Backup & Importação de Prompts
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exporte seus prompts em formato JSON ou restaure um backup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                >
                  <IcoClose s={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 flex-1">
                {/* Export Button */}
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                      Exportar Todos os Prompts ({prompts.length})
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Gera arquivo JSON com todos os prompts e categorias.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 bg-[#e8451f] hover:bg-[#c83214] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                  >
                    Baixar JSON
                  </button>
                </div>

                {/* Import Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                    Importar Prompts de Arquivo JSON
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer bg-transparent"
                  >
                    📁 Selecionar Arquivo .JSON do Computador
                  </button>

                  <textarea
                    rows={4}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="Ou cole o conteúdo JSON aqui..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200"
                  />

                  {importError && (
                    <span className="text-xs font-bold text-red-600">{importError}</span>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  disabled={!importJsonText.trim()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                >
                  Importar Prompts
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
