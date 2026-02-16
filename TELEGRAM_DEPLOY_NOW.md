# Telegram Bot Railway 배포 - 지금 바로 하기

## 🚀 빠른 배포 가이드 (20분)

이 문서는 Telegram 봇만 배포할 때 사용하는 빠른 가이드입니다.

---

## Step 1️⃣ : 토큰 & 키 준비 (5분)

### Telegram Bot Token 받기
1. Telegram 열기
2. **@BotFather** 검색
3. `/newbot` 명령 실행
4. 봇 이름, 사용자명 설정
5. **토큰 복사** (형식: `123456789:ABCdefGHIJKlmnoPQRstuvWXYZ`)
6. 안전하게 저장

### API 키 준비

**Anthropic API Key:**
- https://console.anthropic.com 접속
- API Keys 섹션
- 새 키 생성 또는 기존 키 복사

**Oura API Key:**
- https://cloud.ouraring.com 접속
- API 키 조회
- 복사해서 저장

**Optional - Supabase (데이터 저장용):**
- https://supabase.com 접속
- 프로젝트 생성
- Settings → API에서 가져오기:
  - Project URL → SUPABASE_URL
  - Anon Key → SUPABASE_ANON_KEY
  - Service Role Key → SUPABASE_SERVICE_ROLE_KEY

---

## Step 2️⃣ : Railway 프로젝트 생성 (3분)

1. https://railway.app 접속
2. **"New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. GitHub 계정 연결 (처음이면)
5. **p360** 저장소 찾기
6. 선택 & 기다리기 (2-3분)

Railway가 자동으로:
- ✅ Procfile 감지
- ✅ Telegram 서비스 생성
- ✅ package.json 빌드 스크립트 인식

---

## Step 3️⃣ : 환경 변수 설정 (3분)

Railway 대시보드에서:

1. **Telegram 서비스** 클릭
2. **Settings** 탭 → **Environment**
3. 아래 4개 변수 추가:

```
TELEGRAM_BOT_TOKEN=abc123...xyz (위에서 복사한 토큰)
ANTHROPIC_API_KEY=sk-...
OURA_API_KEY=your_oura_key
P360_USER_ID=bot-default
```

**Optional - Supabase를 사용한다면:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

✅ 모두 입력했으면 저장

---

## Step 4️⃣ : 배포 시작! (10초)

1. Railway 대시보드에서 **Telegram 서비스** 선택
2. **Deploy** 버튼 클릭
3. 빌드 시작... (2-3분 기다리기)

빌드 중에 보이는 것:
```
npm install (의존성 설치)
npm run build (TypeScript 컴파일)
npm start (봇 시작)
```

---

## Step 5️⃣ : 확인 & 테스트 (2분)

### 로그 확인
Railway 대시보드 → **Logs** 탭에서:

✅ 성공하면 보이는 메시지:
```
✅ Bot started: @your_bot_name
Available commands:
  /workout          - Check workout readiness
  /workout bball    - Sport-specific guide
  /sports           - List available sports
  /drink            - Check drinking limit
  /drink log N      - Log drinks
  /why              - Mind vs Body analysis
  /mood N           - Log mood
  /cost beer 3      - Recovery cost simulator
  /ask question     - AI-powered advice
  /connect          - Link Oura/WHOOP
  /demo             - Try with demo data
  /help             - Show all commands

[cron] ✅ Cron job scheduled: Daily outcome resolution at 00:00 UTC
```

### Telegram에서 테스트

1. Telegram 열기
2. 당신의 봇 찾기: **@your_bot_username**
3. **/demo** 명령 실행
4. 🎉 데모 데이터로 Workout Readiness 받기

성공 응답 예시:
```
🏋️ TRAIN HARD
Your body is ready for intense training

HRV: +23% above baseline (Excellent)
Sleep: 7h 45m (Good recovery)
Resting Heart Rate: 52 bpm (Excellent)

This is a green day for heavy lifting, HIIT, or team sports.
```

### 더 테스트하기

```
/workout          → 기본 workout readiness
/workout bball    → Basketball 특화 조언
/sports           → 사용 가능한 스포츠 목록
/drink            → Drinking limit
/demo             → 다른 데모 보기
/help             → 모든 명령 보기
```

---

## ⏱️ 소요 시간 정리

| 단계 | 시간 | 설명 |
|------|------|------|
| 1. 토큰 준비 | 5분 | Telegram @BotFather + API 키 |
| 2. Railway 생성 | 3분 | GitHub 연결 → 저장소 선택 |
| 3. 변수 설정 | 3분 | 4개 환경 변수 추가 |
| 4. 배포 | 3분 | Deploy 클릭 → 빌드 진행 |
| 5. 테스트 | 2분 | /demo 명령 테스트 |
| **합계** | **20분** | **배포 완료!** |

---

## 🎯 체크리스트

### 배포 전
- [ ] Telegram 봇 토큰 복사함
- [ ] Anthropic API 키 준비함
- [ ] Oura API 키 준비함
- [ ] GitHub 계정으로 Railway 로그인 준비됨

### 배포 중
- [ ] Railway 새 프로젝트 생성함
- [ ] GitHub에서 p360 선택함
- [ ] Telegram 서비스 생성됨 (auto)
- [ ] 4개 환경 변수 입력함
- [ ] Deploy 버튼 클릭함

### 배포 후
- [ ] Logs에서 "✅ Bot started" 확인함
- [ ] Telegram에서 /demo 테스트함
- [ ] 응답 받음 (workout readiness)
- [ ] /workout, /drink, /why 등 테스트함

---

## 🚨 문제 해결

### "Error: TELEGRAM_BOT_TOKEN not set"
→ Railway dashboard → Telegram Service → Settings → Environment
→ TELEGRAM_BOT_TOKEN 추가했는지 확인

### "Service crashed"
→ Logs 탭에서 에러 메시지 확인
→ 보통은 환경 변수 누락

### "Bot doesn't respond"
→ 서비스 상태가 "Running"인지 확인
→ Logs에서 에러 있는지 확인
→ /demo 먼저 시도해보기

### "Command not found"
→ /help 실행해서 모든 명령 확인
→ Logs에서 bot started 메시지 확인

---

## 📊 배포 후 뭐가 일어나나?

### 자동으로 실행됨:
✅ Telegram 명령 24/7 대기
✅ 매일 00:00 UTC에 cron job 실행 (outcome 해결)
✅ 사용자 데이터 저장 (Supabase 설정했으면)
✅ Causality profile 생성

### 당신이 모니터링할 것:
📊 로그 확인 (`railway logs --follow`)
🧪 일일 테스트 (몇 명이 사용하는지)
⚠️ 에러 감시

---

## 📈 다음 단계 (24시간 후)

### 확인 사항
- [ ] Bot이 계속 Running 상태
- [ ] 로그에 에러 없음
- [ ] Cron job이 매일 실행됨
- [ ] 메모리 사용량 < 250MB

### 사용자 공유
```
봇 링크: https://t.me/your_bot_username

제 봇이 이런 걸 할 수 있어요:
/workout - 오늘 운동해도 되는지 체크
/drink - 술 마셔도 되는지 체크
/why - 피로의 원인 분석
/mood - 기분 기록
/cost - 회복 비용 계산
/ask - AI 조언
/demo - 데모 보기
```

---

## 🔗 유용한 링크

- **Railway Dashboard**: https://railway.app/dashboard
- **Railway Logs**: Railway Dashboard → Services → Telegram → Logs
- **Full Guide**: RAILWAY_DEPLOYMENT.md (자세한 버전)
- **Checklist**: DEPLOYMENT_CHECKLIST.md (상세 체크)

---

## ✨ 배포 완료!

축하합니다! 🎉

당신의 Telegram 봇이 이제:
- ✅ 24/7 온라인 상태 유지
- ✅ 어디서든 접근 가능
- ✅ 자동으로 재시작
- ✅ 일일 cron job 실행
- ✅ 사용자 데이터 추적

---

**배포 시간**: 2026-02-16
**상태**: 🟢 준비 완료
**다음**: https://railway.app/dashboard 열고 배포 시작!
