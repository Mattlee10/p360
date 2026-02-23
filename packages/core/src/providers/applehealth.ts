// ============================================
// Apple Health XML Parser
// ============================================
//
// Parses Apple Health export.xml (standard Apple Health export format).
// The XML contains individual measurement records — NOT daily aggregates.
// Steps are summed per day from all HKQuantityTypeIdentifierStepCount records.
//
// Export flow: Apple Health app → Export All Health Data → export.zip → export.xml
//

export interface AppleHealthRecord {
  date: string;              // "YYYY-MM-DD" — join key with Oura data
  steps: number;             // sum of all StepCount records for that day
  distanceKm?: number;       // sum of DistanceWalkingRunning
  activeEnergyKcal?: number; // sum of ActiveEnergyBurned
  exerciseMinutes?: number;  // sum of AppleExerciseTime
}

export interface AppleHealthParseResult {
  records: AppleHealthRecord[]; // one per day, sorted ascending by date
  dateRange: { start: string; end: string };
  totalRawRecords: number;     // total <Record> elements matched
  parseErrors: number;         // non-fatal parse failures (bad values, bad dates)
}

// Internal accumulator keyed by "YYYY-MM-DD"
interface DayAccumulator {
  steps: number;
  distanceKm: number;
  activeEnergyKcal: number;
  exerciseMinutes: number;
  hasDistance: boolean;
  hasEnergy: boolean;
  hasExercise: boolean;
}

// HK type identifiers we care about
const HK_STEP_COUNT = "HKQuantityTypeIdentifierStepCount";
const HK_DISTANCE = "HKQuantityTypeIdentifierDistanceWalkingRunning";
const HK_ACTIVE_ENERGY = "HKQuantityTypeIdentifierActiveEnergyBurned";
const HK_EXERCISE_TIME = "HKQuantityTypeIdentifierAppleExerciseTime";

const SUPPORTED_TYPES = new Set([
  HK_STEP_COUNT,
  HK_DISTANCE,
  HK_ACTIVE_ENERGY,
  HK_EXERCISE_TIME,
]);

export class AppleHealthXMLParser {
  parse(xmlText: string): AppleHealthParseResult {
    const dayMap = new Map<string, DayAccumulator>();
    let totalRawRecords = 0;
    let parseErrors = 0;

    // Regex to match <Record ...> elements with the fields we need.
    // Handles attribute order variation (type before/after value, etc.)
    // The 's' flag makes . match newlines (record may span lines).
    const recordPattern =
      /<Record\s+([^>]*?)(?:\s*\/>|>)/gs;

    for (const match of xmlText.matchAll(recordPattern)) {
      const attrs = match[1];

      const typeMatch = attrs.match(/\btype="([^"]+)"/);
      if (!typeMatch) continue;

      const type = typeMatch[1];
      if (!SUPPORTED_TYPES.has(type)) continue;

      totalRawRecords++;

      const valueMatch = attrs.match(/\bvalue="([^"]+)"/);
      const dateMatch = attrs.match(/\bstartDate="([^"]+)"/);

      if (!valueMatch || !dateMatch) {
        parseErrors++;
        continue;
      }

      const value = this.parseNumber(valueMatch[1]);
      if (value === undefined || value < 0) {
        parseErrors++;
        continue;
      }

      const date = this.extractDate(dateMatch[1]);
      if (!date) {
        parseErrors++;
        continue;
      }

      const acc = dayMap.get(date) ?? {
        steps: 0,
        distanceKm: 0,
        activeEnergyKcal: 0,
        exerciseMinutes: 0,
        hasDistance: false,
        hasEnergy: false,
        hasExercise: false,
      };

      switch (type) {
        case HK_STEP_COUNT:
          acc.steps += value;
          break;
        case HK_DISTANCE:
          acc.distanceKm += value;
          acc.hasDistance = true;
          break;
        case HK_ACTIVE_ENERGY:
          acc.activeEnergyKcal += value;
          acc.hasEnergy = true;
          break;
        case HK_EXERCISE_TIME:
          acc.exerciseMinutes += value;
          acc.hasExercise = true;
          break;
      }

      dayMap.set(date, acc);
    }

    // Convert map to sorted records array (only days with step data)
    const records: AppleHealthRecord[] = [];
    for (const [date, acc] of dayMap) {
      if (acc.steps === 0 && !acc.hasDistance && !acc.hasEnergy && !acc.hasExercise) {
        continue;
      }
      const record: AppleHealthRecord = {
        date,
        steps: Math.round(acc.steps),
      };
      if (acc.hasDistance) {
        record.distanceKm = Math.round(acc.distanceKm * 100) / 100;
      }
      if (acc.hasEnergy) {
        record.activeEnergyKcal = Math.round(acc.activeEnergyKcal);
      }
      if (acc.hasExercise) {
        record.exerciseMinutes = Math.round(acc.exerciseMinutes);
      }
      records.push(record);
    }

    records.sort((a, b) => a.date.localeCompare(b.date));

    const dateRange =
      records.length > 0
        ? { start: records[0].date, end: records[records.length - 1].date }
        : { start: "", end: "" };

    return { records, dateRange, totalRawRecords, parseErrors };
  }

  // "2026-02-23 08:00:00 +0000" → "2026-02-23"
  // "2026-02-23T08:00:00+00:00" → "2026-02-23"
  private extractDate(dateStr: string): string | null {
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  private parseNumber(raw: string): number | undefined {
    const n = parseFloat(raw);
    return isNaN(n) ? undefined : n;
  }
}
