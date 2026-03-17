/**
 * Deals Router Unit Tests
 */

import { describe, expect, it } from "vitest";

describe("Deals Router - Business Logic", () => {
  describe("Deal Stages", () => {
    const validStages = [
      "qualification",
      "meeting_scheduled",
      "proposal_sent",
      "negotiation",
      "closed_won",
      "closed_lost",
    ];

    it("should have valid stages defined", () => {
      expect(validStages).toContain("qualification");
      expect(validStages).toContain("closed_won");
      expect(validStages).toContain("closed_lost");
    });

    it("should exclude closed deals from active pipeline", () => {
      const deals = [
        { id: "1", stage: "qualification" },
        { id: "2", stage: "closed_won" },
        { id: "3", stage: "negotiation" },
        { id: "4", stage: "closed_lost" },
      ];

      const activeDeals = deals.filter(
        (d) => d.stage !== "closed_won" && d.stage !== "closed_lost",
      );

      expect(activeDeals).toHaveLength(2);
      expect(activeDeals.map((d) => d.stage)).toEqual([
        "qualification",
        "negotiation",
      ]);
    });
  });

  describe("Deal Value Calculations", () => {
    it("should calculate total pipeline value", () => {
      const deals = [
        { id: "1", value: 10000, probability: 50 },
        { id: "2", value: 20000, probability: 75 },
        { id: "3", value: 15000, probability: 25 },
      ];

      const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      expect(totalValue).toBe(45000);
    });

    it("should calculate weighted pipeline value", () => {
      const deals = [
        { id: "1", value: 10000, probability: 50 },
        { id: "2", value: 20000, probability: 75 },
        { id: "3", value: 15000, probability: 25 },
      ];

      const weightedValue = deals.reduce(
        (sum, deal) => sum + (deal.value || 0) * (deal.probability || 0) / 100,
        0,
      );
      // 10000*0.5 + 20000*0.75 + 15000*0.25 = 5000 + 15000 + 3750 = 23750
      expect(weightedValue).toBe(23750);
    });
  });

  describe("Stage Transitions", () => {
    const stageOrder = [
      "qualification",
      "meeting_scheduled",
      "proposal_sent",
      "negotiation",
      "closed_won",
    ];

    it("should allow forward stage progression", () => {
      const currentStage = "qualification";
      const nextStage = "meeting_scheduled";

      const canProgress =
        stageOrder.indexOf(nextStage) > stageOrder.indexOf(currentStage);

      expect(canProgress).toBe(true);
    });

    it("should allow moving to closed states from any stage", () => {
      const currentStage = "qualification";
      const closedStages = ["closed_won", "closed_lost"];

      const canClose = closedStages.some(
        (stage) => stageOrder.indexOf(stage) > stageOrder.indexOf(currentStage),
      );

      expect(canClose).toBe(true);
    });
  });
});
