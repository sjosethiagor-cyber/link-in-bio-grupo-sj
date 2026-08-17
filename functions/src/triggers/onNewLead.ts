import { onDocumentCreated } from "firebase-functions/v2/firestore"
import { logger } from "firebase-functions"
import { sendLeadNotifications, LeadData } from "../services/emailService"

/**
 * Triggered whenever a new lead document is created in Firestore `leads/{leadId}`.
 */
export const onNewLeadNotification = onDocumentCreated(
  {
    document: "leads/{leadId}",
    region: "us-central1",
    secrets: [],
  },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      logger.warn("No data associated with lead creation event")
      return
    }

    const data = snapshot.data() as LeadData
    const leadId = event.params.leadId

    logger.info(`Processing new lead notification for lead ID: ${leadId}`, {
      name: data.name,
      whatsapp: data.whatsapp,
    })

    try {
      await sendLeadNotifications({
        ...data,
        id: leadId,
      })
    } catch (err) {
      logger.error(`Error processing lead notification for ${leadId}:`, err)
    }
  },
)
