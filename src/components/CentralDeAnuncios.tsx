import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react"
import { Sidebar } from "./central/Sidebar"
import { ProductDetail } from "./central/ProductDetail"
import { EditorModal } from "./central/EditorModal"
import {
  getProductsFromFirebase,
  saveProductInFirebase,
  deleteProductFromFirebase,
  uploadCoverImage,
} from "../services/centralService"
import {
  Product,
  Marketplace,
  EditorForm,
  Validation,
  AdminSession,
} from "./central/types"
import "./CentralDeAnuncios.css"

const AUTHORIZED_EMAIL = "sjosethiago.r@gmail.com"

const blankForm = (marketplace: Marketplace): EditorForm => ({
  name: "",
  sku: "",
  category: "",
  status: "Publicado",
  driveUrl: "",
  marketplace,
  mlTitles: Array(10).fill(""),
  mlDescription: "",
  mlBulkText: "",
  shopeeTitles: Array(10).fill(""),
  shopeeDescription: "",
  shopeeBulkText: "",
  coverKey: null,
  coverUrl: null,
  coverColor: "#3159d9",
})

function formFromProduct(
  product: Product,
  marketplace: Marketplace,
): EditorForm {
  const mlTitles = [...(product.mlTitles ?? []), ...Array(10).fill("")].slice(
    0,
    10,
  )
  const shopeeTitles = [
    ...(product.shopeeTitles ?? []),
    ...Array(10).fill(""),
  ].slice(0, 10)
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    status: product.status,
    driveUrl: product.driveUrl ?? "",
    marketplace,
    mlTitles,
    mlDescription: product.mlDescription ?? "",
    mlBulkText: (product.mlTitles ?? []).filter(Boolean).join("\n"),
    shopeeTitles,
    shopeeDescription: product.shopeeDescription ?? "",
    shopeeBulkText: (product.shopeeTitles ?? []).filter(Boolean).join("\n"),
    coverKey: product.coverKey,
    coverUrl: product.coverUrl,
    coverColor: product.coverColor,
  }
}

function cleanForMarketplace(value: string) {
  if (!value) return ""

  let text = value
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")

  // 1. Remove markdown headings (#, ##, ###, ####, etc.)
  text = text.replace(/^#{1,6}\s*(.+)$/gm, "$1")

  // 2. Convert markdown list items (* item, + item, - item) to clean bullets (• item)
  text = text.replace(/^[\t ]*[\*\+\-]\s+/gm, "• ")
  text = text.replace(/^[\t ]*\*([^\*\s])/gm, "• $1")

  // 3. Remove bold / italic markdown (**bold**, __bold__, *italic*, _italic_)
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1")
  text = text.replace(/__([^_]+)__/g, "$1")
  text = text.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "$1")
  text = text.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")

  // 4. Remove markdown link syntax: [Label](url) -> Label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

  // 5. Remove horizontal rules (---, ***, ___ on their own line)
  text = text.replace(/^[-*_]{3,}\s*$/gm, "")

  // 6. Clean multiple spaces and blank lines
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

function parseTitleBlock(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n").trim()
  const rawParts = normalized.includes("\n")
    ? normalized.split(/\n+/)
    : normalized.includes(";")
      ? normalized.split(/;\s*/)
      : [normalized]

  return rawParts
    .map((line) =>
      cleanForMarketplace(line)
        .replace(
          /^\s*(?:t[ií]tulo\s*(?:\d{1,2})?\s*[:.)-]\s*|\d{1,2}\s*[:.)-]\s*|[-•*]\s*)/i,
          "",
        )
        .replace(/^["“”']+|["“”']+$/g, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 10)
}

function getMarketplaceValidation(
  title: string,
  mkt: Marketplace,
): Validation | null {
  const len = cleanForMarketplace(title).length
  if (!title.trim()) return null

  if (mkt === "mercado-livre") {
    if (len > 60) {
      return { status: "error", label: `${len}/60 ML · Excede o limite de 60` }
    }
    return { status: "ok", label: `${len}/60 ML` }
  } else {
    if (len > 120) {
      return {
        status: "error",
        label: `${len}/120 Shopee · Excede o limite de 120`,
      }
    }
    if (len < 20) {
      return {
        status: "warning",
        label: `${len}/120 Shopee · Recomenda-se min. 20`,
      }
    }
    return { status: "ok", label: `${len}/120 Shopee` }
  }
}

export interface CentralDeAnunciosProps {
  onBackToPortal?: () => void
  onSessionChange?: (session: AdminSession | null) => void
}

const CentralDeAnuncios = forwardRef<any, CentralDeAnunciosProps>(
  ({ onBackToPortal, onSessionChange }, ref) => {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedId, setSelectedId] = useState<string | number | null>(null)
    const [marketplace, setMarketplace] = useState<Marketplace>("mercado-livre")
    const [selectedTitle, setSelectedTitle] = useState(0)
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] =
      useState<"all" | "published" | "review">("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [titlesOpen, setTitlesOpen] = useState(true)
    const [descriptionOpen, setDescriptionOpen] = useState(true)
    const [loading, setLoading] = useState<boolean>(true)
    const [loadError, setLoadError] = useState("")
    const [copied, setCopied] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [editorOpen, setEditorOpen] = useState(false)
    const [form, setForm] = useState<EditorForm>(blankForm("mercado-livre"))
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | number | null>(null)
    const [saveError, setSaveError] = useState("")

    // Authentication State (static and fully authorized by default as access controls were moved to DashboardPortal)
    const [adminSession] = useState<AdminSession>({
      signedIn: true,
      isAuthorized: true,
      role: "owner",
      canEdit: true,
      canDelete: true,
      canManageUsers: false,
      user: { email: "externo@gruposj.com", name: "Externo" },
      signInUrl: "#",
      signOutUrl: "#",
    })

    useImperativeHandle(ref, () => ({
      openNewProduct: () => openEditor(undefined),
    }))

    useEffect(() => {
      if (onSessionChange) {
        onSessionChange(adminSession)
      }
    }, [adminSession, onSessionChange])

    const loadProducts = useCallback(async (preferredId?: string | number) => {
      try {
        setLoadError("")
        setLoading(true)
        const rows = await getProductsFromFirebase()
        setProducts(rows)
        setSelectedId((current) => {
          const candidate = preferredId ?? current
          return rows.some(
            (product) => String(product.id) === String(candidate),
          )
            ? candidate
            : (rows[0]?.id ?? null)
        })
      } catch (error) {
        setLoadError("Não foi possível carregar os produtos do Firestore.")
      } finally {
        setLoading(false)
      }
    }, [])

    // Load products on mount
    useEffect(() => {
      void loadProducts()
    }, [loadProducts])

    const selected =
      products.find((product) => product.id === selectedId) ??
      products[0] ??
      null
    const titles = selected
      ? (marketplace === "mercado-livre"
          ? selected.mlTitles
          : selected.shopeeTitles
        ).filter(Boolean)
      : []
    const description = selected
      ? marketplace === "mercado-livre"
        ? selected.mlDescription
        : selected.shopeeDescription
      : ""

    const categories = useMemo(() => {
      const set = new Set<string>()
      products.forEach((p) => {
        if (p.category && p.category.trim()) {
          set.add(p.category.trim())
        }
      })
      return Array.from(set).sort()
    }, [products])

    const filtered = useMemo(() => {
      const term = query.trim().toLocaleLowerCase("pt-BR")
      return products.filter((product) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && product.status === "Publicado") ||
          (statusFilter === "review" && product.status === "Em revisão")
        const matchesCategory =
          categoryFilter === "all" ||
          product.category.trim().toLocaleLowerCase("pt-BR") ===
            categoryFilter.trim().toLocaleLowerCase("pt-BR")
        const matchesSearch =
          !term ||
          [product.name, product.sku, product.category].some((value) =>
            value.toLocaleLowerCase("pt-BR").includes(term),
          )
        return matchesStatus && matchesCategory && matchesSearch
      })
    }, [products, query, statusFilter, categoryFilter])

    const chooseMarketplace = (value: Marketplace) => {
      setMarketplace(value)
      setSelectedTitle(0)
    }

    const copyText = async (label: string, value: string) => {
      await navigator.clipboard.writeText(cleanForMarketplace(value))
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1800)
    }

    const openEditor = (product?: Product) => {
      setForm(
        product
          ? formFromProduct(product, marketplace)
          : blankForm(marketplace),
      )
      setCoverFile(null)
      setCoverPreview(null)
      setSaveError("")
      setEditorOpen(true)
    }

    const changeEditorProduct = (value: string) => {
      if (value === "new") {
        setForm(blankForm(form.marketplace))
      } else {
        const target = products.find(
          (product) => String(product.id) === String(value),
        )
        if (target) setForm(formFromProduct(target, form.marketplace))
      }
      setCoverFile(null)
      setCoverPreview(null)
      setSaveError("")
    }

    const changeEditorMarketplace = (value: Marketplace) => {
      setForm((current) => ({ ...current, marketplace: value }))
      setSaveError("")
    }

    const updateTitle = (index: number, value: string) => {
      setForm((current) => {
        const isML = current.marketplace === "mercado-livre"
        const listField = isML ? "mlTitles" : "shopeeTitles"
        const textField = isML ? "mlBulkText" : "shopeeBulkText"
        const currentList = current[listField]
        const updatedList = currentList.map((title, titleIndex) =>
          titleIndex === index ? value : title,
        )
        return {
          ...current,
          [listField]: updatedList,
          [textField]: updatedList.filter(Boolean).join("\n"),
        }
      })
    }

    const addTitleField = () => {
      setForm((current) => {
        const isML = current.marketplace === "mercado-livre"
        const listField = isML ? "mlTitles" : "shopeeTitles"
        const textField = isML ? "mlBulkText" : "shopeeBulkText"
        const currentList = current[listField]
        const updatedList = [...currentList, ""]
        return {
          ...current,
          [listField]: updatedList,
          [textField]: updatedList.filter(Boolean).join("\n"),
        }
      })
    }

    const removeTitleField = (index: number) => {
      setForm((current) => {
        const isML = current.marketplace === "mercado-livre"
        const listField = isML ? "mlTitles" : "shopeeTitles"
        const textField = isML ? "mlBulkText" : "shopeeBulkText"
        const currentList = current[listField]
        const updatedList = currentList.filter((_, i) => i !== index)
        return {
          ...current,
          [listField]: updatedList,
          [textField]: updatedList.filter(Boolean).join("\n"),
        }
      })
    }

    const applyTitleBlock = (value: string) => {
      const parsed = parseTitleBlock(value)
      setForm((current) => {
        const isML = current.marketplace === "mercado-livre"
        const listField = isML ? "mlTitles" : "shopeeTitles"
        const textField = isML ? "mlBulkText" : "shopeeBulkText"
        const newTitles = [...parsed, ...Array(10).fill("")].slice(0, 10)
        return {
          ...current,
          [textField]: value,
          [listField]: newTitles,
        }
      })
    }

    const compressImage = async (
      file: File,
      maxDimension = 1200,
      quality = 0.85,
    ): Promise<File> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) return resolve(file)
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          URL.revokeObjectURL(url)
          let { width, height } = img
          if (
            width <= maxDimension &&
            height <= maxDimension &&
            file.size < 400000
          ) {
            return resolve(file)
          }
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) return resolve(file)
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file)
              const webpName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
              const compressedFile = new File([blob], webpName, {
                type: "image/webp",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            },
            "image/webp",
            quality,
          )
        }
        img.onerror = () => resolve(file)
        img.src = url
      })
    }

    const chooseCover = async (file: File | null) => {
      if (!file) {
        setCoverFile(null)
        if (coverPreview) URL.revokeObjectURL(coverPreview)
        setCoverPreview(null)
        return
      }
      const compressed = await compressImage(file)
      setCoverFile(compressed)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverPreview(URL.createObjectURL(compressed))
    }

    const saveProduct = async (event: React.FormEvent) => {
      event.preventDefault()
      setSaving(true)
      setSaveError("")
      try {
        let coverKey = form.coverKey
        if (coverFile) {
          // Upload directly to Firebase Storage
          const uploadUrl = await uploadCoverImage(coverFile)
          coverKey = uploadUrl
        }

        const savedId = await saveProductInFirebase({
          ...form,
          coverKey,
        })

        setMarketplace(form.marketplace)
        setSelectedTitle(0)
        setEditorOpen(false)
        setSaveSuccess(true)
        window.setTimeout(() => setSaveSuccess(false), 2800)
        void loadProducts(savedId)
      } catch (error) {
        setSaveError("Erro ao salvar produto no Firestore.")
      } finally {
        setSaving(false)
      }
    }

    const deleteProduct = async (product: Product) => {
      if (!adminSession?.canDelete) {
        return
      }
      if (
        !window.confirm(
          `Excluir “${product.name}”?\n\nEsta ação remove o produto do banco. Não é possível desfazer.`,
        )
      )
        return

      const previousProducts = [...products]
      const updatedProducts = products.filter(
        (p) => String(p.id) !== String(product.id),
      )
      setProducts(updatedProducts)
      if (String(selectedId) === String(product.id)) {
        setSelectedId(updatedProducts[0]?.id ?? null)
      }

      setDeletingId(product.id)
      setLoadError("")
      try {
        await deleteProductFromFirebase(String(product.id))
      } catch (error) {
        setProducts(previousProducts)
        setLoadError("Não foi possível excluir o produto.")
      } finally {
        setDeletingId(null)
      }
    }

    return (
      <div className="central-ads-wrapper">
        <section className="workspace">
          <Sidebar
            products={products}
            filtered={filtered}
            categories={categories}
            selectedId={selectedId}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            loading={loading}
            loadError={loadError}
            loadProducts={loadProducts}
            canEdit={adminSession.canEdit}
            canDelete={adminSession.canDelete}
            deletingId={deletingId}
            onSelectProduct={(id) => {
              setSelectedId(id)
              setSelectedTitle(0)
            }}
            onEditProduct={(p) => openEditor(p)}
            onDeleteProduct={(p) => deleteProduct(p)}
          />

          <ProductDetail
            selected={selected}
            loading={loading}
            canEdit={adminSession.canEdit}
            marketplace={marketplace}
            chooseMarketplace={chooseMarketplace}
            titles={titles}
            selectedTitle={selectedTitle}
            setSelectedTitle={setSelectedTitle}
            description={description}
            copied={copied}
            copyText={copyText}
            titlesOpen={titlesOpen}
            setTitlesOpen={setTitlesOpen}
            descriptionOpen={descriptionOpen}
            setDescriptionOpen={setDescriptionOpen}
            openEditor={openEditor}
            handleGoogleSignIn={async () => {}}
            getMarketplaceValidation={getMarketplaceValidation}
            cleanForMarketplace={cleanForMarketplace}
          />
        </section>

        <EditorModal
          editorOpen={editorOpen}
          setEditorOpen={setEditorOpen}
          saving={saving}
          saveError={saveError}
          form={form}
          setForm={setForm}
          products={products}
          categories={categories}
          changeEditorProduct={changeEditorProduct}
          changeEditorMarketplace={changeEditorMarketplace}
          coverPreview={coverPreview}
          chooseCover={chooseCover}
          addTitleField={addTitleField}
          updateTitleField={updateTitle}
          removeTitleField={removeTitleField}
          applyTitleBlock={applyTitleBlock}
          parseTitleBlock={parseTitleBlock}
          saveProduct={saveProduct}
          getMarketplaceValidation={getMarketplaceValidation}
          cleanForMarketplace={cleanForMarketplace}
        />

        <div
          className={`toast ${copied ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          Texto copiado com a formatação correta.
        </div>
        <div
          className={`toast success ${saveSuccess ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          ✓ Produto salvo com sucesso!
        </div>
      </div>
    )
  },
)

export default CentralDeAnuncios
