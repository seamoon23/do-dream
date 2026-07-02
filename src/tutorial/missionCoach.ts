import type { GuideKey } from '../lib/content';
import type { AiReport, Idea, PromptTemplate, Resource, ReviewScore, Stage } from '../types/domain';

type MissionWaypointKey = 'seed' | 'genre' | 'character' | 'world' | 'draft' | 'feedback';

export type TutorialWaypoint = {
  key: MissionWaypointKey;
  label: string;
  status: 'done' | 'current' | 'open' | 'locked';
  tab: GuideKey;
};

export type TutorialMissionPrefill =
  | {
      kind: 'resource';
      stageTitleHints?: string[];
      resource: Pick<Resource, 'type' | 'title' | 'summary' | 'contentText' | 'importance' | 'reviewStatus' | 'tags'>;
    }
  | {
      kind: 'prompt';
      stageTitleHints?: string[];
      prompt: Pick<PromptTemplate, 'tool' | 'title' | 'body' | 'variables' | 'version'>;
    };

export type TutorialMission = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  rationale: string;
  action: {
    tab: GuideKey;
    label: string;
    toast?: string;
    prefill?: TutorialMissionPrefill;
  };
  secondaryAction?: {
    tab: GuideKey;
    label: string;
  };
  waypoints: TutorialWaypoint[];
  canDismiss: boolean;
};

export type TutorialMissionInput = {
  routeTemplateId: string;
  idea: Idea;
  resources: Resource[];
  stages: Stage[];
  prompts: PromptTemplate[];
  review?: ReviewScore;
  aiReports: AiReport[];
  dismissedMissionIds?: string[];
};

type MissionDefinition = Omit<TutorialMission, 'waypoints' | 'canDismiss'> & {
  waypointKey: MissionWaypointKey;
  done: boolean;
};

type NovelChecks = Record<MissionWaypointKey, boolean>;

const draftPlaceholder = '여기에 1화 초안을 붙여넣으세요.';

const waypointLabels: Array<{ key: MissionWaypointKey; label: string; tab: GuideKey }> = [
  { key: 'seed', label: '씨앗', tab: 'idea' },
  { key: 'genre', label: '장르', tab: 'resources' },
  { key: 'character', label: '인물', tab: 'resources' },
  { key: 'world', label: '세계/흐름', tab: 'resources' },
  { key: 'draft', label: '1화', tab: 'resources' },
  { key: 'feedback', label: '피드백', tab: 'prompts' },
];

export function getTutorialMission(input: TutorialMissionInput): TutorialMission {
  if (input.routeTemplateId === 'novel-first-episode') {
    return getNovelMission(input);
  }

  return getPlainMission(input);
}

function getNovelMission(input: TutorialMissionInput): TutorialMission {
  const checks = getNovelChecks(input);
  const missions = buildNovelMissions(input, checks);
  const dismissed = new Set(input.dismissedMissionIds ?? []);
  const activeMission = missions.find((mission) => !mission.done && !dismissed.has(mission.id));

  if (activeMission) {
    return {
      ...activeMission,
      waypoints: buildWaypoints(checks, activeMission.waypointKey),
      canDismiss: true,
    };
  }

  if (missions.some((mission) => !mission.done)) {
    return {
      id: 'novel-free-roam',
      eyebrow: '자유 진행',
      title: '건너뛴 미션은 숨겨두고 자유롭게 진행해도 됩니다',
      body: '필요한 칸을 직접 채워도 괜찮습니다. 흐름 보기를 열면 지금 만들어진 뼈대와 빈 구간을 한눈에 볼 수 있어요.',
      rationale: '튜토리얼은 강제 절차가 아니라 길잡이입니다. 원할 때만 따라가고, 이미 감이 오는 부분은 직접 진행하면 됩니다.',
      action: {
        tab: 'flow',
        label: '흐름에서 보기',
      },
      secondaryAction: {
        tab: 'resources',
        label: '자료 직접 채우기',
      },
      waypoints: buildWaypoints(checks),
      canDismiss: false,
    };
  }

  return {
    id: 'novel-complete-first-loop',
    eyebrow: '첫 루프 완료',
    title: '1화 완성 루트가 한 바퀴 돌았습니다',
    body: '이제 1화 수정 방향을 정리하거나, 2화로 넘어가기 전에 JSON 백업을 남겨두면 좋습니다.',
    rationale: '첫 원고는 완성보다 다시 고칠 기준을 얻는 것이 중요합니다. 백업 후 피드백을 보고 수정 우선순위를 고르면 다음 회차가 훨씬 편해집니다.',
    action: {
      tab: 'backup',
      label: '백업하러 가기',
    },
    secondaryAction: {
      tab: 'review',
      label: '피드백 정리',
    },
    waypoints: buildWaypoints(checks),
    canDismiss: false,
  };
}

function getPlainMission(input: TutorialMissionInput): TutorialMission {
  const hasIdeaOverview = hasText(input.idea.title) && hasText(input.idea.summary);
  const hasResource = input.resources.some((resource) => resourceLooksFilled(resource));
  const hasStartedStage = input.stages.some((stage) => stage.status !== 'TODO');
  const hasPrompt = input.prompts.some((prompt) => !prompt.sourceTemplateId);
  const checks: NovelChecks = {
    seed: hasIdeaOverview,
    genre: hasResource,
    character: hasStartedStage,
    world: hasPrompt,
    draft: Boolean(input.review),
    feedback: input.aiReports.length > 0,
  };

  const next =
    !hasIdeaOverview
      ? {
          id: 'plain-idea',
          title: '먼저 아이디어를 한 문장으로 잡아주세요',
          tab: 'idea' as GuideKey,
          label: '아이디어 쓰기',
          body: '제목과 한 줄 요약이 생기면 나머지 화면이 판단 기준을 갖게 됩니다.',
        }
      : !hasResource
        ? {
            id: 'plain-resource',
            title: '판단에 쓸 자료를 하나 넣어주세요',
            tab: 'resources' as GuideKey,
            label: '자료 추가하기',
            body: '링크, 메모, 파일 정보 중 하나만 있어도 다음 단계가 훨씬 구체화됩니다.',
          }
        : !hasStartedStage
          ? {
              id: 'plain-stage',
              title: '실행 단계를 하나 진행 상태로 바꿔보세요',
              tab: 'stages' as GuideKey,
              label: '단계 보기',
              body: '지금 실제로 할 수 있는 가장 작은 행동을 하나 고르면 됩니다.',
            }
          : !hasPrompt
            ? {
                id: 'plain-prompt',
                title: '도구에 넘길 프롬프트를 하나 준비하세요',
                tab: 'prompts' as GuideKey,
                label: '프롬프트 만들기',
                body: '단계 목표와 완료 기준을 붙여넣을 수 있는 작업 지시문을 만들어두세요.',
              }
            : {
                id: 'plain-review',
                title: '이제 진행 판단을 남길 차례입니다',
                tab: 'review' as GuideKey,
                label: '검토하기',
                body: '계속 진행할지, 자료를 더 모을지, 보류할지 가볍게 점수화해보세요.',
              };

  return {
    id: next.id,
    eyebrow: '다음 미션',
    title: next.title,
    body: next.body,
    rationale: 'Plain Mode는 정해진 장르 절차가 없기 때문에, 앱 안의 기본 흐름을 따라 가장 덜 채워진 곳부터 안내합니다.',
    action: {
      tab: next.tab,
      label: next.label,
    },
    secondaryAction: {
      tab: 'flow',
      label: '전체 흐름 보기',
    },
    waypoints: buildWaypoints(checks, firstIncompleteKey(checks)),
    canDismiss: false,
  };
}

function buildNovelMissions(input: TutorialMissionInput, checks: NovelChecks): MissionDefinition[] {
  const draftDone = hasDraft(input.resources);
  const hasFeedback = checks.feedback;

  return [
    {
      id: 'novel-seed',
      waypointKey: 'seed',
      done: hasText(input.idea.title) && hasText(input.idea.summary),
      eyebrow: '처음 10분',
      title: '작품 씨앗을 한 문장으로 잡아주세요',
      body: '캐릭터를 만들기 전에 “무슨 이야기인지”를 아주 거칠게라도 적어야 다음 선택이 쉬워집니다.',
      rationale: '초보 작가는 처음부터 설정을 많이 만들수록 길을 잃기 쉽습니다. 제목과 한 줄 요약만 있어도 장르, 캐릭터, 1화 훅을 고르는 기준이 생깁니다.',
      action: {
        tab: 'idea',
        label: '씨앗 적기',
      },
      secondaryAction: {
        tab: 'prompts',
        label: '키워드 확장 요청서',
      },
    },
    {
      id: 'novel-concept-candidates',
      waypointKey: 'seed',
      done: hasConcept(input.resources),
      eyebrow: '다음 미션',
      title: '아직 캐릭터보다 작품 후보 3개가 먼저예요',
      body: '처음부터 하나를 정답으로 잡지 말고, 같은 키워드에서 나올 수 있는 작품 후보를 3개만 비교해보세요.',
      rationale: '후보를 나란히 보면 내가 쓰고 싶은 재미가 무엇인지 빨리 드러납니다. 이 과정을 거치면 캐릭터도 “그냥 멋진 사람”이 아니라 이야기의 방향에 맞게 만들어집니다.',
      action: {
        tab: 'resources',
        label: '후보 카드 쓰기',
        toast: '작품 후보 카드 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['작은 키워드 확장'],
          resource: {
            type: 'NOTE',
            title: '작품 후보 3개와 선택한 방향',
            summary: `후보 A:
후보 B:
후보 C:
가장 끌리는 방향:
왜 이 방향을 쓰고 싶은가:`,
            contentText: '',
            importance: 5,
            reviewStatus: 'UNREVIEWED',
            tags: ['콘셉트', '시작', '웹소설'],
          },
        },
      },
      secondaryAction: {
        tab: 'prompts',
        label: '확장 프롬프트 보기',
      },
    },
    {
      id: 'novel-genre-reader',
      waypointKey: 'genre',
      done: checks.genre,
      eyebrow: '방향 잡기',
      title: '장르와 목표 독자를 먼저 고정하세요',
      body: '판타지인지 로판인지, 무겁게 갈지 가볍게 갈지에 따라 주인공의 결핍과 1화 사건이 달라집니다.',
      rationale: '장르는 제약이 아니라 독자와의 약속입니다. 이 약속을 먼저 잡으면 어떤 캐릭터가 필요한지, 어떤 자료를 찾아야 하는지 감이 생깁니다.',
      action: {
        tab: 'resources',
        label: '장르 카드 쓰기',
        toast: '장르와 목표 독자 카드 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['장르와 목표 독자 정하기', '독자 기대 분석'],
          resource: {
            type: 'NOTE',
            title: '장르와 목표 독자 카드',
            summary: `장르:
목표 독자:
작품 분위기:
참고하고 싶은 작품:
초반 5화에서 보여줄 재미:
피하고 싶은 전개:`,
            contentText: '',
            importance: 5,
            reviewStatus: 'UNREVIEWED',
            tags: ['장르', '독자', '방향성'],
          },
        },
      },
      secondaryAction: {
        tab: 'prompts',
        label: '독자 기대 요청서',
      },
    },
    {
      id: 'novel-protagonist',
      waypointKey: 'character',
      done: checks.character,
      eyebrow: '인물 만들기',
      title: '이제 주인공 카드를 만들 차례예요',
      body: '이름보다 먼저 욕망, 결핍, 능력, 약점을 정하세요. 독자는 사건보다 주인공을 따라갑니다.',
      rationale: '초반 회차의 힘은 “이 사람이 왜 움직이는지”에서 나옵니다. 주인공의 욕망과 결핍이 분명하면 1화 사건도 자연스럽게 결정됩니다.',
      action: {
        tab: 'resources',
        label: '주인공 카드 쓰기',
        toast: '주인공 캐릭터 카드 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['주인공 캐릭터 설계'],
          resource: {
            type: 'NOTE',
            title: '주인공 캐릭터 카드',
            summary: `이름/나이/직업:
가장 원하는 것:
부족하거나 두려워하는 것:
능력 또는 장점:
치명적인 약점:
1화에서 맞닥뜨릴 사건:
독자가 응원하게 될 이유:`,
            contentText: '',
            importance: 5,
            reviewStatus: 'UNREVIEWED',
            tags: ['캐릭터', '주인공'],
          },
        },
      },
      secondaryAction: {
        tab: 'stages',
        label: '캐릭터 단계 보기',
      },
    },
    {
      id: 'novel-world',
      waypointKey: 'world',
      done: hasWorld(input.resources),
      eyebrow: '설정 다이어트',
      title: '세계관은 1화에 필요한 만큼만 만드세요',
      body: '방대한 설정집을 쓰기보다, 1화에서 독자가 알아야 하는 규칙 3개만 먼저 정리하면 충분합니다.',
      rationale: '초보 작가가 가장 많이 멈추는 곳이 설정 과잉입니다. 지금 필요한 건 세계 전체가 아니라 1화 장면이 설득되는 최소 규칙입니다.',
      action: {
        tab: 'resources',
        label: '최소 세계관 쓰기',
        toast: '최소 세계관 카드 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['최소 세계관 설계'],
          resource: {
            type: 'NOTE',
            title: '1화용 최소 세계관',
            summary: `1화 배경:
독자가 알아야 할 규칙 1:
독자가 알아야 할 규칙 2:
독자가 알아야 할 규칙 3:
주인공이 이 규칙 때문에 겪는 문제:
아직 설명하지 않을 설정:`,
            contentText: '',
            importance: 4,
            reviewStatus: 'UNREVIEWED',
            tags: ['세계관', '설정', '1화'],
          },
        },
      },
      secondaryAction: {
        tab: 'flow',
        label: '흐름으로 보기',
      },
    },
    {
      id: 'novel-pilot-flow',
      waypointKey: 'world',
      done: hasPilotFlow(input.resources, input.stages),
      eyebrow: '초반 설계',
      title: '1화만 쓰기 전에 1~5화 흐름을 얇게 잡아주세요',
      body: '각 화를 자세히 쓰지 말고, 1화가 어떤 다음 클릭으로 이어지는지만 정하면 됩니다.',
      rationale: '웹소설 1화는 혼자 완결되는 단편이 아니라 다음 회차를 누르게 만드는 입구입니다. 5화까지의 방향이 있으면 1화의 끝점이 선명해집니다.',
      action: {
        tab: 'resources',
        label: '파일럿 흐름 쓰기',
        toast: '1~5화 파일럿 흐름 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['1~5화 파일럿 흐름 만들기'],
          resource: {
            type: 'NOTE',
            title: '1~5화 파일럿 흐름',
            summary: `1화:
2화:
3화:
4화:
5화:
5화까지 독자가 기대하게 만들 변화:
아직 확정하지 않을 것:`,
            contentText: '',
            importance: 5,
            reviewStatus: 'UNREVIEWED',
            tags: ['파일럿', '초반전개', '1화'],
          },
        },
      },
      secondaryAction: {
        tab: 'stages',
        label: '해당 단계 보기',
      },
    },
    {
      id: 'novel-hook',
      waypointKey: 'draft',
      done: hasHook(input.resources),
      eyebrow: '첫 장면',
      title: '1화 훅 후보를 고르면 초안이 쉬워집니다',
      body: '첫 문장을 바로 쓰기 막막하다면, 위기형, 의문형, 반전형 훅을 각각 하나씩만 적어보세요.',
      rationale: '훅은 독자를 붙잡는 장치이면서 작가에게도 첫 장면의 방향을 알려주는 표지판입니다. 후보 3개 중 하나를 고르면 초안 작성 부담이 확 줄어듭니다.',
      action: {
        tab: 'resources',
        label: '훅 후보 쓰기',
        toast: '1화 훅 후보 카드 초안을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['1화 훅 설계'],
          resource: {
            type: 'NOTE',
            title: '1화 훅 후보 3개',
            summary: `위기형 훅:
의문형 훅:
반전형 훅:
가장 끌리는 후보:
이 후보로 시작하면 독자가 궁금해할 점:`,
            contentText: '',
            importance: 5,
            reviewStatus: 'UNREVIEWED',
            tags: ['훅', '1화', '도입부'],
          },
        },
      },
      secondaryAction: {
        tab: 'prompts',
        label: '훅 요청서 보기',
      },
    },
    {
      id: 'novel-first-draft',
      waypointKey: 'draft',
      done: draftDone,
      eyebrow: '원고 시작',
      title: '이제 완벽하지 않은 1화 초안을 쓰세요',
      body: '처음부터 좋은 문장을 목표로 하지 말고, 훅에서 시작해 주인공이 선택하는 장면까지 이어보세요.',
      rationale: '첫 초안의 목적은 출간 가능한 문장이 아니라 고칠 수 있는 실체를 만드는 것입니다. 초안이 있어야 편집자, 검수, 독자 피드백 루트가 작동합니다.',
      action: {
        tab: 'resources',
        label: '초안 공간 열기',
        toast: '1화 초안 작성 공간을 자료 입력칸에 준비했습니다.',
        prefill: {
          kind: 'resource',
          stageTitleHints: ['1화 초안 작성'],
          resource: {
            type: 'TEXT',
            title: '1화 초안 작성 공간',
            summary: `첫 장면:
주인공이 처한 문제:
중간에 드러나는 선택지:
마지막 문단의 다음 클릭:

아래 본문/메모 칸에는 초안을 그대로 붙여넣으세요.`,
            contentText: '',
            importance: 5,
            reviewStatus: 'INSUFFICIENT',
            tags: ['원고', '1화', '초안'],
          },
        },
      },
      secondaryAction: {
        tab: 'stages',
        label: '초안 단계 보기',
      },
    },
    {
      id: 'novel-feedback',
      waypointKey: 'feedback',
      done: hasFeedback,
      eyebrow: '고치는 기준',
      title: '초안 다음에는 피드백 요청서를 복사하세요',
      body: '편집자, 문장 검수, 가상 독자 관점으로 나눠 보면 무엇부터 고칠지 덜 막막합니다.',
      rationale: '처음 쓴 1화는 스스로 판단하기 어렵습니다. 관점을 나눠 피드백을 받으면 “문장이 문제인지, 구조가 문제인지, 독자 기대가 문제인지”를 구분할 수 있습니다.',
      action: {
        tab: 'prompts',
        label: '피드백 요청서 보기',
        toast: '프롬프트 준비 탭에서 편집자/검수/독자 피드백 요청서를 복사할 수 있습니다.',
      },
      secondaryAction: {
        tab: 'review',
        label: '피드백 저장하기',
      },
    },
  ];
}

function getNovelChecks(input: TutorialMissionInput): NovelChecks {
  const seed = hasText(input.idea.title) && hasText(input.idea.summary) && hasConcept(input.resources);
  const genre = hasGenre(input.resources);
  const character = hasProtagonist(input.resources);
  const world = hasWorld(input.resources) && hasPilotFlow(input.resources, input.stages) && hasHook(input.resources);
  const draft = hasDraft(input.resources);
  const feedback = Boolean(input.review) || input.aiReports.length > 0 || hasFilledResource(input.resources, ['피드백', '검수', '수정']);

  return { seed, genre, character, world, draft, feedback };
}

function buildWaypoints(checks: NovelChecks, currentKey?: MissionWaypointKey): TutorialWaypoint[] {
  const firstOpenIndex = waypointLabels.findIndex((waypoint) => !checks[waypoint.key]);

  return waypointLabels.map((waypoint, index) => {
    const done = checks[waypoint.key];
    const status = done
      ? 'done'
      : waypoint.key === currentKey
        ? 'current'
        : firstOpenIndex === -1 || index <= firstOpenIndex + 1
          ? 'open'
          : 'locked';

    return {
      ...waypoint,
      status,
    };
  });
}

function firstIncompleteKey(checks: NovelChecks): MissionWaypointKey | undefined {
  return waypointLabels.find((waypoint) => !checks[waypoint.key])?.key;
}

function hasConcept(resources: Resource[]) {
  return hasFilledResource(resources, ['작품 후보', '로그라인', '콘셉트', '방향성']);
}

function hasGenre(resources: Resource[]) {
  return hasFilledResource(resources, ['장르', '목표 독자', '독자 기대', '분위기']);
}

function hasProtagonist(resources: Resource[]) {
  return hasFilledResource(resources, ['주인공', '캐릭터', '욕망', '결핍']);
}

function hasWorld(resources: Resource[]) {
  return hasFilledResource(resources, ['세계관', '설정', '능력 체계', '사회 구조']);
}

function hasPilotFlow(resources: Resource[], stages: Stage[]) {
  return hasFilledResource(resources, ['1~5화', '파일럿', '초반전개', '초반 흐름']) || stageStarted(stages, ['1~5화 파일럿 흐름']);
}

function hasHook(resources: Resource[]) {
  return hasFilledResource(resources, ['훅', '도입부', '첫 장면']);
}

function hasDraft(resources: Resource[]) {
  return resources.some((resource) => {
    if (!matchesResource(resource, ['1화 초안', '원고', '초안'])) return false;
    const body = normalize([resource.summary, resource.contentText].join(' '));
    return body.length >= 80 && !body.includes(normalize(draftPlaceholder));
  });
}

function hasFilledResource(resources: Resource[], tokens: string[]) {
  return resources.some((resource) => matchesResource(resource, tokens) && resourceLooksFilled(resource));
}

function resourceLooksFilled(resource: Resource) {
  if (resource.reviewStatus === 'VALID') return true;
  if (resource.url || resource.fileName) return true;

  const content = normalize(resource.contentText ?? '');
  if (content && content !== normalize(draftPlaceholder)) return true;

  if (resource.sourceTemplateId) return false;

  const summary = normalize(resource.summary ?? '');
  return summary.length >= 12;
}

function stageStarted(stages: Stage[], tokens: string[]) {
  return stages.some((stage) => stage.status !== 'TODO' && tokens.some((token) => normalize(stage.title).includes(normalize(token))));
}

function matchesResource(resource: Resource, tokens: string[]) {
  const haystack = normalize([resource.title, resource.summary, resource.contentText, resource.tags.join(' ')].join(' '));
  return tokens.some((token) => haystack.includes(normalize(token)));
}

function hasText(value: string | undefined) {
  return normalize(value ?? '').length > 0;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
