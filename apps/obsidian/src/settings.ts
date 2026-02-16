import { App, PluginSettingTab, Setting } from "obsidian";
import type P360Plugin from "./main";
import type { ProviderType } from "@p360/core";
import { validateToken, getProviderDisplayName } from "./lib/data";

export interface P360Settings {
  provider: ProviderType;
  token: string;
  autoInsertOnDailyNote: boolean;
  dailyNoteFormat: string;
}

export const DEFAULT_SETTINGS: P360Settings = {
  provider: "oura",
  token: "",
  autoInsertOnDailyNote: false,
  dailyNoteFormat: "YYYY-MM-DD",
};

export class P360SettingTab extends PluginSettingTab {
  plugin: P360Plugin;

  constructor(app: App, plugin: P360Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "P360 Settings" });

    // Provider selection
    new Setting(containerEl)
      .setName("Device")
      .setDesc("Select your wearable device")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("oura", "Oura Ring")
          .addOption("whoop", "WHOOP")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value: ProviderType) => {
            this.plugin.settings.provider = value;
            await this.plugin.saveSettings();
          })
      );

    // Token input
    new Setting(containerEl)
      .setName("Access Token")
      .setDesc("Your device access token")
      .addText((text) =>
        text
          .setPlaceholder("Enter your token")
          .setValue(this.plugin.settings.token)
          .onChange(async (value) => {
            this.plugin.settings.token = value;
            await this.plugin.saveSettings();
          })
      );

    // Validate button
    new Setting(containerEl)
      .setName("Validate Connection")
      .setDesc("Test if your token is working")
      .addButton((button) =>
        button.setButtonText("Test Connection").onClick(async () => {
          const { token, provider } = this.plugin.settings;
          if (!token) {
            new Notice("Please enter a token first");
            return;
          }

          button.setButtonText("Testing...");
          button.setDisabled(true);

          try {
            const isValid = await validateToken(token, provider);
            if (isValid) {
              new Notice(`✅ ${getProviderDisplayName(provider)} connected successfully!`);
            } else {
              new Notice(`❌ Token validation failed. Please check your token.`);
            }
          } catch (error) {
            new Notice(`❌ Error: ${error}`);
          } finally {
            button.setButtonText("Test Connection");
            button.setDisabled(false);
          }
        })
      );

    containerEl.createEl("h3", { text: "Daily Notes Integration" });

    // Auto insert toggle
    new Setting(containerEl)
      .setName("Auto-insert in Daily Notes")
      .setDesc("Automatically add biometric summary when creating daily notes")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoInsertOnDailyNote)
          .onChange(async (value) => {
            this.plugin.settings.autoInsertOnDailyNote = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "How to get your token" });

    const helpEl = containerEl.createEl("div", { cls: "setting-item-description" });

    helpEl.createEl("p", { text: "Oura Ring:" });
    const ouraSteps = helpEl.createEl("ol");
    ouraSteps.createEl("li", { text: "Go to cloud.ouraring.com" });
    ouraSteps.createEl("li", { text: "Navigate to Personal Access Tokens" });
    ouraSteps.createEl("li", { text: "Create a new token and copy it" });

    helpEl.createEl("p", { text: "WHOOP:" });
    const whoopSteps = helpEl.createEl("ol");
    whoopSteps.createEl("li", { text: "Go to developer.whoop.com" });
    whoopSteps.createEl("li", { text: "Create an application" });
    whoopSteps.createEl("li", { text: "Get your access token" });
  }
}

// Notice helper (imported from obsidian)
import { Notice } from "obsidian";
