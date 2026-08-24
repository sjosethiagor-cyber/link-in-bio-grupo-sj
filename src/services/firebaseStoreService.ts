import { db, isFirebaseConfigured } from "../lib/firebase"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  onSnapshot,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import type { ClickEvent, Lead, StoreLink, SocialLinks } from "./storeService"
import { logger } from "../lib/logger"

/**
 * Exponential backoff retry utility for resilient network requests.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 400,
): Promise<T> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) {
        throw err
      }
      const backoff = delayMs * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }
  throw new Error("Maximum retries exceeded")
}

// ── Clicks Analytics ─────────────────────────────────────────────────────────

export async function recordClickInFirebase(event: ClickEvent): Promise<void> {
  if (!isFirebaseConfigured || !db) return

  try {
    await addDoc(collection(db, "clicks"), {
      ...event,
      serverTime: serverTimestamp(),
    })
  } catch (err) {
    logger.warn("recordClickInFirebase failed:", err)
  }
}

export interface ClicksPageResult {
  clicks: ClickEvent[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export async function getClicksFromFirebase(
  pageSize = 200,
  startDocSnapshot?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<ClicksPageResult> {
  if (!isFirebaseConfigured || !db) {
    return { clicks: [], lastDoc: null, hasMore: false }
  }

  try {
    return await withRetry(async () => {
      let q = query(
        collection(db!, "clicks"),
        orderBy("timestamp", "desc"),
        limit(pageSize),
      )

      if (startDocSnapshot) {
        q = query(
          collection(db!, "clicks"),
          orderBy("timestamp", "desc"),
          startAfter(startDocSnapshot),
          limit(pageSize),
        )
      }

      const querySnapshot = await getDocs(q)
      const clicks: ClickEvent[] = []

      querySnapshot.forEach((docSnap) => {
        clicks.push({ id: docSnap.id, ...docSnap.data() as ClickEvent })
      })

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null

      return {
        clicks,
        lastDoc,
        hasMore: querySnapshot.docs.length === pageSize,
      }
    })
  } catch (err) {
    logger.error("Error fetching clicks from Firebase", err)
    return { clicks: [], lastDoc: null, hasMore: false }
  }
}

export function subscribeToClicksInFirebase(
  onUpdate: (clicks: ClickEvent[]) => void,
  pageSize = 100,
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null

  try {
    const q = query(
      collection(db, "clicks"),
      orderBy("timestamp", "desc"),
      limit(pageSize),
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const clicks: ClickEvent[] = []
        snapshot.forEach((docSnap) => {
          clicks.push({ id: docSnap.id, ...docSnap.data() as ClickEvent })
        })
        onUpdate(clicks)
      },
      (error) => {
        logger.warn("subscribeToClicks listener warning:", error)
      },
    )
  } catch (err) {
    logger.error("subscribeToClicks initialization failed", err)
    return null
  }
}

// ── Lead Capture ─────────────────────────────────────────────────────────────

export async function saveLeadInFirebase(lead: Lead): Promise<string | null> {
  if (!isFirebaseConfigured || !db) return null

  try {
    return await withRetry(async () => {
      const docRef = await addDoc(collection(db!, "leads"), {
        ...lead,
        createdAtServer: serverTimestamp(),
      })
      return docRef.id
    })
  } catch (err) {
    logger.error("saveLeadInFirebase failed", err)
    return null
  }
}

export async function getLeadsFromFirebase(pageSize = 100): Promise<Lead[]> {
  if (!isFirebaseConfigured || !db) return []

  try {
    return await withRetry(async () => {
      const q = query(
        collection(db!, "leads"),
        orderBy("createdAt", "desc"),
        limit(pageSize),
      )
      const snapshot = await getDocs(q)
      const leads: Lead[] = []

      snapshot.forEach((docSnap) => {
        leads.push({ ...docSnap.data() as Lead, id: docSnap.id })
      })

      return leads
    })
  } catch (err) {
    logger.error("getLeadsFromFirebase failed", err)
    return []
  }
}

export function subscribeToLeadsInFirebase(
  onUpdate: (leads: Lead[]) => void,
  pageSize = 100,
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null

  try {
    const q = query(
      collection(db, "leads"),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const leads: Lead[] = []
        snapshot.forEach((docSnap) => {
          leads.push({ ...docSnap.data() as Lead, id: docSnap.id })
        })
        onUpdate(leads)
      },
      (error) => {
        logger.warn("subscribeToLeads listener warning:", error)
      },
    )
  } catch (err) {
    logger.error("subscribeToLeads initialization failed", err)
    return null
  }
}

export async function updateLeadStatusInFirebase(
  id: string,
  status: Lead["status"],
): Promise<void> {
  if (!isFirebaseConfigured || !db) return

  try {
    await withRetry(async () => {
      await updateDoc(doc(db!, "leads", id), { status })
    })
  } catch (err) {
    logger.error(`updateLeadStatusInFirebase failed for id ${id}`, err)
  }
}

export async function updateLeadTagsInFirebase(
  id: string,
  tags: string[],
): Promise<void> {
  if (!isFirebaseConfigured || !db) return

  try {
    await withRetry(async () => {
      await updateDoc(doc(db!, "leads", id), { tags })
    })
  } catch (err) {
    logger.error(`updateLeadTagsInFirebase failed for id ${id}`, err)
  }
}

// ── Store & Social Links CMS ─────────────────────────────────────────────────

export async function saveMLStoreLinksInFirebase(
  links: StoreLink[],
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(doc(db, "links", "mercadoLivre"), { list: links })
  } catch (err) {
    logger.error("saveMLStoreLinksInFirebase failed", err)
  }
}

export async function getMLStoreLinksFromFirebase(): Promise<StoreLink[] | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(doc(db, "links", "mercadoLivre"))
    if (snap.exists()) {
      const data = snap.data()
      return data.list || []
    }
    return null
  } catch (err) {
    logger.warn("getMLStoreLinksFromFirebase warning:", err)
    return null
  }
}

export async function saveShopeeStoreLinksInFirebase(
  links: StoreLink[],
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(doc(db, "links", "shopee"), { list: links })
  } catch (err) {
    logger.error("saveShopeeStoreLinksInFirebase failed", err)
  }
}

export async function getShopeeStoreLinksFromFirebase(): Promise<StoreLink[] | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(doc(db, "links", "shopee"))
    if (snap.exists()) {
      const data = snap.data()
      return data.list || []
    }
    return null
  } catch (err) {
    logger.warn("getShopeeStoreLinksFromFirebase warning:", err)
    return null
  }
}

export async function saveTikTokStoreLinksInFirebase(
  links: StoreLink[],
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(doc(db, "links", "tiktok"), { list: links })
  } catch (err) {
    logger.error("saveTikTokStoreLinksInFirebase failed", err)
  }
}

export async function getTikTokStoreLinksFromFirebase(): Promise<StoreLink[] | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(doc(db, "links", "tiktok"))
    if (snap.exists()) {
      const data = snap.data()
      return data.list || []
    }
    return null
  } catch (err) {
    logger.warn("getTikTokStoreLinksFromFirebase warning:", err)
    return null
  }
}

export async function saveSocialLinksInFirebase(
  social: SocialLinks,
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(doc(db, "links", "social"), social)
  } catch (err) {
    logger.error("saveSocialLinksInFirebase failed", err)
  }
}

export async function getSocialLinksFromFirebase(): Promise<SocialLinks | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(doc(db, "links", "social"))
    if (snap.exists()) {
      return snap.data() as SocialLinks
    }
    return null
  } catch (err) {
    logger.warn("getSocialLinksFromFirebase warning:", err)
    return null
  }
}
