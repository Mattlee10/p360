/**
 * Time-series analysis utilities for p360
 * Supports rolling averages, trend detection, and baseline variance calculation
 * Used for isolating signal from noise in biometric data
 */

/**
 * Calculate rolling average (moving average)
 * @param data Array of numeric values
 * @param windowSize Size of the rolling window
 * @returns Array of rolling averages (starts at index windowSize-1)
 */
export function calculateRollingAverage(
  data: number[],
  windowSize: number
): number[] {
  if (data.length < windowSize) {
    throw new Error(
      `Data length (${data.length}) must be >= window size (${windowSize})`
    );
  }

  const result: number[] = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const sum = window.reduce((a, b) => a + b, 0);
    const avg = sum / window.length;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate baseline statistics (mean and standard deviation)
 * Useful for determining what is "normal" noise for a metric
 * @param data Array of numeric values
 * @param window Optional: use only last N days for baseline
 * @returns {mean, stdev, count}
 */
export function calculateBaselineVariance(
  data: number[],
  window?: number
): { mean: number; stdev: number; count: number } {
  const subset = window ? data.slice(-window) : data;

  if (subset.length === 0) {
    throw new Error("No data points available");
  }

  const mean = subset.reduce((a, b) => a + b, 0) / subset.length;
  const squaredDiffs = subset.map((x) => Math.pow(x - mean, 2));
  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / subset.length;
  const stdev = Math.sqrt(variance);

  return {
    mean,
    stdev,
    count: subset.length,
  };
}

/**
 * Detect if a delta is significant relative to baseline noise
 * Signal is significant if it exceeds (baseline_stdev * threshold)
 * @param delta The observed change (e.g., readiness +5 points)
 * @param baseline_stdev Normal variation (noise floor)
 * @param threshold Multiplier for sensitivity (default: 1.5 = 1.5 * stdev)
 * @returns true if delta is significant
 */
export function detectSignificance(
  delta: number,
  baseline_stdev: number,
  threshold: number = 1.5
): boolean {
  const absThreshold = Math.abs(threshold * baseline_stdev);
  return Math.abs(delta) > absThreshold;
}

/**
 * Detect trend direction from rolling average
 * @param data Array of values (typically rolling averages)
 * @returns Array of trend indicators matching data length
 */
export function detectTrend(
  data: number[],
  minPointsForTrend: number = 3
): string[] {
  const trends: string[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < minPointsForTrend - 1) {
      trends.push("→"); // Insufficient data
      continue;
    }

    // Calculate slope over last N points
    const startIdx = Math.max(0, i - minPointsForTrend + 1);
    const window = data.slice(startIdx, i + 1);

    // Simple slope: (current - previous) / window_size
    const currentValue = window[window.length - 1];
    const previousValue = window[0];
    const slope = (currentValue - previousValue) / (window.length - 1);

    // Classify trend (threshold: 0.5% of previous value)
    const threshold = previousValue * 0.005;
    if (slope > threshold) {
      trends.push("↗️");
    } else if (slope < -threshold) {
      trends.push("↘️");
    } else {
      trends.push("→");
    }
  }

  return trends;
}

/**
 * Calculate percentage change from start to end
 * Useful for showing relative improvement/degradation
 */
export function calculatePercentChange(
  start: number,
  end: number
): number {
  if (start === 0) return 0;
  return ((end - start) / Math.abs(start)) * 100;
}

/**
 * Find local peaks and valleys in time series
 * Useful for identifying where compound effects peak/plateau
 */
export interface TimesSeriesPeakValley {
  peaks: Array<{ index: number; value: number }>;
  valleys: Array<{ index: number; value: number }>;
}

export function findPeaksAndValleys(
  data: number[],
  minDistance: number = 3
): TimesSeriesPeakValley {
  const peaks: Array<{ index: number; value: number }> = [];
  const valleys: Array<{ index: number; value: number }> = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1];
    const current = data[i];
    const next = data[i + 1];

    // Peak: current > both neighbors
    if (current > prev && current > next) {
      // Check minimum distance from last peak
      const lastPeak = peaks[peaks.length - 1];
      if (!lastPeak || i - lastPeak.index >= minDistance) {
        peaks.push({ index: i, value: current });
      }
    }

    // Valley: current < both neighbors
    if (current < prev && current < next) {
      const lastValley = valleys[valleys.length - 1];
      if (!lastValley || i - lastValley.index >= minDistance) {
        valleys.push({ index: i, value: current });
      }
    }
  }

  return { peaks, valleys };
}
