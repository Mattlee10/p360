/**
 * Platform Adapter Types and Base Implementation
 *
 * Each platform (Telegram, Discord, CLI, etc) gets a thin adapter that converts:
 * - Platform-specific input → UnifiedMessage
 * - PlatformOutput → Platform-specific format
 */

import type {
  UnifiedMessage,
  PlatformAdapter,
  PlatformContext,
  PlatformFeatures,
  PlatformType,
  PlatformOutput,
} from "../types";

// ============================================
// Base Adapter Class
// ============================================

export abstract class BaseAdapter implements PlatformAdapter {
  protected platformType: PlatformType;
  protected features: PlatformFeatures;
  protected maxMessageLength: number;

  constructor(
    platformType: PlatformType,
    features: PlatformFeatures,
    maxMessageLength: number = 2000,
  ) {
    this.platformType = platformType;
    this.features = features;
    this.maxMessageLength = maxMessageLength;
  }

  abstract parseInput(platformMessage: unknown): Promise<UnifiedMessage>;

  abstract formatOutput(result: PlatformOutput): Promise<unknown>;

  getPlatformContext(): PlatformContext {
    return {
      sourceId: this.getSourceId(),
      sourceName: this.getSourceName(),
      features: this.features,
    };
  }

  getPlatformType(): PlatformType {
    return this.platformType;
  }

  getMaxMessageLength(): number {
    return this.maxMessageLength;
  }

  supportsInteractive(): boolean {
    return this.features.supportsInteractive;
  }

  // Helper methods to be implemented by subclasses
  protected abstract getSourceId(): string;

  protected abstract getSourceName(): string | undefined;

  // Helper: Generate unique message ID
  protected generateMessageId(suffix: string = ""): string {
    return `${this.platformType}-${Date.now()}${suffix ? `-${suffix}` : ""}`;
  }

  // Helper: Extract user ID from platform message
  protected abstract extractUserId(): string;

  // Helper: Extract message text from platform message
  protected abstract extractText(): string;
}

// ============================================
// Telegram Adapter Export
// ============================================

export interface TelegramContext {
  message?: {
    text?: string;
  };
  from?: {
    id?: number;
    first_name?: string;
  };
  chat?: {
    id?: number;
    title?: string;
    type?: string;
  };
  reply?: (text: string, options?: unknown) => Promise<void>;
}

// ============================================
// Discord Adapter Export
// ============================================

export interface DiscordInteraction {
  user?: {
    id?: string;
    username?: string;
  };
  guildId?: string;
  channelId?: string;
  content?: string;
  reply?: (options: unknown) => Promise<void>;
  deferReply?: (options?: unknown) => Promise<void>;
  editReply?: (options: unknown) => Promise<void>;
}

// ============================================
// Slack Adapter Export
// ============================================

export interface SlackEvent {
  user?: string;
  channel?: string;
  text?: string;
  thread_ts?: string;
}

export interface SlackClient {
  chat?: {
    postMessage?: (args: unknown) => Promise<unknown>;
    update?: (args: unknown) => Promise<unknown>;
  };
  users?: {
    info?: (args: unknown) => Promise<unknown>;
  };
}

// ============================================
// Web Adapter Export
// ============================================

export interface WebRequest {
  userId: string;
  question: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// CLI Adapter Export
// ============================================

export interface CLIArgs {
  question: string;
  userId?: string;
  verbose?: boolean;
  format?: "text" | "json" | "markdown";
}

// ============================================
// Raycast Adapter Export
// ============================================

export interface RaycastListItem {
  title: string;
  subtitle?: string;
  icon?: unknown;
}

// ============================================
// VS Code Adapter Export
// ============================================

export interface VSCodeQuickPickItem {
  label: string;
  detail?: string;
  picked?: boolean;
}

// ============================================
// Menu Bar Adapter Export
// ============================================

export interface MenuBarItem {
  title: string;
  tooltip?: string;
  click?: () => void;
}

// ============================================
// WhatsApp Adapter Export
// ============================================

export interface WhatsAppMessage {
  from: string;
  text?: {
    body?: string;
  };
  media?: {
    image?: {
      url?: string;
    };
  };
}
