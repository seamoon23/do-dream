import type { AgentPlugin } from '../types';

export const novelIdeaMeetingAgent: AgentPlugin = {
  id: 'novel-idea-meeting-agent',
  name: '아이디어 회의 에이전트',
  roleName: '웹소설 기획 회의 편집자',
  description: '작은 키워드나 막연한 글감을 작품 후보와 실행 질문으로 확장합니다.',
  category: 'ideation',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '기획', '아이디어'],
  promptPresets: [
    {
      id: 'novel-idea-meeting-basic',
      title: '막연한 아이디어 회의',
      description: '작은 키워드를 웹소설 후보로 확장합니다.',
      variables: ['raw_keyword'],
      body: `너는 웹소설 기획 회의에 참여한 편집자야.

사용자는 아직 구체적인 작품 설정이 없고, 아래 키워드만 가지고 있어.

[키워드]
{{raw_keyword}}

이 키워드를 바탕으로 작품 후보를 검토해줘.

다음 형식으로 답해줘.

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
