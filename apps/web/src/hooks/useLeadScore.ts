/**
 * Lead Score Hook
 *
 * Tracks user engagement and calculates lead scores based on pages visited,
 * time on site, and UTM parameters.
 */

import { useCallback, useEffect, useState } from "react";
import {
  scoreLead,
  getLeadScoreTier,
  getRecommendedPlan,
  trackPageView,
  getPersistedUTMParams,
  type LeadScoreData,
  type LeadScoreTier,
} from "../lib/lead-tracking";

const STORAGE_KEY = "nucleo_lead_data";

interface StoredLeadData extends LeadScoreData {
  firstVisit: string;
  lastVisit: string;
  totalTime: number;
}

function getStoredLeadData(): StoredLeadData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return null;
}

function saveLeadData(data: StoredLeadData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLeadScore() {
  const [leadScore, setLeadScore] = useState<number>(0);
  const [leadTier, setLeadTier] = useState<LeadScoreTier>("cold");
  const [leadData, setLeadData] = useState<StoredLeadData | null>(null);

  // Initialize lead data on mount
  useEffect(() => {
    const stored = getStoredLeadData();
    const utm = getPersistedUTMParams();

    if (stored) {
      setLeadData(stored);
      const score = scoreLead(stored);
      setLeadScore(score);
      setLeadTier(getLeadScoreTier(score));
    } else {
      // Initialize new lead
      const initialData: StoredLeadData = {
        companySize: undefined,
        industry: undefined,
        jobTitle: undefined,
        engagedPages: [],
        visitCount: 1,
        source: "organic",
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        totalTime: 0,
      };
      saveLeadData(initialData);
      setLeadData(initialData);

      const score = scoreLead(initialData);
      setLeadScore(score);
      setLeadTier(getLeadScoreTier(score));
    }
  }, []);

  // Track a page view
  const trackPage = useCallback(
    (page: string, additionalData?: Partial<LeadScoreData>) => {
      const current = getStoredLeadData();
      if (!current) return;

      // Update engagement
      const engagedPages = current.engagedPages.includes(page)
        ? current.engagedPages
        : [...current.engagedPages, page];

      const updated: StoredLeadData = {
        ...current,
        ...additionalData,
        engagedPages,
        visitCount: current.visitCount + 1,
        lastVisit: new Date().toISOString(),
      };

      saveLeadData(updated);
      setLeadData(updated);

      // Recalculate score
      const score = scoreLead(updated);
      setLeadScore(score);
      setLeadTier(getLeadScoreTier(score));

      // Track for analytics
      trackPageView(page);
    },
    []
  );

  // Update lead profile (from form submission)
  const updateLeadProfile = useCallback(
    (data: Partial<LeadScoreData>) => {
      const current = getStoredLeadData();
      if (!current) return;

      const updated: StoredLeadData = {
        ...current,
        ...data,
      };

      saveLeadData(updated);
      setLeadData(updated);

      const score = scoreLead(updated);
      setLeadScore(score);
      setLeadTier(getLeadScoreTier(score));
    },
    []
  );

  // Get recommended plan
  const recommendedPlan = getRecommendedPlan(leadScore);

  return {
    leadScore,
    leadTier,
    leadData,
    recommendedPlan,
    trackPage,
    updateLeadProfile,
  };
}
