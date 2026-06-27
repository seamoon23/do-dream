# Idea Route Builder — Codex Handoff Pack

## 한 줄 정의
아이디어를 쌓아두고, 실행 가능성을 검토한 뒤, 단계별 실행 절차와 프롬프트를 트리/플로우 형태로 관리하는 로컬 우선 웹앱.

## 오늘 안에 만들 MVP 방향
- 설치형 프로그램이 아니라 `Vite + React + TypeScript` 기반 로컬 웹앱으로 먼저 구현한다.
- 데이터는 브라우저 IndexedDB에 저장한다.
- 나중에 필요하면 같은 프론트엔드를 Tauri로 감싸 Windows 설치형 앱으로 확장한다.
- AI 자동 검토는 1차 MVP에서 제외하고, 사람이 입력/수정 가능한 검토 템플릿과 점수화부터 만든다.
- 파일 첨부는 실제 바이너리 저장보다 `파일 메타데이터 + 요약 + 태그 + 체크리스트` 중심으로 시작한다. 텍스트/마크다운 파일은 본문 저장까지 허용한다.

## 핵심 화면
1. 아이디어 목록
2. 아이디어 상세
3. 리소스/첨부 관리
4. 실행 가능성 검토
5. 단계 설계 보드
6. 진행 트리/분기 화면
7. 프롬프트 라이브러리
8. 내보내기/가져오기

## 추천 기술 스택
- Frontend: Vite, React, TypeScript
- UI: Tailwind CSS + shadcn/ui 스타일 컴포넌트 구조
- State: Zustand 또는 React Context. MVP는 Context로도 충분
- DB: Dexie.js / IndexedDB
- Tree UI: React Flow
- Export: JSON, Markdown

## MVP 실행 명령 예시

```bash
npm create vite@latest idea-route-builder -- --template react-ts
cd idea-route-builder
npm install
npm install dexie dexie-react-hooks @xyflow/react lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom
npm run dev
```

## 코덱스 작업 순서
1. 이 패키지의 `AGENTS.md`를 프로젝트 루트에 복사한다.
2. `06_CODEX_PROMPT.md` 내용을 코덱스 첫 프롬프트로 입력한다.
3. `05_IMPLEMENTATION_PLAN.md`의 Phase 1부터 순차 구현한다.
4. 구현 후 `08_TEST_CHECKLIST.md`로 수동 검증한다.
