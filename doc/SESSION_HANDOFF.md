# Do Dream 세션 인수인계

이 문서는 다음 Codex/GPT 세션에서 프로젝트 상태를 빠르게 이어받기 위한 기록이다. 함께 참고할 작업 문서는 `doc/TASK_ROUTE_TEMPLATE_PLUGIN.md`다.

## 1. 프로젝트 정체성

- 제품명: `Do Dream`
- 부제/설명명: `Idea Route Builder`
- 의미: "아이디어를 해드림, 실행을 두드림"
- 목적: 아이디어, 자료, 실행 단계, 프롬프트, 진행 판단, 진행 트리를 로컬 우선 방식으로 관리하는 개인용 웹앱
- 저장 방식: 서버 없이 브라우저 IndexedDB 사용
- MVP 제외: 로그인, 서버 저장, 외부 AI API 직접 호출, 첨부 파일 본문 자동 분석, 협업/동기화

## 2. 기술 스택

- Vite
- React
- TypeScript
- Tailwind CSS
- Dexie.js / IndexedDB
- React Flow
- lucide-react

## 3. Git/GitHub 상태

- 기준 원격 저장소: `https://github.com/seamoon23/do-dream.git`
- 기본 브랜치: `master`
- 작업 브랜치: `codex/route-template-plugin-system`
- 원격 작업 브랜치: `origin/codex/route-template-plugin-system`
- 최신 작업 커밋:
  - `ee23599 feat: add route template plugin architecture`
  - `506bb9e fix: exclude template scaffolds from readiness`
- PR 생성 시도:
  - GitHub 앱 커넥터 `_create_pull_request`는 `403 Resource not accessible by integration`으로 실패
  - `gh` CLI는 설치되어 있지 않음
  - 수동 PR URL: `https://github.com/seamoon23/do-dream/pull/new/codex/route-template-plugin-system`

다음 세션 시작 시 확인:

```powershell
git status --short
git branch --show-current
git remote -v
git log --oneline -5
```

주의:

- 기존 변경을 임의로 되돌리지 말 것.
- `.git` 쓰기는 샌드박스 권한 문제로 escalation이 필요할 수 있음.
- `npm run build`와 `npm run dev`는 Windows/esbuild `spawn EPERM` 때문에 권한 상승 실행이 필요할 수 있음.
- PowerShell 출력에서 한국어가 깨져 보일 수 있다. 브라우저/파일 자체가 깨진 것은 아닐 수 있으므로 성급히 인코딩 변환하지 말 것.

## 4. 실행/검증 명령

프로젝트 폴더:

```powershell
cd "C:\Users\seamo\OneDrive\문서\APP_WEB"
```

개발 서버:

```powershell
npm run dev
```

개발 서버 주소:

```text
http://127.0.0.1:5173
```

타입체크/빌드:

```powershell
npm run typecheck
npm run build
```

최근 검증:

- `npm run typecheck`: 성공
- `npm run build`: 성공
- `http://127.0.0.1:5173/`: HTTP 200 확인

## 5. 구현된 기능 요약

### 기존 MVP

- 홈 대시보드
- 아이디어 정리
- 자료 모으기
- 프롬프트 준비
- 실행 계획
- 진행 판단
- 흐름 보기
- 보관함
- 전체 JSON 백업, 선택 아이디어 Markdown Export, JSON 복원/병합

### Route Template / Agent Plugin

- Plain Mode 추가
- Route Template 타입/레지스트리 추가
- Agent Plugin 타입/레지스트리 추가
- `웹소설 1화 완성 루트` 템플릿 추가
- 웹소설용 에이전트 4종 추가
  - 아이디어 회의 에이전트
  - 편집자 에이전트
  - 문장 검수 에이전트
  - 가상 독자 피드백 에이전트
- 새 아이디어 생성 화면에서 루트 템플릿 선택 가능
- 키워드 기반 템플릿 추천
- 기존 아이디어에 선택 루트 적용 가능
- 템플릿 적용 시 seed 데이터 생성
  - 단계
  - 자료 후보
  - 프롬프트
  - 흐름 노드
  - 흐름 연결
- 프롬프트 준비 화면에서 에이전트 요청서 복사 가능
- 홈 대시보드에서 템플릿 전용 카드와 에이전트 목록 표시
- 진행 판단 화면에서 템플릿 검토 기준 표시
- 외부 AI API 연동 없음

### 실행준비체크 보정

템플릿이 자동 생성한 골격이 실질 완료율로 보이는 문제를 수정했다.

- `sourceTemplateId`가 있는 템플릿 자동 생성 단계/자료/프롬프트/흐름 노드는 기본적으로 완료율에서 제외
- 실제 자료는 사용자 입력 자료 또는 `VALID` 확인 자료 중심으로 계산
- 단계는 템플릿 TODO 상태가 아니라 실제 진행이 시작된 항목 중심으로 계산
- 대시보드에 템플릿 골격은 완료율에 넣지 않는다는 안내 표시

## 6. 데이터 모델 변경

기존 Dexie 테이블은 유지하고 optional 필드를 추가했다.

- `Idea`
  - `templateId?: string`
  - `templateAppliedAt?: string`
- `Resource`
  - `sourceTemplateId?: string`
  - `sourceAgentId?: string`
- `Stage`
  - `sourceTemplateId?: string`
- `FlowNode`
  - `sourceTemplateId?: string`
- `FlowEdge`
  - `sourceTemplateId?: string`
- `PromptTemplate`
  - `sourceTemplateId?: string`
  - `sourceAgentId?: string`
- `AiReport`
  - `sourceAgentId?: string`
- `BackupPayload.version`
  - `1 | 2 | 3`

백업 내보내기는 version 3으로 올렸고, 가져오기는 version 1/2/3을 허용한다.

## 7. 주요 파일 구조

```text
src/
  App.tsx
  agentPlugins/
    types.ts
    registry.ts
    novel/
      ideaMeetingAgent.ts
      editorAgent.ts
      proofreaderAgent.ts
      readerFeedbackAgent.ts
  components/
    DashboardPanel.tsx
    FlowPanel.tsx
    ReviewPanel.tsx
    WorkspacePanels.tsx
    flowVisuals.tsx
    ui.tsx
  db/
    database.ts
  lib/
    aiReport.ts
    clipboard.ts
    content.ts
    format.ts
    markdown.ts
    review.ts
  routePlugins/
    types.ts
    registry.ts
    plain.ts
    novelFirstEpisode.ts
  templateEngine/
    applyRouteTemplate.ts
    createSeedData.ts
    keywordRouter.ts
  types/
    domain.ts
doc/
  SESSION_HANDOFF.md
  TASK_ROUTE_TEMPLATE_PLUGIN.md
```

## 8. 남은 진행 가능 작업

1. GitHub PR 생성
   - 커넥터 권한과 `gh` 부재로 자동 생성은 막힘
   - 브라우저에서 수동 PR URL을 열어 생성 가능
2. 웹소설 루트 UX 점검
   - 새 아이디어 생성
   - 웹소설 루트 적용
   - 대시보드 완료율
   - 프롬프트 준비 탭의 에이전트 요청서 복사
3. 다음 템플릿 추가
   - 전자책 초안 완성 루트
   - 게임 프로토타입 루트
   - 광고 수익형 미니 웹앱 루트
   - 크롬 확장 프로그램 루트
   - 모바일 앱 MVP 루트
4. `doc/TASK_ROUTE_TEMPLATE_PLUGIN.md`를 구현 완료 상태에 맞춰 별도 정리할지 검토

## 9. 다음 세션 권장 시작 순서

1. `doc/SESSION_HANDOFF.md` 읽기
2. `git status --short --branch` 확인
3. `npm run typecheck` 또는 `npm run build`로 기준 상태 확인
4. PR 생성 또는 다음 템플릿 작업 범위 선택
