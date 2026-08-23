import { centralDb, centralStorage, centralAuth } from "../lib/centralFirebase"
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
  updatedAt: string
  createdAt?: string
}

const PRODUCTS_CACHE_KEY = "grupo_sj_products_cache_v1"

export function getCachedProducts(): ProductDoc[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn("Failed to load cached products:", e)
  }
  return []
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
  if (!centralAuth?.currentUser)
    throw new Error("Usuário não autenticado na Central")

  const id = product.id
  const now = new Date().toISOString()
  const uid = centralAuth.currentUser.uid

  const docData = {
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
    updatedAt: now,
    createdBy: uid,
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
