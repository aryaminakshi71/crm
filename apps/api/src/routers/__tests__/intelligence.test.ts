/**
 * Intelligence Router Unit Tests
 */

import { describe, expect, it } from "vitest";

describe("Intelligence Router - Business Logic", () => {
  describe("AI Agent Status", () => {
    const agentStatuses = ["idle", "running", "completed", "failed", "paused"];

    it("should have valid agent statuses", () => {
      expect(agentStatuses).toContain("idle");
      expect(agentStatuses).toContain("running");
      expect(agentStatuses).toContain("completed");
    });

    it("should check if agent is active", () => {
      function isAgentActive(status: string): boolean {
        return status === "running" || status === "paused";
      }

      expect(isAgentActive("running")).toBe(true);
      expect(isAgentActive("paused")).toBe(true);
      expect(isAgentActive("idle")).toBe(false);
      expect(isAgentActive("completed")).toBe(false);
      expect(isAgentActive("failed")).toBe(false);
    });
  });

  describe("KPI Calculations", () => {
    it("should calculate success rate", () => {
      function calculateSuccessRate(successful: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((successful / total) * 100 * 10) / 10;
      }

      expect(calculateSuccessRate(85, 100)).toBe(85);
      expect(calculateSuccessRate(1, 3)).toBe(33.3);
      expect(calculateSuccessRate(0, 0)).toBe(0);
    });

    it("should calculate trend percentage", () => {
      function calculateTrend(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100 * 10) / 10;
      }

      expect(calculateTrend(120, 100)).toBe(20);
      expect(calculateTrend(80, 100)).toBe(-20);
      expect(calculateTrend(100, 0)).toBe(100);
    });
  });

  describe("AI Insights", () => {
    it("should prioritize insights by impact", () => {
      type Insight = { id: string; impact: number; confidence: number };
      const insights: Insight[] = [
        { id: "1", impact: 3, confidence: 80 },
        { id: "2", impact: 5, confidence: 95 },
        { id: "3", impact: 2, confidence: 60 },
      ];

      const sorted = [...insights].sort((a, b) => {
        const scoreA = a.impact * (a.confidence / 100);
        const scoreB = b.impact * (b.confidence / 100);
        return scoreB - scoreA;
      });

      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("1");
      expect(sorted[2].id).toBe("3");
    });

    it("should filter insights by confidence threshold", () => {
      type Insight = { id: string; confidence: number };
      const insights: Insight[] = [
        { id: "1", confidence: 95 },
        { id: "2", confidence: 65 },
        { id: "3", confidence: 45 },
      ];

      const filterByConfidence = (insights: Insight[], threshold: number) =>
        insights.filter((i) => i.confidence >= threshold);

      expect(filterByConfidence(insights, 70)).toHaveLength(1);
      expect(filterByConfidence(insights, 50)).toHaveLength(2);
      expect(filterByConfidence(insights, 30)).toHaveLength(3);
    });
  });

  describe("Data Processing", () => {
    it("should aggregate metrics by time period", () => {
      type Metric = { timestamp: Date; value: number };
      const now = new Date();
      // 3 days ago, 2 days ago, 1 day ago
      const metrics: Metric[] = [
        { timestamp: new Date(now.getTime() - 86400000 * 3), value: 10 },
        { timestamp: new Date(now.getTime() - 86400000 * 2), value: 20 },
        { timestamp: new Date(now.getTime() - 86400000), value: 30 },
      ];

      const aggregateByPeriod = (metrics: Metric[], days: number) => {
        const cutoff = new Date(now.getTime() - days * 86400000);
        return metrics
          .filter((m) => m.timestamp >= cutoff)
          .reduce((sum, m) => sum + m.value, 0);
      };

      // Last 1 day: only the most recent
      expect(aggregateByPeriod(metrics, 1)).toBe(30);
      // Last 2 days: most recent + 2 days ago
      expect(aggregateByPeriod(metrics, 2)).toBe(50);
      // Last 3 days: all three
      expect(aggregateByPeriod(metrics, 3)).toBe(60);
    });

    it("should calculate moving average", () => {
      function calculateMovingAverage(values: number[], window: number): number[] {
        const result: number[] = [];
        for (let i = 0; i < values.length; i++) {
          const start = Math.max(0, i - window + 1);
          const slice = values.slice(start, i + 1);
          const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
          result.push(Math.round(avg * 100) / 100);
        }
        return result;
      }

      const result = calculateMovingAverage([10, 20, 30, 40], 3);
      expect(result).toEqual([10, 15, 20, 30]);
    });
  });
});
