import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { initializeFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  type Auth,
} from "firebase/auth"

// Secondary Firebase app configuration for Central de Anúncios (Database: anuncio)
const centralFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_CENTRAL_FIREBASE_API_KEY ||
    "AIzaSyCRvd-eRCbbF7zV2SBCB_f79FV1vLeZYOo",
  authDomain:
    import.meta.env.VITE_CENTRAL_FIREBASE_AUTH_DOMAIN ||
    "central-de-anuncios-b62ca.firebaseapp.com",
  projectId:
    import.meta.env.VITE_CENTRAL_FIREBASE_PROJECT_ID ||
    "central-de-anuncios-b62ca",
  storageBucket:
    import.meta.env.VITE_CENTRAL_FIREBASE_STORAGE_BUCKET ||
    "central-de-anuncios-b62ca.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_CENTRAL_FIREBASE_MESSAGING_SENDER_ID ||
    "154895857005",
  appId:
    import.meta.env.VITE_CENTRAL_FIREBASE_APP_ID ||
    "1:154895857005:web:2078117b6db2cd0d001664",
}

// Check if the Central Firebase is configured with required keys
export const isCentralFirebaseConfigured = Boolean(
  centralFirebaseConfig.projectId && centralFirebaseConfig.apiKey,
)

let centralApp: FirebaseApp | null = null
let centralDb: Firestore | null = null
let centralAuth: Auth | null = null
let centralStorage: FirebaseStorage | null = null
const centralGoogleProvider = new GoogleAuthProvider()

if (isCentralFirebaseConfigured) {
  try {
    const existingApps = getApps()
    const centralAppExists = existingApps.find(
      (app) => app.name === "centralDeAnuncios",
    )

    if (centralAppExists) {
      centralApp = centralAppExists
    } else {
      centralApp = initializeApp(centralFirebaseConfig, "centralDeAnuncios")
    }

    // Connect to custom Firestore database "anuncio"
    centralDb = initializeFirestore(centralApp, {}, "anuncio")
    centralAuth = getAuth(centralApp)
    centralStorage = getStorage(centralApp)

    // Ensure session is active in the background
    if (centralAuth && !centralAuth.currentUser) {
      signInAnonymously(centralAuth).catch(() => {
        // Silently handle if anonymous is not needed or disabled
      })
    }
  } catch (error) {
    console.warn("Central de Anúncios Firebase initialization warning:", error)
  }
} else {
  console.warn(
    "Central de Anúncios Firebase not configured. Set VITE_CENTRAL_FIREBASE_* environment variables.",
  )
}

export async function ensureCentralAuth(): Promise<string> {
  if (!centralAuth) return "admin_local"
  if (centralAuth.currentUser) return centralAuth.currentUser.uid
  try {
    const userCredential = await signInAnonymously(centralAuth)
    return userCredential.user.uid
  } catch (e) {
    console.warn("ensureCentralAuth anonymous fallback:", e)
    return "admin_local"
  }
}

export {
  centralApp,
  centralDb,
  centralAuth,
  centralStorage,
  centralGoogleProvider,
}
