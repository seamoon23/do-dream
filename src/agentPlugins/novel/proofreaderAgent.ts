import type { AgentPlugin } from '../types';

export const novelProofreaderAgent: AgentPlugin = {
  id: 'novel-proofreader-agent',
  name: '문장 검수 에이전트',
  roleName: '교정 교열 담당자',
  description: '오탈자, 비문, 어색한 문장, 반복 표현을 찾아 수정 후보를 제안합니다.',
  category: 'proofreading',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '교정', '문장'],
  promptPresets: [
    {
      id: 'novel-proofread-basic',
      title: '오탈자/비문 검수',
      description: '원고의 문장 오류와 어색한 표현을 점검합니다.',
      variables: ['episode_1_draft'],
      body: `너는 한국어 웹소설 원고를 검수하는 교정 교열 담당자야.

아래 원고에서 오탈자, 비문, 어색한 문장, 반복 표현을 찾아줘.

[원고]
{{episode_1_draft}}

다음 형식으로 답해줘.

[오탈자 후보]
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
