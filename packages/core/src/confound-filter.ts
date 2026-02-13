/**
 * Confound filtering for p360
 * Isolates true signal by adjusting for known noise sources:
 * - Training/exercise intensity (depletes HRV/readiness)
 * - Travel/timezone changes (disrupts sleep, increases RHR)
 * - Alcohol consumption (depresses HRV, extends recovery)
 */

export interface ConfoundFlags {
  training_intensity?: number; // 0-100 (0=none, 100=max intensity)
  travel_day?: boolean;
  alcohol_units?: number;
}

export interface ConfoundAdjustment {
  raw_value: number;
  confound_penalties: {
    training: number;
    travel: number;
    alcohol: number;
  };
  adjusted_value: number;
  note: string;
}

/**
 * Apply confound adjustments to a biometric value
 * Returns both raw and adjusted values so user can see what was filtered
 *
 * @param raw_value The observed metric (HRV, readiness, etc.)
 * @param confounds Flags for known noise sources
 * @param metric The metric being adjusted (affects penalty calculation)
 * @returns Adjusted value and breakdown of penalties
 */
export function applyConfoundAdjustment(
  raw_value: number,
  confounds: ConfoundFlags,
  metric: "hrv" | "readiness" | "sleep" = "hrv"
): ConfoundAdjustment {
  let adjustments = 0;
  const penalties = {
    training: 0,
    travel: 0,
    alcohol: 0,
  };

  const notes: string[] = [];

  // Training intensity penalty
  if (confounds.training_intensity && confounds.training_intensity > 0) {
    let penalty = 0;
    const intensity = confounds.training_intensity;

    if (metric === "hrv") {
      // HRV drops ~0.5ms per 1% training intensity (rough estimate)
      penalty = intensity * 0.5;
    } else if (metric === "readiness") {
      // Readiness drops ~0.3 points per 1% intensity
      penalty = intensity * 0.3;
    } else if (metric === "sleep") {
      // Sleep efficiency drops ~0.2% per 1% intensity
      penalty = intensity * 0.2;
    }

    penalties.training = penalty;
    adjustments += penalty;
    notes.push(
      `Training (${intensity}%) -${penalty.toFixed(1)} ${metric}`
    );
  }

  // Travel day penalty
  if (confounds.travel_day) {
    let penalty = 0;

    if (metric === "hrv") {
      // Travel disrupts HRV: ~5-8ms typical drop
      penalty = 6;
    } else if (metric === "readiness") {
      // Readiness drops due to travel stress: ~3-5 points
      penalty = 4;
    } else if (metric === "sleep") {
      // Sleep efficiency drops: ~5-10%
      penalty = 7;
    }

    penalties.travel = penalty;
    adjustments += penalty;
    notes.push(`Travel -${penalty.toFixed(1)} ${metric}`);
  }

  // Alcohol penalty
  if (confounds.alcohol_units && confounds.alcohol_units > 0) {
    const units = confounds.alcohol_units;
    let penalty = 0;

    if (metric === "hrv") {
      // HRV drops ~4.5ms per drink (from literature + WHOOP data)
      // Note: 1 unit = ~1 standard drink
      penalty = units * 4.5;
    } else if (metric === "readiness") {
      // Readiness drops ~2-3 points per drink
      penalty = units * 2.5;
    } else if (metric === "sleep") {
      // Sleep efficiency drops ~3-4% per drink
      penalty = units * 3.5;
    }

    penalties.alcohol = penalty;
    adjustments += penalty;
    notes.push(`Alcohol (${units} units) -${penalty.toFixed(1)} ${metric}`);
  }

  const adjusted_value = raw_value + adjustments;
  const note = notes.length > 0 ? notes.join(" | ") : "No confounds";

  return {
    raw_value,
    confound_penalties: penalties,
    adjusted_value,
    note,
  };
}

/**
 * Apply confound adjustments to a time series
 * Useful for filtering entire datasets before rolling average
 *
 * @param data Array of raw values
 * @param confound_days Array of confound flags aligned with data
 * @param metric Type of metric being adjusted
 * @returns Array of adjusted values
 */
export function applyConfoundFiltering(
  data: number[],
  confound_days: ConfoundFlags[],
  metric: "hrv" | "readiness" | "sleep" = "hrv"
): { raw: number[]; adjusted: number[]; adjustments: ConfoundAdjustment[] } {
  if (data.length !== confound_days.length) {
    throw new Error(
      `Data length (${data.length}) must match confound_days length (${confound_days.length})`
    );
  }

  const adjusted: number[] = [];
  const adjustments: ConfoundAdjustment[] = [];

  for (let i = 0; i < data.length; i++) {
    const adj = applyConfoundAdjustment(data[i], confound_days[i], metric);
    adjusted.push(adj.adjusted_value);
    adjustments.push(adj);
  }

  return {
    raw: data,
    adjusted,
    adjustments,
  };
}

/**
 * Estimate confound penalty for a given day based on day type
 * Useful when explicit confound data isn't available but can infer from context
 */
export function estimateConfoundPenalty(
  dayOfWeek: number, // 0=Sunday, 6=Saturday
  userExerciseSchedule?: string[] // e.g., ["Monday", "Wednesday", "Saturday"]
): ConfoundFlags {
  const confounds: ConfoundFlags = {};

  // Assume training on specific days
  if (userExerciseSchedule?.includes(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek])) {
    confounds.training_intensity = 50; // Medium intensity default
  }

  // Weekend travel likelihood slightly higher
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    // Small chance of travel (5% baseline, would be user-configured)
    confounds.travel_day = false;
  }

  // Alcohol likelihood higher on weekends
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    // User would provide this explicitly
  }

  return confounds;
}
