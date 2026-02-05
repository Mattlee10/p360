import { describe, it, expect } from "vitest";
import {
  calculateDecisionReadiness,
  quickCheck,
  getStatusEmoji,
  getVerdictEmoji,
} from "./algorithm";
import { BiometricData } from "./types";

describe("calculateDecisionReadiness", () => {
  const excellentData: BiometricData = {
    sleepScore: 85,
    readinessScore: 82,
    hrvBalance: 65,
    restingHR: 52,
    date: "2024-01-15",
  };

  const poorData: BiometricData = {
    sleepScore: 45,
    readinessScore: 28,
    hrvBalance: 25,
    restingHR: 68,
    date: "2024-01-15",
  };

  const cautionData: BiometricData = {
    sleepScore: 55,
    readinessScore: 42,
    hrvBalance: 45,
    restingHR: 58,
    date: "2024-01-15",
  };

  describe("score calculation", () => {
    it("calculates excellent score correctly", () => {
      const result = calculateDecisionReadiness(excellentData);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.status).toBe("excellent");
    });

    it("calculates poor score correctly", () => {
      const result = calculateDecisionReadiness(poorData);
      expect(result.score).toBeLessThan(30);
      expect(result.status).toBe("poor");
    });

    it("calculates caution score correctly", () => {
      const result = calculateDecisionReadiness(cautionData);
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.score).toBeLessThan(50);
      expect(result.status).toBe("caution");
    });

    it("falls back to sleep score when readiness is null", () => {
      const dataWithoutReadiness: BiometricData = {
        ...excellentData,
        readinessScore: null,
      };
      const result = calculateDecisionReadiness(dataWithoutReadiness);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it("uses default score 50 when both scores are null", () => {
      const emptyData: BiometricData = {
        sleepScore: null,
        readinessScore: null,
        hrvBalance: null,
        restingHR: null,
        date: "2024-01-15",
      };
      const result = calculateDecisionReadiness(emptyData);
      expect(result.score).toBe(50);
    });
  });

  describe("actionable insights", () => {
    it("generates proceed insight for excellent state", () => {
      const result = calculateDecisionReadiness(excellentData, {
        category: "email",
        importance: "high",
      });
      expect(result.insight.verdict).toBe("proceed");
      expect(result.insight.headline).toBe("Clear to send");
    });

    it("generates stop insight for poor state on critical decision", () => {
      const result = calculateDecisionReadiness(poorData, {
        category: "email",
        importance: "critical",
      });
      expect(result.insight.verdict).toBe("stop");
      expect(result.insight.headline).toBe("Do not send");
      expect(result.insight.risk).toBeDefined();
    });

    it("generates wait insight for caution state on high importance", () => {
      const result = calculateDecisionReadiness(cautionData, {
        category: "financial",
        importance: "high",
      });
      expect(["wait", "stop"]).toContain(result.insight.verdict);
      expect(result.insight.retryIn).toBeDefined();
    });

    it("generates workout-specific insights", () => {
      const result = calculateDecisionReadiness(poorData, {
        category: "workout",
        importance: "medium",
      });
      expect(result.insight.headline).toBe("Rest day");
      expect(result.insight.action).toContain("No training");
    });

    it("generates meeting-specific insights", () => {
      const result = calculateDecisionReadiness(cautionData, {
        category: "meeting",
        importance: "high",
      });
      expect(result.insight).toBeDefined();
      expect(result.insight.action).toBeDefined();
    });
  });

  describe("metrics", () => {
    it("includes all metric labels", () => {
      const result = calculateDecisionReadiness(excellentData);
      expect(result.metrics.sleep.label).toBe("Excellent");
      expect(result.metrics.readiness.label).toBe("Excellent");
      expect(result.metrics.hrv.label).toBe("Normal");
    });

    it("handles null metrics gracefully", () => {
      const partialData: BiometricData = {
        sleepScore: null,
        readinessScore: 70,
        hrvBalance: null,
        restingHR: null,
        date: "2024-01-15",
      };
      const result = calculateDecisionReadiness(partialData);
      expect(result.metrics.sleep.label).toBe("N/A");
      expect(result.metrics.hrv.label).toBe("N/A");
    });
  });
});

describe("quickCheck", () => {
  const goodData: BiometricData = {
    sleepScore: 75,
    readinessScore: 72,
    hrvBalance: 55,
    restingHR: 54,
    date: "2024-01-15",
  };

  it("returns actionable insight directly", () => {
    const insight = quickCheck(goodData, "email", "medium");
    expect(insight.verdict).toBeDefined();
    expect(insight.headline).toBeDefined();
    expect(insight.action).toBeDefined();
  });

  it("adjusts verdict based on importance", () => {
    const lowImportance = quickCheck(goodData, "email", "low");
    const criticalImportance = quickCheck(goodData, "email", "critical");

    // Same data, but critical importance should be more cautious
    expect(lowImportance.verdict).toBe("proceed");
    expect(["proceed", "proceed_with_caution"]).toContain(criticalImportance.verdict);
  });
});

describe("emoji helpers", () => {
  it("returns correct status emojis", () => {
    expect(getStatusEmoji("excellent")).toBe("🟢");
    expect(getStatusEmoji("good")).toBe("🔵");
    expect(getStatusEmoji("caution")).toBe("🟡");
    expect(getStatusEmoji("poor")).toBe("🔴");
  });

  it("returns correct verdict emojis", () => {
    expect(getVerdictEmoji("proceed")).toBe("✅");
    expect(getVerdictEmoji("proceed_with_caution")).toBe("⚠️");
    expect(getVerdictEmoji("wait")).toBe("⏳");
    expect(getVerdictEmoji("stop")).toBe("🛑");
  });
});
