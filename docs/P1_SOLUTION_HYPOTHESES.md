# P1 솔루션 가설 매트릭스

> **P1 핵심 문제:** 데이터는 있는데 "So What?"을 모르겠다
>
> 숫자는 보이는데 **행동으로 연결이 안 됨**

---

## 가설 구조

```
P1(pain) → {S1-A, S1-B, S1-C, ...}

각 솔루션 = 타겟 상황 × 데이터 × 행동 × 툴
```

---

## 카테고리 1: 커뮤니케이션

### S1-A: 이메일 발송 전 게이트

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 중요한 이메일 보내기 직전 |
| **Pain Quote** | "왜 항상 피곤할 때 화난 이메일 보내지?" |
| **입력 데이터** | HRV, Sleep Score, Readiness |
| **막힌 행동** | Send vs Don't Send |
| **Output** | "지금 보내지 마. 3시간 후에 다시 봐." |
| **툴** | Chrome Extension (Gmail) |
| **Entry Point** | Gmail Send 버튼 클릭 시 |
| **Build Time** | 3-4일 |
| **검증 지표** | Draft 저장 후 수정 비율, 후회 감소 |

### S1-B: Slack 메시지 전 게이트

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 팀원/상사에게 민감한 메시지 보내기 전 |
| **Pain Quote** | "화날 때 Slack 보내고 후회했다" |
| **입력 데이터** | HRV, Readiness |
| **막힌 행동** | Send vs Schedule for later |
| **Output** | "이 메시지 내일 아침에 보내는 게 낫겠어" |
| **툴** | Slack App / Browser Extension |
| **Entry Point** | Slack 메시지 입력 후 Enter |
| **Build Time** | 4-5일 |
| **검증 지표** | 메시지 지연 후 수정률 |

### S1-C: 문자/카톡 전 게이트

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 감정적 텍스트 보내기 전 |
| **Pain Quote** | "새벽에 보낸 문자 후회" |
| **입력 데이터** | HRV, Sleep, 시간대 |
| **막힌 행동** | Send vs Save |
| **Output** | "새벽 2시 + 낮은 HRV. 이거 진짜 보낼 거야?" |
| **툴** | iOS Shortcut / Android App |
| **Entry Point** | 메시지 앱 Send 전 |
| **Build Time** | 1-2주 |
| **검증 지표** | 메시지 취소율, 관계 갈등 감소 |

### S1-D: 소셜미디어 포스팅 전

| 항목 | 내용 |
|------|------|
| **타겟 상황** | Twitter/LinkedIn 포스트 올리기 전 |
| **Pain Quote** | "피곤할 때 올린 트윗 삭제했다" |
| **입력 데이터** | HRV, Readiness, 시간대 |
| **막힌 행동** | Post vs Save Draft |
| **Output** | "공개 포스트는 컨디션 좋을 때. 내일 아침 다시 봐." |
| **툴** | Browser Extension (Twitter/LinkedIn) |
| **Entry Point** | Post/Tweet 버튼 |
| **Build Time** | 2-3일 |
| **검증 지표** | 삭제된 포스트 감소 |

---

## 카테고리 2: 신체 활동

### S1-E: 운동 전 Go/No-Go

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 오늘 운동할지 말지 결정 |
| **Pain Quote** | "오늘 쉬어야 하나, 밀어붙여야 하나?" |
| **입력 데이터** | HRV, Readiness, 최근 3일 트렌드 |
| **막힌 행동** | Train Hard / Light / Rest |
| **Output** | "오늘 밀어붙이면 3일 강제 휴식. 가벼운 운동 추천." |
| **툴** | CLI, Raycast, Morning Bot |
| **Entry Point** | 아침 루틴 / 헬스장 도착 전 |
| **Build Time** | 2-3일 |
| **검증 지표** | 부상 감소, 퍼포먼스 일관성 |

### S1-F: 러닝/사이클링 강도 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 유산소 운동 강도 설정 |
| **Pain Quote** | "어제 무리했더니 오늘 완전 망했다" |
| **입력 데이터** | HRV, RHR, 이전 운동 기록 |
| **막힌 행동** | Zone 2 vs Zone 4 vs Rest |
| **Output** | "오늘은 Zone 2 러닝만. HR 140 이하로." |
| **툴** | Strava Integration, Garmin Connect |
| **Entry Point** | 운동 앱 시작 시 |
| **Build Time** | 1주 |
| **검증 지표** | 과훈련 지표 감소 |

### S1-G: 요가/명상 vs 고강도 선택

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 오늘의 운동 타입 결정 |
| **Pain Quote** | "몸은 쉬고 싶은데 마음은 운동하고 싶어" |
| **입력 데이터** | HRV Balance, Sleep Quality |
| **막힌 행동** | 운동 타입 선택 |
| **Output** | "신경계 회복 필요. 요가나 걷기 추천." |
| **툴** | Morning Notification, Widget |
| **Entry Point** | 아침 기상 시 |
| **Build Time** | 1-2일 |
| **검증 지표** | 주간 밸런스 개선 |

---

## 카테고리 3: 업무/생산성

### S1-H: 미팅 참석 vs 리스케줄

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 중요한 미팅 앞두고 컨디션 체크 |
| **Pain Quote** | "중요한 미팅인데 컨디션이 별로..." |
| **입력 데이터** | Readiness, Sleep, 미팅 중요도 |
| **막힌 행동** | Attend / Reschedule / Delegate |
| **Output** | "오늘 협상력 60%. 가능하면 내일로 미뤄." |
| **툴** | Calendar Extension (Google Calendar) |
| **Entry Point** | 미팅 30분 전 알림 |
| **Build Time** | 3-4일 |
| **검증 지표** | 미팅 outcome 만족도 |

### S1-I: 딥워크 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 집중 업무 시간 결정 |
| **Pain Quote** | "언제 집중이 잘 되는지 모르겠어" |
| **입력 데이터** | Readiness, 시간대, 개인 패턴 |
| **막힌 행동** | 딥워크 시작 vs 가벼운 업무 |
| **Output** | "지금부터 2시간이 오늘의 골든타임. 핵심 업무 지금 해." |
| **툴** | Menu Bar App, Focus Mode Trigger |
| **Entry Point** | 업무 시작 시 |
| **Build Time** | 3-4일 |
| **검증 지표** | 딥워크 시간 품질 |

### S1-J: 의사결정 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 중요한 비즈니스 결정 앞둠 |
| **Pain Quote** | "큰 결정은 항상 피곤할 때 와" |
| **입력 데이터** | Readiness, HRV, 결정 중요도 |
| **막힌 행동** | Decide Now / Defer |
| **Output** | "지금 판단력 70%. 급하지 않으면 내일 오전에." |
| **툴** | CLI, Raycast, Telegram Bot |
| **Entry Point** | 결정 직전 수동 체크 |
| **Build Time** | 2일 |
| **검증 지표** | 결정 후회율 감소 |

### S1-K: 어려운 대화/협상 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 연봉협상, 갈등 해결 대화 |
| **Pain Quote** | "협상할 때 왜 맨날 져?" |
| **입력 데이터** | HRV, Readiness, 감정 상태 |
| **막힌 행동** | Engage / Postpone |
| **Output** | "감정 조절 능력 낮음. 오늘 협상하면 불리해." |
| **툴** | Reminder + Check Combo |
| **Entry Point** | 캘린더 이벤트 전 |
| **Build Time** | 2-3일 |
| **검증 지표** | 협상 결과 만족도 |

---

## 카테고리 4: 재무/소비

### S1-L: 충동구매 방지

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 온라인 쇼핑 결제 직전 |
| **Pain Quote** | "피곤할 때 왜 쇼핑을 하지?" |
| **입력 데이터** | HRV, Sleep, 구매 금액 |
| **막힌 행동** | Buy / Wait 24hr |
| **Output** | "충동 조절 능력 40%. $50 이상은 내일 다시 봐." |
| **툴** | Browser Extension (Amazon, 쿠팡) |
| **Entry Point** | Checkout 버튼 클릭 |
| **Build Time** | 3-4일 |
| **검증 지표** | 반품률 감소, 구매 후회 감소 |

### S1-M: 투자 결정 게이트

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 주식/코인 매매 직전 |
| **Pain Quote** | "FOMO로 샀다가 물렸다" |
| **입력 데이터** | HRV, Readiness, 시장 변동성 |
| **막힌 행동** | Trade / Hold |
| **Output** | "감정적 거래 확률 높음. 지금 매매하지 마." |
| **툴** | 증권앱 연동 or 별도 체크 |
| **Entry Point** | 매매 버튼 전 |
| **Build Time** | 1주 |
| **검증 지표** | 감정적 매매 감소 |

### S1-N: 구독 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 새로운 구독 서비스 결제 |
| **Pain Quote** | "쓰지도 않는 구독이 10개" |
| **입력 데이터** | Readiness, 시간대 |
| **막힌 행동** | Subscribe / Bookmark for later |
| **Output** | "새벽 충동 구독. 3일 후에도 필요하면 그때 결제." |
| **툴** | Browser Extension |
| **Entry Point** | 구독 버튼 클릭 |
| **Build Time** | 2일 |
| **검증 지표** | 미사용 구독 감소 |

---

## 카테고리 5: 건강/웰빙

### S1-O: 카페인 섭취 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 커피 마실지 말지 |
| **Pain Quote** | "커피 마시면 밤에 못 자" |
| **입력 데이터** | 시간, Sleep Score, HRV 트렌드 |
| **막힌 행동** | Drink / Skip / Half-caf |
| **Output** | "어젯밤 수면 부족 + 오후 3시. 카페인 스킵 추천." |
| **툴** | Quick Check (Raycast, Widget) |
| **Entry Point** | 커피숍 도착 or 기계 앞 |
| **Build Time** | 1일 |
| **검증 지표** | 수면 품질 개선 |

### S1-P: 알코올 섭취 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 술 마실지 말지 |
| **Pain Quote** | "컨디션 안 좋은데 술 마시고 망했다" |
| **입력 데이터** | Readiness, 최근 음주 기록, 내일 일정 |
| **막힌 행동** | Drink / Limit / Skip |
| **Output** | "Readiness 45 + 내일 중요 미팅. 오늘은 스킵." |
| **툴** | Evening Check Notification |
| **Entry Point** | 저녁 시간대 |
| **Build Time** | 1-2일 |
| **검증 지표** | 다음날 컨디션 |

### S1-Q: 수면 시간 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 몇 시에 잘지 결정 |
| **Pain Quote** | "또 늦게 잤다" |
| **입력 데이터** | 현재 피로도, 내일 일정, 수면 부채 |
| **막힌 행동** | Sleep Now / 30min more / 1hr more |
| **Output** | "수면 부채 2시간. 지금 자면 내일 Readiness 75 예상." |
| **툴** | Evening Notification, Widget |
| **Entry Point** | 저녁 9-11시 |
| **Build Time** | 2일 |
| **검증 지표** | 취침 시간 일관성 |

### S1-R: 낮잠 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 낮잠 잘지 말지 |
| **Pain Quote** | "낮잠 자면 밤에 못 자" |
| **입력 데이터** | Sleep Score, 시간대, 저녁 일정 |
| **막힌 행동** | Nap 20min / Nap 90min / Skip |
| **Output** | "오후 2시 + 수면 부족. 20분 파워냅 OK." |
| **툴** | Afternoon Check |
| **Entry Point** | 오후 1-4시 |
| **Build Time** | 1일 |
| **검증 지표** | 오후 에너지, 밤 수면 영향 |

---

## 카테고리 6: 일상 결정

### S1-S: 아침 플래닝

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 오늘 하루 계획 |
| **Pain Quote** | "오늘 뭘 해야 하지?" |
| **입력 데이터** | Readiness, Sleep, 캘린더 |
| **막힌 행동** | Day Type 결정 (Push/Normal/Recovery) |
| **Output** | "Readiness 82. 오늘은 Push Day. 어려운 일 오전에." |
| **툴** | Morning Bot, Daily Briefing |
| **Entry Point** | 기상 직후 |
| **Build Time** | 2-3일 |
| **검증 지표** | 하루 생산성 만족도 |

### S1-T: 사회적 약속 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 친구 만남/파티 참석 |
| **Pain Quote** | "피곤한데 약속 가야 하나" |
| **입력 데이터** | Readiness, 사회적 에너지, 약속 중요도 |
| **막힌 행동** | Go / Reschedule / Short visit |
| **Output** | "에너지 낮음. 1시간만 얼굴 비추고 빠지는 건?" |
| **툴** | Calendar Integration |
| **Entry Point** | 약속 2시간 전 |
| **Build Time** | 2일 |
| **검증 지표** | 사회적 피로 감소 |

### S1-U: 새로운 일 시작 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 새 프로젝트/습관 시작 |
| **Pain Quote** | "시작은 하는데 못 이어가" |
| **입력 데이터** | Readiness 트렌드, 스트레스 레벨 |
| **막힌 행동** | Start Now / Wait for better window |
| **Output** | "이번 주 평균 Readiness 낮음. 다음 주 월요일 시작 추천." |
| **툴** | Planning Assistant |
| **Entry Point** | 새 시작 고민 시 |
| **Build Time** | 3일 |
| **검증 지표** | 새 습관 유지율 |

---

## 카테고리 7: 창작/학습

### S1-V: 창작 작업 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 글쓰기, 디자인, 코딩 |
| **Pain Quote** | "창작이 안 되는 날이 있다" |
| **입력 데이터** | HRV, Readiness, 시간대 |
| **막힌 행동** | Create / Consume / Rest |
| **Output** | "창의력 피크. 지금 2시간 글쓰기 추천." |
| **툴** | Creative Mode Trigger |
| **Entry Point** | 작업 시작 전 |
| **Build Time** | 2일 |
| **검증 지표** | 창작 아웃풋 품질 |

### S1-W: 학습 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 새로운 것 배우기 |
| **Pain Quote** | "공부해도 머리에 안 들어와" |
| **입력 데이터** | Sleep (REM), Readiness |
| **막힌 행동** | Study / Review / Skip |
| **Output** | "REM 부족으로 기억력 저하. 오늘은 복습만." |
| **툴** | Learning App Integration |
| **Entry Point** | 학습 시작 전 |
| **Build Time** | 2-3일 |
| **검증 지표** | 학습 retention |

### S1-X: 문제 해결 타이밍

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 복잡한 문제 해결 |
| **Pain Quote** | "머리가 안 돌아간다" |
| **입력 데이터** | HRV, Readiness, 최근 인지 부하 |
| **막힌 행동** | Tackle / Break down / Delegate |
| **Output** | "인지 능력 60%. 문제를 작게 쪼개거나 내일로." |
| **툴** | Problem-solving Assistant |
| **Entry Point** | 어려운 작업 시작 전 |
| **Build Time** | 2일 |
| **검증 지표** | 문제 해결 효율 |

---

## 카테고리 8: 특수 상황

### S1-Y: 여행 중 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 시차 적응 중 결정 |
| **Pain Quote** | "시차 적응 중에 실수했다" |
| **입력 데이터** | Sleep, 시차, 현지 시간 |
| **막힌 행동** | 중요 결정 여부 |
| **Output** | "시차 적응 2일차. 중요한 건 48시간 후에." |
| **툴** | Travel Mode |
| **Entry Point** | 여행 중 자동 |
| **Build Time** | 3일 |
| **검증 지표** | 여행 중 실수 감소 |

### S1-Z: 병후/회복 중 결정

| 항목 | 내용 |
|------|------|
| **타겟 상황** | 아프고 난 후 복귀 |
| **Pain Quote** | "나았다고 바로 일했다가 다시 아팠다" |
| **입력 데이터** | Readiness 트렌드, Body Temp, RHR |
| **막힌 행동** | Full return / Gradual / More rest |
| **Output** | "회복 70%. 이번 주는 50% 강도로." |
| **툴** | Recovery Tracker |
| **Entry Point** | 회복기 매일 |
| **Build Time** | 3-4일 |
| **검증 지표** | 재발률 감소 |

---

## 우선순위 매트릭스

### Tier 1: 빠른 검증 + 높은 임팩트

| ID | 솔루션 | Build Time | 임팩트 | 검증 용이성 |
|----|--------|------------|--------|------------|
| S1-A | Gmail 발송 게이트 | 3-4일 | ⭐⭐⭐ | ⭐⭐⭐ |
| S1-E | 운동 Go/No-Go | 2-3일 | ⭐⭐⭐ | ⭐⭐⭐ |
| S1-S | 아침 플래닝 | 2-3일 | ⭐⭐⭐ | ⭐⭐ |
| S1-L | 충동구매 방지 | 3-4일 | ⭐⭐⭐ | ⭐⭐ |

### Tier 2: 중간 노력 + 명확한 니즈

| ID | 솔루션 | Build Time | 임팩트 | 검증 용이성 |
|----|--------|------------|--------|------------|
| S1-H | 미팅 게이트 | 3-4일 | ⭐⭐ | ⭐⭐ |
| S1-J | 의사결정 타이밍 | 2일 | ⭐⭐⭐ | ⭐⭐ |
| S1-O | 카페인 결정 | 1일 | ⭐⭐ | ⭐⭐⭐ |
| S1-V | 창작 타이밍 | 2일 | ⭐⭐ | ⭐⭐ |

### Tier 3: 니치 but 강한 Pain

| ID | 솔루션 | Build Time | 임팩트 | 검증 용이성 |
|----|--------|------------|--------|------------|
| S1-M | 투자 결정 | 1주 | ⭐⭐⭐ | ⭐ |
| S1-K | 협상 타이밍 | 2-3일 | ⭐⭐⭐ | ⭐ |
| S1-Y | 여행 중 결정 | 3일 | ⭐⭐ | ⭐ |

---

## 툴별 그룹핑

### Browser Extensions
- S1-A: Gmail
- S1-B: Slack (web)
- S1-D: Twitter/LinkedIn
- S1-L: Amazon/쿠팡
- S1-N: 구독 서비스

### CLI / Raycast
- S1-E: 운동 결정
- S1-J: 의사결정
- S1-O: 카페인
- S1-V: 창작 타이밍

### Calendar Integration
- S1-H: 미팅 게이트
- S1-T: 사회적 약속

### Mobile / Notification
- S1-C: 문자/카톡
- S1-P: 알코올
- S1-Q: 수면 시간
- S1-S: 아침 플래닝

### Specialized Apps
- S1-F: Strava/Garmin
- S1-M: 증권앱
- S1-W: 학습앱

---

## 다음 단계

1. **Tier 1에서 1개 선택** → 1주 내 MVP
2. **검증 지표 설정** → 성공/실패 기준 명확화
3. **빌드 & 테스트** → 10명 얼리어답터
4. **Kill or Scale** → 데이터 기반 결정

---

*Last Updated: 2026-01-30*
*Total Hypotheses: 26개*
