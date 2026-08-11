import { db, isFirebaseConfigured } from "../lib/firebase"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import type { ClickEvent, Lead } from "./storeService"

export async function recordClickInFirebase(event: ClickEvent) {
  if (!isFirebaseConfigured || !db) return

  await addDoc(collection(db, "clicks"), {
    ...event,
    serverTime: serverTimestamp(),
  })
}

export async function getClicksFromFirebase(): Promise<ClickEvent[]> {
  if (!isFirebaseConfigured || !db) return []

  const q = query(
    collection(db, "clicks"),
    orderBy("timestamp", "desc"),
    limit(200),
  )
  const querySnapshot = await getDocs(q)
  const clicks: ClickEvent[] = []

  querySnapshot.forEach((docSnap) => {
    clicks.push({ id: docSnap.id, ...docSnap.data() as ClickEvent })
  })

  return clicks
}

export async function saveLeadInFirebase(lead: Lead): Promise<string | null> {
  if (!isFirebaseConfigured || !db) return null

  const docRef = await addDoc(collection(db, "leads"), {
    ...lead,
    createdAtServer: serverTimestamp(),
  })

  return docRef.id
}

export async function getLeadsFromFirebase(): Promise<Lead[]> {
  if (!isFirebaseConfigured || !db) return []

  const q = query(
    collection(db, "leads"),
    orderBy("createdAt", "desc"),
    limit(100),
  )
  const snapshot = await getDocs(q)
  const leads: Lead[] = []

  snapshot.forEach((docSnap) => {
    leads.push({ ...docSnap.data() as Lead, id: docSnap.id })
  })

  return leads
}

export async function updateLeadStatusInFirebase(
  id: string,
  status: Lead["status"],
) {
  if (!isFirebaseConfigured || !db) return

  await updateDoc(doc(db, "leads", id), { status })
}
