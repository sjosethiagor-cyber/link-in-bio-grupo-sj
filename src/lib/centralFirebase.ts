import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { initializeFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"

// Secondary Firebase app configuration for Central de Anúncios (Database: anuncio)
const centralFirebaseConfig = {
  apiKey: import.meta.env.VITE_CENTRAL_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_CENTRAL_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_CENTRAL_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_CENTRAL_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:
    import.meta.env.VITE_CENTRAL_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_CENTRAL_FIREBASE_APP_ID || "",
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
  } catch (error) {
    console.warn("Central de Anúncios Firebase initialization warning:", error)
  }
} else {
  console.warn(
    "Central de Anúncios Firebase not configured. Set VITE_CENTRAL_FIREBASE_* environment variables.",
  )
}

export {
  centralApp,
  centralDb,
  centralAuth,
  centralStorage,
  centralGoogleProvider,
}
