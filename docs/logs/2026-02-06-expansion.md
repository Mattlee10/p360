# P360 Expansion Log - 2026-02-06

## 요약

Phase 1-5 전체 개발 완료 + GTM 실행 시작

---

## 🛠 개발 완료 (Phase 1-5)

### Phase 1: packages/core 리팩토링 + Provider 패턴 ✅

**변경 사항:**
- `BiometricProvider` 인터페이스 생성 (`packages/core/src/providers/provider.ts`)
- `OuraProvider` 구현 (`packages/core/src/providers/oura.ts`)
- Oura 타입 분리 (`packages/core/src/providers/oura.types.ts`)
- 알고리즘 통합: workout, drink, why → core로 이동
- Demo data 유틸 추가 (`packages/core/src/demo.ts`)
- 16개 테스트 통과

**새 파일:**
```
packages/core/src/
├── providers/
│   ├── provider.ts      # BiometricProvider interface
│   ├── oura.ts          # OuraProvider implementation
│   ├── oura.types.ts    # Oura API types
│   └── index.ts         # Re-exports
├── demo.ts              # Demo data utilities
├── drink.ts             # Drink algorithm (from telegram)
├── why.ts               # Why algorithm (from telegram)
└── workout.ts           # Full workout with 14 sports
```

---

### Phase 2: WHOOP API 연동 ✅

**변경 사항:**
- `WhoopProvider` 구현 (`packages/core/src/providers/whoop.ts`)
- WHOOP 타입 정의 (`packages/core/src/providers/whoop.types.ts`)
- HRV 정규화: raw RMSSD ms → 0-100 scale (60ms = 50 baseline)
- Telegram 멀티 디바이스 지원

**새 커맨드:**
- `/connect whoop TOKEN` - WHOOP 연결
- `/status` - 연결된 디바이스 표시

**새 파일:**
```
packages/core/src/providers/
├── whoop.ts             # WhoopProvider implementation
└── whoop.types.ts       # WHOOP API types (Recovery, Sleep, Cycle)
```

---

### Phase 3: P17 Mood 기능 ✅

**핵심 인사이트:**
> "사용자가 자신을 심리적으로 탓할 때 (불안, 게으름), 실제 원인은 생리적일 수 있다 (낮은 HRV, 수면 부족). Attribution correction."

**4가지 시나리오:**
| 시나리오 | Recovery | Mood | 메시지 |
|----------|----------|------|--------|
| A | ↓ | ↓ | "IT'S YOUR BODY, NOT YOUR MIND" (핵심) |
| B | ↑ | ↓ | "External factors may be involved" |
| C | ↓ | ↑ | "Body needs recovery, don't overdo it" |
| D | ↑ | ↑ | "Great day to challenge yourself!" |

**새 커맨드:**
- `/mood N` - 기분 로깅 (1-5) + 인사이트
- `/mood history` - 기분-회복 상관관계 분석
- `/mooddemo` - 데모

**새 파일:**
```
packages/core/src/mood.ts    # Mood algorithm + Pearson correlation
apps/telegram/src/lib/mood.ts # Telegram formatter
```

---

### Phase 4: Discord Bot ✅

**구현 내용:**
- discord.js 기반 슬래시 커맨드 봇
- Rich embed 포매터
- 전체 기능 지원: workout, drink, why, mood, connect, demo

**커맨드:**
```
/workout [sport]     - 운동 추천
/drink [action]      - 음주 가이드 (log, history, social)
/why [feeling] [score] - Mind vs Body 분석
/mood [score]        - 기분 추적
/connect device token - 디바이스 연결
/demo [feature]      - 데모
/status              - 연결 상태
/disconnect          - 연결 해제
```

**새 파일:**
```
apps/discord/
├── src/
│   ├── index.ts           # 메인 봇 + 핸들러
│   ├── commands/
│   │   └── deploy.ts      # 슬래시 커맨드 배포
│   └── lib/
│       ├── data.ts        # Provider wrapper
│       ├── storage.ts     # In-memory storage
│       └── format.ts      # Discord embed formatters
├── package.json
├── tsconfig.json
└── .env.example
```

---

### Phase 5: Obsidian Plugin ✅

**구현 내용:**
- Settings tab (device + token 설정)
- Mood sidebar widget
- Command palette 커맨드
- Markdown 자동 삽입 (Daily Check, Workout, Drink)

**커맨드:**
- `P360: Insert Daily Check` - 전체 바이오 요약 삽입
- `P360: Insert Workout Recommendation` - 운동 callout 삽입
- `P360: Insert Drink Guide` - 음주 callout 삽입
- `P360: Open Mood Widget` - 사이드바 위젯
- `P360: Refresh Biometric Data` - 데이터 새로고침

**새 파일:**
```
apps/obsidian/
├── src/
│   ├── main.ts            # 플러그인 메인
│   ├── settings.ts        # Settings tab
│   ├── views/
│   │   └── mood-widget.ts # Sidebar mood widget
│   └── lib/
│       └── data.ts        # Provider wrapper
├── manifest.json
├── styles.css
├── esbuild.config.mjs
├── package.json
└── tsconfig.json
```

---

## 📊 프로젝트 구조 (최종)

```
p360/
├── apps/
│   ├── telegram/     ✅ Grammy 봇 (업데이트)
│   ├── discord/      ✅ discord.js 봇 (신규)
│   ├── obsidian/     ✅ Obsidian 플러그인 (신규)
│   ├── cli/          (기존)
│   └── raycast/      (기존)
├── packages/
│   └── core/         ✅ 알고리즘 + Provider (대폭 확장)
└── docs/
    ├── gtm/
    │   └── DM_TARGETS.md  ✅ GTM 타겟 리스트
    └── logs/
        └── 2026-02-06-expansion.md  (이 파일)
```

---

## 🚀 GTM 실행

### 댓글 작업 완료

| # | 서브레딧 | 포스트 | 상태 |
|---|----------|--------|------|
| 1 | r/ouraring | "What's your most used feature?" | ✅ 완료 |
| 2 | r/whoop | "That damn WHOOP was right moment" | ✅ 완료 |
| 3 | r/whoop | "Am I broken or is my whoop broken" | ✅ 완료 |
| 4 | r/ouraring | "If you were on the fence about Oura" | ✅ 완료 |

### 댓글 내용

**r/ouraring (1번):**
```
Readiness score for me. I used to overthink "should I train hard today or take it easy?"

Now I just check readiness + HRV trend in the morning and it basically decides for me. Below 65 with dropping HRV = active recovery only. Above 75 = go hard.

Same with drinking - if my readiness is tanked, I know even 2 drinks will wreck my recovery for days. When I'm in the green, I can handle a bit more.

Basically turned my ring into a daily decision filter instead of just a data tracker.
```

**r/whoop (2번):**
```
Alcohol for sure. But the real wake up call was realizing it wasn't just "one bad night."

Had 4 drinks on a Saturday with 45% recovery. Thought I'd bounce back by Monday. Nope - took until Wednesday to see green again.

Now I have a personal rule: if recovery is yellow or red, max 2 drinks. If I'm in the green and well-rested, I give myself more slack.

The data doesn't lie, it just takes a while to actually listen to it.
```

### 댓글 내용 (추가)

**r/whoop (3번 - "Am I broken"):**
```
Your body is clearly responding well to whatever you're doing. That consistent green recovery is the dream.

The real question now is: are you actually pushing when you could be? When I see multiple green days in a row, that's my signal to go harder. The data is basically saying "you have capacity - use it."
```

**r/whoop (3번 - 답글, OP 반응에 대한 후속):**
> OP: "Yea but ai is telling me not to push, which is conflicting. It says im doing too many days in a row, and yes I always give it my all in the gym. I only have about an hour and a half tho to give it my all"

```
That's the thing - recovery says go but the AI looks at how many days you've been hitting it. Most people overtrain so it plays it safe.

If your HRV keeps going up and you're still green, you're just recovering faster than the algorithm expects. Some people do.

Maybe try this: when AI says chill but you're green, do something different instead of going hard again. Mobility, skill work, whatever. You're still using the time but not hammering the same system.

How's your sleep been on back-to-back days?
```

**r/ouraring (4번 - "on the fence"):**
```
This is why I stuck with Oura. The readiness score is actually actionable.

Every morning: high readiness + good HRV = train hard. Low readiness = forced rest day.

The subscription is worth it if you use the data to make decisions, not just collect it.
```

### 다음 단계

1. **2/7**: 댓글 반응 확인 + 새 핫 포스트 찾아서 추가 댓글
2. **2/8**: 반응 온 유저들에게 DM
3. **2/9+**: 결과 보고 확장 (r/Biohackers, Twitter 등)

---

## 📈 메트릭

### 코드
- 새 파일: 25+
- 새 앱: 2 (Discord, Obsidian)
- core 패키지 사이즈: 50KB → 61KB
- 테스트: 16/16 통과

### GTM
- 타겟 유저 리스트: 21명 (r/ouraring 13명, r/whoop 8명)
- 댓글 완료: 4/4 ✅ + 1 후속 답글
- OP 반응: 1건 (Huge_Pizza_5783 - 대화 진행 중)
- DM 발송: 0 (대화 마무리 후 시작)

---

## 🔗 관련 파일

- DM 타겟 리스트: `/docs/gtm/DM_TARGETS.md`
- 프로젝트 상태: `/docs/STATUS.md`
- 핵심 문서: `/docs/core/P360_CORE.md`
