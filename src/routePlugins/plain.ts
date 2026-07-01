import type { RouteTemplate } from './types';

export const plainRouteTemplate: RouteTemplate = {
  id: 'plain',
  name: 'Plain Mode',
  shortName: 'Plain',
  description: '특정 분야 템플릿 없이 아이디어, 자료, 프롬프트, 실행 단계를 자유롭게 정리합니다.',
  category: 'plain',
  recommendedFor: ['방향이 아직 열려 있는 아이디어', '직접 단계를 구성하고 싶은 개인 프로젝트', '기존 Do Dream 흐름 그대로 정리하고 싶은 작업'],
  outcome: '사용자가 직접 구성하는 자유형 아이디어 실행 보드',
  tags: ['기본', '자유형', '아이디어'],
  seedStages: [],
  seedPrompts: [],
  seedResources: [],
  seedFlowNodes: [],
  seedFlowEdges: [],
  starterQuestions: [
    '무엇을 만들어 보고 싶나요?',
    '왜 지금 이 아이디어를 정리하려고 하나요?',
    '누가 이 결과물을 쓰게 되나요?',
    '오늘 바로 할 수 있는 가장 작은 행동은 무엇인가요?',
  ],
  keywordHints: [],
};
