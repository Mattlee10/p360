/**
 * OpenClaw Hub
 *
 * Unified platform router for p360
 * Normalizes input from all channels (Telegram, CLI, Discord, Web, etc)
 * Routes through Claude for intelligence
 * Formats responses for each platform
 */

// ============================================
// Types
// ============================================

export type {
  UnifiedMessage,
  PlatformContext,
  PlatformFeatures,
  PlatformOutput,
  FormattedResponse,
  InteractiveElement,
  PlatformType,
  MessageType,
  RouteDecision,
  EnrichedMessage,
  UserProfile,
  UserPreferences,
  DeviceFingerprint,
  PlatformAdapter,
  MiddlewareContext,
  AuthContext,
  RateLimitContext,
  DecisionLog,
  OpenClawConfig,
} from "./types";

// ============================================
// Router
// ============================================

export { OpenClawRouter, openClawRouter } from "./router";
export type { RouteDecision } from "./types";

// ============================================
// Response Formatter
// ============================================

export { ResponseFormatter, responseFormatter } from "./response-formatter";

// ============================================
// Platform Adapters
// ============================================

export * from "./adapters";
export {
  TelegramAdapter,
  createTelegramAdapter,
  CLIAdapter,
  createCLIAdapter,
} from "./adapters";

// ============================================
// Middleware (will be implemented in Phase 3)
// ============================================

// Placeholder for middleware exports
// export { AuthMiddleware, RateLimitMiddleware, LoggingMiddleware } from "./middleware";

// ============================================
// Activity Logger (will be implemented in Phase 3)
// ============================================

// Placeholder for activity logger
// export { ActivityLogger, DecisionLogger } from "./activity-logger";

// ============================================
// Context Enricher (will be implemented in Phase 3)
// ============================================

// Placeholder for context enricher
// export { ContextEnricher } from "./context-enricher";
