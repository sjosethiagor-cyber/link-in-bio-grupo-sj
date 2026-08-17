import * as admin from "firebase-admin"
import { onCall } from "firebase-functions/v2/https"
import { assertAdmin } from "../utils/auth"

/**
 * Callable function allowing authenticated administrators to export leads to CSV.
 */
export const exportLeadsCsv = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    // 1. Verify administrator privileges
    const adminEmail = await assertAdmin(request)

    const db = admin.firestore()
    const leadsSnapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(1000)
      .get()

    // 2. Build CSV Content
    const headers = ["ID", "Nome", "WhatsApp", "E-mail", "Status", "Data", "Mensagem"]
    const rows: string[][] = []

    leadsSnapshot.forEach((doc) => {
      const data = doc.data()
      const dateFormatted = data.createdAt
        ? new Date(data.createdAt).toISOString()
        : ""

      const sanitizeField = (val: any) =>
        `"${String(val || "").replace(/"/g, '""')}"`

      rows.push([
        sanitizeField(doc.id),
        sanitizeField(data.name),
        sanitizeField(data.whatsapp),
        sanitizeField(data.email || ""),
        sanitizeField(data.status || "Novo"),
        sanitizeField(dateFormatted),
        sanitizeField(data.message || ""),
      ])
    })

    const csvString = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n")

    return {
      success: true,
      totalCount: rows.length,
      requestedBy: adminEmail,
      csv: csvString,
    }
  },
)
