/**
 * Outreach Router — AI marketing bot
 *
 * Campaigns → enroll leads → send personalized steps via WhatsApp (Twilio)
 * or email (Resend). Personalization uses OpenAI when configured.
 */

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { ORPCError } from '@orpc/server'
import { orgAuthed, getDb, schema } from '../procedures'

const stepSchema = z.object({
  day: z.number().int().min(0),
  subject: z.string().optional(),
  message: z.string(),
})

const campaignSchema = z.object({
  name: z.string().min(1),
  product: z.enum(['schoolai', 'spectrumai', 'diagnoai', 'nucleoai']),
  channel: z.enum(['whatsapp', 'email']),
  sequence: z.array(stepSchema).min(1),
})

async function personalize(
  template: string,
  lead: { firstName?: string | null; companyName?: string | null },
): Promise<string> {
  const key =
    typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined
  if (!key) return template
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Rewrite this outreach message to be concise, personal, and friendly. ' +
              'Keep it under 80 words. Do not invent facts. Return only the message.',
          },
          {
            role: 'user',
            content: `Lead: ${lead.firstName ?? 'there'} at ${lead.companyName ?? 'their company'}\n\n${template}`,
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

async function sendWhatsApp(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_NUMBER
  if (!sid || !token || !from) return { ok: false, error: 'Twilio not configured' }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${to}`,
        Body: body,
      }).toString(),
    },
  )
  if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 200) }
  return { ok: true }
}

async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'outreach@example.com'
  if (!key) return { ok: false, error: 'Resend not configured' }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  })
  if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 200) }
  return { ok: true }
}

export const outreachRouter = {
  createCampaign: orgAuthed
    .route({
      method: 'POST',
      path: '/outreach/campaigns',
      summary: 'Create a marketing campaign',
      tags: ['Outreach'],
    })
    .input(campaignSchema)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context as any)
      const orgId = (context as any).organization?.id
      const [row] = await db
        .insert(schema.marketingCampaigns)
        .values({
          organizationId: orgId,
          name: input.name,
          product: input.product,
          channel: input.channel,
          sequence: input.sequence,
        })
        .returning()
      return { campaign: row }
    }),

  listCampaigns: orgAuthed
    .route({
      method: 'GET',
      path: '/outreach/campaigns',
      summary: 'List marketing campaigns',
      tags: ['Outreach'],
    })
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context as any)
      const orgId = (context as any).organization?.id
      const rows = await db
        .select()
        .from(schema.marketingCampaigns)
        .where(eq(schema.marketingCampaigns.organizationId, orgId))
      return { campaigns: rows }
    }),

  enrollLeads: orgAuthed
    .route({
      method: 'POST',
      path: '/outreach/enroll',
      summary: 'Enroll leads into a campaign',
      tags: ['Outreach'],
    })
    .input(z.object({ campaignId: z.string().uuid(), leadIds: z.array(z.string().uuid()) }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context as any)
      const values = input.leadIds.map((leadId) => ({
        campaignId: input.campaignId,
        leadId,
      }))
      if (values.length === 0) return { enrolled: 0 }
      const rows = await db
        .insert(schema.marketingEnrollments)
        .values(values)
        .returning()
      return { enrolled: rows.length }
    }),

  sendNext: orgAuthed
    .route({
      method: 'POST',
      path: '/outreach/send-next',
      summary: 'Send the next step to active enrollments',
      tags: ['Outreach'],
    })
    .input(z.object({ campaignId: z.string().uuid(), limit: z.number().int().min(1).max(100).default(20) }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context as any)
      const [campaign] = await db
        .select()
        .from(schema.marketingCampaigns)
        .where(eq(schema.marketingCampaigns.id, input.campaignId))
        .limit(1)
      if (!campaign) throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })

      const sequence = (campaign.sequence as any[]) ?? []
      const enrollments = await db
        .select()
        .from(schema.marketingEnrollments)
        .where(
          and(
            eq(schema.marketingEnrollments.campaignId, input.campaignId),
            eq(schema.marketingEnrollments.status, 'active'),
          ),
        )
        .limit(input.limit)

      let sent = 0
      let failed = 0

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
        let result: { ok: boolean; error?: string }
        if (campaign.channel === 'whatsapp' && lead.phone) {
          result = await sendWhatsApp(lead.phone, message)
        } else if (campaign.channel === 'email') {
          result = await sendEmail(lead.email, step.subject || 'Quick question', message)
        } else {
          result = { ok: false, error: 'No contact for channel' }
        }

        if (result.ok) {
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

      return { sent, failed, processed: enrollments.length }
    }),

  stats: orgAuthed
    .route({
      method: 'GET',
      path: '/outreach/stats',
      summary: 'Campaign stats',
      tags: ['Outreach'],
    })
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context as any)
      const orgId = (context as any).organization?.id
      const campaigns = await db
        .select()
        .from(schema.marketingCampaigns)
        .where(eq(schema.marketingCampaigns.organizationId, orgId))
      const enrollments = await db.select().from(schema.marketingEnrollments)
      return {
        campaigns: campaigns.length,
        enrollments: enrollments.length,
        active: enrollments.filter((e: any) => e.status === 'active').length,
        completed: enrollments.filter((e: any) => e.status === 'completed').length,
        failed: enrollments.filter((e: any) => e.status === 'failed').length,
      }
    }),
}
