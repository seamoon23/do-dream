import type { AgentPlugin } from '../types';

export const novelEditorAgent: AgentPlugin = {
  id: 'novel-editor-agent',
  name: '편집자 에이전트',
  roleName: '웹소설 담당 편집자',
  description: '작품 콘셉트와 1화 초안을 편집자 관점에서 검토하고 수정 우선순위를 제안합니다.',
  category: 'editing',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '편집', '피드백'],
  promptPresets: [
    {
      id: 'novel-editor-feedback',
      title: '1화 편집 피드백',
      description: '1화 초안을 연재/출판 관점에서 검토합니다.',
      variables: ['concept', 'episode_1_draft'],
      body: `너는 냉정하지만 실용적인 웹소설 담당 편집자야.

아래 작품 콘셉트와 1화 초안을 검토해줘.

[작품 콘셉트]
{{concept}}

[1화 초안]
{{episode_1_draft}}

다음 형식으로 답해줘.

[편집 결론]
- 계속 봐도 되는지:
- 크게 고쳐야 하는지:
- 방향을 바꿔야 하는지:

[강점]
- 독자가 좋아할 만한 요소:

[약점]
- 현재 원고에서 가장 위험한 부분:

[초반부 문제]
- 첫 문단:
- 사건 시작 속도:
- 주인공 매력:
- 설정 설명:
- 마지막 훅:

[수정 우선순위]
1.
2.
3.

[다음 행동]
- 오늘 바로 수정할 작업 3개`,
    },
  ],
};
