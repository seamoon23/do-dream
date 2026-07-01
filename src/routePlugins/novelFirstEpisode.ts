import type { RouteTemplate } from './types';

const tag = 'template:novel-first-episode';

export const novelFirstEpisodeTemplate: RouteTemplate = {
  id: 'novel-first-episode',
  name: '웹소설 1화 완성 루트',
  shortName: '웹소설 1화',
  description:
    '작은 글감에서 시작해 장르, 콘셉트, 캐릭터, 세계관, 1~5화 흐름, 1화 초안, 수정 방향까지 이어지는 글쓰기 루트입니다.',
  category: 'writing',
  recommendedFor: [
    '웹소설을 써보고 싶지만 어디서 시작할지 막막한 사람',
    '판타지, 로맨스판타지, 현대물, 스릴러 같은 장르 글감을 첫 원고로 옮기고 싶은 사람',
    '외부 AI API 없이 GPT, Claude, Gemini, Codex 등에 붙여넣을 요청서를 모아 쓰고 싶은 사람',
  ],
  outcome: '웹소설 1화 초안과 2차 수정 방향',
  tags: ['웹소설', '글쓰기', '출판', '1화', 'AI작업'],
  starterQuestions: [
    '어떤 글을 써보고 싶나요?',
    '떠오르는 키워드가 있다면 무엇인가요?',
    '좋아하는 장르나 작품은 무엇인가요?',
    '무거운 분위기와 가벼운 분위기 중 어느 쪽이 좋나요?',
    '1화에서 독자가 어떤 감정을 느끼면 좋겠나요?',
  ],
  keywordHints: ['책을 쓰고 싶어', '출판하고 싶어', '웹소설', '소설', '글을 쓰고 싶어', '원고', '작가', '로맨스판타지', '현대물', '판타지'],
  seedStages: [
    {
      order: 1,
      title: '작은 키워드 확장',
      difficulty: 1,
      goal: '막연한 키워드를 작품 후보로 확장한다.',
      doneCriteria: '작품 후보 3개와 가장 끌리는 방향 1개가 정리되어 있다.',
      requiredInputs: '책을 쓰고 싶어, 복수, 가족, 탑, 회귀 같은 작은 키워드',
      expectedOutput: '작품 후보 3개와 추천 방향',
      tags: ['시작', tag],
    },
    {
      order: 2,
      title: '장르와 목표 독자 정하기',
      difficulty: 1,
      goal: '작품의 장르, 분위기, 목표 독자를 정한다.',
      doneCriteria: '장르, 분위기, 목표 독자, 연재 목표가 1차 확정되어 있다.',
      requiredInputs: '좋아하는 작품, 쓰고 싶은 장르, 원하는 이야기 톤',
      expectedOutput: '작품 방향성 카드',
      tags: ['장르', '독자', tag],
    },
    {
      order: 3,
      title: '핵심 콘셉트 만들기',
      difficulty: 2,
      goal: '한 문장으로 설명 가능한 작품 콘셉트를 만든다.',
      doneCriteria: '로그라인 1개와 대체안 2개가 확보되어 있다.',
      requiredInputs: '장르, 주인공 아이디어, 핵심 갈등',
      expectedOutput: '작품 로그라인',
      tags: ['콘셉트', tag],
    },
    {
      order: 4,
      title: '독자 기대 분석',
      difficulty: 2,
      goal: '장르 독자가 기대하는 재미와 금기 요소를 정리한다.',
      doneCriteria: '초반 5화 안에 보여줄 독자 기대 요소 목록이 작성되어 있다.',
      requiredInputs: '장르, 유사 작품, 원하는 분위기',
      expectedOutput: '독자 기대 체크리스트',
      tags: ['독자', '시장성', tag],
    },
    {
      order: 5,
      title: '주인공 캐릭터 설계',
      difficulty: 2,
      goal: '독자가 따라가고 싶어지는 주인공을 만든다.',
      doneCriteria: '주인공의 욕망, 결핍, 능력, 약점이 정리되어 있다.',
      requiredInputs: '이름, 나이, 직업, 욕망, 결핍, 능력',
      expectedOutput: '주인공 캐릭터 카드',
      tags: ['캐릭터', '주인공', tag],
    },
    {
      order: 6,
      title: '조연과 대립자 설계',
      difficulty: 2,
      goal: '주인공을 입체적으로 만드는 관계와 갈등을 만든다.',
      doneCriteria: '주요 인물 3명 이상과 각 인물의 역할이 정리되어 있다.',
      requiredInputs: '조력자, 라이벌, 대립자, 조직 또는 세력',
      expectedOutput: '인물 관계 카드',
      tags: ['캐릭터', '갈등', tag],
    },
    {
      order: 7,
      title: '최소 세계관 설계',
      difficulty: 2,
      goal: '1화에 필요한 설정만 선명하게 정한다.',
      doneCriteria: '1화에서 필요한 설정이 한 페이지 안에 정리되어 있다.',
      requiredInputs: '능력 체계, 사회 구조, 사건 배경',
      expectedOutput: '최소 세계관 문서',
      tags: ['세계관', '설정', tag],
    },
    {
      order: 8,
      title: '1~5화 파일럿 흐름 만들기',
      difficulty: 3,
      goal: '1화만 쓰고 끝나지 않도록 초반 진행 방향을 잡는다.',
      doneCriteria: '1~5화 요약이 완성되어 있다.',
      requiredInputs: '주인공, 능력, 갈등, 세계관',
      expectedOutput: '1~5화 파일럿 흐름',
      tags: ['파일럿', '초반전개', tag],
    },
    {
      order: 9,
      title: '1화 훅 설계',
      difficulty: 3,
      goal: '첫 장면에서 독자를 붙잡을 구조를 만든다.',
      doneCriteria: '도입부 후보 3개 중 1개를 선택한다.',
      requiredInputs: '주인공 상황, 사건, 반전, 위기',
      expectedOutput: '1화 도입부 설계',
      tags: ['훅', '1화', tag],
    },
    {
      order: 10,
      title: '1화 초안 작성',
      difficulty: 3,
      goal: '실제 1화 원고 초안을 만든다.',
      doneCriteria: '1화 초안이 완성되어 있다.',
      requiredInputs: '로그라인, 캐릭터, 세계관, 1~5화 흐름, 훅 구조',
      expectedOutput: '1화 원고 초안',
      tags: ['원고', '초안', tag],
    },
    {
      order: 11,
      title: '편집자 피드백',
      difficulty: 2,
      goal: '출판/연재 관점에서 작품 방향성과 1화의 문제를 검토한다.',
      doneCriteria: '강점, 약점, 수정 우선순위가 정리되어 있다.',
      requiredInputs: '작품 콘셉트, 1화 초안',
      expectedOutput: '편집 피드백 리포트',
      tags: ['편집', '피드백', tag],
    },
    {
      order: 12,
      title: '문장 검수',
      difficulty: 1,
      goal: '오탈자, 비문, 어색한 문장을 점검한다.',
      doneCriteria: '수정 후보 목록이 정리되어 있다.',
      requiredInputs: '1화 초안',
      expectedOutput: '문장 검수 리포트',
      tags: ['검수', '문장', tag],
    },
    {
      order: 13,
      title: '가상 독자 피드백',
      difficulty: 2,
      goal: '목표 독자의 반응을 가정해 이탈 지점과 몰입 지점을 찾는다.',
      doneCriteria: '독자 반응, 이탈 위험, 다음 클릭 욕구가 정리되어 있다.',
      requiredInputs: '1화 초안, 장르, 목표 독자',
      expectedOutput: '가상 독자 피드백',
      tags: ['독자', '피드백', tag],
    },
    {
      order: 14,
      title: '수정본 방향 정리',
      difficulty: 3,
      goal: '피드백을 반영한 1화 수정 방향을 정한다.',
      doneCriteria: '수정 체크리스트와 2차 원고 방향이 정리되어 있다.',
      requiredInputs: '편집 피드백, 문장 검수, 독자 피드백',
      expectedOutput: '수정 체크리스트',
      tags: ['수정', '2차원고', tag],
    },
    {
      order: 15,
      title: '다음 회차 행동 정하기',
      difficulty: 1,
      goal: '2화 또는 연재 준비로 이어질 다음 행동을 정한다.',
      doneCriteria: '다음 작업 3개와 우선순위가 정리되어 있다.',
      requiredInputs: '수정 방향, 1~5화 흐름, 현재 막힘',
      expectedOutput: '다음 행동 목록',
      tags: ['다음행동', tag],
    },
  ],
  seedResources: [
    {
      type: 'NOTE',
      title: '작품 콘셉트 보드',
      summary: '로그라인, 장르, 목표 독자, 초반 사건을 모아 두는 기준 노트입니다.',
      importance: 5,
      reviewStatus: 'UNREVIEWED',
      tags: ['콘셉트', tag],
    },
    {
      type: 'NOTE',
      title: '캐릭터와 관계 메모',
      summary: '주인공, 조연, 대립자의 욕망과 갈등을 정리합니다.',
      importance: 4,
      reviewStatus: 'UNREVIEWED',
      tags: ['캐릭터', tag],
    },
    {
      type: 'TEXT',
      title: '1화 초안 붙여넣기 공간',
      summary: '완성한 1화 초안을 붙여넣고 편집/검수 요청서에 재사용합니다.',
      contentText: '여기에 1화 초안을 붙여넣으세요.',
      importance: 5,
      reviewStatus: 'INSUFFICIENT',
      tags: ['원고', '1화', tag],
    },
    {
      type: 'PROMPT',
      title: 'AI 붙여넣기 작업 기록',
      summary: 'GPT, Claude, Gemini, Codex에 붙여넣은 요청서와 응답 요약을 기록합니다.',
      importance: 4,
      reviewStatus: 'UNREVIEWED',
      tags: ['AI작업', tag],
    },
  ],
  seedPrompts: [
    {
      title: '작은 키워드 작품 후보 확장',
      tool: 'GENERAL',
      stageTitle: '작은 키워드 확장',
      variables: ['raw_keyword'],
      body: `나는 웹소설을 처음 기획하는 작가입니다.

[작은 키워드]
{{raw_keyword}}

이 키워드를 바탕으로 웹소설 작품 후보 3개를 만들어 주세요.

각 후보마다 아래 항목을 채워 주세요.
- 제목 후보:
- 장르:
- 한 줄 콘셉트:
- 주인공:
- 초반 사건:
- 독자 기대 포인트:
- 위험 요소:

마지막에는 초보 작가가 가장 쓰기 쉬운 방향 1개와 이유를 추천해 주세요.`,
    },
    {
      title: '장르 독자 기대 체크',
      tool: 'GENERAL',
      stageTitle: '독자 기대 분석',
      variables: ['genre', 'similar_titles'],
      body: `다음 장르의 독자가 초반 5화에서 기대하는 재미를 정리해 주세요.

[장르]
{{genre}}

[비슷하게 참고하는 작품]
{{similar_titles}}

아래 형식으로 답해 주세요.
- 반드시 보여줘야 할 재미:
- 피해야 할 초반 실수:
- 1화에서 바로 보여주면 좋은 장면:
- 다음 클릭을 만들 장치:`,
    },
    {
      title: '1화 훅 후보 만들기',
      tool: 'GENERAL',
      stageTitle: '1화 훅 설계',
      variables: ['concept', 'main_character', 'incident'],
      body: `아래 작품의 1화 도입부 후보를 3개 만들어 주세요.

[콘셉트]
{{concept}}

[주인공]
{{main_character}}

[초반 사건]
{{incident}}

각 후보는 첫 문단 분위기, 사건 시작 위치, 독자가 궁금해할 질문을 포함해 주세요.`,
    },
    {
      title: '1화 초안 작성 요청',
      tool: 'GENERAL',
      stageTitle: '1화 초안 작성',
      variables: ['concept', 'characters', 'episode_outline', 'hook'],
      body: `아래 정보를 바탕으로 웹소설 1화 초안을 작성해 주세요.

[작품 콘셉트]
{{concept}}

[주요 인물]
{{characters}}

[1~5화 흐름]
{{episode_outline}}

[선택한 1화 훅]
{{hook}}

조건:
- 첫 장면에서 사건 또는 갈등을 바로 보여 주세요.
- 설명은 최소화하고 행동과 대화로 전달해 주세요.
- 마지막은 다음 화를 누르고 싶게 끝내 주세요.`,
    },
    {
      title: '수정 방향 정리 요청',
      tool: 'GENERAL',
      stageTitle: '수정본 방향 정리',
      variables: ['editor_feedback', 'proofread_feedback', 'reader_feedback'],
      body: `아래 피드백을 합쳐 1화 수정 방향을 정리해 주세요.

[편집 피드백]
{{editor_feedback}}

[문장 검수]
{{proofread_feedback}}

[가상 독자 피드백]
{{reader_feedback}}

아래 형식으로 답해 주세요.
1. 반드시 고칠 것
2. 유지할 강점
3. 2차 원고에서 바꿀 장면
4. 다음 작업 순서`,
    },
  ],
  seedFlowNodes: [
    { title: '키워드', nodeType: 'STAGE', stageTitle: '작은 키워드 확장' },
    { title: '장르/독자', nodeType: 'STAGE', stageTitle: '장르와 목표 독자 정하기' },
    { title: '로그라인', nodeType: 'STAGE', stageTitle: '핵심 콘셉트 만들기' },
    { title: '주인공', nodeType: 'STAGE', stageTitle: '주인공 캐릭터 설계' },
    { title: '세계관', nodeType: 'STAGE', stageTitle: '최소 세계관 설계' },
    { title: '1~5화 흐름', nodeType: 'STAGE', stageTitle: '1~5화 파일럿 흐름 만들기' },
    { title: '1화 훅', nodeType: 'STAGE', stageTitle: '1화 훅 설계' },
    { title: '1화 초안', nodeType: 'STAGE', stageTitle: '1화 초안 작성' },
    { title: '피드백', nodeType: 'STAGE', stageTitle: '편집자 피드백' },
    { title: '수정 방향', nodeType: 'STAGE', stageTitle: '수정본 방향 정리' },
  ],
  seedFlowEdges: [
    { sourceTitle: '키워드', targetTitle: '장르/독자', label: '방향 좁히기', edgeType: 'NEXT' },
    { sourceTitle: '장르/독자', targetTitle: '로그라인', label: '콘셉트화', edgeType: 'NEXT' },
    { sourceTitle: '로그라인', targetTitle: '주인공', label: '인물 설계', edgeType: 'NEXT' },
    { sourceTitle: '주인공', targetTitle: '세계관', label: '배경 설계', edgeType: 'NEXT' },
    { sourceTitle: '세계관', targetTitle: '1~5화 흐름', label: '초반 전개', edgeType: 'NEXT' },
    { sourceTitle: '1~5화 흐름', targetTitle: '1화 훅', label: '도입 선택', edgeType: 'NEXT' },
    { sourceTitle: '1화 훅', targetTitle: '1화 초안', label: '원고 작성', edgeType: 'NEXT' },
    { sourceTitle: '1화 초안', targetTitle: '피드백', label: '검토', edgeType: 'NEXT' },
    { sourceTitle: '피드백', targetTitle: '수정 방향', label: '반영', edgeType: 'NEXT' },
  ],
  reviewCriteria: [
    { key: 'conceptClarity', label: '콘셉트 선명도', description: '한 문장으로 작품이 설명되는가?' },
    { key: 'readerExpectation', label: '독자 기대 충족', description: '장르 독자가 좋아할 요소가 있는가?' },
    { key: 'mainCharacterAppeal', label: '주인공 매력', description: '독자가 응원할 이유가 있는가?' },
    { key: 'earlyIncident', label: '초반 사건성', description: '1화 안에 사건이 발생하는가?' },
    { key: 'seriesPotential', label: '연재 확장성', description: '5화 이후로 이어질 갈등이 있는가?' },
    { key: 'settingLoad', label: '설정 부담', description: '설정 설명이 초반을 누르지 않는가?' },
    { key: 'differentiation', label: '차별성', description: '익숙한 소재 안에서도 다른 맛이 있는가?' },
    { key: 'completionPossibility', label: '완성 가능성', description: '실제로 1화를 끝낼 만큼 조건이 좋은가?' },
  ],
  homeCards: [
    { key: 'todayWritingAction', title: '오늘의 집필 행동', description: '현재 단계에서 바로 할 수 있는 가장 작은 글쓰기 행동을 고릅니다.' },
    { key: 'currentStoryDecision', title: '현재 작품 판단', description: '작품 방향, 막힘 이유, 다음 보완점을 확인합니다.' },
    { key: 'draftReadiness', title: '1화 준비도', description: '콘셉트, 캐릭터, 세계관, 파일럿, 훅, 초안 상태를 봅니다.' },
  ],
};
