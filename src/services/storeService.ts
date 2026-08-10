import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

export interface ClickEvent {
  id?: string;
  linkId: string;
  linkName: string;
  category: "Mercado Livre" | "Shopee" | "Rede Social" | "Contato";
  timestamp: number;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  message: string;
  status: "Novo" | "Em Atendimento" | "Concluído";
  createdAt: number;
}

export interface StoreLink {
  id: string;
  name: string;
  desc: string;
  href: string;
  storeType: "ml" | "shopee";
}

// ── Default Links Initial State ─────────────────────────────────────────────

export const DEFAULT_ML_LOJAS: StoreLink[] = [
  { id: "ml_cola_mix", name: "Cola Mix", desc: "Adesivos e colas", href: "https://www.mercadolivre.com.br", storeType: "ml" },
  { id: "ml_trio_mix", name: "Trio Mix", desc: "Kits e combos", href: "https://www.mercadolivre.com.br", storeType: "ml" },
  { id: "ml_maximper", name: "MAXIMPER", desc: "Linha premium", href: "https://www.mercadolivre.com.br", storeType: "ml" },
  { id: "ml_sj_novais", name: "SJ Novais", desc: "Loja geral", href: "https://www.mercadolivre.com.br", storeType: "ml" },
];

export const DEFAULT_SHOPEE_LOJAS: StoreLink[] = [
  { id: "sp_cola_mix", name: "Cola Mix", desc: "Adesivos e colas", href: "https://shopee.com.br", storeType: "shopee" },
  { id: "sp_trio_mix", name: "Trio Mix", desc: "Kits e combos", href: "https://shopee.com.br", storeType: "shopee" },
  { id: "sp_maximper", name: "MAXIMPER", desc: "Linha premium", href: "https://shopee.com.br", storeType: "shopee" },
  { id: "sp_sj_novais", name: "SJ Novais", desc: "Loja geral", href: "https://shopee.com.br", storeType: "shopee" },
];

const LOCAL_STORAGE_KEYS = {
  CLICKS: "grupo_sj_clicks_v1",
  LEADS: "grupo_sj_leads_v1",
  LINKS_ML: "grupo_sj_links_ml_v1",
  LINKS_SP: "grupo_sj_links_sp_v1",
};

// ── Clicks Analytics Service ─────────────────────────────────────────────────

export async function recordClick(
  linkId: string,
  linkName: string,
  category: "Mercado Livre" | "Shopee" | "Rede Social" | "Contato"
) {
  const event: ClickEvent = {
    linkId,
    linkName,
    category,
    timestamp: Date.now(),
  };

  // Local storage backup
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICKS);
    const existing: ClickEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(event);
    // Keep max 500 recent clicks in local storage
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLICKS, JSON.stringify(existing.slice(0, 500)));
  } catch (err) {
    console.error("Local storage error on recordClick:", err);
  }

  // Firebase Firestore write if configured
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "clicks"), {
        ...event,
        serverTime: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Firestore recordClick error:", err);
    }
  }
}

export async function getClicks(): Promise<ClickEvent[]> {
  let firebaseClicks: ClickEvent[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"), limit(200));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        firebaseClicks.push({ id: docSnap.id, ...(docSnap.data() as ClickEvent) });
      });
    } catch (err) {
      console.warn("Firestore getClicks fallback to localStorage:", err);
    }
  }

  if (firebaseClicks.length > 0) {
    return firebaseClicks;
  }

  // Fallback local storage
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICKS);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch (err) {
    return [];
  }
}

// ── Lead Capture Service ─────────────────────────────────────────────────────

export async function saveLead(data: {
  name: string;
  whatsapp: string;
  email: string;
  message: string;
}): Promise<Lead> {
  const newLead: Lead = {
    id: "lead_" + Math.random().toString(36).substring(2, 9),
    name: data.name,
    whatsapp: data.whatsapp,
    email: data.email,
    message: data.message,
    status: "Novo",
    createdAt: Date.now(),
  };

  // Local Storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS);
    const existing: Lead[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newLead);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(existing));
  } catch (err) {
    console.error("Local storage saveLead error:", err);
  }

  // Firebase Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "leads"), {
        ...newLead,
        createdAtServer: serverTimestamp(),
      });
      newLead.id = docRef.id;
    } catch (err) {
      console.warn("Firestore saveLead error:", err);
    }
  }

  return newLead;
}

export async function getLeads(): Promise<Lead[]> {
  let firebaseLeads: Lead[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(100));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        firebaseLeads.push({ id: d.id, ...(d.data() as Lead) });
      });
    } catch (err) {
      console.warn("Firestore getLeads fallback:", err);
    }
  }

  if (firebaseLeads.length > 0) {
    return firebaseLeads;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export async function updateLeadStatus(id: string, status: "Novo" | "Em Atendimento" | "Concluído") {
  // Update local storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS);
    if (raw) {
      const leads: Lead[] = JSON.parse(raw);
      const updated = leads.map((l) => (l.id === id ? { ...l, status } : l));
      localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(updated));
    }
  } catch (err) {
    console.error(err);
  }

  // Update Firebase
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "leads", id);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.warn("Firestore updateLeadStatus warning:", err);
    }
  }
}

// ── Store Links CMS Service ──────────────────────────────────────────────────

export function getStoredMLStoreLinks(): StoreLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LINKS_ML);
    return raw ? JSON.parse(raw) : DEFAULT_ML_LOJAS;
  } catch {
    return DEFAULT_ML_LOJAS;
  }
}

export function getStoredShopeeStoreLinks(): StoreLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LINKS_SP);
    return raw ? JSON.parse(raw) : DEFAULT_SHOPEE_LOJAS;
  } catch {
    return DEFAULT_SHOPEE_LOJAS;
  }
}

export function saveStoredMLStoreLinks(links: StoreLink[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_ML, JSON.stringify(links));
  } catch (e) {
    console.error(e);
  }
}

export function saveStoredShopeeStoreLinks(links: StoreLink[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LINKS_SP, JSON.stringify(links));
  } catch (e) {
    console.error(e);
  }
}
