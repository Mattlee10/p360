# OpenClaw Hub

Unified platform router for p360. Normalizes input from all channels and routes through the p360 core intelligence engine.

## Overview

OpenClaw Hub sits between user-facing platforms (Telegram, CLI, Discord, Web, etc) and the p360 core algorithm. It handles:

1. **Input Normalization**: Convert platform-specific message formats to `UnifiedMessage`
2. **Routing**: Determine how to handle each message type (ask query, command, feedback, etc)
3. **Context Enrichment**: Add user profile, preferences, device context
4. **Intelligence**: Call p360 core (`buildAdvisorContext`) to prepare Claude system prompt
5. **Response Formatting**: Convert Claude's `NudgeResponse` to platform-specific output
6. **Activity Logging**: Capture decisions for causality analysis

## Architecture

```
User Input (Telegram/CLI/Discord/Web)
         ↓
  [Platform Adapter] → UnifiedMessage
         ↓
  [OpenClaw Router] → RouteDecision
         ↓
  [p360 Core] → AdvisorContext (system prompt + analysis)
         ↓
  [Claude API] → NudgeResponse
         ↓
  [Response Formatter] → PlatformOutput
         ↓
  [Platform Adapter] → Platform-specific format
         ↓
User Output (Telegram HTML/CLI text/Discord embed)
```

## Quick Start

### Installation

```bash
npm install @p360/openclaw
```

### Basic Usage

#### Telegram

```typescript
import { createTelegramAdapter, openClawRouter, responseFormatter } from "@p360/openclaw";
import { prepareAsk, processAskResponse } from "@p360/core";
import { Anthropic } from "anthropic";

// In your Telegram handler
async function handleAsk(ctx: Context) {
  // 1. Parse input
  const adapter = createTelegramAdapter(ctx);
  const unified = await adapter.parseInput();

  // 2. Route decision
  const route = openClawRouter.routeMessage(unified);

  // 3. Get biometric data
  const biometricData = await getUserBiometricData(unified.userId);

  // 4. Build Claude context
  const advisorContext = openClawRouter.buildAdvisorContext(
    unified.question || "",
    biometricData,
  );

  // 5. Call Claude
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    system: advisorContext.systemPrompt,
    messages: [{ role: "user", content: unified.question || "" }],
  });

  // 6. Process response
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const nudgeResponse = JSON.parse(text) as NudgeResponse;

  // 7. Format for platform
  const output = await responseFormatter.format(
    nudgeResponse,
    unified.platformContext,
  );

  // 8. Send response
  await adapter.formatOutput(output);
}
```

#### CLI

```typescript
import { createCLIAdapter, openClawRouter, responseFormatter } from "@p360/openclaw";

async function handleCLI(args: string[]) {
  // 1. Parse CLI args
  const adapter = createCLIAdapter(args, "cli-user", true);
  const unified = await adapter.parseInput();

  // 2-8. Same as Telegram example above
}
```

## Platform Adapters

### Implemented (Phase 1)

- **Telegram** (`createTelegramAdapter`) - Supports HTML formatting, inline buttons
- **CLI** (`createCLIAdapter`) - Supports ANSI colors, markdown

### Planned (Phase 2-4)

- Discord (rich embeds, reactions)
- Web/API (JSON responses)
- Slack (block kit formatting)
- Raycast (list/form UI)
- VS Code (quick pick)
- macOS Menu Bar
- WhatsApp

## Core Components

### Router

```typescript
const router = new OpenClawRouter(config);
const route = router.routeMessage(unifiedMessage);
const context = router.buildAdvisorContext(question, biometrics, profile);
```

### Response Formatter

```typescript
const formatter = new ResponseFormatter();
const output = await formatter.format(nudge, platformContext);
```

### Platform Features Detection

Each platform declares its capabilities:

```typescript
interface PlatformFeatures {
  supportsEmbed: boolean;      // Rich formatting
  supportsInteractive: boolean; // Buttons, selects
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsReactions: boolean;
  maxMessageLength: number;
  preferredFormat: "text" | "markdown" | "html" | "json";
}
```

## Data Flow

### Input Message Normalization

Every platform message becomes a `UnifiedMessage`:

```typescript
interface UnifiedMessage {
  id: string;              // Unique message ID
  platform: PlatformType;  // "telegram", "cli", "discord", etc
  userId: string;          // Normalized user ID
  question?: string;       // Main question text
  command?: string;        // Command if applicable
  platformContext: {       // Platform-specific metadata
    sourceId: string;
    sourceName?: string;
    features: PlatformFeatures;
  };
}
```

### Route Decisions

Each message gets routed to:

- **ask_query**: General questions (routes to Claude + p360 core)
- **domain_command**: Explicit command ("drink", "workout", etc)
- **settings**: User preferences/config
- **help**: Documentation
- **invalid**: Unrecognized input

### Response Formatting

`NudgeResponse` from Claude becomes `PlatformOutput`:

```typescript
interface PlatformOutput {
  text: string;                    // Plain text (always)
  formatted?: FormattedResponse;   // Platform-specific (optional)
  interactive?: InteractiveElement[]; // Buttons, etc (optional)
}
```

The formatter automatically:
- Handles HTML for Telegram
- Converts to markdown for Discord/Slack
- Creates JSON for Web API
- Adds ANSI colors for CLI

## Configuration

```typescript
const router = new OpenClawRouter({
  enableCache: true,
  cacheTTL: 3600,
  enableRateLimit: true,
  enableActivityLogging: true,
  claudeModel: "claude-sonnet-4-5-20250929",
  claudeMaxTokens: 1024,
});
```

## Testing Adapters

Each adapter can be tested independently:

```typescript
// Telegram
const ctx = { message: { text: "should i drink?" }, from: { id: 123 }, ...};
const adapter = createTelegramAdapter(ctx);
const unified = await adapter.parseInput();
assert(unified.question === "should i drink?");

// CLI
const adapter = createCLIAdapter(["should", "i", "drink?"], "test-user");
const unified = await adapter.parseInput();
assert(unified.question === "should i drink?");
```

## Middleware (Phase 3)

Future middleware layers:

- **Auth**: Verify user tokens
- **RateLimit**: Prevent abuse
- **Logging**: Request/response tracking
- **Context**: Inject user preferences

## Activity Logging (Phase 3)

Capture all decisions:

```typescript
interface DecisionLog {
  userId: string;
  platform: PlatformType;
  question: string;
  answer: string;
  timestamp: Date;
  userFollowedAdvice?: boolean;
}
```

Used for causality analysis: "When user takes advice to avoid alcohol, recovery improves by X%"

## Best Practices

1. **Always call `parseInput()` first** - Ensures message is normalized
2. **Route before processing** - Determines handling strategy
3. **Enrich context with biometrics** - Needed for Claude prompts
4. **Format response for platform** - Don't send HTML to CLI
5. **Log decisions for causality** - Build personal patterns over time

## Future Roadmap

### Phase 1 (Now): Foundation
- ✅ OpenClaw Hub core + Router
- ✅ Telegram + CLI adapters
- ✅ Response formatter

### Phase 2: Expansion
- Discord, Web, Raycast adapters
- Context enricher (time, timezone, etc)

### Phase 3: Intelligence
- Activity logger (auto-collect causality data)
- Middleware (auth, rate limit, logging)

### Phase 4: Scale
- Slack, VS Code, Menu Bar, WhatsApp adapters
- Prompt caching for cost optimization
- Multi-language support

## Contributing

Add a new platform adapter:

1. Create `src/adapters/[platform].adapter.ts`
2. Extend `BaseAdapter`
3. Implement `parseInput()` and `formatOutput()`
4. Export in `src/adapters/index.ts`
5. Add tests in `__tests__/adapters/[platform].test.ts`

## License

MIT
