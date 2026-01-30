# S1-E: 운동 Go/No-Go 구현 계획

> **Pain:** "오늘 쉬어야 하나, 밀어붙여야 하나?"
>
> **Solution:** 바이오 데이터 기반 운동 결정 지원

---

## 동시 빌드 전략

```
@p360/core (공유 알고리즘)
       ↓
   ┌───┴───┐
   ↓       ↓
 CLI    Telegram Bot
   ↓       ↓
HN/Dev  Biohackers
```

**핵심:** 같은 알고리즘, 다른 인터페이스, 다른 타겟

---

## Tool 1: CLI (p360-cli)

### 타겟 유저
- 개발자
- 터미널 파워유저
- Hacker News 독자

### 명령어

```bash
# 설치
npm install -g p360-cli

# 초기 설정 (Oura 연동)
p360 login

# 기본 체크
p360 workout
# Output:
# 🟡 TRAIN LIGHT
#
# Your readiness is 58 (below baseline).
# Pushing hard today = 60% chance of 3-day recovery.
#
# Recommendation:
# → Zone 2 cardio only (HR < 140)
# → Skip heavy lifting
# → Tomorrow looks better

# 상세 옵션
p360 workout --verbose    # 상세 데이터 포함
p360 workout --json       # JSON 출력 (자동화용)
```

### 디렉토리 구조

```
p360-cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── login.ts          # Oura OAuth
│   │   ├── workout.ts        # 운동 체크 (메인)
│   │   └── status.ts         # 일반 상태
│   ├── lib/
│   │   ├── oura.ts           # Oura API client
│   │   ├── config.ts         # 토큰 저장 (~/.p360)
│   │   └── display.ts        # 터미널 출력 포맷
│   └── core/                 # @p360/core 복사 또는 import
│       ├── algorithm.ts
│       └── types.ts
└── bin/
    └── p360                  # executable
```

### Build Time: 2-3일

---

## Tool 2: Telegram Bot (@p360bot)

### 타겟 유저
- Oura Ring 사용자
- Reddit r/Biohackers
- 비개발자 바이오해커

### 인터랙션

```
[Proactive - 아침 7시]
━━━━━━━━━━━━━━━━━━━━━━
🌅 Good morning!

Your readiness: 58
HRV: 12% below baseline
Sleep: 6.2h (Fair)

🟡 TODAY: Rest or Light Activity

Recommendation:
• Walking, yoga, stretching OK
• Skip gym / heavy cardio
• Push day tomorrow if recovered

Reply /why for details
━━━━━━━━━━━━━━━━━━━━━━

[On-demand - 사용자 질문]
👤: /workout

🤖: 🟢 TRAIN HARD

Readiness 78 • HRV +8% • Sleep 7.5h

You're recovered. Great day for:
• Heavy lifting
• HIIT / intervals
• Personal records

Go get it 💪

━━━━━━━━━━━━━━━━━━━━━━

[Follow-up]
👤: /why

🤖: Here's the breakdown:

📊 Your Numbers:
• Readiness: 78 (Good)
• HRV Balance: 58 (+8% vs baseline)
• Sleep Score: 82 (7.5h, Good efficiency)
• Resting HR: 52 (Normal)

🧠 Algorithm Logic:
Primary signal: Readiness 78 → Green zone
HRV confirms: Above baseline = recovered
No red flags in sleep contributors

This is a "push day" - your body can handle stress.
```

### 봇 명령어

| 명령어 | 설명 |
|--------|------|
| `/start` | 온보딩 + Oura 연동 |
| `/workout` | 운동 체크 (메인 기능) |
| `/status` | 전체 상태 요약 |
| `/why` | 마지막 판단 상세 설명 |
| `/settings` | 아침 알림 시간 설정 |
| `/disconnect` | Oura 연결 해제 |

### 디렉토리 구조

```
p360-telegram/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Bot entry point
│   ├── bot/
│   │   ├── handlers.ts       # 명령어 핸들러
│   │   ├── messages.ts       # 메시지 템플릿
│   │   └── keyboard.ts       # 인라인 키보드
│   ├── jobs/
│   │   └── morning.ts        # 아침 알림 cron
│   ├── lib/
│   │   ├── oura.ts           # Oura API
│   │   └── db.ts             # 유저 토큰 저장 (Supabase)
│   └── core/
│       ├── algorithm.ts
│       └── types.ts
└── Dockerfile                # 배포용
```

### 인프라

| 컴포넌트 | 선택 | 이유 |
|---------|------|------|
| Hosting | Railway / Fly.io | 무료 티어, 쉬운 배포 |
| Database | Supabase | 유저 토큰 저장 |
| Bot Framework | grammY | TypeScript, 가벼움 |

### Build Time: 2-3일

---

## 공유 Core 알고리즘

### Workout-specific Output

```typescript
interface WorkoutDecision {
  verdict: "train_hard" | "train_light" | "rest";
  confidence: number;  // 0-100

  headline: string;
  recommendation: string[];

  // Workout-specific
  maxHeartRate?: number;      // "HR < 140"
  suggestedActivities: string[];
  avoidActivities: string[];

  // Projection
  tomorrowOutlook: string;
  recoveryRisk: string;       // "60% chance of 3-day recovery"
}
```

### 판단 로직

```typescript
function getWorkoutVerdict(data: BiometricData): WorkoutDecision {
  const score = calculateBaseScore(data);
  const hrvTrend = getHrvTrend(data);  // vs baseline

  // Decision matrix
  if (score >= 70 && hrvTrend >= 0) {
    return {
      verdict: "train_hard",
      headline: "TRAIN HARD",
      suggestedActivities: ["Heavy lifting", "HIIT", "Intervals"],
      avoidActivities: [],
      recoveryRisk: "Low - you're recovered",
      tomorrowOutlook: "Should stay good if you sleep well"
    };
  }

  if (score >= 50 || (score >= 40 && hrvTrend >= 0)) {
    return {
      verdict: "train_light",
      headline: "TRAIN LIGHT",
      maxHeartRate: 140,
      suggestedActivities: ["Zone 2 cardio", "Light weights", "Yoga"],
      avoidActivities: ["Heavy lifting", "HIIT", "PRs"],
      recoveryRisk: "Moderate - don't push it",
      tomorrowOutlook: "Better if you rest today"
    };
  }

  return {
    verdict: "rest",
    headline: "REST DAY",
    suggestedActivities: ["Walking", "Stretching", "Meditation"],
    avoidActivities: ["All intense exercise"],
    recoveryRisk: "High if you train - expect 2-3 day setback",
    tomorrowOutlook: "Recovery likely if you rest"
  };
}
```

---

## GTM 전략

### 채널별 타겟

| 채널 | 툴 | 메시지 |
|------|-----|--------|
| **Hacker News** | CLI | "Show HN: CLI that tells you if you should work out today (based on Oura)" |
| **Reddit r/Biohackers** | Telegram | "I built a bot that answers 'should I train today?' using your Oura data" |
| **Reddit r/ouraring** | Both | "Finally know what to DO with my readiness score" |
| **Twitter/X** | Both | Thread: "Your Oura shows numbers. Here's what they mean for your workout." |
| **Product Hunt** | Both | "P360 - Your body's workout advisor" |

### 런칭 순서

```
Day 1-3: Build CLI + Bot
Day 4:   Internal testing
Day 5:   Reddit soft launch (r/Biohackers)
Day 6:   Gather feedback, iterate
Day 7:   Hacker News (Show HN)
Day 8:   Product Hunt
```

### 성공 지표

| 지표 | 1주 목표 | 1달 목표 |
|------|---------|---------|
| CLI installs | 100 | 500 |
| Bot users | 200 | 1,000 |
| Daily active | 30 | 200 |
| Reddit upvotes | 50+ | - |
| HN points | 30+ | - |

---

## 검증 질문

빌드 후 답해야 할 질문들:

1. **사람들이 매일 쓰는가?** (DAU/MAU)
2. **"Rest" 추천을 따르는가?** (compliance rate)
3. **따랐을 때 다음 날 컨디션이 나아지는가?** (outcome)
4. **유료로 전환할 의향?** (WTP survey)

---

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| Oura API rate limit | 캐싱, 하루 1-2회 fetch |
| 사람들이 조언 무시 | Outcome tracking으로 증명 |
| "그냥 Oura 앱 보면 되잖아" | "Oura는 숫자, 우리는 행동" 강조 |
| Telegram 봇 발견성 낮음 | Reddit/Twitter로 드라이브 |

---

## 다음 액션

- [ ] CLI 프로젝트 셋업
- [ ] Telegram Bot 프로젝트 셋업
- [ ] Core workout algorithm 구현
- [ ] Oura OAuth flow (재사용)
- [ ] 메시지 템플릿 작성
- [ ] Railway/Fly.io 배포 설정
- [ ] Reddit 포스트 초안
- [ ] HN Show HN 초안

---

*Created: 2026-01-30*
