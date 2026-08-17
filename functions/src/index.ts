import * as admin from "firebase-admin"
import { onRequest } from "firebase-functions/v2/https"

// Initialize Firebase Admin SDK once at the root
if (admin.apps.length === 0) {
  admin.initializeApp()
}

// Export Firestore Triggers
export { onNewLeadNotification } from "./triggers/onNewLead"

// Export Callable Functions
export { exportLeadsCsv } from "./callables/exportLeads"

// Export HTTP Health Check Endpoint
export const healthCheck = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "grupo-sj-functions",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    })
  },
)
