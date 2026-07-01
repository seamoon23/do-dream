# Idea Route Builder vNext 작업 계획서

## Route Template / Agent Plugin 구조 도입

## 0. 작업 전 필수 확인

작업 시작 전에 반드시 현재 작업물의 Git 상태를 확인한다.

```bash
git status --short
git branch --show-current
git remote -v
git log --oneline -5
```

### 작업 전 체크 규칙

1. `git status --short` 결과가 비어 있으면 바로 작업 가능하다.
2. 수정 파일이 있으면 어떤 파일이 변경되었는지 먼저 요약한다.
3. 기존 변경분이 현재 작업과 관련 없는 경우 임의로 덮어쓰지 않는다.
4. 기존 변경분이 사용자의 미커밋 작업물일 수 있으므로 삭제, 초기화, 강제 checkout, hard reset 금지.
5. 작업 전 상태를 보존하기 위해 가능하면 현재 상태를 커밋하거나 별도 브랜치를 만든다.

권장 브랜치명:

```bash
git checkout -b feature/route-template-plugin-system
```

작업 완료 후에는 다음을 수행한다.

```bash
npm run build
git status --short
```

가능하면 커밋까지 진행한다.

```bash
git add .
git commit -m "Add route template and agent plugin architecture"
```

원격 push 가능 상태라면 push한다.

```bash
git push -u origin feature/route-template-plugin-system
```

단, 인증/권한 문제로 push가 실패하면 실패 사유와 현재 커밋 해시를 보고한다.

---

# 1. 작업 목적

Idea Route Builder는 기존의 기본 기능을 유지하면서, 특정 목표에 맞는 실행 루트 템플릿과 보조 에이전트를 추가할 수 있는 구조로 확장한다.

현재 앱의 핵심은 다음과 같다.

* 아이디어 정리
* 자료 모으기
* 프롬프트 준비
* 실행 계획
* 진행 판단
* 흐름 보기
* 보관함
* 로컬 우선 IndexedDB 저장
* 외부 AI API 직접 호출 없음
* GPT / Claude / Gemini / Codex 등에 복사/붙여넣기 방식으로 협업

이 구조는 유지한다.

새로 도입할 방향은 다음과 같다.

> 기본 앱은 Plain Mode로 계속 사용할 수 있고,
> 필요할 때만 웹소설, 전자책, 앱 개발, 게임 개발, 광고 수익화 같은 전문 루트 템플릿을 적용할 수 있게 한다.

---

# 2. 핵심 개념

## 2.1 Plain Mode

템플릿을 적용하지 않은 기본 아이디어 관리 모드다.

특징:

* 기존 아이디어 CRUD 유지
* 기존 자료/단계/프롬프트/진행 판단/흐름 보기 유지
* 특정 분야에 종속되지 않음
* 사용자가 직접 단계와 프롬프트를 구성

Plain Mode는 항상 기본값으로 남겨둔다.

---

## 2.2 Route Template

특정 목표를 달성하기 위한 실행 루트 스타터팩이다.

예시:

* 웹소설 1화 완성 루트
* 전자책 초안 완성 루트
* 모바일 앱 MVP 루트
* 크롬 확장 프로그램 출시 루트
* 게임 프로토타입 루트
* 광고 수익형 미니 웹앱 루트

Route Template은 다음 데이터를 자동 생성한다.

* 실행 단계
* 기본 프롬프트
* 자료 후보
* 진행 판단 기준
* 흐름 노드 초안
* 홈 대시보드용 강조 카드
* 다음 행동 후보

---

## 2.3 Agent Plugin

출판사, 기획자, 편집자, 독자, 검수자처럼 특정 역할을 가진 AI 협업 요청서 묶음이다.

주의:

* 실제 AI API를 호출하지 않는다.
* 앱 내부에서 에이전트가 자동 실행되는 것이 아니다.
* 앱은 에이전트별 요청서를 생성하고 복사/다운로드할 수 있게 한다.
* 사용자는 GPT, Claude, Gemini 등에 붙여넣고, 응답을 앱에 다시 저장한다.

예시 에이전트:

* 아이디어 회의 에이전트
* 편집자 에이전트
* 오타/문장 검수 에이전트
* 독자 피드백 에이전트
* 시장성 검토 에이전트
* 리스크 검토 에이전트
* 다음 행동 설계 에이전트

---

# 3. 전체 구조 목표

기존 기능을 직접 수정해서 특정 템플릿에 종속시키지 말고, 플러그인 레지스트리 방식으로 확장한다.

목표 구조:

```text
src/
  routePlugins/
    types.ts
    registry.ts
    plain.ts
    novelFirstEpisode.ts
  agentPlugins/
    types.ts
    registry.ts
    novel/
      ideaMeetingAgent.ts
      editorAgent.ts
      proofreaderAgent.ts
      readerFeedbackAgent.ts
  templateEngine/
    applyRouteTemplate.ts
    createSeedData.ts
    keywordRouter.ts
```

---

# 4. 타입 설계

## 4.1 RouteTemplate 타입

`src/routePlugins/types.ts` 파일을 만든다.

```ts
export type RouteTemplateCategory =
  | 'plain'
  | 'writing'
  | 'publishing'
  | 'app'
  | 'web'
  | 'game'
  | 'monetization'
  | 'automation'
  | 'custom';

export type RouteTemplateSeedStage = {
  title: string;
  order: number;
  status?: string;
  difficulty?: number;
  goal: string;
  doneCriteria: string;
  requiredInputs?: string;
  expectedOutput?: string;
  tags?: string[];
};

export type RouteTemplateSeedPrompt = {
  title: string;
  tool?: 'Codex' | 'Claude Code' | 'Gemini' | 'General';
  body: string;
  stageTitle?: string;
  variables?: string[];
  version?: string;
  tags?: string[];
};

export type RouteTemplateSeedResource = {
  type: string;
  title: string;
  summary?: string;
  importance?: 'low' | 'medium' | 'high';
  reviewStatus?: string;
  tags?: string[];
};

export type RouteTemplateSeedFlowNode = {
  title: string;
  nodeType?: 'stage' | 'issue' | 'decision' | 'branch' | 'note';
  status?: string;
  memo?: string;
  stageTitle?: string;
};

export type RouteTemplateSeedFlowEdge = {
  sourceTitle: string;
  targetTitle: string;
  label?: string;
  edgeType?: 'sequence' | 'dependency' | 'decision' | 'reference';
};

export type RouteTemplateReviewCriterion = {
  key: string;
  label: string;
  description: string;
  lowGuide?: string;
  highGuide?: string;
};

export type RouteTemplateHomeCard = {
  key: string;
  title: string;
  description: string;
};

export type RouteTemplate = {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  category: RouteTemplateCategory;
  recommendedFor: string[];
  outcome: string;
  tags: string[];

  seedStages: RouteTemplateSeedStage[];
  seedPrompts: RouteTemplateSeedPrompt[];
  seedResources?: RouteTemplateSeedResource[];
  seedFlowNodes?: RouteTemplateSeedFlowNode[];
  seedFlowEdges?: RouteTemplateSeedFlowEdge[];

  reviewCriteria?: RouteTemplateReviewCriterion[];
  homeCards?: RouteTemplateHomeCard[];

  starterQuestions?: string[];
  keywordHints?: string[];
};
```

---

## 4.2 AgentPlugin 타입

`src/agentPlugins/types.ts` 파일을 만든다.

```ts
export type AgentPluginCategory =
  | 'ideation'
  | 'planning'
  | 'editing'
  | 'proofreading'
  | 'reader-feedback'
  | 'market-review'
  | 'risk-review'
  | 'next-action'
  | 'custom';

export type AgentPromptPreset = {
  id: string;
  title: string;
  description: string;
  body: string;
  variables?: string[];
};

export type AgentPlugin = {
  id: string;
  name: string;
  roleName: string;
  description: string;
  category: AgentPluginCategory;
  supportedTemplateIds?: string[];
  tags: string[];
  promptPresets: AgentPromptPreset[];
};
```

---

# 5. 레지스트리 구조

## 5.1 Route Template Registry

`src/routePlugins/registry.ts`

```ts
import type { RouteTemplate } from './types';
import { plainRouteTemplate } from './plain';
import { novelFirstEpisodeTemplate } from './novelFirstEpisode';

export const routeTemplates: RouteTemplate[] = [
  plainRouteTemplate,
  novelFirstEpisodeTemplate,
];

export function getRouteTemplateById(id: string): RouteTemplate | undefined {
  return routeTemplates.find((template) => template.id === id);
}
```

---

## 5.2 Agent Plugin Registry

`src/agentPlugins/registry.ts`

```ts
import type { AgentPlugin } from './types';
import { novelIdeaMeetingAgent } from './novel/ideaMeetingAgent';
import { novelEditorAgent } from './novel/editorAgent';
import { novelProofreaderAgent } from './novel/proofreaderAgent';
import { novelReaderFeedbackAgent } from './novel/readerFeedbackAgent';

export const agentPlugins: AgentPlugin[] = [
  novelIdeaMeetingAgent,
  novelEditorAgent,
  novelProofreaderAgent,
  novelReaderFeedbackAgent,
];

export function getAgentsForTemplate(templateId?: string): AgentPlugin[] {
  if (!templateId) return agentPlugins;

  return agentPlugins.filter((agent) => {
    if (!agent.supportedTemplateIds || agent.supportedTemplateIds.length === 0) {
      return true;
    }

    return agent.supportedTemplateIds.includes(templateId);
  });
}
```

---

# 6. Plain Template

`src/routePlugins/plain.ts`

```ts
import type { RouteTemplate } from './types';

export const plainRouteTemplate: RouteTemplate = {
  id: 'plain',
  name: '기본 아이디어 보드',
  shortName: 'Plain',
  description: '특정 분야 템플릿 없이 아이디어, 자료, 프롬프트, 실행 단계를 자유롭게 정리합니다.',
  category: 'plain',
  recommendedFor: [
    '아직 방향이 정해지지 않은 아이디어',
    '자유롭게 정리하고 싶은 개인 프로젝트',
    '템플릿 없이 직접 단계를 구성하고 싶은 경우',
  ],
  outcome: '아이디어와 실행 자료를 자유롭게 정리한 개인 작업 보드',
  tags: ['기본', '자유형', '아이디어'],
  seedStages: [],
  seedPrompts: [],
  seedResources: [],
  seedFlowNodes: [],
  seedFlowEdges: [],
  starterQuestions: [
    '무엇을 만들고 싶은가?',
    '왜 만들고 싶은가?',
    '누가 사용할 것인가?',
    '오늘 바로 할 수 있는 가장 작은 행동은 무엇인가?',
  ],
  keywordHints: [],
};
```

---

# 7. 웹소설 1화 완성 루트 템플릿

`src/routePlugins/novelFirstEpisode.ts`

## 7.1 템플릿 목적

웹소설을 쓰고 싶지만 어디서 시작해야 할지 모르는 사용자를 위해, 작은 키워드에서 시작해 1화 초안까지 갈 수 있도록 돕는다.

사용자는 처음에 다음 정도만 입력해도 된다.

* 책을 쓰고 싶어
* 웹소설을 써보고 싶어
* 판타지 글을 써보고 싶어
* 네이버 시리즈 같은 곳에 올려보고 싶어
* 헌터물 하나 써보고 싶어

앱은 부족한 요소를 찾아주고, 단계적으로 고도화할 수 있게 한다.

---

## 7.2 단계 구성

웹소설 템플릿 적용 시 다음 실행 단계가 생성되어야 한다.

1. 작은 키워드 확장
2. 장르와 목표 독자 정하기
3. 핵심 콘셉트 만들기
4. 독자 기대 분석
5. 주인공 캐릭터 설계
6. 조연/적대자 설계
7. 최소 세계관 설계
8. 1~5화 파일럿 플롯 만들기
9. 1화 후킹 설계
10. 1화 초안 작성
11. 출판사식 편집 피드백
12. 오타/문장 검수
13. 가상 독자 피드백
14. 수정본 정리
15. 다음 회차 행동 정하기

---

## 7.3 코드 초안

```ts
import type { RouteTemplate } from './types';

export const novelFirstEpisodeTemplate: RouteTemplate = {
  id: 'novel-first-episode',
  name: '웹소설 1화 완성 루트',
  shortName: '웹소설 1화',
  description:
    '작은 키워드에서 시작해 장르, 콘셉트, 캐릭터, 세계관, 1~5화 플롯, 1화 초안, 편집 피드백까지 이어지는 웹소설 시작 루트입니다.',
  category: 'writing',
  recommendedFor: [
    '웹소설을 써보고 싶지만 시작하지 못한 사람',
    '판타지, 현대판타지, 헌터물, 로맨스판타지 등 장르 글을 써보고 싶은 사람',
    'AI와 함께 첫 원고를 완성해보고 싶은 사람',
  ],
  outcome: '웹소설 1화 초안과 수정 방향',
  tags: ['웹소설', '글쓰기', '출판', '1화', 'AI협업'],

  starterQuestions: [
    '어떤 글을 써보고 싶은가?',
    '떠오르는 키워드가 있다면 무엇인가?',
    '좋아하는 장르나 작품은 무엇인가?',
    '무거운 분위기와 가벼운 분위기 중 어느 쪽이 좋은가?',
    '1화에서 독자가 어떤 감정을 느끼면 좋겠는가?',
  ],

  keywordHints: [
    '책을 쓰고 싶어',
    '출판하고 싶어',
    '웹소설을 쓰고 싶어',
    '판타지 글을 쓰고 싶어',
    '네이버 시리즈',
    '카카오페이지',
    '헌터물',
    '회귀물',
    '로맨스판타지',
  ],

  seedStages: [
    {
      order: 1,
      title: '작은 키워드 확장',
      status: 'todo',
      difficulty: 1,
      goal: '막연한 키워드를 작품 후보로 확장한다.',
      doneCriteria: '작품 방향 후보 3개와 가장 끌리는 방향 1개를 정한다.',
      requiredInputs: '책을 쓰고 싶어, 판타지, 헌터, 가족, 복수, 성장 등 작은 키워드',
      expectedOutput: '작품 후보 3개, 추천 방향 1개',
      tags: ['시작', '키워드'],
    },
    {
      order: 2,
      title: '장르와 목표 독자 정하기',
      status: 'todo',
      difficulty: 1,
      goal: '작품의 장르, 분위기, 목표 독자를 정한다.',
      doneCriteria: '장르, 분위기, 목표 독자, 연재 목표가 1차 확정된다.',
      requiredInputs: '좋아하는 작품, 쓰고 싶은 장르, 피하고 싶은 클리셰',
      expectedOutput: '작품 방향성 카드',
      tags: ['장르', '독자'],
    },
    {
      order: 3,
      title: '핵심 콘셉트 만들기',
      status: 'todo',
      difficulty: 2,
      goal: '한 문장으로 설명 가능한 작품 콘셉트를 만든다.',
      doneCriteria: '로그라인 1개와 대체안 2개를 확보한다.',
      requiredInputs: '장르, 주인공 아이디어, 세계관, 핵심 갈등',
      expectedOutput: '작품 로그라인',
      tags: ['콘셉트', '로그라인'],
    },
    {
      order: 4,
      title: '독자 기대 분석',
      status: 'todo',
      difficulty: 2,
      goal: '장르 독자가 기대하는 재미를 정리한다.',
      doneCriteria: '초반 5화에서 보여줘야 할 재미 요소 목록을 작성한다.',
      requiredInputs: '장르, 유사 작품, 원하는 분위기',
      expectedOutput: '독자 기대 체크리스트',
      tags: ['독자', '시장성'],
    },
    {
      order: 5,
      title: '주인공 캐릭터 설계',
      status: 'todo',
      difficulty: 2,
      goal: '오래 끌고 갈 수 있는 주인공을 만든다.',
      doneCriteria: '주인공 캐릭터 카드가 완성된다.',
      requiredInputs: '이름, 나이, 직업, 약점, 욕망, 결핍, 능력',
      expectedOutput: '주인공 캐릭터 카드',
      tags: ['캐릭터', '주인공'],
    },
    {
      order: 6,
      title: '조연/적대자 설계',
      status: 'todo',
      difficulty: 2,
      goal: '주인공을 움직이게 만드는 관계와 갈등을 만든다.',
      doneCriteria: '주요 인물 3명 이상과 장기 떡밥용 세력 1개를 정리한다.',
      requiredInputs: '조력자, 라이벌, 적대자, 조직/세력',
      expectedOutput: '인물 관계 카드',
      tags: ['캐릭터', '갈등'],
    },
    {
      order: 7,
      title: '최소 세계관 설계',
      status: 'todo',
      difficulty: 2,
      goal: '1화에 필요한 세계관만 만든다.',
      doneCriteria: '1화에서 필요한 설정만 1페이지로 정리한다.',
      requiredInputs: '능력 체계, 사회 구조, 사건 배경',
      expectedOutput: '최소 세계관 문서',
      tags: ['세계관', '설정'],
    },
    {
      order: 8,
      title: '1~5화 파일럿 플롯 만들기',
      status: 'todo',
      difficulty: 3,
      goal: '1화만 쓰고 끝나지 않게 초반 진행 방향을 잡는다.',
      doneCriteria: '1~5화 요약이 완성된다.',
      requiredInputs: '주인공, 능력, 갈등, 세계관',
      expectedOutput: '1~5화 파일럿 플롯',
      tags: ['플롯', '초반전개'],
    },
    {
      order: 9,
      title: '1화 후킹 설계',
      status: 'todo',
      difficulty: 3,
      goal: '첫 장면에서 독자를 붙잡는 구조를 만든다.',
      doneCriteria: '도입부 후보 3개 중 1개를 선택한다.',
      requiredInputs: '주인공 상황, 사건, 반전, 위기',
      expectedOutput: '1화 도입부 설계',
      tags: ['후킹', '1화'],
    },
    {
      order: 10,
      title: '1화 초안 작성',
      status: 'todo',
      difficulty: 3,
      goal: '실제 1화 원고를 만든다.',
      doneCriteria: '1화 초안이 완성된다.',
      requiredInputs: '로그라인, 캐릭터, 세계관, 1~5화 플롯, 후킹 구조',
      expectedOutput: '1화 원고 초안',
      tags: ['원고', '초안'],
    },
    {
      order: 11,
      title: '출판사식 편집 피드백',
      status: 'todo',
      difficulty: 2,
      goal: '편집자 관점에서 작품의 방향성과 1화의 문제를 검토한다.',
      doneCriteria: '강점, 약점, 수정 우선순위가 정리된다.',
      requiredInputs: '작품 콘셉트, 1화 초안',
      expectedOutput: '편집 피드백 리포트',
      tags: ['편집', '피드백'],
    },
    {
      order: 12,
      title: '오타/문장 검수',
      status: 'todo',
      difficulty: 1,
      goal: '오타, 비문, 어색한 문장을 점검한다.',
      doneCriteria: '수정 후보 목록이 정리된다.',
      requiredInputs: '1화 초안',
      expectedOutput: '문장 검수 리포트',
      tags: ['검수', '오타'],
    },
    {
      order: 13,
      title: '가상 독자 피드백',
      status: 'todo',
      difficulty: 2,
      goal: '실제 독자 반응을 가정해 이탈 지점과 흥미 지점을 찾는다.',
      doneCriteria: '독자 반응, 이탈 위험, 계속 읽게 만드는 요소가 정리된다.',
      requiredInputs: '1화 초안, 장르, 목표 독자',
      expectedOutput: '가상 독자 피드백',
      tags: ['독자', '피드백'],
    },
    {
      order: 14,
      title: '수정본 정리',
      status: 'todo',
      difficulty: 3,
      goal: '피드백을 반영해 1화 수정 방향을 정리한다.',
      doneCriteria: '수정 체크리스트와 2차 원고 방향이 정리된다.',
      requiredInputs: '편집 피드백, 문장 검수, 독자 피드백',
      expectedOutput: '수정 체크리스트',
      tags: ['수정', '2차원고'],
    },
    {
      order: 15,
      title: '다음 회차 행동 정하기',
      status: 'todo',
      difficulty: 1,
      goal: '2화 작성 또는 전체 방향 재정리 중 다음 행동을 선택한다.',
      doneCriteria: '오늘 바로 할 수 있는 다음 행동 3개가 정리된다.',
      requiredInputs: '1화 수정 결과, 1~5화 플롯',
      expectedOutput: '다음 행동 목록',
      tags: ['다음행동', '연재'],
    },
  ],

  seedPrompts: [
    {
      title: '작은 키워드에서 작품 후보 만들기',
      tool: 'General',
      stageTitle: '작은 키워드 확장',
      version: '1.0.0',
      variables: ['raw_keyword'],
      body: `너는 웹소설 기획 편집자야.

사용자는 아직 구체적인 설정이 없고, 작은 키워드만 가지고 있어.

[작은 키워드]
{{raw_keyword}}

이 키워드를 바탕으로 웹소설 작품 후보를 3개 만들어줘.

각 후보는 다음 형식으로 정리해줘.

1. 제목 후보
2. 장르
3. 한 줄 콘셉트
4. 주인공
5. 초반 사건
6. 독자가 기대할 재미
7. 1화로 시작하기 쉬운 이유
8. 위험 요소

마지막에는 초보 작가가 가장 시작하기 쉬운 후보 1개를 추천해줘.

조건:
- 너무 거대한 세계관으로 벌리지 말 것
- 1화부터 쓸 수 있는 사건 중심으로 제안할 것
- 막연한 조언보다 바로 다음 단계로 옮길 수 있게 작성할 것`,
      tags: ['키워드', '시작'],
    },
    {
      title: '출판사식 아이디어 회의 요청서',
      tool: 'General',
      stageTitle: '장르와 목표 독자 정하기',
      version: '1.0.0',
      variables: ['idea_summary'],
      body: `너는 출판사 웹소설 기획 회의에 참여한 편집자야.

아래 아이디어를 회의 안건으로 보고 검토해줘.

[아이디어]
{{idea_summary}}

다음 형식으로 답변해줘.

[회의 결론]
- 이 아이디어를 계속 밀어도 되는가?
- 방향을 좁혀야 한다면 어디를 좁혀야 하는가?

[좋은 점]
- 독자에게 매력적일 수 있는 요소

[부족한 점]
- 아직 정해지지 않은 핵심 요소

[질문 목록]
- 작가가 답해야 할 질문 7개

[추천 방향]
- 장르
- 목표 독자
- 분위기
- 초반 5화 방향

[다음 행동]
- 오늘 바로 할 일 3개`,
      tags: ['출판사', '회의', '기획'],
    },
    {
      title: '1화 초안 작성 요청서',
      tool: 'General',
      stageTitle: '1화 초안 작성',
      version: '1.0.0',
      variables: ['concept', 'main_character_card', 'world_setting', 'episode_1_plot', 'opening_hook'],
      body: `너는 웹소설 작가야.

아래 설정을 바탕으로 웹소설 1화 초안을 작성해줘.

[작품 콘셉트]
{{concept}}

[주인공]
{{main_character_card}}

[세계관]
{{world_setting}}

[1화 플롯]
{{episode_1_plot}}

[도입부 방향]
{{opening_hook}}

작성 조건:
- 1화 안에서 주인공의 현재 상황, 핵심 사건, 선택, 다음 화 궁금증이 드러나야 한다.
- 설정 설명은 필요한 만큼만 자연스럽게 넣어줘.
- 첫 문단은 독자가 계속 읽고 싶게 만들어줘.
- 주인공을 응원할 이유를 최소 1개 이상 보여줘.
- 마지막은 다음 화를 누르고 싶게 끝내줘.
- 웹소설 독자가 읽기 쉬운 속도감 있는 문체로 작성해줘.

출력 후 마지막에 다음 항목도 따로 정리해줘.

1. 이 1화의 강점
2. 부족한 점
3. 다음 수정 우선순위`,
      tags: ['1화', '초안'],
    },
  ],

  seedResources: [
    {
      type: 'memo',
      title: '작은 키워드 메모',
      summary: '책을 쓰고 싶어, 판타지, 헌터, 가족, 복수, 성장 등 처음 떠오른 키워드를 적는다.',
      importance: 'high',
      tags: ['시작', '키워드'],
    },
    {
      type: 'memo',
      title: '좋아하는 웹소설 목록',
      summary: '내가 좋아하는 작품과 이유를 정리한다.',
      importance: 'high',
      tags: ['참고작', '취향'],
    },
    {
      type: 'memo',
      title: '피하고 싶은 클리셰',
      summary: '쓰고 싶지 않은 전개, 캐릭터, 설정을 정리한다.',
      importance: 'medium',
      tags: ['클리셰', '주의'],
    },
    {
      type: 'memo',
      title: '장르 독자 기대',
      summary: '장르 독자가 기대하는 재미와 초반부 필수 요소를 정리한다.',
      importance: 'high',
      tags: ['독자', '장르'],
    },
    {
      type: 'file',
      title: '1화 초안',
      summary: '완성된 첫 원고 파일 또는 붙여넣기 기록을 관리한다.',
      importance: 'high',
      tags: ['원고', '1화'],
    },
  ],

  seedFlowNodes: [
    { title: '작은 키워드', nodeType: 'stage', stageTitle: '작은 키워드 확장' },
    { title: '장르/독자', nodeType: 'stage', stageTitle: '장르와 목표 독자 정하기' },
    { title: '로그라인', nodeType: 'stage', stageTitle: '핵심 콘셉트 만들기' },
    { title: '주인공', nodeType: 'stage', stageTitle: '주인공 캐릭터 설계' },
    { title: '세계관', nodeType: 'stage', stageTitle: '최소 세계관 설계' },
    { title: '1~5화 플롯', nodeType: 'stage', stageTitle: '1~5화 파일럿 플롯 만들기' },
    { title: '1화 후킹', nodeType: 'stage', stageTitle: '1화 후킹 설계' },
    { title: '1화 초안', nodeType: 'stage', stageTitle: '1화 초안 작성' },
    { title: '편집 피드백', nodeType: 'stage', stageTitle: '출판사식 편집 피드백' },
    { title: '수정본', nodeType: 'stage', stageTitle: '수정본 정리' },
  ],

  seedFlowEdges: [
    { sourceTitle: '작은 키워드', targetTitle: '장르/독자', label: '방향 좁히기', edgeType: 'sequence' },
    { sourceTitle: '장르/독자', targetTitle: '로그라인', label: '콘셉트화', edgeType: 'sequence' },
    { sourceTitle: '로그라인', targetTitle: '주인공', label: '인물 설계', edgeType: 'sequence' },
    { sourceTitle: '주인공', targetTitle: '세계관', label: '배경 설계', edgeType: 'sequence' },
    { sourceTitle: '세계관', targetTitle: '1~5화 플롯', label: '초반 전개', edgeType: 'sequence' },
    { sourceTitle: '1~5화 플롯', targetTitle: '1화 후킹', label: '도입부 선택', edgeType: 'sequence' },
    { sourceTitle: '1화 후킹', targetTitle: '1화 초안', label: '원고 작성', edgeType: 'sequence' },
    { sourceTitle: '1화 초안', targetTitle: '편집 피드백', label: '검토', edgeType: 'sequence' },
    { sourceTitle: '편집 피드백', targetTitle: '수정본', label: '반영', edgeType: 'sequence' },
  ],

  reviewCriteria: [
    {
      key: 'conceptClarity',
      label: '콘셉트 선명도',
      description: '한 문장으로 작품이 설명되는가?',
    },
    {
      key: 'readerExpectation',
      label: '독자 기대 충족',
      description: '장르 독자가 좋아할 요소가 있는가?',
    },
    {
      key: 'mainCharacterAppeal',
      label: '주인공 매력',
      description: '독자가 응원할 이유가 있는가?',
    },
    {
      key: 'earlyIncident',
      label: '초반 사건성',
      description: '1화 안에 사건이 발생하는가?',
    },
    {
      key: 'seriesPotential',
      label: '연재 확장성',
      description: '5화 이후로 이어질 갈등이 있는가?',
    },
    {
      key: 'settingLoad',
      label: '설정 부담',
      description: '설정이 너무 복잡하지 않은가?',
    },
    {
      key: 'differentiation',
      label: '차별점',
      description: '흔한 소재 안에서도 다른 맛이 있는가?',
    },
    {
      key: 'completionPossibility',
      label: '완성 가능성',
      description: '실제로 1화를 쓸 수 있을 만큼 좁혀졌는가?',
    },
  ],

  homeCards: [
    {
      key: 'todayWritingAction',
      title: '오늘의 집필 행동',
      description: '지금 단계에서 바로 할 수 있는 가장 작은 글쓰기 행동을 보여줍니다.',
    },
    {
      key: 'currentStoryDecision',
      title: '현재 작품 판단',
      description: '작품 방향, 막힌 이유, 다음 보완점을 요약합니다.',
    },
    {
      key: 'draftReadiness',
      title: '1화 준비도',
      description: '콘셉트, 캐릭터, 세계관, 플롯, 후킹, 초안 상태를 보여줍니다.',
    },
  ],
};
```

---

# 8. Agent Plugin 상세

## 8.1 아이디어 회의 에이전트

`src/agentPlugins/novel/ideaMeetingAgent.ts`

```ts
import type { AgentPlugin } from '../types';

export const novelIdeaMeetingAgent: AgentPlugin = {
  id: 'novel-idea-meeting-agent',
  name: '아이디어 회의 에이전트',
  roleName: '출판사 기획 회의 편집자',
  description: '작은 키워드나 막연한 아이디어를 작품 후보와 실행 질문으로 확장합니다.',
  category: 'ideation',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '기획', '아이디어'],
  promptPresets: [
    {
      id: 'novel-idea-meeting-basic',
      title: '막연한 아이디어 회의',
      description: '작은 키워드를 웹소설 후보로 확장합니다.',
      variables: ['raw_keyword'],
      body: `너는 출판사 웹소설 기획 회의에 참여한 편집자야.

사용자는 아직 구체적인 작품 설정이 없고, 아래 키워드만 가지고 있어.

[키워드]
{{raw_keyword}}

이 키워드를 바탕으로 회의하듯이 검토해줘.

다음 형식으로 답변해줘.

[가능한 작품 후보 3개]
각 후보마다:
- 제목 후보:
- 장르:
- 한 줄 콘셉트:
- 주인공:
- 초반 사건:
- 독자 기대 포인트:
- 위험 요소:

[가장 추천하는 방향]
- 추천안:
- 이유:
- 초보 작가가 시작하기 쉬운 이유:

[작가에게 물어볼 질문]
- 반드시 답해야 할 질문 7개

[다음 행동]
- 오늘 바로 할 수 있는 작업 3개`,
    },
  ],
};
```

---

## 8.2 편집자 에이전트

`src/agentPlugins/novel/editorAgent.ts`

```ts
import type { AgentPlugin } from '../types';

export const novelEditorAgent: AgentPlugin = {
  id: 'novel-editor-agent',
  name: '편집자 에이전트',
  roleName: '웹소설 담당 편집자',
  description: '작품 콘셉트와 원고를 편집자 관점에서 검토하고 수정 우선순위를 제안합니다.',
  category: 'editing',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '편집', '피드백'],
  promptPresets: [
    {
      id: 'novel-editor-feedback',
      title: '1화 편집 피드백',
      description: '1화 초안을 편집자 관점으로 검토합니다.',
      variables: ['concept', 'episode_1_draft'],
      body: `너는 냉정하지만 실용적인 웹소설 담당 편집자야.

아래 작품 콘셉트와 1화 초안을 검토해줘.

[작품 콘셉트]
{{concept}}

[1화 초안]
{{episode_1_draft}}

다음 형식으로 답변해줘.

[편집 결론]
- 계속 밀어도 되는지
- 크게 고쳐야 하는지
- 방향을 바꿔야 하는지

[강점]
- 독자가 좋아할 만한 요소

[약점]
- 현재 원고에서 가장 아쉬운 부분

[초반부 문제]
- 첫 문단
- 사건 시작 속도
- 주인공 매력
- 설정 설명
- 마지막 후킹

[수정 우선순위]
1.
2.
3.

[다음 행동]
오늘 바로 수정할 작업 3개`,
    },
  ],
};
```

---

## 8.3 오타/문장 검수 에이전트

`src/agentPlugins/novel/proofreaderAgent.ts`

```ts
import type { AgentPlugin } from '../types';

export const novelProofreaderAgent: AgentPlugin = {
  id: 'novel-proofreader-agent',
  name: '오타/문장 검수 에이전트',
  roleName: '교정 교열 담당자',
  description: '오타, 비문, 어색한 문장, 반복 표현을 찾아 수정 후보를 제안합니다.',
  category: 'proofreading',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '교정', '오타', '문장'],
  promptPresets: [
    {
      id: 'novel-proofread-basic',
      title: '오타/비문 검수',
      description: '원고의 문장 오류와 어색한 표현을 점검합니다.',
      variables: ['episode_1_draft'],
      body: `너는 한국어 웹소설 원고를 검수하는 교정 교열 담당자야.

아래 원고에서 오타, 비문, 어색한 문장, 반복 표현을 찾아줘.

[원고]
{{episode_1_draft}}

다음 형식으로 답변해줘.

[오타 후보]
- 원문:
- 수정 제안:
- 이유:

[비문/어색한 문장]
- 원문:
- 수정 제안:
- 이유:

[반복 표현]
- 반복되는 표현:
- 대체 표현:

[문장 리듬 개선]
- 원문:
- 수정 제안:

조건:
- 원고 전체를 임의로 다시 쓰지 말 것
- 수정 후보와 이유 중심으로 정리할 것
- 작가의 문체를 최대한 보존할 것`,
    },
  ],
};
```

---

## 8.4 가상 독자 피드백 에이전트

`src/agentPlugins/novel/readerFeedbackAgent.ts`

```ts
import type { AgentPlugin } from '../types';

export const novelReaderFeedbackAgent: AgentPlugin = {
  id: 'novel-reader-feedback-agent',
  name: '가상 독자 피드백 에이전트',
  roleName: '장르 웹소설 독자',
  description: '목표 독자 입장에서 흥미 지점, 이탈 지점, 다음 화 클릭 욕구를 평가합니다.',
  category: 'reader-feedback',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '독자', '피드백'],
  promptPresets: [
    {
      id: 'novel-reader-feedback-basic',
      title: '독자 반응 시뮬레이션',
      description: '목표 독자 입장에서 1화 반응을 시뮬레이션합니다.',
      variables: ['genre', 'target_reader', 'episode_1_draft'],
      body: `너는 {{genre}} 장르 웹소설을 자주 읽는 독자야.

아래 1화를 읽고 실제 독자처럼 반응해줘.

[목표 독자]
{{target_reader}}

[1화 초안]
{{episode_1_draft}}

다음 형식으로 답변해줘.

[첫인상]
- 계속 읽고 싶은가?
- 이유는 무엇인가?

[재미있었던 부분]
- 장면:
- 이유:

[이탈할 뻔한 부분]
- 장면:
- 이유:

[주인공 호감도]
- 응원하고 싶은가?
- 부족하다면 무엇이 부족한가?

[다음 화 클릭 욕구]
- 1~5점:
- 이유:

[독자 입장에서 바라는 수정]
1.
2.
3.

조건:
- 작가를 배려하되, 독자 입장에서 솔직하게 말할 것
- 추상적인 칭찬보다 실제 이탈 지점을 말할 것`,
    },
  ],
};
```

---

# 9. 키워드 기반 시작 UX

사용자는 처음부터 템플릿을 고르지 않을 수도 있다.

따라서 새 아이디어 생성 화면에 다음 기능을 추가한다.

## 9.1 작은 입력 필드

예시 placeholder:

```text
무엇을 해보고 싶나요? 예: 책을 쓰고 싶어, 게임을 만들고 싶어, 광고수익을 얻고 싶어
```

사용자가 입력하면 앱이 로컬 키워드 매칭으로 추천 템플릿을 보여준다.

예시:

```text
입력: 책을 쓰고 싶어
추천:
- 웹소설 1화 완성 루트
- 전자책 초안 완성 루트
```

```text
입력: 게임을 만들고 싶어
추천:
- 게임 프로토타입 루트
```

```text
입력: 광고수익을 얻고 싶어
추천:
- 광고 수익형 미니 웹앱 루트
```

MVP에서는 AI 분석이 아니라 단순 키워드 매칭으로 충분하다.

---

## 9.2 keywordRouter 구현

`src/templateEngine/keywordRouter.ts`

```ts
import type { RouteTemplate } from '../routePlugins/types';
import { routeTemplates } from '../routePlugins/registry';

export function recommendTemplatesByKeyword(input: string): RouteTemplate[] {
  const normalized = input.trim().toLowerCase();

  if (!normalized) return [];

  return routeTemplates
    .filter((template) => {
      return template.keywordHints?.some((hint) => {
        return normalized.includes(hint.toLowerCase());
      });
    })
    .slice(0, 3);
}
```

---

# 10. 템플릿 적용 엔진

`src/templateEngine/applyRouteTemplate.ts`

RouteTemplate을 선택하면 현재 ideaId에 다음 seed 데이터를 생성한다.

* stages
* promptTemplates
* resources
* flowNodes
* flowEdges

주의사항:

1. 중복 생성 방지 필요
2. 이미 같은 템플릿을 적용한 경우 재적용 여부 확인 필요
3. 기존 사용자가 직접 만든 데이터는 삭제하지 않음
4. 템플릿 데이터에는 `templateId` 또는 `sourceTemplateId` 필드를 저장할 수 있으면 저장
5. 기존 DB 스키마에 필드 추가가 부담되면 tags에 `template:novel-first-episode` 형태로 남겨도 됨

권장 구현:

```ts
export type ApplyRouteTemplateOptions = {
  ideaId: number;
  templateId: string;
  mode?: 'append' | 'skip-existing';
};

export async function applyRouteTemplate(options: ApplyRouteTemplateOptions): Promise<void> {
  // 1. template 조회
  // 2. 기존 stages/prompts/resources/flowNodes 조회
  // 3. title 기반 중복 체크
  // 4. 없는 seed만 생성
  // 5. flowEdges는 node title 매핑 후 생성
}
```

---

# 11. UI 변경 범위

## 11.1 새 아이디어 생성 화면

다음 요소를 추가한다.

* 작은 목표 입력
* 추천 템플릿 카드
* Plain Mode 선택 카드
* 템플릿 선택 시 생성될 항목 미리보기

템플릿 카드 표시 정보:

* 템플릿명
* 설명
* 최종 산출물
* 추천 대상
* 생성될 단계 수
* 생성될 프롬프트 수
* 생성될 자료 후보 수

---

## 11.2 홈 대시보드

선택된 아이디어에 적용된 템플릿이 있으면 템플릿 전용 홈 카드를 표시한다.

웹소설 템플릿의 경우:

* 오늘의 집필 행동
* 현재 작품 판단
* 1화 준비도
* 콘셉트/캐릭터/세계관/플롯/초안 상태
* 사용 가능한 에이전트 목록

Plain Mode에서는 기존 홈 유지.

---

## 11.3 진행 판단 화면

기존 진행 판단은 유지한다.

다만 템플릿에 `reviewCriteria`가 있으면 해당 기준을 우선 표시한다.

웹소설 템플릿 기준:

* 콘셉트 선명도
* 독자 기대 충족
* 주인공 매력
* 초반 사건성
* 연재 확장성
* 설정 부담
* 차별점
* 완성 가능성

판정 문구:

```text
평균 4.0 이상: 바로 1화 작성 가능
평균 3.0 이상: 보완 후 작성 가능
평균 2.0 이상: 콘셉트 재정리 필요
평균 2.0 미만: 소재를 더 좁히는 단계로 돌아가기
```

---

## 11.4 프롬프트 준비 화면

기존 프롬프트 라이브러리는 유지한다.

추가로 다음 필터 또는 섹션을 제공한다.

* 전체 프롬프트
* 단계별 프롬프트
* 에이전트별 요청서
* 템플릿 기본 프롬프트

에이전트 요청서는 일반 프롬프트와 동일하게 복사할 수 있어야 한다.

---

# 12. 데이터 저장 정책

MVP에서는 기존 Dexie 테이블을 최대한 유지한다.

가능하면 ideas 테이블에 다음 필드를 추가한다.

```ts
templateId?: string;
templateAppliedAt?: string;
```

각 seed 데이터에도 가능하면 다음 필드를 추가한다.

```ts
sourceTemplateId?: string;
sourceAgentId?: string;
```

스키마 변경이 부담된다면 대체 방식으로 tags에 다음 값을 넣는다.

```text
template:novel-first-episode
agent:novel-editor-agent
```

---

# 13. 백업/복원 고려사항

BackupPayload version을 3으로 올릴지 검토한다.

추가 필드가 optional이면 기존 version 2 백업 복원과 호환되게 한다.

권장:

* BackupPayload version 3
* ideas.templateId optional
* ideas.templateAppliedAt optional
* 각 테이블의 sourceTemplateId/sourceAgentId optional
* version 1, 2 복원 가능 유지

---

# 14. 이번 작업의 MVP 범위

이번 작업에서 반드시 할 것:

1. RouteTemplate 타입 추가
2. AgentPlugin 타입 추가
3. Route Template registry 추가
4. Agent Plugin registry 추가
5. Plain template 추가
6. 웹소설 1화 완성 루트 템플릿 추가
7. 웹소설용 에이전트 4종 추가

   * 아이디어 회의
   * 편집자
   * 오타/문장 검수
   * 가상 독자 피드백
8. 새 아이디어 생성 시 템플릿 선택 또는 적용 가능한 UI 추가
9. 선택한 템플릿의 seed stages/prompts/resources/flowNodes/flowEdges 생성
10. 기존 기능이 깨지지 않게 유지
11. `npm run build` 통과

이번 작업에서 하지 말 것:

* 외부 AI API 연동
* 로그인/서버 저장
* 실시간 협업
* 자동 원고 생성
* 첨부 파일 본문 자동 분석
* 유료 결제/광고 기능
* 템플릿 마켓플레이스
* 복잡한 플러그인 런타임 로더

---

# 15. 완료 기준

작업 완료 후 다음이 가능해야 한다.

## Plain Mode

* 기존처럼 빈 아이디어를 만들 수 있다.
* 기존 화면들이 정상 동작한다.
* 기존 데이터가 깨지지 않는다.

## 웹소설 템플릿

* 새 아이디어 생성 또는 기존 아이디어에서 `웹소설 1화 완성 루트`를 선택할 수 있다.
* 선택 시 실행 단계가 자동 생성된다.
* 선택 시 기본 프롬프트가 자동 생성된다.
* 선택 시 자료 후보가 자동 생성된다.
* 선택 시 흐름 노드/연결이 자동 생성된다.
* 중복 적용 시 동일 단계/프롬프트가 무한히 늘어나지 않는다.

## 에이전트

* 웹소설 템플릿에서 아이디어 회의, 편집자, 오타/문장 검수, 가상 독자 피드백 요청서를 확인할 수 있다.
* 각 요청서는 복사 가능해야 한다.
* 기존 AI 리포트 저장 워크플로우와 충돌하지 않아야 한다.

## 빌드

```bash
npm run build
```

가 성공해야 한다.

---

# 16. 작업 후 보고 양식

작업이 끝나면 다음 형식으로 보고한다.

```text
## 작업 완료 보고

### Git 상태
- 브랜치:
- 커밋 해시:
- push 여부:

### 구현한 내용
-
-
-

### 변경 파일
-
-
-

### 빌드 결과
- npm run build: 성공/실패

### 주의사항
-

### 다음 작업 제안
1.
2.
3.
```

---

# 17. 개발 방향 메모

이 작업의 핵심은 기능을 무작정 늘리는 것이 아니다.

핵심 방향은 다음과 같다.

> Idea Route Builder는 아이디어를 저장하는 앱이 아니라,
> 작은 목표를 실행 가능한 루트로 바꿔주는 앱이다.

이번 작업은 이 방향을 위해 다음 구조를 만든다.

```text
기본 보드
  + Plain Mode
  + Route Template
  + Agent Plugin
  + AI 복사/붙여넣기 협업
```

웹소설은 첫 번째 전문 템플릿 사례다.

향후 같은 구조로 다음 템플릿을 추가할 수 있어야 한다.

* 전자책 초안 완성 루트
* 게임 프로토타입 루트
* 광고 수익형 미니 웹앱 루트
* 크롬 확장 프로그램 루트
* 모바일 앱 MVP 루트
