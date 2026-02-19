/**
 * OpenClaw Hub Router
 *
 * Core orchestration logic:
 * 1. Route unified messages
 * 2. Enrich with context
 * 3. Call ask pipeline
 * 4. Format response for platform
 * 5. Log events
 */

import {
  buildAdvisorContext,
  type BiometricData,
  type CausalityProfile,
  type NudgeResponse,
} from "@p360/core";
import { responseFormatter } from "./response-formatter";
import type {
  UnifiedMessage,
  RouteDecision,
  PlatformOutput,
  OpenClawConfig,
} from "./types";

// ============================================
// Route Decision Logic
// ============================================

export class OpenClawRouter {
  private config: OpenClawConfig;

  constructor(config: OpenClawConfig = {}) {
    this.config = {
      enableCache: true,
      cacheTTL: 3600,
      enableRateLimit: true,
      enableActivityLogging: true,
      claudeModel: "claude-sonnet-4-5-20250929",
      claudeMaxTokens: 1024,
      ...config,
    };
  }

  /**
   * Main routing logic
   */
  routeMessage(message: UnifiedMessage): RouteDecision {
    const question = message.question?.toLowerCase() || "";
    const command = message.command?.toLowerCase() || "";

    // Route by explicit command
    if (command) {
      return this.routeByCommand(command);
    }

    // Route by question content
    return this.routeByContent(question);
  }

  /**
   * Route by explicit command
   */
  private routeByCommand(command: string): RouteDecision {
    // Domain commands
    if (["drink", "workout", "coffee", "tired", "why"].includes(command)) {
      return {
        type: "domain_command",
        domain: command,
        priority: "normal",
      };
    }

    // Settings commands
    if (["settings", "config", "preferences"].includes(command)) {
      return {
        type: "settings",
        priority: "normal",
      };
    }

    // Help commands
    if (["help", "info", "about"].includes(command)) {
      return {
        type: "help",
        priority: "normal",
      };
    }

    return {
      type: "invalid",
      priority: "low",
    };
  }

  /**
   * Route by question content
   */
  private routeByContent(question: string): RouteDecision {
    // Detect domain keywords
    const drinkKeywords = [
      "drink",
      "beer",
      "wine",
      "alcohol",
      "술",
      "맥주",
      "칵테일",
      "whiskey",
    ];
    if (drinkKeywords.some((kw) => question.includes(kw))) {
      return {
        type: "ask_query",
        routes: ["drink"],
        priority: "normal",
      };
    }

    const workoutKeywords = [
      "workout",
      "exercise",
      "gym",
      "운동",
      "train",
      "run",
      "swim",
    ];
    if (workoutKeywords.some((kw) => question.includes(kw))) {
      return {
        type: "ask_query",
        routes: ["workout"],
        priority: "normal",
      };
    }

    const coffeeKeywords = [
      "coffee",
      "caffeine",
      "커피",
      "카페인",
      "tea",
      "matcha",
    ];
    if (coffeeKeywords.some((kw) => question.includes(kw))) {
      return {
        type: "ask_query",
        routes: ["coffee"],
        priority: "normal",
      };
    }

    const tiredKeywords = [
      "tired",
      "fatigue",
      "exhausted",
      "피곤",
      "sleepy",
      "energy",
      "focus",
    ];
    if (tiredKeywords.some((kw) => question.includes(kw))) {
      return {
        type: "ask_query",
        routes: ["tired"],
        priority: "normal",
      };
    }

    // Default: general ask query
    return {
      type: "ask_query",
      routes: ["general"],
      priority: "normal",
    };
  }

  /**
   * Build advisor context for Claude
   */
  buildAdvisorContext(
    question: string,
    biometrics: BiometricData,
    profile?: CausalityProfile,
  ): {
    systemPrompt: string;
    analyses: Record<string, unknown>;
  } {
    const context = buildAdvisorContext(question, biometrics, profile);
    return {
      systemPrompt: context.systemPrompt,
      analyses: context.analyses,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): OpenClawConfig {
    return this.config;
  }

  /**
   * Check if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.config.enableCache ?? false;
  }

  /**
   * Check if rate limiting is enabled
   */
  isRateLimitEnabled(): boolean {
    return this.config.enableRateLimit ?? false;
  }

  /**
   * Check if activity logging is enabled
   */
  isActivityLoggingEnabled(): boolean {
    return this.config.enableActivityLogging ?? true;
  }

  /**
   * Get Claude model configuration
   */
  getClaudeConfig(): { model: string; maxTokens: number } {
    return {
      model: this.config.claudeModel || "claude-sonnet-4-5-20250929",
      maxTokens: this.config.claudeMaxTokens || 1024,
    };
  }
}

// ============================================
// Export Singleton
// ============================================

export const openClawRouter = new OpenClawRouter();
