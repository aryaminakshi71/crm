/**
 * Email Service
 *
 * Real delivery through Resend (shared @platform/email module).
 * Falls back to console logging when RESEND_API_KEY is not configured,
 * so local development and demos keep working without credentials.
 */

import { isEmailConfigured, sendEmail } from "@platform/email";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailService {
  send(
    message: EmailMessage,
  ): Promise<{ success: boolean; messageId?: string }>;
  sendBulk(
    messages: EmailMessage[],
  ): Promise<{ success: boolean; sent: number; failed: number }>;
}

function emailEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
}

export const emailService: EmailService = {
  async send(message: EmailMessage) {
    const env = emailEnv();
    if (!isEmailConfigured(env)) {
      console.log("[Email] RESEND_API_KEY not set — logging instead:", {
        to: message.to,
        subject: message.subject,
      });
      return { success: true, messageId: `dev-${Date.now()}` };
    }
    try {
      const result = await sendEmail(env, message);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error("[Email] Delivery failed:", error);
      return { success: false };
    }
  },

  async sendBulk(messages: EmailMessage[]) {
    let sent = 0;
    let failed = 0;
    for (const message of messages) {
      const result = await emailService.send(message);
      if (result.success) sent += 1;
      else failed += 1;
    }
    return { success: failed === 0, sent, failed };
  },
};

/**
 * Email templates for CRM
 */
export const emailTemplates = {
  /**
   * Organization invitation email
   */
  organizationInvitation: (data: {
    organizationName: string;
    inviterName: string;
    inviterEmail: string;
    inviteUrl: string;
  }) => ({
    subject: `You've been invited to join ${data.organizationName}`,
    html: `
      <h1>You're invited!</h1>
      <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join <strong>${data.organizationName}</strong>.</p>
      <p><a href="${data.inviteUrl}">Accept Invitation</a></p>
    `,
  }),

  /**
   * Deal stage change notification
   */
  dealStageChange: (data: {
    dealName: string;
    oldStage: string;
    newStage: string;
    dealValue: string;
    ownerName: string;
  }) => ({
    subject: `Deal "${data.dealName}" moved to ${data.newStage}`,
    html: `
      <h1>Deal Update</h1>
      <p>Deal <strong>${data.dealName}</strong> (${data.dealValue}) has been moved from ${data.oldStage} to ${data.newStage}.</p>
      <p>Owner: ${data.ownerName}</p>
    `,
  }),

  /**
   * New lead assigned notification
   */
  leadAssigned: (data: {
    leadEmail: string;
    leadCompany?: string;
    assigneeName: string;
    assigneeEmail: string;
  }) => ({
    subject: `New lead assigned: ${data.leadEmail}`,
    html: `
      <h1>New Lead Assignment</h1>
      <p>A new lead has been assigned to you:</p>
      <ul>
        <li>Email: ${data.leadEmail}</li>
        <li>Company: ${data.leadCompany || "N/A"}</li>
      </ul>
    `,
  }),

  /**
   * Activity reminder
   */
  activityReminder: (data: {
    activityType: string;
    subject: string;
    dueDate: string;
    contactName?: string;
  }) => ({
    subject: `Reminder: ${data.activityType} - ${data.subject}`,
    html: `
      <h1>Activity Reminder</h1>
      <p>You have a pending ${data.activityType}:</p>
      <ul>
        <li><strong>${data.subject}</strong></li>
        <li>Due: ${data.dueDate}</li>
        ${data.contactName ? `<li>Contact: ${data.contactName}</li>` : ""}
      </ul>
    `,
  }),
};
