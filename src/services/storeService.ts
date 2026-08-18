export interface ClickEvent {
  id?: string
  linkId: string
  linkName: string
  category: "Mercado Livre" | "Shopee" | "TikTok" | "TikTok Shop" | "Rede Social" | "Contato"
  timestamp: number
}

export interface Lead {
  id: string
  name: string
  whatsapp: string
  email: string
  message: string
  status: "Novo" | "Em Atendimento" | "Concluído"
  createdAt: number
}

export interface StoreLink {
  id: string
  name: string
  desc: string
  href: string
  storeType: "ml" | "shopee" | "tiktok"
}

// ── Security Helpers & Input Sanitization ─────────────────────────────────────

export function sanitizeText(input: string, maxLen = 300): string {
  if (!input) return ""
  return input
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
    .trim()
    .slice(0, maxLen)
}

export function sanitizeUrl(url: string): string {
  if (!url) return "https://www.mercadolivre.com.br"
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "https://www.mercadolivre.com.br"
  }
  try {
    const parsed = new URL(
      trimmed.startsWith("http") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:")
        ? trimmed
        : "https://" + trimmed,
    )
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return parsed.toString().slice(0, 1000)
    }
  } catch {
    // Fallback if parsing fails
  }
  return "https://www.mercadolivre.com.br"
}

// ── Default Links Initial State ─────────────────────────────────────────────

export const DEFAULT_ML_LOJAS: StoreLink[] = [
  {
    id: "ml_cola_mix",
    name: "Cola Mix",
    desc: "Adesivos e colas",
    href: "https://www.mercadolivre.com.br",
    storeType: "ml",
  },
  {
    id: "ml_trio_mix",
    name: "Trio Mix",
    desc: "Kits e combos",
    href: "https://www.mercadolivre.com.br",
    storeType: "ml",
  },
  {
    id: "ml_maximper",
    name: "MAXIMPER",
    desc: "Linha premium",
    href: "https://www.mercadolivre.com.br",
    storeType: "ml",
  },
  {
    id: "ml_sj_novais",
    name: "SJ Novais",
    desc: "Loja geral",
    href: "https://www.mercadolivre.com.br",
    storeType: "ml",
  },
]

export const DEFAULT_SHOPEE_LOJAS: StoreLink[] = [
  {
    id: "sp_cola_mix",
    name: "Cola Mix",
    desc: "Adesivos e colas",
    href: "https://shopee.com.br",
    storeType: "shopee",
  },
  {
    id: "sp_trio_mix",
    name: "Trio Mix",
    desc: "Kits e combos",
    href: "https://shopee.com.br",
    storeType: "shopee",
  },
  {
    id: "sp_maximper",
    name: "MAXIMPER",
    desc: "Linha premium",
    href: "https://shopee.com.br",
    storeType: "shopee",
  },
  {
    id: "sp_sj_novais",
    name: "SJ Novais",
    desc: "Loja geral",
    href: "https://shopee.com.br",
    storeType: "shopee",
  },
]

export const DEFAULT_TIKTOK_LOJAS: StoreLink[] = [
  {
    id: "tt_grupo_sj",
    name: "Grupo SJ Oficial",
    desc: "Loja oficial no TikTok Shop",
    href: "https://www.tiktok.com/@gruposj",
    storeType: "tiktok",
  },
]

export interface SocialLinks {
  instagram: string
  facebook: string
  youtube: string
  whatsapp: string
  email: string
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: "https://instagram.com/gruposj",
  facebook: "https://facebook.com/gruposj",
  youtube: "https://youtube.com/@gruposj",
  whatsapp: "https://wa.me/5511999999999",
  email: "contato@gruposj.com.br",
}

const LOCAL_STORAGE_KEYS = {
  CLICKS: "grupo_sj_clicks_v1",
  LEADS: "grupo_sj_leads_v1",
  LINKS_ML: "grupo_sj_links_ml_v1",
  LINKS_SP: "grupo_sj_links_sp_v1",
  LINKS_TT: "grupo_sj_links_tt_v1",
  SOCIAL_LINKS: "grupo_sj_social_links_v1",
}

// ── Clicks Analytics Service ─────────────────────────────────────────────────

export async function recordClick(
  linkId: string,
  linkName: string,
  category: "Mercado Livre" | "Shopee" | "TikTok" | "Rede Social" | "Contato",
) {
  const event: ClickEvent = {
    linkId,
    linkName,
    category,
    timestamp: Date.now(),
  }

  // Local storage backup
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICKS)
    const existing: ClickEvent[] = existingRaw ? JSON.parse(existingRaw) : []
    existing.unshift(event)
    // Keep max 500 recent clicks in local storage
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.CLICKS,
      JSON.stringify(existing.slice(0, 500)),
    )
  } catch (err) {
    console.error("Local storage error on recordClick:", err)
  }

  // Firebase is loaded only after the first tracked interaction.
  try {
    const { recordClickInFirebase } = await import("./firebaseStoreService")
    await recordClickInFirebase(event)
  } catch (err) {
    console.warn("Firestore recordClick error:", err)
  }
}

export async function getClicks(): Promise<ClickEvent[]> {
  let firebaseClicks: ClickEvent[] = []

  try {
    const { getClicksFromFirebase } = await import("./firebaseStoreService")
    const result = await getClicksFromFirebase()
    firebaseClicks = result.clicks
  } catch (err) {
    console.warn("Firestore getClicks fallback to localStorage:", err)
  }

  if (firebaseClicks.length > 0) {
    return firebaseClicks
  }

  // Fallback local storage
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICKS)
    return existingRaw ? JSON.parse(existingRaw) : []
  } catch (err) {
    return []
  }
}

// ── Lead Capture Service ─────────────────────────────────────────────────────

export async function saveLead(data: {
  name: string
  whatsapp: string
  email: string
  message: string
}): Promise<Lead> {
  const newLead: Lead = {
    id: "lead_" + Math.random().toString(36).substring(2, 9),
    name: sanitizeText(data.name, 100),
    whatsapp: sanitizeText(data.whatsapp, 50),
    email: sanitizeText(data.email, 100),
    message: sanitizeText(data.message, 1000),
    status: "Novo",
    createdAt: Date.now(),
  }

  // Local Storage (limit to most recent 100 leads to prevent quota exhaustion)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS)
    const existing: Lead[] = raw ? JSON.parse(raw) : []
    existing.unshift(newLead)
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.LEADS,
      JSON.stringify(existing.slice(0, 100)),
    )
  } catch (err) {
    console.error("Local storage saveLead error:", err)
  }

  // Firebase is loaded only when a lead is submitted.
  try {
    const { saveLeadInFirebase } = await import("./firebaseStoreService")
    const firebaseId = await saveLeadInFirebase(newLead)
    if (firebaseId) newLead.id = firebaseId
  } catch (err) {
    console.warn("Firestore saveLead error:", err)
  }

  return newLead
}

export async function getLeads(): Promise<Lead[]> {
  let firebaseLeads: Lead[] = []

  try {
    const { getLeadsFromFirebase } = await import("./firebaseStoreService")
    firebaseLeads = await getLeadsFromFirebase()
  } catch (err) {
    console.warn("Firestore getLeads fallback:", err)
  }

  if (firebaseLeads.length > 0) {
    return firebaseLeads
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    return []
  }
}

export async function updateLeadStatus(
  id: string,
  status: "Novo" | "Em Atendimento" | "Concluído",
) {
  // Update local storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS)
    if (raw) {
      const leads: Lead[] = JSON.parse(raw)
      const updated = leads.map((l) => (l.id === id ? { ...l, status } : l))
      localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(updated))
    }
  } catch (err) {
    console.error(err)
  }

  // Firebase is loaded only when an admin changes a lead status.
  try {
    const { updateLeadStatusInFirebase } = await import(
      "./firebaseStoreService"
    )
    await updateLeadStatusInFirebase(id, status)
  } catch (err) {
    console.warn("Firestore updateLeadStatus warning:", err)
  }
}

// ── Store & Social Links CMS Service ─────────────────────────────────────────

export function getStoredMLStoreLinks(): StoreLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LINKS_ML)
    if (!raw) return DEFAULT_ML_LOJAS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_ML_LOJAS
  } catch {
    return DEFAULT_ML_LOJAS
  }
}

export function getStoredShopeeStoreLinks(): StoreLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LINKS_SP)
    if (!raw) return DEFAULT_SHOPEE_LOJAS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_SHOPEE_LOJAS
  } catch {
    return DEFAULT_SHOPEE_LOJAS
  }
}

export function saveStoredMLStoreLinks(links: StoreLink[]) {
  try {
    const sanitized = links.map((l) => ({
      ...l,
      name: sanitizeText(l.name || (l as any).nome || "", 100),
      desc: sanitizeText(l.desc, 150),
      href: sanitizeUrl(l.href),
    }))
    localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_ML, JSON.stringify(sanitized))
    import("./firebaseStoreService")
      .then(({ saveMLStoreLinksInFirebase }) => {
        saveMLStoreLinksInFirebase(sanitized)
      })
      .catch((err) =>
        console.warn("Firestore saveMLStoreLinksInFirebase error:", err),
      )
  } catch (e) {
    console.error(e)
  }
}

export async function getMLStoreLinks(): Promise<StoreLink[]> {
  const local = getStoredMLStoreLinks()
  try {
    const { getMLStoreLinksFromFirebase } = await import(
      "./firebaseStoreService"
    )
    const cloud = await getMLStoreLinksFromFirebase()
    if (cloud && cloud.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_ML, JSON.stringify(cloud))
      return cloud
    }
  } catch (err) {
    console.warn("Failed to fetch ML store links from Firebase:", err)
  }
  return local
}

export function saveStoredShopeeStoreLinks(links: StoreLink[]) {
  try {
    const sanitized = links.map((l) => ({
      ...l,
      name: sanitizeText(l.name || (l as any).nome || "", 100),
      desc: sanitizeText(l.desc, 150),
      href: sanitizeUrl(l.href),
    }))
    localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_SP, JSON.stringify(sanitized))
    import("./firebaseStoreService")
      .then(({ saveShopeeStoreLinksInFirebase }) => {
        saveShopeeStoreLinksInFirebase(sanitized)
      })
      .catch((err) =>
        console.warn("Firestore saveShopeeStoreLinksInFirebase error:", err),
      )
  } catch (e) {
    console.error(e)
  }
}

export async function getShopeeStoreLinks(): Promise<StoreLink[]> {
  const local = getStoredShopeeStoreLinks()
  try {
    const { getShopeeStoreLinksFromFirebase } = await import(
      "./firebaseStoreService"
    )
    const cloud = await getShopeeStoreLinksFromFirebase()
    if (cloud && cloud.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_SP, JSON.stringify(cloud))
      return cloud
    }
  } catch (err) {
    console.warn("Failed to fetch Shopee store links from Firebase:", err)
  }
  return local
}

export function getStoredTikTokStoreLinks(): StoreLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LINKS_TT)
    if (!raw) return DEFAULT_TIKTOK_LOJAS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_TIKTOK_LOJAS
  } catch {
    return DEFAULT_TIKTOK_LOJAS
  }
}

export function saveStoredTikTokStoreLinks(links: StoreLink[]) {
  try {
    const sanitized = links.map((l) => ({
      ...l,
      name: sanitizeText(l.name || (l as any).nome || "", 100),
      desc: sanitizeText(l.desc, 150),
      href: sanitizeUrl(l.href),
    }))
    localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_TT, JSON.stringify(sanitized))
    import("./firebaseStoreService")
      .then(({ saveTikTokStoreLinksInFirebase }) => {
        saveTikTokStoreLinksInFirebase(sanitized)
      })
      .catch((err) =>
        console.warn("Firestore saveTikTokStoreLinksInFirebase error:", err),
      )
  } catch (e) {
    console.error(e)
  }
}

export async function getTikTokStoreLinks(): Promise<StoreLink[]> {
  const local = getStoredTikTokStoreLinks()
  try {
    const { getTikTokStoreLinksFromFirebase } = await import(
      "./firebaseStoreService"
    )
    const cloud = await getTikTokStoreLinksFromFirebase()
    if (cloud && cloud.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_TT, JSON.stringify(cloud))
      return cloud
    }
  } catch (err) {
    console.warn("Failed to fetch TikTok store links from Firebase:", err)
  }
  return local
}

export function getStoredSocialLinks(): SocialLinks {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SOCIAL_LINKS)
    if (!raw) return DEFAULT_SOCIAL_LINKS
    const parsed = JSON.parse(raw)
    return {
      instagram: sanitizeUrl(
        parsed.instagram || DEFAULT_SOCIAL_LINKS.instagram,
      ),
      facebook: sanitizeUrl(parsed.facebook || DEFAULT_SOCIAL_LINKS.facebook),
      youtube: sanitizeUrl(parsed.youtube || DEFAULT_SOCIAL_LINKS.youtube),
      whatsapp: sanitizeUrl(parsed.whatsapp || DEFAULT_SOCIAL_LINKS.whatsapp),
      email: sanitizeText(parsed.email || DEFAULT_SOCIAL_LINKS.email, 150),
    }
  } catch {
    return DEFAULT_SOCIAL_LINKS
  }
}

export function saveStoredSocialLinks(socialLinks: SocialLinks) {
  try {
    const sanitized: SocialLinks = {
      instagram: sanitizeUrl(socialLinks.instagram),
      facebook: sanitizeUrl(socialLinks.facebook),
      youtube: sanitizeUrl(socialLinks.youtube),
      whatsapp: sanitizeUrl(socialLinks.whatsapp),
      email: sanitizeText(socialLinks.email, 150),
    }
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.SOCIAL_LINKS,
      JSON.stringify(sanitized),
    )
    import("./firebaseStoreService")
      .then(({ saveSocialLinksInFirebase }) => {
        saveSocialLinksInFirebase(sanitized)
      })
      .catch((err) =>
        console.warn("Firestore saveSocialLinksInFirebase error:", err),
      )
  } catch (e) {
    console.error(e)
  }
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const local = getStoredSocialLinks()
  try {
    const { getSocialLinksFromFirebase } = await import(
      "./firebaseStoreService"
    )
    const cloud = await getSocialLinksFromFirebase()
    if (cloud) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.SOCIAL_LINKS,
        JSON.stringify(cloud),
      )
      return cloud
    }
  } catch (err) {
    console.warn("Failed to fetch Social links from Firebase:", err)
  }
  return local
}
