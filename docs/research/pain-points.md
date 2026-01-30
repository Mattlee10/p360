# P360 Target Pain Points Research

> **Research Date:** 2026-01-30
> **Sources:** r/Biohackers, r/QuantifiedSelf, r/ouraring
> **Target:** Bio-hackers × High-performers (English-speaking markets)

---

## Pain Point Summary

| ID | Pain Point | Core Problem | P360 Opportunity |
|----|------------|--------------|------------------|
| P1 | Data → Action 단절 | 숫자는 보이는데 행동 연결 안 됨 | **Nudge 시스템** |
| P2 | 앱 파편화 | 데이터 사일로, 연결 안 됨 | **통합 데이터 레이어** |
| P3 | 개인화 부족 | 점수가 내 상황 반영 안 함 | **컨텍스트 인식 베이스라인** |
| P4 | 피로 원인 불명 | 왜 피곤한지 특정 불가 | **인과관계 분석** |
| P5 | 정보 과부하 | 데이터 쌓이는데 인사이트 없음 | **단순화 & 우선순위화** |
| P6 | 높은 진입장벽 | 시작점을 모르겠음 | **가이드된 온보딩** |

---

## P1: 데이터는 있는데 "So What?"을 모르겠다

### User Quotes
> "My HRV was 45 yesterday and 38 today... now what?"
> — r/QuantifiedSelf

> "Readiness says 68 today versus 85 yesterday. Does that mean skip the gym or just go lighter? That's the part I'm still figuring out."
> — r/QuantifiedSelf

### Problem Definition
- 숫자는 보이는데 **행동으로 연결이 안 됨**
- "나쁘다"는 건 아는데 **얼마나 나쁜지, 뭘 해야 하는지** 모름
- 대시보드만 있고 **의사결정 가이드가 없음**

### P360 Solution Direction
- Biometric 기반 **행동 추천** (운동 강도 조절, 일정 리스케줄링)
- 단순 정보 표시 → **Nudge 메시지** 전환
- "HRV 38" → "오늘은 강도 낮춰서 운동하세요. 내일 회복 예상됩니다."

---

## P2: 앱이 너무 많고, 연결이 안 된다

### User Quotes
> "Garmin for runs, Amazfit for recovery, Apple Health as hub, FatSecret for food... they don't really work together"
> — r/QuantifiedSelf

> "The multi-source problem is real. Each app works fine solo but getting them to talk to each other is a pain."
> — r/QuantifiedSelf

> "What I'd really like is some kind of AI or smart system that can look at both my activity data and my nutrition, and then give useful, personalized feedback"
> — r/QuantifiedSelf

### Problem Definition
- 데이터 사일로 (Oura, Garmin, Apple Health, 영양 앱...)
- **Cross-correlation**이 필요한데 앱들이 단절됨
- "수면 vs 운동 vs 식단" 관계를 보려면 **직접 엔지니어링** 해야 함

### P360 Solution Direction
- Oura API 우선, 향후 다중 소스 통합
- 사용자가 파이프라인 구축할 필요 없이 **자동 상관관계 분석**
- Phase 1에서는 Oura 단일 소스로 시작 → 점진적 확장

---

## P3: 점수가 내 상황을 반영하지 않는다

### User Quotes
> "My readiness is 56-70 most days, when I'm feeling fine and kicking butt at the gym"
> — r/ouraring (GLP-1 사용자)

> "It would be really cool to have the option to flag that we're on a GLP-1 in our profiles, just like we can flag other data points so that the ring could be a bit smarter about our baselines"
> — r/ouraring

> "Night shifts and sleep score... We should be able to set our own bedtime and not have our lifestyle or job affect the sleep score."
> — r/ouraring

> "I was tired of Whoop being a subscription so I made the habit tracking part into an app myself."
> — r/QuantifiedSelf

### Problem Definition
- GLP-1 복용, 야간 근무, 개인 상황이 **베이스라인에 반영 안 됨**
- 점수가 낮으면 괜찮아도 **불안해지는 역설** (디지털 노시보 효과)
- 개인화 부족으로 **신뢰도 하락**

### P360 Solution Direction
- **컨텍스트 태그** (약물, 근무 패턴, 생리주기 등) 반영
- 절대 점수보다 **개인 베이스라인 대비 변화** 강조
- "Sleep Wearable Paradox" 해결: 주관적 느낌 + 객관적 데이터 균형

---

## P4: 항상 피곤하다, 왜인지 모르겠다

### User Quotes
> "What do you guys do to stay productive and avoid feeling tired all day?"
> — r/Biohackers (59 upvotes, 51 comments)

> "Sick 3x in 3 months... I have no idea why this happens. I have friends who sleep six hours a night and drink almost every weekend and don't get sick as me."
> — r/Biohackers

> "At home sleep test reveals I have no sleep apnea but only 19 minutes of REM sleep... Not sure where else to go after this."
> — r/Biohackers

### Problem Definition
- 만성 피로의 **근본 원인 파악 어려움**
- 수면, 운동, 영양, 스트레스 중 **뭐가 문제인지** 특정 불가
- 혈액검사도 정상인데 여전히 피곤함

### P360 Solution Direction
- **단일 변수 추적** 권장 (한 번에 하나씩 실험)
- 피로 원인 후보 **우선순위화** (가장 가능성 높은 것부터)
- 패턴 기반 **가설 제시**: "지난 3일 Deep Sleep 부족. 이게 원인일 수 있습니다."

---

## P5: 정보 과부하 & 분석 마비

### User Quotes
> "Rate my stack" (20개 이상의 서플리먼트 나열)
> — r/Biohackers

> "There are lots of good apps, but none of them really does everything"
> — r/QuantifiedSelf

> "Charts and numbers... very little interpretation"
> — r/QuantifiedSelf

### Problem Definition
- 너무 많은 변수를 추적하다가 **핵심을 놓침**
- 데이터는 쌓이는데 **인사이트로 전환이 안 됨**
- "뭘 더 해야 하지?"의 무한 루프

### P360 Solution Direction
- **단 하나의 핵심 지표**에 집중 (오늘의 Decision Readiness)
- 복잡한 데이터 → **단순한 행동 권고** 변환
- "Less is More" 철학: 20개 차트 대신 1개의 명확한 가이드

---

## P6: 최적화는 하고 싶은데 너무 복잡하다

### User Quotes
> "I'm 19... What would be the best small/simple habits you would recommend?"
> — r/Biohackers

> "Where to start?"
> — r/Biohackers (111 upvotes)

### Problem Definition
- 바이오해킹에 관심은 있지만 **진입장벽이 높음**
- 정보는 넘치는데 **신뢰할 수 있는 시작점**이 없음
- n=1 실험을 하고 싶지만 **방법론을 모름**

### P360 Solution Direction
- **가이드된 첫 걸음**: "Oura 연결하세요. 나머지는 저희가."
- 복잡한 설정 없이 **즉시 가치** 제공
- Phase 1 Tool-first: 파워유저도 쉽게 쓸 수 있어야 함

---

## Key Insight

> **모든 Pain Point는 결국 P1으로 수렴한다.**
>
> 앱이 많아서 → 어디서 답을 찾아야 하는지 모름 (P2)
> 점수가 안 맞아서 → 믿고 행동할 수 없음 (P3)
> 피곤한 이유를 몰라서 → 뭘 해야 할지 모름 (P4)
> 정보가 너무 많아서 → 뭘 해야 할지 모름 (P5)
> 시작점을 몰라서 → 뭘 해야 할지 모름 (P6)
>
> **P360의 핵심 가치: "데이터 → 행동" 연결**

---

## Next Steps

- [ ] P1 해결을 위한 MVP 기능 정의
- [ ] 각 Pain Point별 구체적 사용자 시나리오 작성
- [ ] r/Biohackers, r/ouraring에서 추가 인터뷰 대상 탐색
- [ ] 경쟁 제품의 Pain Point 해결 방식 분석

---

## Research Methodology

### Sources Analyzed
- r/Biohackers: Hot 25 posts + "Always tired" 댓글 51개
- r/QuantifiedSelf: Hot 25 posts + "HRV day to day" + "AI health apps" 댓글
- r/ouraring: Hot 25 posts + "GLP-1 Feature Request" 댓글 19개

### Limitations
- Reddit 유저 = Early Adopter 편향
- 영어권 시장 한정
- 정량적 검증 필요 (설문, 인터뷰)

---

*Last Updated: 2026-01-30*
