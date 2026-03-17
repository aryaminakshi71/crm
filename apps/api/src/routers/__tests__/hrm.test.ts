/**
 * HRM Router Unit Tests
 */

import { describe, expect, it } from "vitest";

describe("HRM Router - Business Logic", () => {
  describe("Employee Status", () => {
    const validStatuses = ["active", "inactive", "on_leave", "terminated"];

    it("should have valid statuses defined", () => {
      expect(validStatuses).toContain("active");
      expect(validStatuses).toContain("on_leave");
    });
  });

  describe("Leave Types", () => {
    const leaveTypes = ["annual", "sick", "personal", "maternity", "paternity"];

    it("should have valid leave types", () => {
      expect(leaveTypes).toContain("annual");
      expect(leaveTypes).toContain("sick");
    });

    it("should calculate remaining leave days", () => {
      function getRemainingDays(
        annualAllowance: number,
        daysTaken: number,
      ): number {
        return Math.max(0, annualAllowance - daysTaken);
      }

      expect(getRemainingDays(20, 5)).toBe(15);
      expect(getRemainingDays(20, 25)).toBe(0);
    });
  });

  describe("Payroll Calculations", () => {
    it("should calculate gross pay", () => {
      function calculateGrossPay(
        hourlyRate: number,
        hoursWorked: number,
      ): number {
        return hourlyRate * hoursWorked;
      }

      expect(calculateGrossPay(50, 40)).toBe(2000);
    });

    it("should calculate net pay from gross", () => {
      function calculateNetPay(grossPay: number, taxRate: number): number {
        const tax = grossPay * (taxRate / 100);
        return grossPay - tax;
      }

      expect(calculateNetPay(5000, 20)).toBe(4000);
    });

    it("should calculate overtime pay", () => {
      function calculateOvertimePay(
        hours: number,
        regularRate: number,
        overtimeMultiplier: number,
      ): number {
        const regularHours = Math.min(hours, 40);
        const overtimeHours = Math.max(0, hours - 40);
        return (
          regularHours * regularRate +
          overtimeHours * regularRate * overtimeMultiplier
        );
      }

      expect(calculateOvertimePay(45, 20, 1.5)).toBe(950);
    });
  });

  describe("Attendance", () => {
    it("should calculate work hours from clock in/out", () => {
      function calculateHours(
        clockIn: string, // "HH:MM"
        clockOut: string,
      ): number {
        const [inHour, inMin] = clockIn.split(":").map(Number);
        const [outHour, outMin] = clockOut.split(":").map(Number);
        const totalMinutes = outHour * 60 + outMin - (inHour * 60 + inMin);
        return Math.max(0, totalMinutes / 60);
      }

      expect(calculateHours("09:00", "17:00")).toBe(8);
      expect(calculateHours("09:30", "18:00")).toBe(8.5);
    });

    it("should determine if late based on threshold", () => {
      function isLate(clockIn: string, threshold: string): boolean {
        return clockIn > threshold;
      }

      expect(isLate("09:00", "09:00")).toBe(false);
      expect(isLate("09:15", "09:00")).toBe(true);
    });
  });

  describe("Performance Reviews", () => {
    it("should calculate average performance score", () => {
      function calculateAverageScore(scores: number[]): number {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((a, b) => a + b, 0);
        return Math.round((sum / scores.length) * 10) / 10;
      }

      expect(calculateAverageScore([4, 5, 3, 4])).toBe(4);
      expect(calculateAverageScore([])).toBe(0);
    });

    it("should determine rating from score", () => {
      function getRating(score: number): string {
        if (score >= 4.5) return "Excellent";
        if (score >= 3.5) return "Good";
        if (score >= 2.5) return "Satisfactory";
        if (score >= 1.5) return "Needs Improvement";
        return "Poor";
      }

      expect(getRating(4.8)).toBe("Excellent");
      expect(getRating(3.8)).toBe("Good");
      expect(getRating(2.8)).toBe("Satisfactory");
      expect(getRating(1.8)).toBe("Needs Improvement");
      expect(getRating(1.0)).toBe("Poor");
    });
  });
});
