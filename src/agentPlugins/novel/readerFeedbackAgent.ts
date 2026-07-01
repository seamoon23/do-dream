import type { AgentPlugin } from '../types';

export const novelReaderFeedbackAgent: AgentPlugin = {
  id: 'novel-reader-feedback-agent',
  name: '가상 독자 피드백 에이전트',
  roleName: '장르 웹소설 독자',
  description: '목표 독자 입장에서 몰입 지점, 이탈 지점, 다음 화 클릭 욕구를 평가합니다.',
  category: 'reader-feedback',
  supportedTemplateIds: ['novel-first-episode'],
  tags: ['웹소설', '독자', '피드백'],
  promptPresets: [
    {
      id: 'novel-reader-feedback-basic',
      title: '독자 반응 시뮬레이션',
      description: '목표 독자 입장에서 1화 반응을 점검합니다.',
      variables: ['genre', 'target_reader', 'episode_1_draft'],
      body: `너는 {{genre}} 장르 웹소설을 자주 읽는 독자야.

아래 1화를 읽고 실제 독자처럼 반응해줘.

[목표 독자]
{{target_reader}}

[1화 초안]
{{episode_1_draft}}

다음 형식으로 답해줘.

[첫인상]
- 계속 읽고 싶은가?
- 이유는 무엇인가?

[재미있었던 부분]
- 장면:
- 이유:

[이탈할 뻔한 부분]
- 장면:
- 이유:

[주인공 인상]
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
- 작가를 배려하되 독자 입장에서 솔직하게 말할 것
- 추상적인 칭찬보다 실제 이탈 지점을 말할 것`,
    },
  ],
};
