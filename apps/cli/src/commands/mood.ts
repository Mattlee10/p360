import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getMoodHistory, addMoodEntry } from "../lib/config";
import { getMoodDecision } from "@p360/core";
import type { MoodEntry } from "@p360/core";

interface MoodOptions {
  demo?: boolean;
  json?: boolean;
  note?: string;
}

export async function moodCommand(score: string | undefined, options: MoodOptions): Promise<void> {
  try {
    if (!score) {
      // Show history summary
      const entries = getMoodHistory();
      if (entries.length === 0) {
        console.log("");
        console.log("  No mood entries yet.");
        console.log("  Log your mood: p360 mood <1-5>");
        console.log("  Example: p360 mood 3 --note 'feeling tired'");
        console.log("");
        return;
      }

      console.log("");
      console.log("  📊 Mood History (last 7 entries)");
      console.log("");
      entries.slice(-7).forEach((entry) => {
        const emoji = entry.score >= 4 ? "🟢" : entry.score >= 3 ? "🟡" : "🔴";
        const note = entry.note ? ` — ${entry.note}` : "";
        console.log(`    ${emoji} ${entry.date}: ${entry.score}/5${note}`);
      });
      console.log("");
      return;
    }

    const moodScore = parseInt(score, 10);
    if (isNaN(moodScore) || moodScore < 1 || moodScore > 5) {
      console.log("  ⚠️  Mood score must be 1-5");
      return;
    }

    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // Save mood entry
    const entry: MoodEntry = {
      date: new Date().toISOString().split("T")[0],
      score: moodScore,
      timestamp: new Date(),
      note: options.note,
    };
    addMoodEntry(entry);

    // Get mood history for correlation
    const moodEntries = getMoodHistory();
    const recoveryHistory = moodEntries
      .map(() => data.readinessScore)
      .filter((s): s is number => s !== null);

    const decision = getMoodDecision(
      data,
      moodScore,
      moodEntries.length >= 5 ? moodEntries : undefined,
      recoveryHistory.length >= 5 ? recoveryHistory : undefined,
    );

    if (options.json) {
      console.log(JSON.stringify(decision, null, 2));
      return;
    }

    const attr = decision.attribution;

    console.log("");
    console.log(`  ${attr.emoji} ${attr.headline}`);
    console.log("");
    console.log(`  ${attr.subheadline}`);
    console.log("");

    // Explanation
    attr.explanation.split("\n").forEach((line) => {
      console.log(`  ${line}`);
    });
    console.log("");

    // Data summary
    const ds = decision.dataSummary;
    console.log(`  Recovery: ${ds.readiness ?? "N/A"} (${ds.recoveryStatus})`);
    console.log(`  Mood: ${ds.moodScore}/5 (${ds.moodStatus})`);
    console.log(`  Scenario: ${decision.scenario}`);
    console.log("");

    // Recommendations
    console.log("  What to do:");
    attr.recommendations.forEach((rec) => {
      console.log(`    • ${rec}`);
    });
    console.log("");

    // History insight
    if (decision.moodHistory) {
      console.log(`  📈 ${decision.moodHistory.summary}`);
      console.log(`  ${decision.moodHistory.insight}`);
      console.log("");
    }

    console.log(`  ✅ Mood ${moodScore}/5 saved for today`);
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
