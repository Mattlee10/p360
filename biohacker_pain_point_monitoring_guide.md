# Bio-hacker Pain Point 자동 모니터링 세팅 가이드

> 생체 데이터 기반 의사결정 솔루션 타겟 리서치를 위한 도구 세팅

---

## 📌 모니터링 대상 커뮤니티

### Reddit 서브레딧 (핵심 타겟)

| 카테고리 | 서브레딧 | 멤버수 | 설명 |
|---------|---------|-------|------|
| **Biohacking** | r/Biohackers | 27K+ | 바이오해킹 전반 |
| **Quantified Self** | r/QuantifiedSelf | - | 데이터 기반 자기 추적 |
| **Cognitive** | r/Nootropics | 156K+ | 인지 향상제 |
| **Longevity** | r/Longevity | - | 수명 연장, 안티에이징 |
| **Wearables** | r/WearableFitness | - | 웨어러블 기기 |
| **Cold Therapy** | r/BecomingTheIceman | - | Wim Hof 메소드 |
| **Diet** | r/Keto, r/IntermittentFasting | 868K+ | 식이요법 |
| **Fitness** | r/Fitness | 6.6M+ | 운동/피트니스 |
| **Transhumanism** | r/Transhumanism | 26K+ | 인간 향상 기술 |

### Discord 서버

- **The Biohacker Lounge** (~4,800명) - https://discord.gg/biohacker-lounge
- **Biohackers Digital** - RFID/임플란트 중심

---

## 🔧 도구 1: Reddit Research MCP (Claude Code용)

### 개요
- 20,000+ 서브레딧 semantic search
- Pain point 자동 발견 + 인용 출처 제공
- 무료/오픈소스

### 설치 방법

#### Step 1: MCP 서버 클론
```bash
git clone https://github.com/king-of-the-grackles/reddit-research-mcp
cd reddit-research-mcp
npm install
npm run build
```

#### Step 2: Claude Code 설정 파일 수정
위치: `~/.claude.json` 또는 프로젝트 폴더의 `.claude/mcp.json`

```json
{
  "mcpServers": {
    "reddit-research": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/reddit-research-mcp/build/index.js"],
      "env": {}
    }
  }
}
```

#### Step 3: Claude Code 재시작
```bash
claude mcp list  # 서버 확인
```

### 사용 예시 프롬프트
```
r/Biohackers와 r/QuantifiedSelf에서 최근 한 달간
"data tracking frustration" 또는 "wearable problems" 관련
pain point를 찾아줘
```

---

## 🔧 도구 2: PainOnSocial

### 개요
- AI 기반 Reddit pain point 자동 분석
- Pain score (0-100) 제공
- 실제 인용구 + 퍼머링크 제공
- 800+ 직업군별 서브레딧 추천

### 요금제

| 플랜 | 가격 | 일일 스캔 | 서브레딧 수 | 기간 |
|-----|------|----------|-----------|-----|
| Free | $0 | 1회 | 3개 | 7일 |
| Starter | $19/월 | 5회 | 10개 | 30일 |
| Enterprise | 문의 | 무제한 | 무제한 | 커스텀 |

### 세팅 방법

1. https://painonsocial.com 접속
2. 7일 무료 체험 시작
3. 아래 서브레딧으로 첫 스캔 실행:
   - r/Biohackers
   - r/QuantifiedSelf
   - r/Nootropics

---

## 🎯 생체 데이터 솔루션 관련 검색 키워드

### Pain Point 발견용 키워드

**데이터 관련**
- "too much data", "data overload"
- "don't know what to do with"
- "can't interpret", "confusing metrics"
- "actionable insights", "what does this mean"

**의사결정 관련**
- "decision fatigue", "overwhelmed by choices"
- "how do I know if", "should I change"
- "conflicting data", "contradictory"
- "when to take action"

**웨어러블 불만**
- "inaccurate", "not reliable"
- "battery life", "uncomfortable"
- "sync issues", "lost data"
- "too many apps", "fragmented"

**원하는 것**
- "wish there was", "looking for"
- "anyone know a tool that"
- "recommendation for", "alternative to"

### 경쟁사/유사 솔루션 언급 키워드
- Oura, WHOOP, Garmin, Apple Watch
- Levels (CGM), Lumen, Eight Sleep
- InsideTracker, Function Health
- Cronometer, MacroFactor

---

## 📊 모니터링 운영 제안

### 주간 루틴
1. **월요일**: PainOnSocial로 주간 스캔 (5개 핵심 서브레딧)
2. **수요일**: Reddit Research MCP로 새 키워드 탐색
3. **금요일**: 발견된 pain point 정리 및 우선순위화

### 기록 템플릿

| 날짜 | 서브레딧 | Pain Point | 빈도 | 심각도 | 출처 |
|-----|---------|-----------|-----|-------|-----|
| | | | /10 | /10 | URL |

---

## 🔗 참고 링크

- [Reddit Research MCP GitHub](https://github.com/king-of-the-grackles/reddit-research-mcp)
- [PainOnSocial](https://painonsocial.com)
- [Claude Code MCP 공식 문서](https://code.claude.com/docs/en/mcp)
- [Biohacker 서브레딧 리스트](https://daveasprey.com/best-biohacker-subreddits/)
- [Quantified Self 서브레딧](https://thehiveindex.com/topics/quantified-self/platform/reddit/)

---

*Generated for p360 Project - 2026.01.30*
