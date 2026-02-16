import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type P360Plugin from "../main";
import {
  getMoodDecision,
  BiometricData,
  MoodDecision,
} from "@p360/core";
import { fetchBiometricData } from "../lib/data";

export const VIEW_TYPE_MOOD = "p360-mood-view";

export class MoodView extends ItemView {
  plugin: P360Plugin;
  private moodScore: number | null = null;
  private biometricData: BiometricData | null = null;
  private moodDecision: MoodDecision | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: P360Plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_MOOD;
  }

  getDisplayText(): string {
    return "P360 Mood";
  }

  getIcon(): string {
    return "smile";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("p360-mood-widget");

    // Header
    const header = container.createDiv({ cls: "p360-mood-header" });
    const iconSpan = header.createSpan();
    setIcon(iconSpan, "smile");
    header.createEl("h4", { text: "How are you feeling?" });

    // Mood buttons
    const moodContainer = container.createDiv({ cls: "p360-mood-scores" });
    const labels = ["😫", "😕", "😐", "🙂", "😊"];

    for (let i = 1; i <= 5; i++) {
      const btn = moodContainer.createEl("button", {
        cls: "p360-mood-btn",
        text: labels[i - 1],
      });
      btn.setAttribute("data-score", String(i));

      if (this.moodScore === i) {
        btn.addClass("selected");
      }

      btn.addEventListener("click", async () => {
        this.moodScore = i;
        await this.updateMoodAnalysis();
        await this.refresh();
      });
    }

    // Status section
    if (this.biometricData) {
      const statusEl = container.createDiv({ cls: "p360-status" });

      this.createStatusRow(
        statusEl,
        "Readiness",
        `${this.biometricData.readinessScore ?? "?"}/100`
      );
      this.createStatusRow(
        statusEl,
        "HRV",
        this.getHrvStatus(this.biometricData.hrvBalance)
      );
      this.createStatusRow(
        statusEl,
        "Sleep",
        `${this.biometricData.sleepScore ?? "?"}/100`
      );
    } else if (this.plugin.settings.token) {
      const loadingEl = container.createDiv({ cls: "p360-status" });
      loadingEl.createEl("p", { text: "Loading biometric data..." });
      this.loadBiometricData();
    } else {
      const noTokenEl = container.createDiv({ cls: "p360-status" });
      noTokenEl.createEl("p", {
        text: "Configure your device in settings to see biometric data.",
      });
    }

    // Insight section
    if (this.moodDecision) {
      const insightEl = container.createDiv({ cls: "p360-insight" });
      const { attribution } = this.moodDecision;

      insightEl.createDiv({
        cls: "p360-insight-title",
        text: `${attribution.emoji} ${attribution.headline}`,
      });
      insightEl.createDiv({
        cls: "p360-insight-text",
        text: attribution.subheadline,
      });

      // Recommendations
      const recsEl = insightEl.createEl("ul");
      attribution.recommendations.slice(0, 3).forEach((rec) => {
        recsEl.createEl("li", { text: rec });
      });
    }
  }

  private createStatusRow(
    parent: HTMLElement,
    label: string,
    value: string
  ): void {
    const row = parent.createDiv({ cls: "p360-status-row" });
    row.createSpan({ cls: "p360-status-label", text: label });
    row.createSpan({ cls: "p360-status-value", text: value });
  }

  private getHrvStatus(hrvBalance: number | null): string {
    if (hrvBalance === null) return "N/A";
    const diff = hrvBalance - 50;
    if (diff >= 10) return `+${diff}% above baseline`;
    if (diff <= -10) return `${diff}% below baseline`;
    return "At baseline";
  }

  private async loadBiometricData(): Promise<void> {
    const { token, provider } = this.plugin.settings;
    if (!token) return;

    try {
      this.biometricData = await fetchBiometricData(token, provider);
      if (this.moodScore) {
        await this.updateMoodAnalysis();
      }
      await this.refresh();
    } catch (error) {
      console.error("Failed to load biometric data:", error);
    }
  }

  private async updateMoodAnalysis(): Promise<void> {
    if (!this.moodScore || !this.biometricData) return;

    this.moodDecision = getMoodDecision(this.biometricData, this.moodScore);
  }

  async onClose(): Promise<void> {
    // Cleanup
  }
}
