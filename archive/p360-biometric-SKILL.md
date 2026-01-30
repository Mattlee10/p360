---
name: p360-biometric
description: P360 - Real-time Bio-data Driven Decision Support Solution for Bio-hackers and High-performers
version: 1.0
author: P360 Team
---

# P360 Project Skill

## 🎯 Core Identity

**One-line pitch:**
"Real-time Bio-data Driven Decision Support Solution"

**Target:**
Bio-hackers × High-performers (영어권)

**Method:**
- Biometrics (HRV, Sleep, Stress)
- SW Embedding (API-first, 다른 서비스에 임베딩 가능)

**Mission:**
Make better decisions by listening to your body's signals in real-time.

---

## 👥 Target Users

### Primary: Bio-hacker × High-performer
```
Profile:
- Age: 25-45
- Income: $75K+/year
- Location: US, UK, Canada, Australia
- Devices: Oura Ring, Whoop, Apple Watch
- Behavior: Tracks everything, optimizes constantly
- Values: Data > intuition, Science > trends
- Pain: "I know I should track more, but what do I do with the data?"
- Goal: Peak performance in work & life

Psychographics:
- Reads: Huberman Lab, Tim Ferriss, Bryan Johnson
- Uses: Superhuman, Linear, Arc Browser, Notion
- Communities: r/Biohackers, r/QuantifiedSelf
- Willing to pay: $10-30/month for real value

Current behavior:
- Checks Oura app daily
- Has spreadsheets of data
- Doesn't know when to make important decisions
- Sometimes makes bad decisions when tired/stressed
```

### Secondary Targets (Phase 2+)
1. **ADHD individuals** - decision timing is critical
2. **Day traders** - emotional control needed
3. **Executives** - high-stakes decision makers

---

## 💡 Core Problem & Solution

### Problem Statement
**"High-performers have all the biometric data, but don't know what to DO with it in the moment."**

Specific pain points:
- Makes impulse purchases when HRV is low
- Sends angry emails when stressed
- Schedules important meetings at wrong times
- Can't tell if tired feeling is "real" or just mental

### Our Solution
**Real-time decision support powered by biometric data.**

Key differentiation:
1. **Real-time** - Not weekly reports, but instant feedback
2. **Actionable** - Not just "your HRV is 45", but "Wait 3 hours to decide"
3. **Embeddable** - Can integrate into other tools (calendar, email, shopping)
4. **Privacy-first** - Your data stays yours, never sold

### Value Proposition
"Your body knows when you're ready for important decisions. We just translate the signal."

---

## 🏗️ Tech Stack (Recommended)

### Frontend
```
Framework: React 18+ with Vite
  - Why: Fast, modern, great ecosystem
  - Alternative: Next.js if need SSR later
  
Styling: Tailwind CSS
  - Why: Fast prototyping, consistent design
  - Plus: shadcn/ui for beautiful components
  
Language: TypeScript
  - Why: Better for scaling, fewer bugs
  - Start: Can begin with JavaScript, migrate later
  
State Management:
  - React Query (server state)
  - Zustand (client state, only if needed)
  
Routing: React Router v6
```

### Backend & Database
```
Platform: Supabase (Recommended)
  - Database: PostgreSQL
  - Auth: Built-in OAuth (Oura, Google, etc)
  - Realtime: WebSocket subscriptions
  - Edge Functions: Serverless functions
  - Storage: File storage if needed
  - Why: All-in-one, great DX, generous free tier

Alternative: Firebase (if prefer Google ecosystem)
```

### APIs & Integrations
```
Primary: Oura API v2
  - Most popular in target market
  - Clean API, good docs
  - OAuth 2.0

Phase 2: 
  - Whoop API
  - Apple Health (HealthKit)
  - Garmin Connect

Embedding targets (Phase 3):
  - Google Calendar
  - Gmail
  - Notion
  - Slack
```

### Infrastructure
```
Hosting: Vercel
  - Why: Zero config, fast, great DX
  - Auto preview deploys
  - Edge network

Analytics: 
  - PostHog (product analytics + feature flags)
  - Or: Plausible (privacy-friendly, simpler)

Error Tracking: Sentry

Payments: Stripe
  - Standard for SaaS
  - Great docs, easy integration
```

### Development Tools
```
Package Manager: pnpm
  - Why: Faster than npm, saves disk space
  
Version Control: Git + GitHub
  - GitHub Actions for CI/CD

Code Quality:
  - ESLint + Prettier (formatting)
  - Husky (git hooks)
  - lint-staged (only lint changed files)

Testing (Phase 2):
  - Vitest (unit tests)
  - Playwright (E2E tests)
```

---

## 🎨 Design System

### Visual Identity: Navy Professional

**Color Palette:**
```css
/* Primary - Navy Blue (Professional, Trust) */
--primary-50: #EFF6FF;
--primary-100: #DBEAFE;
--primary-200: #BFDBFE;
--primary-300: #93C5FD;
--primary-400: #60A5FA;
--primary-500: #3B82F6;  /* Main brand color */
--primary-600: #2563EB;  /* Hover states */
--primary-700: #1E40AF;  /* Active states */
--primary-800: #1E3A8A;
--primary-900: #1E293B;  /* Dark navy for text */

/* Status Colors (Biometric Indicators) */
--status-excellent: #10B981; /* Green - optimal state */
--status-good: #3B82F6;      /* Blue - good state */
--status-caution: #F59E0B;   /* Amber - suboptimal */
--status-poor: #EF4444;      /* Red - not recommended */

/* Neutrals (Dark Mode First) */
--bg-dark: #0F172A;          /* Slate-900 */
--bg-dark-elevated: #1E293B; /* Slate-800 */
--bg-light: #F8FAFC;         /* Slate-50 */
--bg-light-elevated: #FFFFFF;

--text-dark-primary: #F1F5F9;   /* Slate-100 */
--text-dark-secondary: #94A3B8; /* Slate-400 */
--text-light-primary: #0F172A;  /* Slate-900 */
--text-light-secondary: #64748B; /* Slate-500 */

/* Accents */
--accent-purple: #8B5CF6;    /* For special features */
--accent-teal: #14B8A6;      /* For positive actions */
```

**Typography:**
```css
/* Display/Headings: Inter Variable */
/* - Clean, professional, excellent legibility */
/* - But customized with tighter letter-spacing */
font-family: 'Inter Variable', system-ui, sans-serif;

/* Body: Inter Variable */
/* - Same family for consistency */

/* Monospace (for data/numbers): JetBrains Mono */
/* - Used for HRV scores, timestamps, technical data */
font-family: 'JetBrains Mono', monospace;

/* Font Sizes (Tailwind scale) */
h1: text-4xl (36px)
h2: text-3xl (30px)
h3: text-2xl (24px)
h4: text-xl (20px)
body: text-base (16px)
small: text-sm (14px)
tiny: text-xs (12px)
```

**Design Aesthetic:**
```
Style: Data-Driven Professional
Inspiration: Linear + Stripe Dashboard + Superhuman

Characteristics:
- Clean, uncluttered layouts
- Generous whitespace
- Card-based information architecture
- Subtle shadows and depth
- Smooth, purposeful animations
- Data visualization emphasis
- Dark mode as default
- Professional but not boring

Avoid:
- Playful illustrations (too casual)
- Bright neon colors (unprofessional)
- Heavy gradients (dated)
- Cluttered dashboards (overwhelming)
```

**Component Style Guide:**
```
Cards:
- Rounded corners (rounded-lg = 8px)
- Subtle border or shadow
- Hover state with slight elevation
- Dark: bg-slate-800 with slate-700 border
- Light: white with slate-200 border

Buttons:
Primary: Navy blue, white text, medium shadow
Secondary: Transparent, navy border, navy text
Destructive: Red background
Ghost: No background, hover shows background

Data Display:
- Large numbers in JetBrains Mono
- Status indicators (colored dots or badges)
- Sparklines for trends
- Minimal but clear labels

Forms:
- Clean, spacious inputs
- Inline validation
- Helpful error messages
- Auto-save where possible
```

**Spacing System:**
```
Use Tailwind's default scale (4px base):
- Tight: 2, 4 (0.5rem, 1rem)
- Normal: 4, 6, 8 (1rem, 1.5rem, 2rem)
- Loose: 12, 16, 20 (3rem, 4rem, 5rem)

Component padding: p-6 (1.5rem)
Section spacing: space-y-8 (2rem)
Page margins: px-4 md:px-8 lg:px-12
```

**Animations:**
```
Philosophy: Smooth but fast
Duration: 150-200ms for most interactions
Easing: ease-in-out

Use for:
- Page transitions (fade)
- Card hover states (subtle lift)
- Loading states (skeleton screens)
- Status changes (smooth color transitions)
- Toasts/notifications (slide in)

Avoid:
- Bouncy animations (unprofessional)
- Long durations (feels slow)
- Too many simultaneous animations (chaotic)
```

---

## 💻 Code Patterns & Architecture

### Project Structure
```
p360/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── biometrics/      # Biometric display components
│   │   │   ├── HRVCard.tsx
│   │   │   ├── SleepScore.tsx
│   │   │   └── DecisionReadiness.tsx
│   │   ├── decisions/       # Decision-related
│   │   │   ├── DecisionLog.tsx
│   │   │   └── NudgeCard.tsx
│   │   └── layout/          # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   ├── Connect.tsx      # OAuth connections
│   │   └── Pricing.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useOuraData.ts
│   │   ├── useDecisionScore.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── oura.ts          # Oura API wrapper
│   │   ├── algorithms.ts    # Decision algorithms
│   │   └── utils.ts         # Utilities
│   ├── types/               # TypeScript types
│   │   ├── oura.ts
│   │   ├── database.ts
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css      # Tailwind + custom CSS
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── public/
│   └── assets/
└── package.json
```

### Component Patterns

**Example: HRV Card Component**
```tsx
// src/components/biometrics/HRVCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOuraData } from '@/hooks/useOuraData';
import { calculateDecisionScore } from '@/lib/algorithms';

interface HRVCardProps {
  userId: string;
  showDetails?: boolean;
}

export function HRVCard({ userId, showDetails = false }: HRVCardProps) {
  // Data fetching with React Query
  const { data, isLoading, error } = useOuraData(userId, 'latest');
  
  if (isLoading) {
    return <CardSkeleton />;
  }
  
  if (error) {
    return <ErrorCard message="Failed to load HRV data" />;
  }
  
  // Calculate decision readiness
  const score = calculateDecisionScore(data.hrv, data.sleep);
  const status = getStatusFromScore(score);
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIndicator status={status} />
          Heart Rate Variability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Large HRV number */}
          <div className="text-center">
            <p className="text-5xl font-mono font-bold text-primary-600">
              {data.hrv}
            </p>
            <p className="text-sm text-slate-500 mt-1">ms (RMSSD)</p>
          </div>
          
          {/* Decision readiness */}
          <div className={`p-4 rounded-lg ${getStatusBg(status)}`}>
            <p className="font-medium">{getStatusMessage(status)}</p>
          </div>
          
          {/* Details (optional) */}
          {showDetails && (
            <div className="text-sm text-slate-600 space-y-1">
              <p>7-day average: {data.hrvAvg}</p>
              <p>Last updated: {formatTime(data.timestamp)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getStatusFromScore(score: number): Status {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'caution';
  return 'poor';
}

function getStatusMessage(status: Status): string {
  const messages = {
    excellent: '✅ Great time for important decisions',
    good: '👍 Good state for most decisions',
    caution: '⚠️ Consider waiting for big decisions',
    poor: '❌ Not recommended for major decisions'
  };
  return messages[status];
}

function getStatusBg(status: Status): string {
  const styles = {
    excellent: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    good: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    caution: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    poor: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  };
  return styles[status];
}
```

### API Integration Pattern

**Oura API Wrapper:**
```typescript
// src/lib/oura.ts

import { createClient } from '@supabase/supabase-js';

export class OuraClient {
  private accessToken: string;
  
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
  
  async getLatestHRV() {
    const response = await fetch(
      'https://api.ouraring.com/v2/usercollection/daily_sleep',
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Oura data');
    }
    
    const data = await response.json();
    return this.parseHRVData(data);
  }
  
  private parseHRVData(rawData: any) {
    // Transform Oura API response to our format
    return {
      hrv: rawData.data[0].heart_rate.average_hrv,
      timestamp: rawData.data[0].day,
      // ... more fields
    };
  }
}

// React Query hook wrapper
export function useOuraData(userId: string, type: 'latest' | 'week') {
  return useQuery({
    queryKey: ['oura', userId, type],
    queryFn: async () => {
      // Get access token from Supabase
      const { data: tokenData } = await supabase
        .from('oura_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      
      const client = new OuraClient(tokenData.access_token);
      return type === 'latest' 
        ? await client.getLatestHRV()
        : await client.getWeekHRV();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}
```

### Database Schema

**Core Tables:**
```sql
-- Users (handled by Supabase Auth)

-- Oura connections
CREATE TABLE oura_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id)
);

-- Biometric data cache (for faster access)
CREATE TABLE biometric_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  hrv integer,
  sleep_score integer,
  resting_hr integer,
  readiness_score integer,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Decision logs (for tracking and learning)
CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  decision_type text,
  body_score integer NOT NULL, -- 0-100
  action_taken text CHECK (action_taken IN ('proceed', 'wait', 'skip')),
  outcome text, -- User can log how it went
  notes text,
  created_at timestamp DEFAULT now()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  hrv_threshold integer DEFAULT 50,
  notification_enabled boolean DEFAULT true,
  timezone text DEFAULT 'UTC',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE oura_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users manage own tokens" ON oura_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own biometric data" ON biometric_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own decisions" ON decisions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🚀 MVP Scope & Roadmap

### MVP v0.1 (Week 4-8) - "Proof of Concept"

**Must Have:**
```
□ User Authentication
  - Email/password sign up
  - Google OAuth (easier onboarding)
  
□ Oura Connection
  - OAuth flow
  - Store tokens securely
  - Handle token refresh
  
□ Dashboard
  - Show latest HRV (last night)
  - Show sleep score
  - Display decision readiness score (0-100)
  - Simple, clean layout
  
□ Decision Algorithm v1
  - Simple threshold-based
  - HRV < 50 = "Wait"
  - HRV >= 50 = "Good to go"
  - Consider sleep score too
  
□ Basic Settings
  - Connect/disconnect Oura
  - Dark/light mode toggle
  - Adjust HRV threshold (advanced users)
```

**Success Metrics:**
```
- 5 beta users can connect Oura
- Can see their HRV and get recommendation
- Works on mobile web
```

### v0.2 (Week 9-12) - "Beta Launch"

**Add:**
```
□ Historical View
  - 7-day HRV trend chart
  - Pattern recognition (morning person?)
  
□ Decision Log
  - Log when you made important decision
  - Track: did you follow the recommendation?
  - Outcome: how did it go?
  
□ Notifications
  - Email: "Your HRV recovered, good time to decide"
  
□ Improved Algorithm
  - Multi-factor (HRV + sleep + resting HR)
  - Personalized thresholds (learn from user)
```

**Success Metrics:**
```
- 30 beta users
- 20 active (using weekly)
- 7-day retention: 50%+
```

### v0.3 (Month 4-6) - "Public Launch"

**Add:**
```
□ Freemium Model
  - Free: Basic dashboard
  - Pro $9.99/mo: Historical data, predictions
  
□ Product Hunt Launch
  - Landing page redesign
  - Demo video
  - Press kit
  
□ Calendar Integration (Phase 1)
  - Show best meeting times
  
□ Chrome Extension (Phase 1)
  - Quick check HRV from toolbar
```

**Success Metrics:**
```
- 500 sign-ups (PH launch)
- 100 active users
- 30 paying users
- $300 MRR
```

### v1.0 (Month 7-12) - "Growth"

**Add:**
```
□ Whoop Integration
□ Mobile app (React Native or PWA)
□ API for embedding (beta)
□ Team features (for companies)
□ Advanced predictions (ML)
```

**Success Metrics:**
```
- $3-5K MRR
- 80% of target market knows P360
- B2B partnerships (2-3)
```

### Explicitly NOT Building (Yet)

```
❌ Social features (focus on individual first)
❌ Community/forum (too much to manage)
❌ Meditation/breathing exercises (stay focused)
❌ Food/supplement tracking (different product)
❌ Fitness tracking (Oura/Whoop do this)
❌ AI chatbot (not needed for MVP)
```

---

## 📊 Success Metrics & KPIs

### Development Phase
```
Week 4: Oura OAuth working
Week 6: Dashboard showing real data
Week 8: MVP deployed, 5 beta testers
```

### Beta Phase (Month 3-4)
```
Users:
- 30 sign-ups
- 20 connected Oura
- 10 weekly active

Engagement:
- Daily app opens: 2+
- Decision logs per week: 3+
- 7-day retention: 50%+
- 30-day retention: 30%+

Quality:
- Bug reports: <5 per week
- Response time: <2 seconds
- Uptime: 99%+
```

### Launch Phase (Month 4-6)
```
Acquisition:
- Product Hunt: Top 5
- Sign-ups: 500+
- Traffic: 5K visitors

Activation:
- Oura connection rate: 60%+
- Time to first value: <2 minutes

Retention:
- 7-day: 50%+
- 30-day: 30%+
- 90-day: 20%+

Revenue:
- Free → Paid: 10%+
- MRR: $300+
- Churn: <5% monthly

Referral:
- NPS: 40+
- Viral coefficient: 1.2+ (would be amazing)
```

### Growth Phase (Month 7-12)
```
Scale:
- 1,000 active users
- $5K MRR
- 2-3 B2B partnerships
- API users: 100+
```

---

## 🎯 Common Claude Prompts

### Starting New Feature
```
"Use p360-biometric skill.

I'm building [feature name].

Context: [brief context]
Requirements:
- [req 1]
- [req 2]
- [req 3]

Tech stack: React + TypeScript + Tailwind + Supabase
Design: Navy professional, data-driven

Generate complete code with:
1. Component code (TSX)
2. Types (TypeScript interfaces)
3. Supabase queries
4. Error handling
5. Loading states
6. Mobile responsive

Make it production-ready."
```

### Debugging
```
"Use p360-biometric skill.

Bug in [feature/file].

Expected: [what should happen]
Actual: [what happens]
Error: [error message if any]

Code:
[paste relevant code]

Environment:
- Browser: Chrome
- React version: 18.2
- Supabase: latest

Please debug and fix with explanation."
```

### Design/Styling
```
"Use p360-biometric skill.

I need to style [component name].

Requirements:
- Navy professional aesthetic
- Dark mode
- Responsive (mobile-first)
- [specific requirements]

Current code:
[paste component]

Generate Tailwind classes that match our design system."
```

### Database Schema
```
"Use p360-biometric skill.

I need to store [data type].

Requirements:
- [requirement 1]
- [requirement 2]

Generate:
1. PostgreSQL schema (CREATE TABLE)
2. RLS policies
3. TypeScript types
4. Supabase query examples

Follow our database patterns."
```

### Algorithm/Logic
```
"Use p360-biometric skill.

I need an algorithm to [goal].

Inputs:
- HRV: number
- Sleep score: number
- [other inputs]

Output:
- Decision readiness score (0-100)

Requirements:
- Simple, explainable
- No ML (for now)
- Based on research if possible

Generate TypeScript function with tests."
```

### Content Writing
```
"Use p360-biometric skill.

Write [type of content] for P360.

Purpose: [purpose]
Audience: Bio-hackers, high-performers
Tone: Professional, data-driven, trustworthy
Length: [length]

Key points:
- [point 1]
- [point 2]

Guidelines:
- Focus on outcomes, not features
- Use simple language
- Include data/research if relevant
- No hype or marketing speak"
```

---

## 🛠️ Development Workflow

### Local Setup
```bash
# Clone repo
git clone https://github.com/[your-username]/p360.git
cd p360

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and keys

# Start dev server
pnpm dev
# → http://localhost:5173

# In another terminal, start Supabase local (optional)
supabase start
supabase db reset
```

### Git Workflow
```bash
# Always work on feature branches
git checkout -b feature/decision-log

# Commit often with clear messages
git commit -m "Add decision logging functionality"
git commit -m "Add decision history view"
git commit -m "Add tests for decision log"

# Push and create PR
git push origin feature/decision-log
# → Create PR on GitHub
# → Wait for review/checks
# → Merge to main

# Main branch auto-deploys to Vercel
```

### Code Quality Checks
```bash
# Before committing
pnpm lint        # ESLint
pnpm format      # Prettier
pnpm typecheck   # TypeScript

# Husky runs these automatically on commit
```

### Deployment
```
Environment: Production
Main branch → Auto deploy to Vercel
URL: p360.vercel.app (or custom domain)

Environment Variables (set in Vercel):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- (Never commit these to Git)

Preview Deployments:
Every PR gets a preview URL
Test before merging
```

---

## 📚 Resources & References

### Documentation
- **Oura API**: https://cloud.ouraring.com/v2/docs
- **Supabase**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

### Design Inspiration
- **Linear**: Clean, fast, professional
- **Stripe Dashboard**: Data-heavy but elegant
- **Superhuman**: Attention to detail
- **Arc Browser**: Bold but usable

**What to copy:**
- Clean layouts
- Smooth interactions
- Professional color choices
- Data visualization approaches

**What NOT to copy:**
- Exact designs (be original)
- Their business model (ours is different)

### Research & Learning
- **HRV Science**: hrv4training.com/blog
- **Biohacking**: r/Biohackers, r/QuantifiedSelf
- **Product**: Lenny's Newsletter, First Round Review
- **Design**: Refactoring UI (book)

### Communities
- **r/Biohackers**: Target audience (300K members)
- **r/QuantifiedSelf**: Data nerds (50K members)
- **Indie Hackers**: Fellow founders
- **Product Hunt**: Launch platform

### Competitors (Learn from)
- **Whoop**: Great onboarding
- **Oura**: Beautiful data viz
- **Levels**: Excellent content marketing
- **HRV4Training**: Deep HRV knowledge

**Don't copy, differentiate:**
- They focus on long-term trends
- We focus on real-time decisions
- They're reports, we're tools
- They're general wellness, we're decision support

---

## 🚫 Anti-Patterns & Mistakes to Avoid

### Code
```typescript
// ❌ Don't
function getData(data: any) { return data.value; }
let globalState = {};
useEffect(() => { fetch(...) }, []);

// ✅ Do
function getData(data: OuraResponse): number { return data.hrv.value; }
const [state, setState] = useState<State>({});
const { data } = useQuery('key', fetcher);
```

### Design
```
❌ Don't:
- Use every color in the palette
- Add animations everywhere
- Copy competitors exactly
- Use Comic Sans (seriously)
- Ignore mobile users
- Overload with features

✅ Do:
- Stick to color system
- Animate purposefully
- Create unique identity
- Use professional fonts
- Mobile-first design
- Focus on core value
```

### Product
```
❌ Don't:
- Build features no one asked for
- Ignore user feedback
- Optimize prematurely
- Try to compete with Whoop/Oura directly
- Add social features too early
- Promise features you can't deliver

✅ Do:
- Talk to users constantly
- Ship fast, iterate faster
- Focus on one thing done well
- Differentiate clearly (decision support)
- Stay focused on individual first
- Under-promise, over-deliver
```

### Business
```
❌ Don't:
- Give equity away easily
- Raise money too early
- Ignore unit economics
- Discount heavily (devalues product)
- Compete on price (race to bottom)

✅ Do:
- Bootstrap as long as possible
- Know your numbers (CAC, LTV)
- Price for value, not cost
- Focus on retention over acquisition
- Build moat through data/embedding
```

---

## 🔄 Skill Maintenance

### Update Schedule
```
Weekly: Add new patterns as discovered
Monthly: Review and refine based on learnings
Quarterly: Major version update with new phase

Next update triggers:
- Tech stack changes
- Major feature additions
- Target market pivot
- Design system evolution
```

### Version History
```
v1.0 (2026-01-28): Initial complete version
  - Navy professional design system
  - Tech stack recommendations
  - Complete MVP scope
  - [Future updates logged here]
```

---

## 💡 Philosophy & Principles

### Product Philosophy
```
"Simple solutions to complex problems."

We believe:
1. Your body knows best
2. Data should lead to action, not just awareness
3. Privacy is non-negotiable
4. Simple is better than complex
5. Fast is better than perfect
```

### Development Philosophy
```
"Ship fast, learn faster."

Principles:
1. Build for users, not investors
2. Perfect is the enemy of shipped
3. Measure everything
4. Listen > Assume
5. Iterate > Big Bang
```

### Design Philosophy
```
"Professional simplicity."

Guidelines:
1. Form follows function
2. Every element has purpose
3. Data is beautiful
4. Consistency > Creativity
5. Accessibility is not optional
```

### Business Philosophy
```
"Sustainable growth over hockey sticks."

Values:
1. Profit > Valuation
2. Retention > Acquisition
3. Quality > Quantity
4. Long-term > Short-term
5. Independence > Dependency
```

---

## 🎯 Final Reminders

### For Claude
```
When using this skill:
1. Always reference "Use p360-biometric skill" at start
2. Follow design system strictly (navy professional)
3. Use recommended tech stack unless specified otherwise
4. Generate production-ready code (not pseudo-code)
5. Consider mobile-first always
6. Include error handling always
7. Ask for clarification if context unclear
```

### For Developer (You)
```
Success checklist:
□ Code is readable (future you will thank you)
□ Components are reusable
□ Everything is typed (TypeScript)
□ Mobile works perfectly
□ Dark mode works
□ Error states handled
□ Loading states smooth
□ Accessible (keyboard navigation, screen readers)

Before shipping:
□ Test on real mobile device
□ Test with real Oura data
□ Ask 3 people to try
□ Check performance (Lighthouse)
□ Review analytics setup
```

---

**END OF SKILL**

**Remember:**
This skill is your project's brain. Keep it updated as P360 evolves.
When in doubt, refer back to this skill.

**Next steps:**
1. Save this as `/mnt/skills/user/p360-biometric/SKILL.md`
2. Start every Claude conversation with "Use p360-biometric skill"
3. Build amazing things 🚀
