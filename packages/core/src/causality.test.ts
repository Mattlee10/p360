import { describe, it, expect } from "vitest";
import type { BiometricData } from "./types";
import type { CausalityEvent } from "./causality";
import { toBiometricSnapshot, calculateDelta } from "./causality";
import {
  InMemoryEventStore,
  extractEventFromAsk,
  resolveOutcomes,
} from "./causality-collector";
import {
  linearRegression,
  analyzeAlcoholSensitivity,
  analyzeCaffeineSensitivity,
  analyzePersonalDrinkLimit,
  buildCausalityProfile,
} from "./causality-analyzer";

// ============================================
// Test Data
// ============================================

const goodData: BiometricData = {
  sleepScore: 80,
  readinessScore: 75,
  hrvBalance: 55,
  restingHR: 55,
  date: "2024-01-15",
};

const poorData: BiometricData = {
  sleepScore: 55,
  readinessScore: 45,
  hrvBalance: 35,
  restingHR: 68,
  date: "2024-01-16",
};

function makeDrinkEvent(
  userId: string,
  amount: number,
  bioBefore: BiometricData,
  bioAfter?: BiometricData,
): CausalityEvent {
  const before = toBiometricSnapshot(bioBefore);
  const event: CausalityEvent = {
    id: `test-${Math.random().toString(36).slice(2)}`,
    userId,
    domain: "drink",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago (so resolveOutcomes can pick it up)
    biometricsBefore: before,
    action: { type: "drank", amount, detail: "beer" },
  };

  if (bioAfter) {
    const after = toBiometricSnapshot(bioAfter);
    event.outcome = {
      measuredAt: new Date(),
      after,
      delta: calculateDelta(before, after),
    };
  }

  return event;
}

function makeCoffeeEvent(
  userId: string,
  cups: number,
  bioBefore: BiometricData,
  bioAfter?: BiometricData,
): CausalityEvent {
  const before = toBiometricSnapshot(bioBefore);
  const event: CausalityEvent = {
    id: `test-${Math.random().toString(36).slice(2)}`,
    userId,
    domain: "coffee",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    biometricsBefore: before,
    action: { type: "drank_coffee", amount: cups, detail: "coffee" },
  };

  if (bioAfter) {
    const after = toBiometricSnapshot(bioAfter);
    event.outcome = {
      measuredAt: new Date(),
      after,
      delta: calculateDelta(before, after),
    };
  }

  return event;
}

// ============================================
// causality.ts Tests
// ============================================

describe("toBiometricSnapshot", () => {
  it("should extract snapshot from BiometricData", () => {
    const snapshot = toBiometricSnapshot(goodData);
    expect(snapshot.sleepScore).toBe(80);
    expect(snapshot.readinessScore).toBe(75);
    expect(snapshot.hrvBalance).toBe(55);
    expect(snapshot.restingHR).toBe(55);
  });
});

describe("calculateDelta", () => {
  it("should compute difference between two snapshots", () => {
    const before = toBiometricSnapshot(goodData);
    const after = toBiometricSnapshot(poorData);
    const delta = calculateDelta(before, after);

    expect(delta.sleepChange).toBe(-25);       // 55 - 80
    expect(delta.readinessChange).toBe(-30);   // 45 - 75
    expect(delta.hrvChange).toBe(-20);         // 35 - 55
    expect(delta.rhrChange).toBe(13);          // 68 - 55
  });

  it("should handle null values", () => {
    const before = toBiometricSnapshot({ ...goodData, sleepScore: null });
    const after = toBiometricSnapshot(poorData);
    const delta = calculateDelta(before, after);

    expect(delta.sleepChange).toBeNull();
    expect(delta.readinessChange).toBe(-30);
  });
});

// ============================================
// causality-collector.ts Tests
// ============================================

describe("InMemoryEventStore", () => {
  it("should save and retrieve events", async () => {
    const store = new InMemoryEventStore();
    const event = makeDrinkEvent("user1", 3, goodData);

    await store.save(event);
    const results = await store.getByUser("user1");

    expect(results).toHaveLength(1);
    expect(results[0].action.amount).toBe(3);
  });

  it("should filter by domain", async () => {
    const store = new InMemoryEventStore();
    await store.save(makeDrinkEvent("user1", 2, goodData));
    await store.save(makeCoffeeEvent("user1", 1, goodData));

    const drinkEvents = await store.getByUserAndDomain("user1", "drink");
    expect(drinkEvents).toHaveLength(1);

    const coffeeEvents = await store.getByUserAndDomain("user1", "coffee");
    expect(coffeeEvents).toHaveLength(1);
  });

  it("should find pending outcomes", async () => {
    const store = new InMemoryEventStore();
    const event = makeDrinkEvent("user1", 3, goodData);
    // timestamp is 2 days ago, no outcome → pending
    await store.save(event);

    const pending = await store.getPendingOutcomes("user1");
    expect(pending).toHaveLength(1);
  });
});

describe("extractEventFromAsk", () => {
  it("should extract drink event from question", () => {
    const event = extractEventFromAsk(
      "맥주 3잔 마셔도 돼?",
      ["drink"],
      { drink: { verdict: "green", greenLimit: 3 } },
      goodData,
      "user1",
    );

    expect(event).not.toBeNull();
    expect(event!.domain).toBe("drink");
    expect(event!.action.type).toBe("drank");
    expect(event!.action.amount).toBe(3);
    expect(event!.action.detail).toBe("beer");
    expect(event!.recommendation?.verdict).toBe("green");
  });

  it("should extract coffee event from question", () => {
    const event = extractEventFromAsk(
      "커피 2잔 마셔도 되나?",
      ["coffee"],
      {},
      goodData,
      "user1",
    );

    expect(event).not.toBeNull();
    expect(event!.domain).toBe("coffee");
    expect(event!.action.type).toBe("drank_coffee");
    expect(event!.action.amount).toBe(2);
  });

  it("should return null for general questions", () => {
    const event = extractEventFromAsk(
      "how am I doing today?",
      ["general"],
      {},
      goodData,
      "user1",
    );

    expect(event).toBeNull();
  });

  it("should extract workout event", () => {
    const event = extractEventFromAsk(
      "should I play basketball today?",
      ["workout"],
      { workout: { verdict: "train_hard" } },
      goodData,
      "user1",
    );

    expect(event).not.toBeNull();
    expect(event!.domain).toBe("workout");
    expect(event!.action.detail).toBe("basketball");
  });
});

describe("resolveOutcomes", () => {
  it("should link today's biometrics to yesterday's events", async () => {
    const store = new InMemoryEventStore();
    const event = makeDrinkEvent("user1", 3, goodData);
    await store.save(event);

    const resolved = await resolveOutcomes(store, "user1", poorData);
    expect(resolved).toBe(1);

    const events = await store.getByUser("user1");
    expect(events[0].outcome).toBeDefined();
    expect(events[0].outcome!.delta.readinessChange).toBe(-30);
  });
});

// ============================================
// causality-analyzer.ts Tests
// ============================================

describe("linearRegression", () => {
  it("should compute correct slope for linear data", () => {
    // y = 2x + 1
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11];

    const result = linearRegression(x, y);

    expect(result).not.toBeNull();
    expect(result!.slope).toBeCloseTo(2, 5);
    expect(result!.intercept).toBeCloseTo(1, 5);
    expect(result!.r2).toBeCloseTo(1, 5);
  });

  it("should return null for insufficient data", () => {
    const result = linearRegression([1, 2], [3, 5]);
    expect(result).toBeNull();
  });

  it("should handle noisy data", () => {
    // Approximate y = -5x (with noise)
    const x = [1, 2, 3, 4, 5, 6, 7];
    const y = [-4, -11, -14, -22, -24, -31, -34];

    const result = linearRegression(x, y);

    expect(result).not.toBeNull();
    expect(result!.slope).toBeLessThan(-4);
    expect(result!.slope).toBeGreaterThan(-6);
    expect(result!.r2).toBeGreaterThan(0.9);
  });
});

describe("analyzeAlcoholSensitivity", () => {
  it("should detect personal alcohol sensitivity", () => {
    // Simulate: this user's HRV drops ~6% per drink (more than default 4.5%)
    const events: CausalityEvent[] = [];
    for (let i = 0; i < 7; i++) {
      const amount = (i % 4) + 1; // 1, 2, 3, 4, 1, 2, 3
      const hrvDrop = -6 * amount + (Math.random() * 2 - 1); // ~-6 per drink + noise
      const afterData: BiometricData = {
        ...goodData,
        hrvBalance: goodData.hrvBalance! + hrvDrop,
      };
      events.push(makeDrinkEvent("user1", amount, goodData, afterData));
    }

    const pattern = analyzeAlcoholSensitivity(events);

    expect(pattern).not.toBeNull();
    expect(pattern!.patternType).toBe("alcohol_hrv_sensitivity");
    expect(pattern!.learnedValue).toBeGreaterThan(5);
    expect(pattern!.learnedValue).toBeLessThan(7);
    expect(pattern!.populationDefault).toBe(4.5);
    expect(pattern!.description).toContain("more sensitive");
  });

  it("should return null with insufficient data", () => {
    const events = [
      makeDrinkEvent("user1", 2, goodData, poorData),
      makeDrinkEvent("user1", 3, goodData, poorData),
    ];

    const pattern = analyzeAlcoholSensitivity(events);
    expect(pattern).toBeNull();
  });
});

describe("buildCausalityProfile", () => {
  it("should build profile with discovered patterns", () => {
    const events: CausalityEvent[] = [];

    // 7 drink events with consistent sensitivity
    for (let i = 0; i < 7; i++) {
      const amount = (i % 3) + 1;
      const afterData: BiometricData = {
        ...goodData,
        hrvBalance: goodData.hrvBalance! - 6 * amount,
        readinessScore: goodData.readinessScore! - 5 * amount,
      };
      events.push(makeDrinkEvent("user1", amount, goodData, afterData));
    }

    const profile = buildCausalityProfile("user1", events);

    expect(profile.userId).toBe("user1");
    expect(profile.totalEvents).toBe(7);
    expect(profile.patterns.length).toBeGreaterThan(0);
    expect(profile.personalConstants.alcoholHrvDropPerDrink).toBeDefined();
  });

  it("should return empty profile with no events", () => {
    const profile = buildCausalityProfile("user1", []);

    expect(profile.totalEvents).toBe(0);
    expect(profile.patterns).toHaveLength(0);
    expect(profile.personalConstants.alcoholHrvDropPerDrink).toBeUndefined();
  });
});
