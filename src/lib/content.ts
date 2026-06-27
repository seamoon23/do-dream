import type { FlowNodeType, IdeaStatus, PromptTool, ResourceType, ReviewScore, ReviewVerdict, StageStatus } from '../types/domain';

export type ScoreKey =
  | 'problemClarity'
  | 'userValue'
  | 'implementationDifficulty'
  | 'resourceReadiness'
  | 'techFit'
  | 'scalability'
  | 'monetizationPotential'
  | 'riskLevel';

export const ideaStatusLabels: Record<IdeaStatus, string> = {
  COLLECTED: '수집됨',
  REVIEWING: '검토 중',
  READY: '준비됨',
  IN_PROGRESS: '실행 중',
  ON_HOLD: '보류',
  DONE: '완료',
  ARCHIVED: '보관',
};

export const resourceTypeLabels: Record<ResourceType, string> = {
  LINK: '링크',
  NOTE: '메모',
  FILE: '파일',
  TEXT: '텍스트',
  CODE: '코드',
  PROMPT: '프롬프트',
  IMAGE_NOTE: '이미지 메모',
};

export const stageStatusLabels: Record<StageStatus, string> = {
  TODO: '대기',
  DOING: '진행',
  BLOCKED: '막힘',
  DONE: '완료',
  SKIPPED: '건너뜀',
};

export const flowTypeLabels: Record<FlowNodeType, string> = {
  STAGE: '단계',
  PROMPT: '프롬프트',
  ISSUE: '이슈',
  DECISION: '결정',
  BRANCH: '분기',
  DONE: '완료',
};

export const promptToolLabels: Record<PromptTool, string> = {
  CODEX: 'Codex',
  CLAUDE_CODE: 'Claude Code',
  GEMINI: 'Gemini',
  GENERAL: '일반',
};

export const verdictLabels: Record<ReviewVerdict, string> = {
  RECOMMENDED: '실행 추천',
  NEEDS_MORE_RESOURCE: '자료 보강 후 실행',
  ON_HOLD: '보류 추천',
};

export const reviewFields: Array<{ key: ScoreKey; label: string; hint: string }> = [
  { key: 'problemClarity', label: '문제 명확성', hint: '해결하려는 문제가 한 문장으로 설명되는지 봅니다.' },
  { key: 'userValue', label: '사용자 가치', hint: '누가 왜 써야 하는지 분명한지 봅니다.' },
  { key: 'implementationDifficulty', label: '구현 난이도', hint: '지금 가진 시간과 기술로 만들 수 있는지 봅니다.' },
  { key: 'resourceReadiness', label: '자료 준비도', hint: '참고 링크, 첨부, 요구사항, 예시가 충분한지 봅니다.' },
  { key: 'techFit', label: '기술 적합성', hint: '현재 도구와 스택으로 풀기 좋은 문제인지 봅니다.' },
  { key: 'scalability', label: '확장성', hint: '작게 시작한 뒤 기능을 키울 수 있는지 봅니다.' },
  { key: 'monetizationPotential', label: '수익 가능성', hint: '개인용 이후 유료화나 업무 효율 가치가 있는지 봅니다.' },
  { key: 'riskLevel', label: '리스크 제어', hint: '법적, 운영, 데이터 리스크를 감당할 수 있는지 봅니다.' },
];

export const stageTemplates = [
  {
    title: '아이디어 윤곽 잡기',
    goal: '아이디어의 문제, 대상 사용자, 기대 가치를 짧게 정리한다.',
    inputRequired: '아이디어 메모, 떠오른 배경, 비슷한 서비스 링크',
    outputExpected: '1문단 아이디어 브리프',
    doneCriteria: '문제, 사용자, 기대 가치가 각각 한 문장 이상 적혀 있다.',
  },
  {
    title: '자료 수집과 정리',
    goal: '판단과 실행에 필요한 자료를 리소스로 모으고 태그를 붙인다.',
    inputRequired: '링크, 문서, 이미지, 파일명, 관련 프롬프트, 개인 메모',
    outputExpected: '검토 가능한 리소스 목록',
    doneCriteria: '핵심 리소스 3개 이상이 요약과 함께 저장되어 있다.',
  },
  {
    title: 'MVP 범위 확정',
    goal: '가장 작은 첫 버전의 필수 기능과 제외 범위를 정한다.',
    inputRequired: '아이디어 개요, 리소스, 사용자 시나리오',
    outputExpected: '필수 기능, 제외 기능, 첫 화면 흐름',
    doneCriteria: '오늘 만들 기능과 나중에 미룰 기능이 구분되어 있다.',
  },
  {
    title: '실행 프롬프트 준비',
    goal: '각 단계에서 사용할 AI/개발 도구용 작업 지시문을 만든다.',
    inputRequired: '단계 목표, 완료 기준, 연결 리소스',
    outputExpected: '도구별 프롬프트 템플릿',
    doneCriteria: '최소 1개 이상의 단계에 프롬프트가 연결되어 있다.',
  },
  {
    title: '검토와 실행 판단',
    goal: '아이디어를 계속 진행할지, 자료를 더 모을지, 보류할지 판단한다.',
    inputRequired: '리소스, 단계 설계, 프롬프트, 리스크 메모',
    outputExpected: '평균 점수, 판정, 부족 자료 목록',
    doneCriteria: '검토 점수와 부족 자료가 저장되어 있다.',
  },
];

export const guideContent = {
  dashboard: {
    title: 'Workspace 대시보드',
    summary: '선택한 아이디어의 전체 상태를 한눈에 보는 기본 화면입니다.',
    bullets: [
      '아이디어, 리소스, 단계, 프롬프트, 검토가 어떤 순서로 이어지는지 보여줍니다.',
      '각 카드의 버튼을 누르면 해당 작업 화면으로 이동합니다.',
      '처음에는 샘플 추가를 눌러 데이터가 채워진 상태를 보는 것이 가장 빠릅니다.',
    ],
  },
  idea: {
    title: '아이디어',
    summary: '아이디어의 개요와 문제 정의를 적는 시작 화면입니다.',
    bullets: [
      '제목, 요약, 문제, 대상 사용자, 기대 가치를 채우면 이후 화면의 기준점이 됩니다.',
      '상태와 우선순위는 왼쪽 목록 필터와 대시보드 요약에 반영됩니다.',
      '태그는 쉼표로 구분해서 검색과 분류에 사용합니다.',
    ],
  },
  resources: {
    title: '리소스',
    summary: '아이디어 판단과 실행에 필요한 참고 자료를 모으는 곳입니다.',
    bullets: [
      '링크, 메모, 파일 메타데이터, 코드, 프롬프트, 이미지 설명 등을 저장합니다.',
      'MVP에서는 파일 자동 분석을 하지 않고 파일명, MIME 타입, 크기, 요약만 관리합니다.',
      '리소스를 단계에 연결하면 어떤 자료가 어떤 실행 단계에 필요한지 추적할 수 있습니다.',
    ],
  },
  stages: {
    title: '단계',
    summary: '아이디어를 실행 가능한 절차로 쪼개는 화면입니다.',
    bullets: [
      '각 단계에는 목표, 필요한 입력, 예상 산출물, 완료 기준을 적습니다.',
      '리소스와 프롬프트를 연결하면 단계별 작업 맥락이 분명해집니다.',
      '기본 단계 생성은 초안을 만드는 기능이며, 이후 직접 수정하는 흐름을 전제로 합니다.',
    ],
  },
  prompts: {
    title: '프롬프트',
    summary: '단계 실행에 사용할 AI/개발 도구용 지시문을 저장하는 라이브러리입니다.',
    bullets: [
      'MVP에서는 AI가 자동 생성하지 않고, 사람이 템플릿을 저장하고 복사합니다.',
      'Codex, Claude Code, Gemini, 일반 도구별로 프롬프트를 구분해 둘 수 있습니다.',
      '프롬프트는 단계에 연결되고 Markdown Export에 포함됩니다.',
    ],
  },
  review: {
    title: '검토',
    summary: '아이디어를 계속 진행할지 판단하는 점검 화면입니다.',
    bullets: [
      '현재 MVP에서는 외부 AI 연동 없이 직접 점수를 입력합니다.',
      '향후 AI 리포트가 붙으면 이 화면은 자동 분석 결과를 검토하고 수정하는 위치가 됩니다.',
      '자료가 어느 정도 모인 뒤 사용하는 화면이라 탭 순서를 뒤쪽으로 옮겼습니다.',
    ],
  },
  flow: {
    title: '진행 트리',
    summary: '단계, 이슈, 결정, 분기를 시각적으로 배치하는 화면입니다.',
    bullets: [
      '단계 동기화는 단계 목록을 노드로 만들고 순서 연결을 다시 정리합니다.',
      '동기화를 여러 번 눌러도 단계 연결이 중복되지 않도록 처리합니다.',
      '노드를 선택하면 화면 상단에서 선택 노드 삭제 버튼이 나타납니다.',
    ],
  },
  backup: {
    title: '백업',
    summary: '브라우저 IndexedDB 데이터를 파일로 내보내거나 복원합니다.',
    bullets: [
      '전체 JSON 백업은 모든 아이디어와 연결 데이터를 포함합니다.',
      'Markdown Export는 선택한 아이디어를 문서 형태로 정리합니다.',
      'JSON 가져오기는 기존 데이터 교체 또는 병합을 선택할 수 있습니다.',
    ],
  },
} as const;

export type GuideKey = keyof typeof guideContent;

export function scoreFromReview(score: Pick<ReviewScore, ScoreKey>) {
  return reviewFields.map((field) => Number(score[field.key] ?? 0));
}
