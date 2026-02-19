/**
 * OpenClaw Hub Types
 *
 * Unified message types for all platforms (Telegram, CLI, Discord, Web, etc)
 * Provides a single interface for routing, context enrichment, and response formatting
 */

// ============================================
// Platform Types
// ============================================

export type PlatformType =
  | "telegram"
  | "cli"
  | "discord"
  | "slack"
  | "web"
  | "raycast"
  | "vscode"
  | "menubar"
  | "whatsapp";

export type MessageType = "query" | "command" | "log" | "feedback";

// ============================================
// Unified Message (Platform-Agnostic)
// ============================================

export interface UnifiedMessage {
  // Unique identifier for idempotency
  id: string;
  platform: PlatformType;
  timestamp: Date;

  // User context
  userId: string;
  userDevice?: string; // "iphone", "macos", "web", etc

  // Message content
  type: MessageType;
  question?: string; // Main question for /ask
  command?: string; // Command name (e.g., "drink", "workout", "why")
  metadata?: Record<string, unknown>;

  // Platform-specific context
  platformContext: PlatformContext;
}

export interface PlatformContext {
  // Where the message came from
  sourceId: string; // ChatID, userID, channel ID, etc
  sourceName?: string; // Telegram chat title, Discord server name

  // Device + capability signals
  features: PlatformFeatures;
}

export interface PlatformFeatures {
  supportsEmbed: boolean; // Can show formatted responses (HTML/Markdown/Rich)
  supportsInteractive: boolean; // Can show buttons/selections/forms
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsReactions: boolean; // Emoji reactions, thumbs up, etc
  maxMessageLength: number;
  preferredFormat: "text" | "markdown" | "html" | "json";
}

// ============================================
// Platform Output
// ============================================

export interface PlatformOutput {
  // Primary response (always required)
  text: string;

  // Platform-specific formatted response (optional)
  formatted?: FormattedResponse;

  // Interactive elements (buttons, select, etc)
  interactive?: InteractiveElement[];

  // Delivery options
  shouldNotify?: boolean;
  ttl?: number; // Time-to-live for cached responses (seconds)
}

export interface FormattedResponse {
  platform: PlatformType;
  // Platform-specific native data
  // For Telegram: HTML string
  // For Discord: EmbedBuilder
  // For Slack: BlockKit JSON
  // For Web: Component structure
  native: unknown;
}

export interface InteractiveElement {
  type: "button" | "select" | "input" | "confirmation";
  id?: string; // Unique ID for callback
  label: string;
  value?: string;
  action?: "callback" | "follow_up_question" | "log_decision";
  description?: string;
  style?: "primary" | "secondary" | "danger";
}

// ============================================
// Route Decision
// ============================================

export interface RouteDecision {
  type: "ask_query" | "domain_command" | "settings" | "help" | "invalid";
  routes?: string[]; // From matchRoutes()
  domain?: string; // For domain commands
  priority?: "urgent" | "normal" | "low";
}

// ============================================
// Context Enrichment
// ============================================

export interface EnrichedMessage extends UnifiedMessage {
  metadata: Record<string, unknown> & {
    dayOfWeek?: string;
    timeOfDay?: string;
    userTimezone?: string;
    deviceType?: string;
    previousQuestionsToday?: number;
  };
  userProfile?: UserProfile;
  userPreferences?: UserPreferences;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  timezone?: string;
  language?: string;
  createdAt?: Date;
  lastActiveAt?: Date;
}

export interface UserPreferences {
  userId: string;
  timezone: string;
  language: string;
  responseFormat: "text" | "markdown" | "html" | "json";
  platformPermissions?: Record<PlatformType, boolean>;
  deviceFingerprints?: DeviceFingerprint[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeviceFingerprint {
  id: string;
  platform: PlatformType;
  deviceType: string;
  deviceName?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isTrusted: boolean;
}

// ============================================
// Adapter Interface
// ============================================

export interface PlatformAdapter {
  // Inbound: Convert platform-specific input → UnifiedMessage
  parseInput(platformMessage: unknown): Promise<UnifiedMessage>;

  // Outbound: Convert PlatformOutput → platform-specific format
  formatOutput(result: PlatformOutput): Promise<unknown>;

  // Metadata
  getPlatformContext(): PlatformContext;
  getPlatformType(): PlatformType;
  getMaxMessageLength(): number;
  supportsInteractive(): boolean;
}

// ============================================
// Middleware Context
// ============================================

export interface MiddlewareContext {
  unified: UnifiedMessage;
  userId: string;
  platform: PlatformType;
  timestamp: Date;
  metadata: Record<string, unknown>;
  next?: () => Promise<void>;
}

export interface AuthContext extends MiddlewareContext {
  isAuthenticated: boolean;
  token?: string;
  error?: string;
}

export interface RateLimitContext extends MiddlewareContext {
  allowedQueries: number;
  remainingQueries: number;
  resetAt: Date;
  isRateLimited: boolean;
}

// ============================================
// Activity/Event Logging
// ============================================

export interface DecisionLog {
  id: string;
  userId: string;
  platform: PlatformType;
  device?: string;
  sourceId: string;
  question: string;
  answer: string;
  verdict?: string;
  options?: Array<{ label: string; impact: string }>;
  timestamp: Date;
  responseTimeMs?: number;
  biometricScore?: number;
  userFollowedAdvice?: boolean;
  followUpData?: {
    outcomeRecordedAt?: Date;
    actualReadinessDelta?: number;
  };
}

// ============================================
// Hub Configuration
// ============================================

export interface OpenClawConfig {
  // Redis/Cache settings
  enableCache?: boolean;
  cacheTTL?: number; // seconds

  // Rate limiting
  enableRateLimit?: boolean;
  rateLimit?: {
    queriesPerMinute?: number;
    queriesPerHour?: number;
  };

  // Logging
  enableActivityLogging?: boolean;
  logAllRequests?: boolean;

  // Claude settings
  claudeModel?: string;
  claudeMaxTokens?: number;

  // Supabase
  supabaseUrl?: string;
  supabaseKey?: string;
}
