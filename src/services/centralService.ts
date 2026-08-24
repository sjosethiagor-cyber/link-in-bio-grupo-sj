import {
  centralDb,
  centralStorage,
  centralAuth,
  ensureCentralAuth,
} from "../lib/centralFirebase"
import DOMPurify from "dompurify"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore"
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"
import type { Product, UserRoleRecord } from "../components/central/types"

export interface ProductDoc {
  id: string
  name: string
  sku: string
  category: string
  status: string
  driveUrl: string | null
  coverKey: string | null
  coverUrl: string | null
  coverColor: string
  mlTitles: string[]
  mlDescription: string
  shopeeTitles: string[]
  shopeeDescription: string
  tiktokTitles?: string[]
  tiktokDescription?: string
  temuTitles?: string[]
  temuDescription?: string
  updatedAt: string
  createdAt?: string
}

const PRODUCTS_CACHE_KEY = "grupo_sj_products_cache_v1"

export const INITIAL_CATALOG_FALLBACK: ProductDoc[] = [
  {
    id: "inPxrzj3Qc7wKbm8c07G",
    name: "COLA BLOCO",
    sku: "COLABLOCO-1",
    category: "Argamassa",
    status: "Publicado",
    driveUrl: "https://drive.google.com/drive/folders/1w7UoGhy88r5a1g1lA4nQ2w7hUuVvXwYZ",
    coverKey: "https://firebasestorage.googleapis.com/v0/b/central-de-anuncios-b62ca.firebasestorage.app/o/covers%2F1772421376822_60u25p8.webp?alt=media&token=8d234cf7-775e-4c31-897b-1cbbf47f3b89",
    coverUrl: "https://firebasestorage.googleapis.com/v0/b/central-de-anuncios-b62ca.firebasestorage.app/o/covers%2F1772421376822_60u25p8.webp?alt=media&token=8d234cf7-775e-4c31-897b-1cbbf47f3b89",
    coverColor: "#3159d9",
    mlTitles: [
      "Argamassa Polimerica Cola Bloco Tijolo Alvenaria 15kg",
      "Cola Bloco Argamassa Polimerica Massa Pronta P/ Tijolos 15kg",
      "Cola Bloco Massa Polimerica Pronta P/ Assentar Tijolos 15kg",
      "Argamassa Polimerica Pronta Cola Bloco Tijolos 15kg",
      "Massa Pronta Cola Bloco Assentamento De Tijolos 15kg",
      "Cola Bloco Massa Polimerica Pronta P/ Alvenaria 15kg",
      "Cola Bloco Argamassa Polimerica Para Tijolo Ecologico 15kg",
      "Argamassa Polimerica Pronta P/ Assentar Tijolos 15kg",
    ],
    mlDescription:
      "A Argamassa Polimérica Cola Bloco é uma massa pronta para uso imediato em assentamento de tijolos e blocos de concreto em alvenaria de vedação.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-10T14:48:47.382Z",
  },
  {
    id: "osNROovVvnrPcZfdXZft",
    name: "Kit Pedra Natural 20kg",
    sku: "KIT2PEDRA20KG-",
    category: "Revestimento",
    status: "Publicado",
    driveUrl: null,
    coverKey: null,
    coverUrl: null,
    coverColor: "#3159d9",
    mlTitles: [
      "Kit Pedra Natural RevCollor 40kg + 2 Primers 900ml",
      "Pedra Natural RevCollor 40kg Com 2 Fundos Primer",
      "Kit Revestimento Pedra Natural 40kg + 2 Primers",
      "Revestimento Pedra Natural 40kg Com Primer RevCollor",
      "Kit 2 Pedras Naturais 20kg + 2 Primers RevCollor",
      "Pedra Natural Decorativa 40kg + 2 Primers 900ml",
      "Kit Revestimento Para Parede Pedra Natural 40kg",
      "Pedra Natural RevCollor 2 Barricas 20kg Com Primer",
    ],
    mlDescription:
      "Kit completo de Pedra Natural RevCollor 40kg (2 barricas de 20kg) acompanhado de 2 primers de 900ml para garantir aderência perfeita.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-06T00:23:14.069Z",
  },
  {
    id: "NsKesyR6EPSoCOg1KNlV",
    name: "Kit Pedra Natural 5 kg",
    sku: "KIT2PEDRA5KG-",
    category: "Revestimento",
    status: "Publicado",
    driveUrl: null,
    coverKey: null,
    coverUrl: null,
    coverColor: "#3159d9",
    mlTitles: [
      "Kit 2 Pedra Natural RevCollor 5kg + Fundo Primer 900ml",
      "Kit Revestimento Pedra Natural 10kg Com Fundo Primer",
      "Pedra Natural RevCollor Kit 10kg + Primer Para Aplicacao",
      "Kit Pedra Natural Decorativa 10kg Parede + Primer 900ml",
      "Revestimento Pedra Natural 2x 5kg RevCollor + Primer",
      "Kit 2 Galoes Pedra Natural 5kg + 1 Fundo Primer RevCollor",
      "Pedra Natural Parede Kit 10kg Com Primer Pronto P/ Uso",
      "Kit Pedra Natural RevCollor 10kg + Primer Promotor Aderencia",
    ],
    mlDescription:
      "Kit Revestimento Pedra Natural RevCollor 10kg (2 galões de 5kg) + 1 Primer de 900ml para fácil aplicação.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-06T00:23:36.568Z",
  },
  {
    id: "XC4jdmSncKRC9i30FYSI",
    name: "Pedra natural 20kg",
    sku: "PEDRA20KG-",
    category: "Revestimento",
    status: "Publicado",
    driveUrl: null,
    coverKey: null,
    coverUrl: null,
    coverColor: "#3159d9",
    mlTitles: [
      "Pedra Natural RevCollor 20kg Revestimento Parede Decorativo",
      "Revestimento Pedra Natural RevCollor Barrica 20kg P/ Parede",
      "Pedra Natural 20kg RevCollor Revestimento Textura Decorativa",
      "Massa Pedra Natural 20kg RevCollor Parede Interna E Externa",
      "Pedra Natural Decorativa 20kg RevCollor Alta Durabilidade",
      "Revestimento Texturado Pedra Natural RevCollor 20kg",
      "Pedra Natural Parede 20kg RevCollor Pronto Para Aplicar",
      "Revestimento Mineral Pedra Natural 20kg RevCollor Original",
    ],
    mlDescription:
      "Revestimento decorativo em Pedra Natural RevCollor 20kg de alta resistência para paredes internas e externas.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-06T00:22:42.502Z",
  },
  {
    id: "o8KGJgmCVAjdMiZRDlGa",
    name: "Pedra natural 5kg",
    sku: "PEDRA5KG-",
    category: "Revestimento",
    status: "Publicado",
    driveUrl: null,
    coverKey: null,
    coverUrl: null,
    coverColor: "#3159d9",
    mlTitles: [
      "Pedra Natural RevCollor 5kg Revestimento Decorativo Parede",
      "Revestimento Pedra Natural RevCollor Galao 5kg P/ Parede",
      "Pedra Natural 5kg RevCollor Revestimento Textura Parede",
      "Massa Pedra Natural 5kg RevCollor Parede Interna E Externa",
      "Pedra Natural Decorativa 5kg RevCollor Alta Durabilidade",
      "Revestimento Texturado Pedra Natural RevCollor 5kg",
      "Pedra Natural Parede 5kg RevCollor Pronto Para Aplicar",
      "Revestimento Mineral Pedra Natural 5kg RevCollor Original",
    ],
    mlDescription:
      "Revestimento em Pedra Natural RevCollor 5kg ideal para detalhes e paredes sofisticadas.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-06T00:22:58.261Z",
  },
  {
    id: "VelRiqyDw58WIr9ST1hT",
    name: "Suporte para Notebook",
    sku: "SUPORTENOTE-01",
    category: "Acessórios",
    status: "Publicado",
    driveUrl: null,
    coverKey: null,
    coverUrl: null,
    coverColor: "#3159d9",
    mlTitles: [
      "Suporte Para Notebook Ajustavel Ergonomico Mesa Dobravel",
      "Suporte Articulado De Mesa Para Notebook Regulavel",
      "Suporte Ergonomico Para Notebook Portatil Dobravel",
      "Base Suporte Para Notebook Ajuste De Altura Ergonomico",
      "Suporte Notebook Mesa Dobravel Regulavel Portatil",
      "Suporte De Alumínio Notebook Apoio Ergonomico Ajustavel",
      "Base Elevatória Para Notebook Regulagem De Altura",
      "Suporte Articulavel P/ Notebook Conforto Ergonomico",
    ],
    mlDescription:
      "Suporte ergonômico articulado para notebook, dobrável, portátil e com regulagem de altura.",
    shopeeTitles: [],
    shopeeDescription: "",
    updatedAt: "2026-08-06T00:22:15.000Z",
  },
]

export function getCachedProducts(): ProductDoc[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn("Failed to load cached products:", e)
  }
  return INITIAL_CATALOG_FALLBACK
}

export function saveCachedProducts(products: ProductDoc[]): void {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products))
  } catch (e) {
    console.warn("Failed to save cached products:", e)
  }
}

// ─── Products Collection API ──────────────────────────────────────────────────

export async function getProductsFromFirebase(): Promise<ProductDoc[]> {
  if (!centralDb) return getCachedProducts()
  try {
    const q = query(collection(centralDb, "products"), orderBy("name", "asc"))
    const snapshot = await getDocs(q)
    const products: ProductDoc[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const coverKey = data.coverKey ? String(data.coverKey) : null
      const coverUrl = coverKey
        ? coverKey.startsWith("http") || coverKey.startsWith("data:")
          ? coverKey
          : null // If it's not a url, we won't be able to resolve it easily since we don't have Next API covers routing
        : null

      products.push({
        id: docSnap.id,
        name: String(data.name || ""),
        sku: String(data.sku || ""),
        category: String(data.category || "Geral"),
        status: String(data.status || "Publicado"),
        driveUrl: data.driveUrl ? String(data.driveUrl) : null,
        coverKey,
        coverUrl: coverUrl || data.coverUrl || null,
        coverColor: String(data.coverColor || "#3159d9"),
        mlTitles: Array.isArray(data.mlTitles) ? data.mlTitles : [],
        mlDescription: String(data.mlDescription || ""),
        shopeeTitles: Array.isArray(data.shopeeTitles) ? data.shopeeTitles : [],
        shopeeDescription: String(data.shopeeDescription || ""),
        tiktokTitles: Array.isArray(data.tiktokTitles) ? data.tiktokTitles : [],
        tiktokDescription: String(data.tiktokDescription || ""),
        temuTitles: Array.isArray(data.temuTitles) ? data.temuTitles : [],
        temuDescription: String(data.temuDescription || ""),
        updatedAt: data.updatedAt
          ? String(data.updatedAt)
          : new Date().toISOString(),
      })
    })

    // Fallback: sort locally just in case
    products.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    saveCachedProducts(products)
    return products
  } catch (error) {
    console.error(
      "Error getProductsFromFirebase (falling back to cache):",
      error,
    )
    const cached = getCachedProducts()
    if (cached.length > 0) return cached
    throw error
  }
}

export async function saveProductInFirebase(
  product: Partial<Omit<ProductDoc, "id">> & { id?: string | number },
): Promise<string> {
  if (!centralDb) throw new Error("Database not connected")

  let uid = centralAuth?.currentUser?.uid
  if (!uid) {
    uid = await ensureCentralAuth()
  }

  const id = product.id
  const now = new Date().toISOString()

  const docData: any = {
    name: DOMPurify.sanitize(product.name || ""),
    sku: DOMPurify.sanitize(product.sku || ""),
    category: DOMPurify.sanitize(product.category || "Geral"),
    status: product.status === "Em revisão" ? "Em revisão" : "Publicado",
    driveUrl: product.driveUrl ? DOMPurify.sanitize(product.driveUrl) : null,
    coverKey: product.coverKey || null,
    coverColor: product.coverColor || "#3159d9",
    mlTitles: (product.mlTitles || []).map((t) => DOMPurify.sanitize(t)),
    mlDescription: DOMPurify.sanitize(product.mlDescription || ""),
    shopeeTitles: (product.shopeeTitles || []).map((t) =>
      DOMPurify.sanitize(t),
    ),
    shopeeDescription: DOMPurify.sanitize(product.shopeeDescription || ""),
    tiktokTitles: (product.tiktokTitles || []).map((t) =>
      DOMPurify.sanitize(t),
    ),
    tiktokDescription: DOMPurify.sanitize(product.tiktokDescription || ""),
    temuTitles: (product.temuTitles || []).map((t) => DOMPurify.sanitize(t)),
    temuDescription: DOMPurify.sanitize(product.temuDescription || ""),
    updatedAt: now,
  }

  if (uid) {
    docData.createdBy = uid
  }

  if (id) {
    // Edit existing product
    const docRef = doc(centralDb, "products", String(id))
    await setDoc(docRef, docData, { merge: true })
    return String(id)
  } else {
    // Create new product
    const colRef = collection(centralDb, "products")
    const docRef = await addDoc(colRef, {
      ...docData,
      createdAt: now,
    })
    return docRef.id
  }
}

export async function deleteProductFromFirebase(id: string): Promise<void> {
  if (!centralDb) throw new Error("Database not connected")

  // Try to find if there is a coverKey that we should delete from storage
  try {
    const docRef = doc(centralDb, "products", id)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      const data = snap.data()
      const coverKey = data.coverKey
      if (
        coverKey &&
        coverKey.startsWith("https://firebasestorage.googleapis.com") &&
        centralStorage
      ) {
        // Try deleting cover image from Storage if it belongs to this app
        try {
          const fileRef = ref(centralStorage, coverKey)
          await deleteObject(fileRef)
        } catch (e) {
          console.warn("Storage cover delete warning:", e)
        }
      }
    }
  } catch (e) {
    console.warn("Could not retrieve coverKey prior to deletion:", e)
  }

  const docRef = doc(centralDb, "products", id)
  await deleteDoc(docRef)
}

// ─── User Roles Collection API ────────────────────────────────────────────────

export async function getCentralUserRole(email: string): Promise<string> {
  if (!centralDb) return "viewer"
  const cleanEmail = email.trim().toLowerCase()

  // Owner is hardcoded
  if (cleanEmail === "sjosethiago.r@gmail.com") return "owner"

  try {
    const docRef = doc(centralDb, "user_roles", cleanEmail)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      const data = snap.data()
      return String(data.role || "viewer")
    }
  } catch (error) {
    console.warn("Error fetching user role:", error)
  }
  return "viewer"
}

export async function getCentralUserRoles(): Promise<UserRoleRecord[]> {
  if (!centralDb) return []
  try {
    const snap = await getDocs(collection(centralDb, "user_roles"))
    const roles: UserRoleRecord[] = []

    snap.forEach((docSnap) => {
      const data = docSnap.data()
      roles.push({
        id: docSnap.id,
        email: docSnap.id,
        role: data.role as any,
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
      })
    })
    return roles
  } catch (error) {
    console.error("Error getCentralUserRoles:", error)
    throw error
  }
}

export async function saveCentralUserRole(
  email: string,
  role: string,
): Promise<void> {
  if (!centralDb) throw new Error("Database not connected")
  const cleanEmail = email.trim().toLowerCase()
  const now = new Date().toISOString()

  const docRef = doc(centralDb, "user_roles", cleanEmail)
  await setDoc(
    docRef,
    {
      role,
      updatedAt: now,
      createdAt: now, // will be merged/set
    },
    { merge: true },
  )
}

export async function deleteCentralUserRole(email: string): Promise<void> {
  if (!centralDb) throw new Error("Database not connected")
  const cleanEmail = email.trim().toLowerCase()
  const docRef = doc(centralDb, "user_roles", cleanEmail)
  await deleteDoc(docRef)
}

// ─── Image Upload Service ─────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"]
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

import { compressImage } from "../lib/imageCompressor"

export async function uploadCoverImage(file: File): Promise<string> {
  if (!centralStorage) throw new Error("Storage not connected")
  await ensureCentralAuth()

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Tipo de arquivo não permitido: "${file.type}". Envie apenas imagens (JPEG, PNG, WebP, GIF, SVG).`,
    )
  }

  // Validate file extension
  const fileExt = (file.name.split(".").pop() || "").toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
    throw new Error(
      `Extensão de arquivo não permitida: ".${fileExt}". Use: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}.`,
    )
  }

  // Validate file size before compression (10 MB max)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`Arquivo muito grande (${sizeMB} MB). O limite é de 10 MB.`)
  }

  // Optimize & compress image before sending to Firebase Storage
  const optimizedFile = await compressImage(file, 1600, 0.85)

  const finalExt = (optimizedFile.name.split(".").pop() || "webp").toLowerCase()
  const fileName = `covers/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${finalExt}`
  const fileRef = ref(centralStorage, fileName)

  await uploadBytes(fileRef, optimizedFile, {
    contentType: optimizedFile.type || "image/webp",
  })
  const downloadUrl = await getDownloadURL(fileRef)
  return downloadUrl
}
