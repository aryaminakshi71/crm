/**
 * Email Service Abstraction
 *
 * Stub implementation that logs to console.
 * Replace with actual provider (SendGrid, Resend, SMTP, etc.)
 */

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

/**
 * Stub email service - logs to console
 * Replace with actual implementation for production
 */
export const emailService: EmailService = {
  async send(message: EmailMessage) {
    console.log("[Email Stub] Sending email:", {
      to: message.to,
      subject: message.subject,
    });
    // In production, replace with actual email provider:
    // - Resend: await resend.emails.send({ ... })
    // - SendGrid: await sgMail.send({ ... })
    // - SMTP: await transporter.sendMail({ ... })
    return { success: true, messageId: `stub-${Date.now()}` };
  },

  async sendBulk(messages: EmailMessage[]) {
    console.log(`[Email Stub] Sending ${messages.length} emails in bulk`);
    // In production, implement batch sending with your provider
    return { success: true, sent: messages.length, failed: 0 };
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
