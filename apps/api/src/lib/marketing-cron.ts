/**
 * Marketing cron — runs the AI outreach sequence on a schedule.
 *
 * Cloudflare Cron Trigger calls `runMarketingCron(env)`.
 * For each active campaign, sends the next step to up to 20 active enrollments.
 */

import { createDb, schema } from '@crm/storage'
import { and, eq } from 'drizzle-orm'

async function personalize(template: string, lead: any): Promise<string> {
  const key = (globalThis as any)?.process?.env?.OPENAI_API_KEY
  if (!key) return template
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Rewrite this outreach message to be concise, personal, and friendly. Keep it under 80 words. Do not invent facts. Return only the message.',
          },
          {
            role: 'user',
            content: `Lead: ${lead?.firstName ?? 'there'} at ${lead?.companyName ?? 'their company'}\n\n${template}`,
          },
        ],
      }),
    })
    const data = (await res.json()) as any
    return data?.choices?.[0]?.message?.content?.trim() || template
  } catch {
    return template
  }
}

async function sendWhatsApp(env: any, to: string, body: string) {
  const sid = env.TWILIO_ACCOUNT_SID
  const token = env.TWILIO_AUTH_TOKEN
  const from = env.TWILIO_WHATSAPP_NUMBER
  if (!sid || !token || !from) return false
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${sid}:${token}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body }).toString(),
  })
  return res.ok
}

async function sendEmail(env: any, to: string, subject: string, body: string) {
  const key = env.RESEND_API_KEY
  const from = env.RESEND_FROM || 'outreach@example.com'
  if (!key) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text: body }),
  })
  return res.ok
}

export async function runMarketingCron(env: any): Promise<{ campaigns: number; sent: number; failed: number }> {
  const db = createDb(env)
  const campaigns = await db
    .select()
    .from(schema.marketingCampaigns)
    .where(eq(schema.marketingCampaigns.status, 'active'))

  let sent = 0
  let failed = 0

  for (const campaign of campaigns) {
    const sequence = (campaign.sequence as any[]) ?? []
    const enrollments = await db
      .select()
      .from(schema.marketingEnrollments)
      .where(
        and(
          eq(schema.marketingEnrollments.campaignId, campaign.id),
          eq(schema.marketingEnrollments.status, 'active'),
        ),
      )
      .limit(20)

    for (const e of enrollments) {
      const step = sequence[e.step]
      if (!step) {
        await db
          .update(schema.marketingEnrollments)
          .set({ status: 'completed' })
          .where(eq(schema.marketingEnrollments.id, e.id))
        continue
      }
      const [lead] = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, e.leadId))
        .limit(1)
      if (!lead) {
        await db
          .update(schema.marketingEnrollments)
          .set({ status: 'failed' })
          .where(eq(schema.marketingEnrollments.id, e.id))
        failed++
        continue
      }

      const message = await personalize(step.message, lead)
      const ok =
        campaign.channel === 'whatsapp' && lead.phone
          ? await sendWhatsApp(env, lead.phone, message)
          : campaign.channel === 'email'
            ? await sendEmail(env, lead.email, step.subject || 'Quick question', message)
            : false

      if (ok) {
        sent++
        const nextStep = e.step + 1
        await db
          .update(schema.marketingEnrollments)
          .set({
            step: nextStep,
            lastSentAt: new Date(),
            status: nextStep >= sequence.length ? 'completed' : 'active',
          })
          .where(eq(schema.marketingEnrollments.id, e.id))
      } else {
        failed++
        await db
          .update(schema.marketingEnrollments)
          .set({ status: 'failed' })
          .where(eq(schema.marketingEnrollments.id, e.id))
      }
    }
  }

  return { campaigns: campaigns.length, sent, failed }
}
