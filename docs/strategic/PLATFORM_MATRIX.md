# P360 기생 플랫폼 전체 매트릭스

> 모든 가능한 기생 표면(surface)을 빠짐없이 조사한 결과
>
> Last Updated: 2026-02-06

---

## 현재 상태

| 플랫폼 | 상태 | 위치 |
|--------|------|------|
| CLI | ✅ Live | `apps/cli/` |
| Telegram Bot | ✅ Live | `apps/telegram/` |
| Raycast Extension | ✅ Live | `apps/raycast/` |
| Web Demo | ✅ Live | `apps/web-demo/` |
| Discord Bot | 코드 있음 | `apps/discord/` |
| Obsidian Plugin | 코드 있음 | `apps/obsidian/` |

**Core 알고리즘:** `packages/core/` — 여기에 한번 빌드하면 모든 앱에서 사용.

---

## 전체 플랫폼 매트릭스

### 메시징 플랫폼

| 플랫폼 | Bot API | 유저 풀 | 디스커버리 | 난이도 | 판정 |
|--------|---------|--------|-----------|--------|------|
| **Telegram** | ✅ Full | 1B MAU, 바이오해커 그룹 다수 | 중간 (봇 검색, 초대링크) | 쉬움 | ✅ **Live** |
| **Discord** | ✅ Full (Slash cmd) | 250M MAU, Biohacker Lounge 16K+ | **높음** (DISBOARD, 서버 디렉토리) | 쉬움 | ✅ **즉시 배포** |
| **Slack** | ✅ Full | 79M MAU, Fortune 100 80% | 있음 (App Directory) | 중간 | 🟡 Phase 2 (B2B) |
| **WhatsApp** | ❌ 금지 | - | - | - | ❌ **2026.01 범용 봇 금지** |
| **iMessage** | ❌ 공식 API 없음 | - | 없음 | 어려움 | ❌ Park |
| **Signal** | ⚠️ 비공식 | 작음 | 없음 | 중간 | ❌ Park |
| **Matrix** | ✅ | 작지만 EU 헬스케어 성장 | 제한적 | 중간 | 🟡 탐색 (EU) |

### 웨어러블 / 건강 데이터 소스

| 플랫폼 | API | 데이터 접근 | 유저 풀 | 판정 |
|--------|-----|-----------|--------|------|
| **Oura API v2** | ✅ | HRV, Sleep, Readiness | Oura 유저 전체 | ✅ **연동 완료** |
| **WHOOP API** | ✅ Free | Recovery, Strain, Sleep | WHOOP 유저 전체 | ✅ **연동 완료** |
| **Apple HealthKit** | ✅ (네이티브 앱 필요) | 전체 건강 데이터 | iPhone 전체 | 🟡 iOS 앱 빌드 시 |
| **Health Connect (Android)** | ✅ | 50+ 건강 데이터 타입 | Android 14+ | 🟡 Android 앱 빌드 시 |
| **Garmin Connect** | ✅ (승인 필요) | Health, Activity, Training | 대규모 (내구 운동 선수) | 🟡 Phase 2 (API 신청) |
| **Fitbit** | ✅ | Activity, Sleep, HR | 대규모 (감소 추세) | 🟡 탐색 |
| **Google Fit** | ❌ | - | - | ❌ **2025.06 폐기됨** |

### 스마트 글래스 / AR

| 플랫폼 | API | 생체 센서 | 유저 풀 | 난이도 | 판정 |
|--------|-----|----------|--------|--------|------|
| **Meta Ray-Ban** | ✅ 2026 (Wearables Toolkit) | ❌ 없음 (카메라만) | 얼리 어답터 | 중간 | 🟡 **Park** (센서 없음) |
| **Apple Vision Pro** | ✅ (visionOS SDK) | HealthKit 연동 가능 | 매우 작음 ($3,499) | 어려움 | ❌ Park (너무 이름) |
| **Snap Spectacles** | 제한적 | ❌ | 매우 작음 | 어려움 | ❌ Park |

> Meta Glasses 전략은 별도 문서: `docs/strategic/META_GLASS_ROADMAP.md`
> 핵심: 생체 센서 없음 → 현재 P360 유스케이스와 직접 연결 안 됨. 6-18개월 후 재평가.

### 음성 비서

| 플랫폼 | API | 생체 접근 | 유저 풀 | 난이도 | 판정 |
|--------|-----|----------|--------|--------|------|
| **Alexa Skills** | ✅ | 외부 API 연동 | 수천만 디바이스 | 중간 | 🟡 탐색 ("오늘 운동해도 돼?") |
| **Siri Shortcuts / App Intents** | ✅ (네이티브 앱 필요) | HealthKit 풀 접근 | Apple 전체 | 중간 | ✅ **iOS 앱과 함께** |
| **Google Assistant** | ❌ | - | - | - | ❌ **2026.01 폐기됨** |
| **HomePod** | ✅ (SiriKit) | HealthKit 연동 | 작음 | 중간 | 🟡 iOS 앱의 보너스 |

### 브라우저 확장

| 플랫폼 | API | 유저 풀 | 디스커버리 | 난이도 | 판정 |
|--------|-----|--------|-----------|--------|------|
| **Chrome Extension** | ✅ (MV3) | 수십억 | Chrome Web Store | 쉬움 | ✅ **빌드** |
| **Safari Extension** | ✅ | Apple 유저 | App Store | 중간 | 🟡 Chrome 이후 |
| **Firefox Extension** | ✅ | 작지만 충성 | Add-ons | 쉬움 | 🟡 Chrome 포팅 |

### 데스크톱

| 플랫폼 | API | 유저 풀 | 디스커버리 | 난이도 | 판정 |
|--------|-----|--------|-----------|--------|------|
| **Raycast Extension** | ✅ (TS/React) | 파워 유저 | Raycast Store | 쉬움 | ✅ **Live** |
| **macOS Menu Bar** | ✅ (AppKit) | Mac 유저 | PH, WOM | 중간 | 🟡 Phase 2 |
| **Alfred Workflow** | ✅ | Raycast 경쟁 | Alfred Gallery | 쉬움 | 🟡 탐색 |
| **Windows System Tray** | ✅ (.NET) | Windows 유저 | 제한적 | 중간 | 🟡 Phase 3 |

### 모바일

| 플랫폼 | API | 생체 접근 | 유저 풀 | 난이도 | 판정 |
|--------|-----|----------|--------|--------|------|
| **iOS Widget (WidgetKit)** | ✅ | HealthKit 풀 | iPhone 전체 | 중간 | ✅ **iOS 앱과 함께** |
| **Apple Watch Complication** | ✅ | HealthKit + Watch 센서 | 100M+ Watch | 중간 | ✅ **최고 가치** (항상 보임) |
| **iOS Shortcuts** | ✅ (App Intents) | HealthKit | iPhone 전체 | 중간 | ✅ **iOS 앱과 함께** |
| **Android Widget (Glance)** | ✅ | Health Connect | Android 전체 | 중간 | 🟡 Android 앱 빌드 시 |
| **Wear OS Tile** | ✅ | Health Connect | Wear OS | 중간 | 🟡 Android 후 |
| **Android Tasker** | ✅ | Health Connect | 파워 유저 | 쉬움 | 🟡 탐색 |

### 생산성 도구

| 플랫폼 | API | 유저 풀 | 디스커버리 | 난이도 | 판정 |
|--------|-----|--------|-----------|--------|------|
| **Obsidian Plugin** | ✅ (TS) | 60K+ 커뮤니티 | Plugin marketplace | 쉬움 | ✅ **코드 있음** |
| **Notion Integration** | ✅ (REST) | 수백만 | Integration directory | 쉬움 | 🟡 Phase 2 |
| **Google Calendar** | ✅ (REST) | 수십억 | 제한적 | 쉬움 | ✅ **빌드** (운동 경고) |
| **Todoist** | ✅ (REST) | 수백만 | Marketplace | 쉬움 | 🟡 탐색 |
| **Apple Reminders** | ⚠️ (EventKit 제한) | Apple 유저 | 제한적 | 중간 | ❌ Park |

### 건강/피트니스 플랫폼

| 플랫폼 | API | 데이터 | 유저 풀 | 난이도 | 판정 |
|--------|-----|--------|--------|--------|------|
| **Strava** | ✅ Free (85K 개발자) | Activity | 주 4천만 활동 | 쉬움 | ✅ **빌드** |
| **TrainingPeaks** | ⚠️ (승인 필요) | HRV, Sleep, Stress | 내구 선수 | 중간 | 🟡 API 신청 |
| **MyFitnessPal** | ⚠️ (프라이빗) | Nutrition | 대규모 | 어려움 | ❌ Park |
| **Cronometer** | ⚠️ (엔터프라이즈만) | Nutrition | 소규모 | 어려움 | ❌ Park |

### 개발자 / 자동화

| 플랫폼 | API | 유저 풀 | 난이도 | 판정 |
|--------|-----|--------|--------|------|
| **CLI** | N/A | 개발자 | N/A | ✅ **Live** |
| **n8n / Zapier / Make** | ✅ | 수천 앱 연동 | 쉬움 | 🟡 Phase 2 |
| **IFTTT** | ✅ | 900+ 서비스 | 쉬움 | 🟡 Phase 2 |
| **Home Assistant** | ✅ (Python) | 스마트홈 유저 | 쉬움 | 🟡 탐색 (HRV 낮으면 조명 조절) |
| **GitHub Actions** | ✅ | 100M+ | 쉬움 | ❌ Park (유스케이스 약함) |

### 소셜 / 콘텐츠

| 플랫폼 | API | 비용 | 유저 풀 | 판정 |
|--------|-----|------|--------|------|
| **Reddit Bot** | ✅ (PRAW) | 무료 | 830K+ 타겟 | 🟡 탐색 (콘텐츠 전략) |
| **Twitter/X Bot** | ✅ | $200/월 Basic | 대규모 | ❌ Park (비용) |
| **Substack/Newsletter** | N/A | 무료 | 빌드 필요 | 🟡 탐색 |

### 신흥 플랫폼

| 플랫폼 | API | 생체 센서 | 유저 풀 | 판정 |
|--------|-----|----------|--------|------|
| **Apple Intelligence (2026+)** | ✅ (App Intents) | HealthKit 풀 | Apple 전체 | ✅ **iOS 앱과 함께 (최고 우선)** |
| **Humane AI Pin** | ⚠️ 실험적 | ❌ | 서비스 종료 | ❌ 죽은 플랫폼 |
| **Rabbit R1** | ⚠️ | ❌ | 매우 작음 | ❌ Park |

---

## 우선순위 정리

### Tier 1: 즉시 빌드 (이번 주)

`@p360/core`에 `/cost` 알고리즘 빌드 → 아래 순서로 배포

| # | 플랫폼 | 이유 | 빌드 시간 |
|---|--------|------|----------|
| 1 | **Telegram** `/cost` | ✅ Live, 기존 유저 즉시 테스트 | 1-2일 |
| 2 | **Discord** `/cost` | 코드 있음, 16K+ Biohacker Lounge | 1일 |

### Tier 2: 1-2주 내 (Telegram 검증 후)

| # | 플랫폼 | 이유 | 빌드 시간 |
|---|--------|------|----------|
| 3 | **Chrome Extension** | 수십억 유저, Web Store 디스커버리 | 3-4일 |
| 4 | **Strava Integration** | 주 4천만 활동, "운동 전 경고" | 2-3일 |
| 5 | **Google Calendar** | "운동 예약 시 HRV 경고" | 2-3일 |

### Tier 3: 1-2개월 (PMF 확인 후)

| # | 플랫폼 | 이유 | 빌드 시간 |
|---|--------|------|----------|
| 6 | **iOS App** (Widget + Watch + Shortcuts + Siri) | Apple 생태계 통합, Apple Intelligence | 2-3주 |
| 7 | **Slack Bot** | B2B 하이퍼포머 | 3-4일 |
| 8 | **Notion Integration** | 일일 리커버리 저널 | 2-3일 |
| 9 | **macOS Menu Bar** | 항상 보이는 상태 표시 | 1주 |
| 10 | **n8n / Zapier** | 자동화 허브 | 3-4일 |

### Tier 4: 3-6개월 (스케일 시)

| # | 플랫폼 | 이유 |
|---|--------|------|
| 11 | **Android App** (Widget + Health Connect) | 안드로이드 시장 |
| 12 | **Garmin Connect** | 내구 선수 세그먼트 |
| 13 | **TrainingPeaks** | 시리어스 선수 |
| 14 | **Alexa Skill** | 음성 넛지 |
| 15 | **Home Assistant** | 스마트홈 자동화 |

### Park (지금 아님)

| 플랫폼 | 이유 |
|--------|------|
| WhatsApp | 2026.01 범용 봇 금지 |
| Google Fit | 2025.06 폐기 |
| Google Assistant | 2026.01 폐기 |
| iMessage | 공식 API 없음 |
| Twitter/X Bot | $200/월 |
| Meta Ray-Ban | 생체 센서 없음 (6-18개월 후 재평가) |
| Apple Vision Pro | $3,499, 시장 너무 작음 |
| MyFitnessPal | 프라이빗 API |
| Humane AI Pin | 서비스 종료 |
| Rabbit R1 | 센서 없음, 시장 없음 |

---

## 핵심 인사이트

### 1. "Apple 생태계 = 최종 목적지"
iOS App 하나 만들면 Widget + Watch + Shortcuts + Siri + Apple Intelligence가 전부 열림. 가장 높은 ROI.

### 2. "지금은 Telegram + Discord"
PMF 검증 전에 네이티브 앱은 오버엔지니어링. 봇으로 검증 → 네이티브로 확장.

### 3. "Core 한번 빌드 = 모든 곳 배포"
`@p360/core` 패턴이 이미 잘 잡혀있음. 새 플랫폼 추가 = 포매터만 작성.

### 4. "WhatsApp, Google Fit, Google Assistant = 죽음"
2025-2026에 전부 폐기/금지됨. 이쪽은 절대 투자하지 않음.

### 5. "Meta Glasses = 센서가 생기면 재평가"
현재 카메라만 있고 HRV/건강 센서 없음. P360에는 아직 의미 없음. 별도 로드맵 유지.

---

## 결정 프레임워크

새 플랫폼 추가 전 체크:

| 기준 | 필수 |
|------|------|
| 생체 데이터 접근 가능? | Yes |
| 하이퍼포머 pain 해결? | Yes |
| 1주 내 빌드 가능? | Yes |
| 기생 경로 있음? (디스커버리) | Yes |
| 의사결정 넛지 가능? | Yes |

**4-5점: 빌드** | **2-3점: 탐색** | **0-1점: Park**

---

*Version: 1.0 | Created: 2026-02-06*
