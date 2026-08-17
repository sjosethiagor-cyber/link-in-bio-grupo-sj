import * as admin from "firebase-admin"
import { CallableRequest, HttpsError } from "firebase-functions/v2/https"

const AUTHORIZED_EMAIL = "sjosethiago.r@gmail.com"

/**
 * Asserts that the caller is authenticated and is an authorized administrator.
 */
export async function assertAdmin(request: CallableRequest): Promise<string> {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "O usuário precisa estar autenticado para realizar esta operação.",
    )
  }

  const email = (request.auth.token.email || "").toLowerCase().trim()
  if (!email || !request.auth.token.email_verified) {
    throw new HttpsError(
      "permission-denied",
      "O e-mail da conta precisa ser verificado.",
    )
  }

  // Primary owner has unconditional admin rights
  if (email === AUTHORIZED_EMAIL.toLowerCase()) {
    return email
  }

  // Check if user is registered in dashboard_users collection
  const db = admin.firestore()
  const userDoc = await db.collection("dashboard_users").doc(email).get()

  if (!userDoc.exists) {
    throw new HttpsError(
      "permission-denied",
      "Usuário não possui permissões administrativas para acessar este recurso.",
    )
  }

  return email
}
