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

const ai = createAIClient({ provider: "openai" });

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
  if (!ai) {
    return { score: 50, reasoning: "AI not configured", factors: [] };
  }

  const context = `
    Contact Information:
    - Email: ${contactData.email || "N/A"}
    - Company: ${contactData.companyName || "N/A"}
    - Job Title: ${contactData.jobTitle || "N/A"}
    - Notes: ${contactData.notes || "N/A"}
    - Tags: ${contactData.tags?.join(", ") || "N/A"}
  `;

  const prediction = await predictScore(ai, context, "value");
  const suggestions = await generateSuggestions(ai, "CRM", context, "insights");

  return {
    score: prediction.score,
    reasoning: prediction.reasoning,
    factors: suggestions,
  };
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
