/**
 * Platform Adapters Export
 *
 * Central export for all platform adapters
 * Each platform gets a thin adapter for input/output conversion
 */

export { BaseAdapter } from "./types";
export type {
  PlatformAdapter,
  TelegramContext,
  DiscordInteraction,
  SlackEvent,
  SlackClient,
  WebRequest,
  CLIArgs,
  RaycastListItem,
  VSCodeQuickPickItem,
  MenuBarItem,
  WhatsAppMessage,
} from "./types";

// Telegram Adapter
export { TelegramAdapter, createTelegramAdapter } from "./telegram.adapter";

// CLI Adapter
export { CLIAdapter, createCLIAdapter } from "./cli.adapter";

// Placeholder exports for future adapters
// These will be implemented in subsequent phases

/**
 * Discord Adapter (Phase 2)
 * export { DiscordAdapter, createDiscordAdapter } from "./discord.adapter";
 */

/**
 * Slack Adapter (Phase 4)
 * export { SlackAdapter, createSlackAdapter } from "./slack.adapter";
 */

/**
 * Web Adapter (Phase 2)
 * export { WebAdapter, createWebAdapter } from "./web.adapter";
 */

/**
 * Raycast Adapter (Phase 4)
 * export { RaycastAdapter, createRaycastAdapter } from "./raycast.adapter";
 */

/**
 * VS Code Adapter (Phase 4)
 * export { VSCodeAdapter, createVSCodeAdapter } from "./vscode.adapter";
 */

/**
 * Menu Bar Adapter (Phase 4)
 * export { MenuBarAdapter, createMenuBarAdapter } from "./menubar.adapter";
 */

/**
 * WhatsApp Adapter (Phase 4)
 * export { WhatsAppAdapter, createWhatsAppAdapter } from "./whatsapp.adapter";
 */
