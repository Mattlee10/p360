import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  calculateRollingAverage,
  calculateBaselineVariance,
  detectTrend,
  detectSignificance,
  findPeaksAndValleys,
} from "@p360/core";
import { applyConfoundAdjustment, applyConfoundFiltering } from "@p360/core";
import type { BiometricData } from "@p360/core";

interface AnalyzeOptions {
  metric?: string; // "hrv", "readiness", "sleep", "rhr"
  rolling?: number; // window size (default: 7)
  days?: number; // look back period (default: 30)
  exclude?: string; // comma-separated: "training,travel,alcohol"
  baseline?: number; // window for baseline (default: 30)
  demo?: boolean;
  json?: boolean;
}

export async function analyzeCommand(
  args: string[],
  options: AnalyzeOptions
): Promise<void> {
  try {
    const metric = args[0] || options.metric || "hrv";

    if (!["hrv", "readiness", "sleep", "rhr"].includes(metric)) {
      console.error(
        `❌ Unknown metric: ${metric}. Use: hrv, readiness, sleep, rhr`
      );
      process.exit(1);
    }

    const rollingWindow = options.rolling || 7;
    const lookbackDays = options.days || 30;
    const baselineWindow = options.baseline || 30;
    const excludeConfounds = (options.exclude || "").split(",").filter(Boolean);

    console.log(`\n📊 Analyzing ${metric} (${lookbackDays}-day window, ${rollingWindow}-day rolling)`);
    if (excludeConfounds.length > 0) {
      console.log(`   Excluding confounds: ${excludeConfounds.join(", ")}`);
    }
    console.log("");

    // Get data
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // Extract metric values
    const metricData = extractMetricData(data, metric, lookbackDays);

    if (metricData.length < rollingWindow) {
      console.error(
        `❌ Not enough data. Need ${rollingWindow} days, have ${metricData.length}`
      );
      process.exit(1);
    }

    // Calculate baseline variance
    const baseline = calculateBaselineVariance(metricData, baselineWindow);
    console.log(`📈 Baseline (last ${baselineWindow} days):`);
    console.log(
      `   Mean: ${baseline.mean.toFixed(2)} | StDev: ${baseline.stdev.toFixed(2)} (noise floor)`
    );
    console.log("");

    // Apply confound filtering if requested
    let processedData = metricData;
    if (excludeConfounds.length > 0) {
      console.log(`🔧 Applying confound adjustments...`);
      const confoundFlags = generateDummyConfounds(
        metricData.length,
        excludeConfounds
      );
      const filtered = applyConfoundFiltering(
        metricData,
        confoundFlags,
        metric as "hrv" | "readiness" | "sleep"
      );
      processedData = filtered.adjusted;
      console.log(`   Raw variance: ${calculateBaselineVariance(filtered.raw).stdev.toFixed(2)}`);
      console.log(
        `   Adjusted variance: ${calculateBaselineVariance(filtered.adjusted).stdev.toFixed(2)} (noise reduced)`
      );
      console.log("");
    }

    // Calculate rolling average
    const rolling = calculateRollingAverage(processedData, rollingWindow);
    const trends = detectTrend(rolling);

    // Find peaks/valleys
    const peaksValleys = findPeaksAndValleys(rolling, 3);

    // Format output
    console.log(
      `📉 ${metric.toUpperCase()} Rolling Average (${rollingWindow}-day window):`
    );
    console.log("");

    // Show recent data with context
    const displayRows = Math.min(15, rolling.length);
    const startIdx = rolling.length - displayRows;

    for (let i = startIdx; i < rolling.length; i++) {
      const value = rolling[i];
      const trend = trends[i];
      const dayNum = i + rollingWindow; // Adjusted for rolling window offset
      const rawValue = processedData[i + rollingWindow - 1];
      const delta = value - baseline.mean;
      const isSignificant = detectSignificance(delta, baseline.stdev);

      const significance = isSignificant
        ? "⭐ SIGNAL"
        : delta > 0
          ? "↑ above baseline"
          : "↓ below baseline";

      console.log(
        `  Day ${dayNum}: ${value.toFixed(2).padStart(7)} ${trend} ${significance} (delta: ${delta > 0 ? "+" : ""}${delta.toFixed(2)})`
      );
    }

    console.log("");

    // Summary
    if (peaksValleys.peaks.length > 0) {
      const lastPeak = peaksValleys.peaks[peaksValleys.peaks.length - 1];
      console.log(`⬆️  Latest peak: Day ${lastPeak.index + rollingWindow} (${lastPeak.value.toFixed(2)})`);
    }
    if (peaksValleys.valleys.length > 0) {
      const lastValley = peaksValleys.valleys[peaksValleys.valleys.length - 1];
      console.log(
        `⬇️  Latest valley: Day ${lastValley.index + rollingWindow} (${lastValley.value.toFixed(2)})`
      );
    }

    // Trend summary
    const recentTrends = trends.slice(-7);
    const upCount = recentTrends.filter((t) => t === "↗️").length;
    const downCount = recentTrends.filter((t) => t === "↘️").length;
    if (upCount > downCount) {
      console.log(`📈 Recent trend: IMPROVING (${upCount}/${recentTrends.length} days up)`);
    } else if (downCount > upCount) {
      console.log(
        `📉 Recent trend: DECLINING (${downCount}/${recentTrends.length} days down)`
      );
    } else {
      console.log(`→ Recent trend: STABLE`);
    }

    console.log("");

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            metric,
            rolling,
            trends,
            baseline,
            peaksValleys,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Extract metric values from biometric data
 */
function extractMetricData(
  data: BiometricData,
  metric: string,
  days: number
): number[] {
  // For demo, generate synthetic data
  // In real usage, this would extract from Oura API response
  const values: number[] = [];

  if (metric === "hrv") {
    // Simulate HRV data (typically 25-150ms range)
    for (let i = 0; i < days; i++) {
      const baseHrv = 55 + Math.sin(i / 7) * 10; // Weekly pattern
      const noise = (Math.random() - 0.5) * 15; // Daily noise
      values.push(Math.max(25, baseHrv + noise));
    }
  } else if (metric === "readiness") {
    // Simulate readiness (0-100)
    for (let i = 0; i < days; i++) {
      const baseReadiness = 65 + Math.sin(i / 7) * 15;
      const noise = (Math.random() - 0.5) * 10;
      values.push(Math.max(0, Math.min(100, baseReadiness + noise)));
    }
  } else if (metric === "sleep") {
    // Simulate sleep efficiency (70-95%)
    for (let i = 0; i < days; i++) {
      const baseSleep = 82 + Math.sin(i / 10) * 8;
      const noise = (Math.random() - 0.5) * 5;
      values.push(Math.max(65, Math.min(95, baseSleep + noise)));
    }
  } else if (metric === "rhr") {
    // Simulate resting heart rate (45-70 bpm)
    for (let i = 0; i < days; i++) {
      const baseRhr = 55 + Math.sin(i / 7) * -5; // Improves with rest
      const noise = (Math.random() - 0.5) * 3;
      values.push(Math.max(45, Math.min(70, baseRhr + noise)));
    }
  }

  return values;
}

/**
 * Generate dummy confound flags for demo
 * In real usage, these would come from user input or database
 */
function generateDummyConfounds(
  count: number,
  excludeList: string[]
): Array<{
  training_intensity?: number;
  travel_day?: boolean;
  alcohol_units?: number;
}> {
  const confounds = [];

  for (let i = 0; i < count; i++) {
    const conf: any = {};

    // Simulate training 3x per week
    if (excludeList.includes("training") && [1, 3, 5].includes(i % 7)) {
      conf.training_intensity = 40 + Math.random() * 40; // 40-80
    }

    // Simulate travel (random, ~10% chance)
    if (excludeList.includes("travel") && Math.random() < 0.1) {
      conf.travel_day = true;
    }

    // Simulate alcohol on weekends
    if (excludeList.includes("alcohol") && [5, 6].includes(i % 7)) {
      if (Math.random() < 0.5) {
        conf.alcohol_units = 2 + Math.floor(Math.random() * 3); // 2-4 units
      }
    }

    confounds.push(conf);
  }

  return confounds;
}
