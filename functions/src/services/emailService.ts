import * as nodemailer from "nodemailer"
import { logger } from "firebase-functions"

export interface LeadData {
  id?: string
  name: string
  whatsapp: string
  email?: string
  message?: string
  createdAt?: number
  status?: string
}

/**
 * Creates SMTP transporter from environment variables if available.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: {
      user,
      pass,
    },
  })
}

/**
 * Generates modern HTML email template for new lead notification.
 */
export function buildLeadEmailHtml(lead: LeadData): string {
  const rawWhatsapp = lead.whatsapp.replace(/\D/g, "")
  const waLink = `https://wa.me/55${rawWhatsapp}?text=${encodeURIComponent(
    `Olá ${lead.name}, recebemos sua solicitação através do Grupo SJ! Como podemos ajudar?`,
  )}`

  const dateStr = lead.createdAt
    ? new Date(lead.createdAt).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Novo Lead Grupo SJ</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0d; color: #f2f0ea; margin: 0; padding: 24px; }
    .card { background-color: #141418; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #e8451f 0%, #c83214 100%); padding: 24px 28px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; }
    .header p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.85); }
    .content { padding: 28px; }
    .field-group { margin-bottom: 18px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8f8d88; margin-bottom: 4px; font-weight: 700; }
    .value { font-size: 15px; color: #f2f0ea; font-weight: 600; word-break: break-word; }
    .message-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; margin-top: 6px; font-size: 14px; line-height: 1.5; color: #d8d4cb; }
    .btn { display: inline-block; background-color: #25D366; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 24px; border-radius: 12px; margin-top: 12px; text-align: center; box-shadow: 0 4px 16px rgba(37,211,102,0.3); }
    .footer { padding: 16px 28px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6d6b67; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 Novo Lead Recebido!</h1>
      <p>Grupo SJ — Link in Bio Page</p>
    </div>
    <div class="content">
      <div class="field-group">
        <div class="label">Nome do Cliente</div>
        <div class="value">${lead.name}</div>
      </div>
      <div class="field-group">
        <div class="label">WhatsApp</div>
        <div class="value">${lead.whatsapp}</div>
      </div>
      ${
        lead.email
          ? `<div class="field-group">
              <div class="label">E-mail</div>
              <div class="value">${lead.email}</div>
            </div>`
          : ""
      }
      <div class="field-group">
        <div class="label">Mensagem / Interesse</div>
        <div class="message-box">${lead.message || "Sem mensagem"}</div>
      </div>
      <div class="field-group">
        <div class="label">Data de Recebimento</div>
        <div class="value" style="font-size: 13px; color: #8f8d88;">${dateStr}</div>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="${waLink}" target="_blank" class="btn">
          💬 Iniciar Atendimento no WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      Painel Administrativo Grupo SJ · Notificação Automática Serverless
    </div>
  </div>
</body>
</html>
`
}

/**
 * Sends notification via Email and/or Webhook.
 */
export async function sendLeadNotifications(lead: LeadData): Promise<void> {
  const targetEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || "sjosethiago.r@gmail.com"
  const transporter = getTransporter()

  // 1. Send Email Notification if SMTP is configured
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Grupo SJ Notificações" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `⚡ Novo Lead: ${lead.name} (${lead.whatsapp})`,
        html: buildLeadEmailHtml(lead),
      })
      logger.info(`Lead notification email sent to ${targetEmail} for lead ${lead.name}`)
    } catch (err) {
      logger.error("Failed to send lead email notification:", err)
    }
  } else {
    logger.info(
      `SMTP not configured. Notification for lead "${lead.name}" logged successfully. Configure SMTP_* environment variables to enable email dispatch.`,
    )
  }

  // 2. Send Webhook Notification if URL is configured
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL
  if (webhookUrl) {
    try {
      const payload = {
        content: `🚨 **Novo Lead Recebido no Grupo SJ!**\n**Nome:** ${lead.name}\n**WhatsApp:** ${lead.whatsapp}\n**E-mail:** ${lead.email || "Não informado"}\n**Mensagem:** ${lead.message || "Nenhuma"}\n**WhatsApp Link:** https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`,
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        logger.warn(`Webhook responded with status ${response.status}`)
      } else {
        logger.info("Webhook notification sent successfully")
      }
    } catch (err) {
      logger.error("Failed to dispatch webhook notification:", err)
    }
  }
}
