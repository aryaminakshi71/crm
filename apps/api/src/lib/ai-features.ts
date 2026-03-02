/**
 * CRM AI Features
 *
 * AI-powered features for CRM:
 * - Lead scoring
 * - Email content suggestions
 * - Meeting summary generation
 * - Contact enrichment
 */

import {
  analyzeText,
  createAIClient,
  generateSuggestions,
  predictScore,
} from "./ai";

const ai = createAIClient({ 
  provider: "openrouter",
  apiKey: typeof process !== "undefined" ? process.env.OPENROUTER_API_KEY : undefined,
});

/**
 * Score a lead based on contact information
 */
export async function scoreLead(contactData: {
  email?: string;
  companyName?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
}): Promise<{ score: number; reasoning: string; factors: string[] }> {
  console.log("scoreLead called, ai:", ai);
  
  if (!ai) {
    return { score: 50, reasoning: "AI not configured", factors: [] };
  }

  try {
    const context = `
    Contact Information:
    - Email: ${contactData.email || "N/A"}
    - Company: ${contactData.companyName || "N/A"}
    - Job Title: ${contactData.jobTitle || "N/A"}
    - Notes: ${contactData.notes || "N/A"}
    - Tags: ${contactData.tags?.join(", ") || "N/A"}
  `;
    console.log("Calling predictScore with context:", context);

    const prediction = await predictScore(ai, context, "value");
    console.log("Prediction result:", prediction);
    
    const suggestions = await generateSuggestions(ai, "CRM", context, "insights");

    return {
      score: prediction.score,
      reasoning: prediction.reasoning,
      factors: suggestions,
    };
  } catch (error) {
    console.error("Error scoring lead:", error);
    return { score: 50, reasoning: String(error), factors: [] };
  }
}

/**
 * Generate email content suggestions
 */
export async function suggestEmailContent(
  recipient: string,
  purpose: "follow-up" | "introduction" | "proposal" | "meeting-request",
): Promise<string[]> {
  if (!ai) {
    return [];
  }

  const context = `Generate email content for ${purpose} to ${recipient}`;
  return await generateSuggestions(ai, "CRM", context, "actions");
}

/**
 * Generate meeting summary from notes
 */
export async function generateMeetingSummary(notes: string): Promise<string> {
  if (!ai) {
    return notes;
  }

  const analysis = await analyzeText(ai, notes, "summary");
  return analysis.summary || notes;
}

/**
 * Enrich contact with additional information
 */
export async function enrichContact(contactData: {
  email?: string;
  companyName?: string;
  name: string;
}): Promise<{
  linkedin?: string;
  twitter?: string;
  additionalInfo?: string;
}> {
  if (!ai) {
    return {};
  }

  const context = `Contact: ${contactData.name}, Company: ${contactData.companyName || "N/A"}, Email: ${contactData.email || "N/A"}`;
  const insights = await generateSuggestions(ai, "CRM", context, "insights");

  return {
    additionalInfo: insights.join("; "),
  };
}

export interface TicketTriageResult {
  priority: "low" | "medium" | "high";
  queue: string;
  summary: string;
  suggestedResponse: string;
  slaHours: number;
  confidence: number;
  rationale: string[];
}

function getTicketHeuristics(input: {
  subject?: string;
  description?: string;
  customerTier?: string;
}): TicketTriageResult {
  const text = `${input.subject || ""} ${input.description || ""}`.toLowerCase();

  let priority: TicketTriageResult["priority"] = "medium";
  let queue = "general";
  let slaHours = 24;
  const rationale: string[] = [];

  if (/(down|outage|critical|urgent|asap|cannot access|blocked|breach)/.test(text)) {
    priority = "high";
    queue = "technical";
    slaHours = 4;
    rationale.push("Detected outage/urgent technical language.");
  } else if (/(invoice|billing|payment|refund|charge|subscription)/.test(text)) {
    queue = "billing";
    slaHours = 8;
    rationale.push("Detected billing-related terms.");
  } else {
    rationale.push("No critical keywords detected; default triage applied.");
  }

  if ((input.customerTier || "").toLowerCase().includes("enterprise")) {
    slaHours = Math.max(2, Math.floor(slaHours / 2));
    rationale.push("Enterprise customer tier reduced SLA target.");
  }

  return {
    priority,
    queue,
    summary: (input.description || input.subject || "No context provided").slice(0, 220),
    suggestedResponse:
      "Thanks for reaching out. We have triaged this ticket and assigned it to the appropriate queue. We will update you with next steps shortly.",
    slaHours,
    confidence: 0.62,
    rationale,
  };
}

export async function triageSupportTicket(input: {
  subject?: string;
  description?: string;
  customerTier?: string;
}): Promise<TicketTriageResult> {
  const fallback = getTicketHeuristics(input);

  if (!ai) {
    return fallback;
  }

  try {
    const context = `
Ticket Subject: ${input.subject || "N/A"}
Ticket Description: ${input.description || "N/A"}
Customer Tier: ${input.customerTier || "N/A"}
`;
    const prediction = await predictScore(ai, context, "priority");
    const insights = await generateSuggestions(ai, "Helpdesk", context, "insights");
    const summaryData = await analyzeText(ai, context, "summary");

    const score = Number(prediction.score || 50);
    const priority: TicketTriageResult["priority"] =
      score >= 75 ? "high" : score <= 35 ? "low" : "medium";
    const queue =
      /billing|invoice|payment/i.test(context) ? "billing" :
      /bug|error|down|technical|outage/i.test(context) ? "technical" :
      fallback.queue;
    const slaHours = priority === "high" ? 4 : priority === "medium" ? 12 : 24;

    return {
      priority,
      queue,
      summary: summaryData?.summary || fallback.summary,
      suggestedResponse:
        insights[0] ||
        "We have received your ticket and assigned it for review. We will follow up with an update soon.",
      slaHours,
      confidence: Math.min(0.95, Math.max(0.5, score / 100)),
      rationale: insights.length ? insights : fallback.rationale,
    };
  } catch (error) {
    console.error("Error triaging ticket:", error);
    return fallback;
  }
}

export interface CampaignPlan {
  name: string;
  subjectLines: string[];
  messageOutline: string;
  segments: string[];
  kpis: string[];
  recommendedChannel: string;
}

export async function generateCampaignPlan(input: {
  goal: string;
  audience: string;
  channel?: string;
  budget?: number;
}): Promise<CampaignPlan> {
  const fallback: CampaignPlan = {
    name: `${input.goal} - ${input.audience}`.slice(0, 80),
    subjectLines: [
      `Improve ${input.goal} for ${input.audience}`,
      `${input.audience}: unlock better ${input.goal}`,
      `Action plan to increase ${input.goal}`,
    ],
    messageOutline:
      "Hook with a clear value proposition, add proof point, include one CTA, and close with urgency.",
    segments: [input.audience, "engaged users", "high intent leads"],
    kpis: ["Open rate", "CTR", "Conversion rate", "Pipeline influenced"],
    recommendedChannel: input.channel || "email",
  };

  if (!ai) {
    return fallback;
  }

  try {
    const context = `
Goal: ${input.goal}
Audience: ${input.audience}
Preferred Channel: ${input.channel || "email"}
Budget: ${input.budget ?? "N/A"}
`;
    const suggestions = await generateSuggestions(ai, "Marketing", context, "actions");
    const insights = await generateSuggestions(ai, "Marketing", context, "insights");

    return {
      ...fallback,
      subjectLines: suggestions.slice(0, 3).length
        ? suggestions.slice(0, 3)
        : fallback.subjectLines,
      messageOutline: insights[0] || fallback.messageOutline,
      segments: insights.slice(1, 4).length ? insights.slice(1, 4) : fallback.segments,
      kpis: ["Open rate", "CTR", "Conversion rate", "Attributed revenue"],
    };
  } catch (error) {
    console.error("Error generating campaign plan:", error);
    return fallback;
  }
}

export interface InvoiceRiskAssessment {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  rationale: string;
  recommendations: string[];
}

export async function assessInvoiceRisk(input: {
  invoiceNumber?: string;
  total?: number;
  dueAt?: string;
  status?: string;
  notes?: string;
}): Promise<InvoiceRiskAssessment> {
  const now = Date.now();
  const dueTs = input.dueAt ? new Date(input.dueAt).getTime() : null;
  const isOverdue = Boolean(dueTs && dueTs < now && input.status !== "paid");
  const largeAmount = Number(input.total || 0) >= 10000;

  let riskScore = 25;
  const reasons: string[] = [];
  if (isOverdue) {
    riskScore += 45;
    reasons.push("Invoice appears overdue and not marked paid.");
  }
  if (largeAmount) {
    riskScore += 15;
    reasons.push("Large invoice amount increases collection risk.");
  }
  if ((input.notes || "").toLowerCase().includes("dispute")) {
    riskScore += 25;
    reasons.push("Dispute keyword found in notes.");
  }
  if ((input.status || "").toLowerCase() === "paid") {
    riskScore = 5;
    reasons.push("Invoice already paid.");
  }

  const cappedScore = Math.max(0, Math.min(100, riskScore));
  const riskLevel: InvoiceRiskAssessment["riskLevel"] =
    cappedScore >= 70 ? "high" : cappedScore >= 35 ? "medium" : "low";

  return {
    riskScore: cappedScore,
    riskLevel,
    rationale: reasons.join(" ") || "No elevated risk indicators found.",
    recommendations:
      riskLevel === "high"
        ? [
            "Trigger dunning workflow with escalation.",
            "Assign owner for direct follow-up.",
            "Offer payment plan or dispute resolution path.",
          ]
        : riskLevel === "medium"
          ? [
              "Send reminder before due date.",
              "Monitor payment behavior weekly.",
            ]
          : ["No immediate action needed."],
  };
}

export interface ProjectRiskAssessment {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  blockers: string[];
  nextActions: string[];
}

export async function assessProjectRisk(input: {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}): Promise<ProjectRiskAssessment> {
  let riskScore = 20;
  const blockers: string[] = [];

  if ((input.priority || "").toLowerCase() === "high") {
    riskScore += 15;
    blockers.push("High-priority scope needs active monitoring.");
  }
  if ((input.status || "").toLowerCase().includes("planning")) {
    riskScore += 10;
    blockers.push("Project still in planning state.");
  }
  if (input.dueDate) {
    const daysLeft = Math.ceil(
      (new Date(input.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft < 7) {
      riskScore += 30;
      blockers.push("Due date is under 7 days away.");
    }
  }
  if ((input.description || "").toLowerCase().includes("dependency")) {
    riskScore += 15;
    blockers.push("Dependencies called out in description.");
  }

  const finalScore = Math.max(0, Math.min(100, riskScore));
  const riskLevel: ProjectRiskAssessment["riskLevel"] =
    finalScore >= 70 ? "high" : finalScore >= 35 ? "medium" : "low";

  return {
    riskScore: finalScore,
    riskLevel,
    blockers: blockers.length ? blockers : ["No blockers detected from available data."],
    nextActions:
      riskLevel === "high"
        ? [
            "Run risk review with owner today.",
            "Split scope into must-have and optional.",
            "Create escalation plan for dependencies.",
          ]
        : riskLevel === "medium"
          ? [
              "Review milestone dates this week.",
              "Track owner updates in standup.",
            ]
          : ["Continue current execution cadence."],
  };
}

export interface DocumentInsightResult {
  summary: string;
  keywords: string[];
  actionItems: string[];
}

export async function analyzeDocumentDraft(input: {
  title?: string;
  content?: string;
}): Promise<DocumentInsightResult> {
  const text = `${input.title || ""}\n${input.content || ""}`.trim();
  const fallback: DocumentInsightResult = {
    summary: text.slice(0, 220) || "No document content provided.",
    keywords: ["document", "review", "workflow"],
    actionItems: ["Review with stakeholders", "Assign owner", "Set due date"],
  };

  if (!ai || !text) {
    return fallback;
  }

  try {
    const summary = await analyzeText(ai, text, "summary");
    const keywords = await analyzeText(ai, text, "keywords");
    const actions = await generateSuggestions(ai, "Doclattice", text, "actions");

    return {
      summary: summary?.summary || fallback.summary,
      keywords: Array.isArray(keywords?.keywords)
        ? keywords.keywords.slice(0, 6)
        : fallback.keywords,
      actionItems: actions.slice(0, 4).length ? actions.slice(0, 4) : fallback.actionItems,
    };
  } catch (error) {
    console.error("Error analyzing document draft:", error);
    return fallback;
  }
}
