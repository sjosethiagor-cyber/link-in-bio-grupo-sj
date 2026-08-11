import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"

// Firebase Configuration loaded strictly from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
}

// Check if Firebase is configured with a valid projectId
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey,
)

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
const googleProvider = new GoogleAuthProvider()

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    db = getFirestore(app)
    auth = getAuth(app)
  } catch (error) {
    console.warn("Firebase initialization warning:", error)
  }
}

export { app, db, auth, googleProvider }
