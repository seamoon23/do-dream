import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Check,
  Clipboard,
  DatabaseBackup,
  FileText,
  GitBranch,
  Info,
  Link,
  ListChecks,
  Network,
  Plus,
  Route,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DashboardPanelView } from './components/DashboardPanel';
import { FlowPanelView } from './components/FlowPanel';
import { edgeStyles, edgeTypeLabels, FlowTypeIcon, flowNodeStyles, statusBadgeClass } from './components/flowVisuals';
import { ReviewPanelView } from './components/ReviewPanel';
import { AppButton, classNames, EmptyState, GuideDialog, inputClass, Metric } from './components/ui';
import { BackupPanelView, IdeaPanelView, PromptsPanelView, ResourcesPanelView, StagesPanelView } from './components/WorkspacePanels';
import { getAgentsForTemplate } from './agentPlugins/registry';
import { assertBackupPayload, db, exportBackup, importBackup } from './db/database';
import type { AiReportDraft } from './lib/aiReport';
import { copyTextToClipboard } from './lib/clipboard';
import {
  flowTypeLabels,
  type GuideKey,
  ideaStatusLabels,
  stageStatusLabels,
  stageTemplates,
} from './lib/content';
import { createId, downloadText, readFileAsText } from './lib/format';
import { buildAiReviewPrompt, buildIdeaMarkdown } from './lib/markdown';
import { calculateReviewAverage, getReviewVerdict } from './lib/review';
import { getEffectiveRouteTemplate, routeTemplates } from './routePlugins/registry';
import { applyRouteTemplate } from './templateEngine/applyRouteTemplate';
import { recommendTemplatesByKeyword } from './templateEngine/keywordRouter';
import { getTutorialMission, type TutorialMission, type TutorialMissionPrefill } from './tutorial/missionCoach';
import type {
  AiReport,
  BackupPayload,
  FlowEdge,
  FlowNode,
  FlowNodeType,
  Idea,
  IdeaStatus,
  PromptTemplate,
  Resource,
  ReviewScore,
  Stage,
  StageStatus,
} from './types/domain';

type TabKey = GuideKey;
type Toast = { type: 'success' | 'error' | 'info'; message: string };
type PendingBackupImport = { payload: BackupPayload; fileName: string };
type DismissedTutorialMissionMap = Record<string, string[]>;

const tabItems = [
  { value: 'dashboard', label: '홈', Icon: Route },
  { value: 'idea', label: '아이디어 정리', Icon: FileText },
  { value: 'resources', label: '자료 모으기', Icon: Link },
  { value: 'prompts', label: '프롬프트 준비', Icon: Clipboard },
  { value: 'stages', label: '실행 계획', Icon: Check },
  { value: 'review', label: '진행 판단', Icon: ListChecks },
  { value: 'flow', label: '흐름 보기', Icon: Network },
  { value: 'backup', label: '보관함', Icon: DatabaseBackup },
] satisfies Array<{ value: TabKey; label: string; Icon: LucideIcon }>;

const emptyIdea = (): Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  summary: '',
  problem: '',
  targetUser: '',
  expectedValue: '',
  monetizationNote: '',
  status: 'COLLECTED',
  priority: 3,
  tags: [],
  memo: '',
});

const emptyResource = (): Omit<Resource, 'id' | 'ideaId' | 'createdAt' | 'updatedAt'> => ({
  type: 'LINK',
  title: '',
  url: '',
  fileName: '',
  mimeType: '',
  sizeBytes: undefined,
  contentText: '',
  summary: '',
  tags: [],
  importance: 3,
  reviewStatus: 'UNREVIEWED',
  linkedStageId: '',
});

const emptyPrompt = (): Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> => ({
  ideaId: undefined,
  stageId: undefined,
  tool: 'CODEX',
  title: '',
  body: '',
  variables: [],
  version: 1,
});

const tutorialDismissedStorageKey = 'idea-route-builder:dismissed-tutorial-missions';

const defaultReview = (ideaId: string): Omit<ReviewScore, 'id' | 'createdAt' | 'updatedAt'> => ({
  ideaId,
  problemClarity: 3,
  userValue: 3,
  implementationDifficulty: 3,
  resourceReadiness: 3,
  techFit: 3,
  scalability: 3,
  monetizationPotential: 3,
  riskLevel: 3,
  totalAverage: 3,
  verdict: 'NEEDS_MORE_RESOURCE',
  missingResources: [],
  memo: '',
});

function now() {
  return new Date().toISOString();
}

export function App() {
  const ideas = useLiveQuery((): Promise<Idea[]> => db.ideas.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [ideaDraft, setIdeaDraft] = useState(emptyIdea);
  const [resourceDraft, setResourceDraft] = useState(emptyResource);
  const [promptDraft, setPromptDraft] = useState(emptyPrompt);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'ALL'>('ALL');
  const [toast, setToast] = useState<Toast>();
  const [guideOpen, setGuideOpen] = useState<GuideKey>();
  const [routeGoal, setRouteGoal] = useState('');
  const [selectedRouteTemplateId, setSelectedRouteTemplateId] = useState('plain');
  const [selectedFlowNodeId, setSelectedFlowNodeId] = useState<string>();
  const [selectedFlowEdgeId, setSelectedFlowEdgeId] = useState<string>();
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState(() => window.localStorage.getItem('idea-route-builder:last-backup-at') ?? '');
  const [pendingBackupImport, setPendingBackupImport] = useState<PendingBackupImport>();
  const [dismissedTutorialMissionMap, setDismissedTutorialMissionMap] = useState<DismissedTutorialMissionMap>(() => {
    try {
      const stored = window.localStorage.getItem(tutorialDismissedStorageKey);
      return stored ? (JSON.parse(stored) as DismissedTutorialMissionMap) : {};
    } catch {
      return {};
    }
  });

  const selectedIdea = isCreatingIdea ? undefined : ideas.find((idea) => idea.id === selectedIdeaId);
  const activeRouteTemplate = getEffectiveRouteTemplate(selectedIdea?.templateId ?? selectedRouteTemplateId);
  const activeAgentPlugins = activeRouteTemplate.id === 'plain' ? [] : getAgentsForTemplate(activeRouteTemplate.id);
  const resources =
    useLiveQuery(
      (): Promise<Resource[]> =>
        selectedIdeaId ? db.resources.where('ideaId').equals(selectedIdeaId).reverse().sortBy('updatedAt') : Promise.resolve([] as Resource[]),
      [selectedIdeaId],
    ) ?? [];
  const stages =
    useLiveQuery(
      (): Promise<Stage[]> => (selectedIdeaId ? db.stages.where('ideaId').equals(selectedIdeaId).sortBy('order') : Promise.resolve([] as Stage[])),
      [selectedIdeaId],
    ) ?? [];
  const review = useLiveQuery(
    (): Promise<ReviewScore | undefined> =>
      selectedIdeaId ? db.reviewScores.where('ideaId').equals(selectedIdeaId).last() : Promise.resolve(undefined),
    [selectedIdeaId],
  );
  const prompts =
    useLiveQuery(
      (): Promise<PromptTemplate[]> =>
        selectedIdeaId
          ? db.promptTemplates.where('ideaId').equals(selectedIdeaId).reverse().sortBy('updatedAt')
          : Promise.resolve([] as PromptTemplate[]),
      [selectedIdeaId],
    ) ?? [];
  const flowNodes =
    useLiveQuery(
      (): Promise<FlowNode[]> => (selectedIdeaId ? db.flowNodes.where('ideaId').equals(selectedIdeaId).toArray() : Promise.resolve([] as FlowNode[])),
      [selectedIdeaId],
    ) ?? [];
  const flowEdges =
    useLiveQuery(
      (): Promise<FlowEdge[]> => (selectedIdeaId ? db.flowEdges.where('ideaId').equals(selectedIdeaId).toArray() : Promise.resolve([] as FlowEdge[])),
      [selectedIdeaId],
    ) ?? [];
  const aiReports =
    useLiveQuery(
      (): Promise<AiReport[]> =>
        selectedIdeaId ? db.aiReports.where('ideaId').equals(selectedIdeaId).reverse().sortBy('updatedAt') : Promise.resolve([] as AiReport[]),
      [selectedIdeaId],
    ) ?? [];
  const dismissedTutorialMissionIds = selectedIdea ? (dismissedTutorialMissionMap[selectedIdea.id] ?? []) : [];
  const tutorialMission = useMemo(
    () =>
      selectedIdea
        ? getTutorialMission({
            routeTemplateId: activeRouteTemplate.id,
            idea: selectedIdea,
            resources,
            stages,
            prompts,
            review,
            aiReports,
            dismissedMissionIds: dismissedTutorialMissionIds,
          })
        : undefined,
    [activeRouteTemplate.id, aiReports, dismissedTutorialMissionIds, prompts, resources, review, selectedIdea, stages],
  );

  useEffect(() => {
    if (!isCreatingIdea && !selectedIdeaId && ideas.length > 0) {
      setSelectedIdeaId(ideas[0].id);
    }
  }, [ideas, isCreatingIdea, selectedIdeaId]);

  useEffect(() => {
    if (!selectedIdea) {
      setIdeaDraft(emptyIdea());
      return;
    }

    setIdeaDraft({
      title: selectedIdea.title,
      summary: selectedIdea.summary,
      problem: selectedIdea.problem,
      targetUser: selectedIdea.targetUser,
      expectedValue: selectedIdea.expectedValue,
      monetizationNote: selectedIdea.monetizationNote ?? '',
      status: selectedIdea.status,
      priority: selectedIdea.priority,
      tags: selectedIdea.tags,
      memo: selectedIdea.memo ?? '',
    });
    setSelectedRouteTemplateId(selectedIdea.templateId ?? 'plain');
  }, [selectedIdea]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredIdeas = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ideas.filter((idea) => {
      const statusMatch = statusFilter === 'ALL' || idea.status === statusFilter;
      const queryMatch =
        !normalized ||
        [idea.title, idea.summary, idea.problem, idea.tags.join(' ')].some((value) => value.toLowerCase().includes(normalized));
      return statusMatch && queryMatch;
    });
  }, [ideas, query, statusFilter]);

  const recommendedRouteTemplates = useMemo(() => recommendTemplatesByKeyword(routeGoal), [routeGoal]);
  const selectedFlowNode = flowNodes.find((node) => node.id === selectedFlowNodeId);
  const selectedFlowEdge = flowEdges.find((edge) => edge.id === selectedFlowEdgeId);
  const stats = {
    resourceCount: resources.length,
    stageCount: stages.length,
    doneStageCount: stages.filter((stage) => stage.status === 'DONE').length,
    promptCount: prompts.length,
    flowNodeCount: flowNodes.length,
  };

  function notify(type: Toast['type'], message: string) {
    setToast({ type, message });
  }

  function findStageIdByTitleHints(hints?: string[]) {
    if (!hints?.length) return '';
    const normalizedHints = hints.map((hint) => hint.trim().toLowerCase()).filter(Boolean);
    return stages.find((stage) => normalizedHints.some((hint) => stage.title.toLowerCase().includes(hint)))?.id ?? '';
  }

  function applyTutorialPrefill(prefill?: TutorialMissionPrefill) {
    if (!prefill) return;

    const stageId = findStageIdByTitleHints(prefill.stageTitleHints);
    if (prefill.kind === 'resource') {
      setResourceDraft({
        ...emptyResource(),
        ...prefill.resource,
        linkedStageId: stageId,
      });
      return;
    }

    setPromptDraft({
      ...emptyPrompt(),
      ...prefill.prompt,
      stageId: stageId || undefined,
    });
  }

  function startTutorialMission(mission: TutorialMission) {
    applyTutorialPrefill(mission.action.prefill);
    setTab(mission.action.tab);
    notify('info', mission.action.toast ?? '미션 화면으로 이동했습니다.');
  }

  function dismissTutorialMission(missionId: string) {
    if (!selectedIdea) return;

    const next = {
      ...dismissedTutorialMissionMap,
      [selectedIdea.id]: Array.from(new Set([...(dismissedTutorialMissionMap[selectedIdea.id] ?? []), missionId])),
    };
    setDismissedTutorialMissionMap(next);
    window.localStorage.setItem(tutorialDismissedStorageKey, JSON.stringify(next));
    notify('info', '이 미션은 잠시 건너뛰었습니다.');
  }

  async function saveIdea() {
    const title = ideaDraft.title.trim();
    if (!title) {
      notify('error', '아이디어 제목은 비워둘 수 없습니다.');
      return;
    }

    const timestamp = now();
    const payload = {
      ...ideaDraft,
      title,
      priority: Math.min(5, Math.max(1, ideaDraft.priority)) as Idea['priority'],
      updatedAt: timestamp,
    };

    try {
      if (selectedIdea) {
        await db.ideas.update(selectedIdea.id, payload);
        notify('success', '아이디어를 저장했습니다.');
      } else {
        const idea: Idea = {
          ...payload,
          id: createId('idea'),
          templateId: selectedRouteTemplateId,
          templateAppliedAt: selectedRouteTemplateId === 'plain' ? timestamp : undefined,
          createdAt: timestamp,
        };
        await db.ideas.add(idea);
        if (selectedRouteTemplateId !== 'plain') {
          await applyRouteTemplate({ ideaId: idea.id, templateId: selectedRouteTemplateId });
        }
        setIsCreatingIdea(false);
        setSelectedIdeaId(idea.id);
        setTab('dashboard');
        notify('success', '새 아이디어를 만들었습니다.');
      }
    } catch (error) {
      notify('error', error instanceof Error ? error.message : '아이디어 저장에 실패했습니다.');
    }
  }

  async function applySelectedRouteTemplate(templateId: string) {
    if (!selectedIdea) return;
    try {
      const result = await applyRouteTemplate({ ideaId: selectedIdea.id, templateId });
      setSelectedRouteTemplateId(templateId);
      notify(
        'success',
        `루트 템플릿 적용 완료: 단계 ${result.addedStages}개, 프롬프트 ${result.addedPrompts}개, 자료 ${result.addedResources}개, 노드 ${result.addedFlowNodes}개`,
      );
    } catch (error) {
      notify('error', error instanceof Error ? error.message : '루트 템플릿 적용에 실패했습니다.');
    }
  }

  async function deleteIdea() {
    if (!selectedIdea) return;
    const ok = window.confirm(`"${selectedIdea.title}" 아이디어와 연결 데이터를 모두 삭제할까요?`);
    if (!ok) return;

    await db.transaction('rw', [db.ideas, db.resources, db.reviewScores, db.stages, db.flowNodes, db.flowEdges, db.promptTemplates, db.aiReports], async () => {
      await Promise.all([
        db.ideas.delete(selectedIdea.id),
        db.resources.where('ideaId').equals(selectedIdea.id).delete(),
        db.reviewScores.where('ideaId').equals(selectedIdea.id).delete(),
        db.stages.where('ideaId').equals(selectedIdea.id).delete(),
        db.flowNodes.where('ideaId').equals(selectedIdea.id).delete(),
        db.flowEdges.where('ideaId').equals(selectedIdea.id).delete(),
        db.promptTemplates.where('ideaId').equals(selectedIdea.id).delete(),
        db.aiReports.where('ideaId').equals(selectedIdea.id).delete(),
      ]);
    });

    setSelectedIdeaId(undefined);
    setIsCreatingIdea(false);
    setSelectedFlowNodeId(undefined);
    setSelectedFlowEdgeId(undefined);
    setTab('dashboard');
    notify('info', '아이디어를 삭제했습니다.');
  }

  async function seedSample() {
    const timestamp = now();
    const ideaId = createId('idea');
    const resourceIds = {
      reference: createId('resource'),
      scenario: createId('resource'),
      attachment: createId('resource'),
      promptNote: createId('resource'),
      risk: createId('resource'),
    };
    const stageIds = stageTemplates.map(() => createId('stage'));
    const promptIds = {
      codex: createId('prompt'),
      planning: createId('prompt'),
      review: createId('prompt'),
    };

    const sampleIdea: Idea = {
      id: ideaId,
      title: '개인용 아이디어 실행 루트 보드',
      summary: '아이디어, 참고 자료, 실행 절차, 도구별 프롬프트를 한곳에 모아 MVP 실행 가능성을 판단하는 로컬 우선 웹앱',
      problem: '아이디어는 자주 떠오르지만 자료와 실행 절차가 흩어져서 실제 구현 직전의 판단이 느려진다.',
      targetUser: '혼자 빠르게 MVP를 기획하고 구현하는 개발자, 기획자, 1인 메이커',
      expectedValue: '아이디어를 등록한 뒤 필요한 자료와 실행 단계를 연결해서 다음 행동을 빠르게 결정할 수 있다.',
      monetizationNote: '개인 유틸리티로 검증한 뒤 팀 템플릿 공유, 프로젝트별 백업, 협업 리뷰 기능으로 확장 가능',
      status: 'REVIEWING',
      priority: 4,
      tags: ['local-first', 'mvp', 'workflow', 'prompt'],
      memo: '샘플은 화면 이해용입니다. 리소스, 단계, 프롬프트가 어떻게 연결되는지 먼저 살펴보세요.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const sampleResources: Resource[] = [
      {
        id: resourceIds.reference,
        ideaId,
        type: 'LINK',
        title: 'Local-first web app 설계 참고',
        url: 'https://localfirstweb.dev/',
        summary: '서버 없이 브라우저 저장소 중심으로 개인 데이터를 다루는 앱 설계 관점 참고',
        tags: ['reference', 'local-first'],
        importance: 4,
        reviewStatus: 'VALID',
        linkedStageId: stageIds[1],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: resourceIds.scenario,
        ideaId,
        type: 'NOTE',
        title: '사용 시나리오 메모',
        summary: '새 아이디어를 만들고, 관련 링크와 파일명을 붙이고, 단계별 실행 프롬프트를 만든 뒤 Markdown으로 Codex에 넘긴다.',
        contentText: '1. 아이디어 브리프 작성\n2. 참고 자료 등록\n3. 단계와 프롬프트 연결\n4. 검토 점수로 보강 여부 판단\n5. Markdown으로 내보내 후 실행',
        tags: ['scenario', 'workflow'],
        importance: 5,
        reviewStatus: 'VALID',
        linkedStageId: stageIds[0],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: resourceIds.attachment,
        ideaId,
        type: 'FILE',
        title: '요구사항 정리 문서 메타데이터',
        fileName: 'idea-route-builder-requirements.md',
        mimeType: 'text/markdown',
        sizeBytes: 18432,
        summary: 'MVP 범위, 제외 범위, 데이터 모델을 적어둔 문서. 실제 파일 본문 분석은 하지 않고 메타데이터와 요약만 관리.',
        tags: ['attachment', 'requirements'],
        importance: 4,
        reviewStatus: 'VALID',
        linkedStageId: stageIds[2],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: resourceIds.promptNote,
        ideaId,
        type: 'PROMPT',
        title: 'Codex에게 넘길 구현 지시 초안',
        summary: '단계 목표와 완료 기준을 변수로 넣어 구현 작업을 요청하는 프롬프트 초안',
        contentText: '다음 단계의 목표와 완료 기준을 만족하도록 MVP 기능을 구현해줘.\n단계: {{stage_title}}\n목표: {{stage_goal}}\n완료 기준: {{done_criteria}}',
        tags: ['prompt', 'codex'],
        importance: 5,
        reviewStatus: 'VALID',
        linkedStageId: stageIds[3],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: resourceIds.risk,
        ideaId,
        type: 'TEXT',
        title: '리스크와 보강 자료',
        summary: 'IndexedDB 차단, 브라우저별 파일 처리, 백업 파일 손상 시 복원 실패 가능성을 검토해야 함.',
        contentText: '부족 자료: 브라우저 호환성 체크, JSON 백업 스키마 검증, 대용량 파일 UX 안내',
        tags: ['risk', 'review'],
        importance: 3,
        reviewStatus: 'INSUFFICIENT',
        linkedStageId: stageIds[4],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    const samplePrompts: PromptTemplate[] = [
      {
        id: promptIds.codex,
        ideaId,
        stageId: stageIds[3],
        tool: 'CODEX',
        title: '단계 구현 요청 프롬프트',
        body: '아래 단계의 목표와 완료 기준을 만족하도록 구현해줘.\n\n아이디어: {{idea_title}}\n단계: {{stage_title}}\n목표: {{stage_goal}}\n완료 기준: {{done_criteria}}\n제약: 서버, 로그인, 외부 AI API 없이 브라우저 IndexedDB에 저장',
        variables: ['idea_title', 'stage_title', 'stage_goal', 'done_criteria'],
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: promptIds.planning,
        ideaId,
        stageId: stageIds[2],
        tool: 'GENERAL',
        title: 'MVP 범위 정리 프롬프트',
        body: '다음 아이디어의 MVP 범위를 필수/선택/제외 항목으로 나눠줘.\n\n아이디어 요약: {{idea_summary}}\n사용자: {{target_user}}\n참고 자료: {{resources}}',
        variables: ['idea_summary', 'target_user', 'resources'],
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: promptIds.review,
        ideaId,
        stageId: stageIds[4],
        tool: 'GEMINI',
        title: '검토 리포트용 질문 초안',
        body: '아래 아이디어를 실행 가능성 관점에서 검토하고 부족한 자료를 목록화해줘.\n\n아이디어: {{idea}}\n리소스 요약: {{resource_summary}}\n단계 계획: {{stage_plan}}',
        variables: ['idea', 'resource_summary', 'stage_plan'],
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    const resourceMap = [
      [resourceIds.scenario],
      [resourceIds.reference, resourceIds.scenario],
      [resourceIds.attachment, resourceIds.reference],
      [resourceIds.promptNote],
      [resourceIds.risk, resourceIds.attachment],
    ];

    const sampleStages: Stage[] = stageTemplates.map((template, index) => ({
      ...template,
      id: stageIds[index],
      ideaId,
      order: index + 1,
      difficulty: index >= 3 ? 4 : 3,
      status: index === 0 ? 'DONE' : index === 1 ? 'DOING' : 'TODO',
      promptTemplateId: index === 2 ? promptIds.planning : index === 3 ? promptIds.codex : index === 4 ? promptIds.review : undefined,
      resourceIds: resourceMap[index],
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const reviewAverage = calculateReviewAverage({
      problemClarity: 4,
      userValue: 4,
      implementationDifficulty: 3,
      resourceReadiness: 4,
      techFit: 5,
      scalability: 3,
      monetizationPotential: 3,
      riskLevel: 3,
    });
    const sampleReview: ReviewScore = {
      id: createId('review'),
      ideaId,
      problemClarity: 4,
      userValue: 4,
      implementationDifficulty: 3,
      resourceReadiness: 4,
      techFit: 5,
      scalability: 3,
      monetizationPotential: 3,
      riskLevel: 3,
      totalAverage: reviewAverage,
      verdict: getReviewVerdict(reviewAverage),
      missingResources: ['브라우저별 IndexedDB 예외', '대용량 파일 UX', '복원 실패 처리 문구'],
      memo: '자료는 충분히 시작 가능하지만, 백업/복원 예외 문구와 진행 트리 UX는 보강하면 좋다.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const sampleAiReport: AiReport = {
      id: createId('ai-report'),
      ideaId,
      title: '샘플 AI 검토 리포트',
      sourceTool: 'GENERAL',
      conclusion:
        '현재 자료와 실행 단계가 충분히 정리되어 있어 MVP 진행은 가능하지만, 백업/복원 예외와 대용량 파일 UX를 먼저 보강하면 실사용 안정성이 높아집니다.',
      missingResources: ['브라우저별 IndexedDB 예외 사례', 'JSON 복원 실패 시 사용자 안내 문구', '대용량 파일 처리 기준'],
      risks: ['백업을 하지 않은 상태에서 브라우저 저장소가 초기화될 수 있음', '파일 자동 분석으로 오해할 수 있는 UX 문구'],
      nextActions: ['백업 화면에 마지막 백업 시각 표시', 'AI 리포트 후속 처리 버튼 추가', 'README에 AI 협업 흐름 정리'],
      rawResponse:
        '# AI 검토 리포트\n## 결론\n현재 자료와 실행 단계가 충분히 정리되어 있어 MVP 진행은 가능하지만, 백업/복원 예외와 대용량 파일 UX를 먼저 보강하면 실사용 안정성이 높아집니다.\n\n## 부족 자료\n- 브라우저별 IndexedDB 예외 사례\n- JSON 복원 실패 시 사용자 안내 문구\n- 대용량 파일 처리 기준\n\n## 위험\n- 백업을 하지 않은 상태에서 브라우저 저장소가 초기화될 수 있음\n- 파일 자동 분석으로 오해할 수 있는 UX 문구\n\n## 다음 행동\n- 백업 화면에 마지막 백업 시각 표시\n- AI 리포트 후속 처리 버튼 추가\n- README에 AI 협업 흐름 정리',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      const existingSample = ideas.find((idea) => idea.title === sampleIdea.title) ?? (await db.ideas.toArray()).find((idea) => idea.title === sampleIdea.title);
    if (existingSample) {
      setSelectedIdeaId(existingSample.id);
      setIsCreatingIdea(false);
      setTab('dashboard');
      notify('info', '이미 추가된 샘플 아이디어를 열었습니다.');
      return;
    }

    await db.transaction('rw', [db.ideas, db.resources, db.stages, db.promptTemplates, db.reviewScores, db.aiReports], async () => {
      await db.ideas.add(sampleIdea);
      await db.resources.bulkAdd(sampleResources);
      await db.stages.bulkAdd(sampleStages);
      await db.promptTemplates.bulkAdd(samplePrompts);
      await db.reviewScores.add(sampleReview);
      await db.aiReports.add(sampleAiReport);
    });

    setSelectedIdeaId(ideaId);
    setIsCreatingIdea(false);
    setTab('dashboard');
    notify('success', '설명용 샘플 데이터를 추가했습니다.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : '샘플 데이터 추가에 실패했습니다.');
    }
  }

  async function saveResource() {
    if (!selectedIdea) return;
    const title = resourceDraft.title.trim();
    if (!title) {
      notify('error', '리소스 제목은 필수입니다.');
      return;
    }
    if (resourceDraft.type === 'LINK' && resourceDraft.url) {
      try {
        new URL(resourceDraft.url);
      } catch {
        notify('error', '링크 리소스의 URL 형식을 확인해주세요.');
        return;
      }
    }

    const timestamp = now();
    const resource: Resource = {
      ...resourceDraft,
      id: createId('resource'),
      ideaId: selectedIdea.id,
      linkedStageId: resourceDraft.linkedStageId || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.resources.add(resource);
    setResourceDraft(emptyResource());
    notify('success', '리소스를 추가했습니다.');
  }

  async function handleResourceFile(file?: File) {
    if (!file) return;
    const textLike =
      file.type.startsWith('text/') ||
      ['.md', '.txt', '.json', '.csv', '.ts', '.tsx', '.js', '.css', '.html'].some((ext) => file.name.toLowerCase().endsWith(ext));
    const maxTextBytes = 1024 * 1024;
    let contentText = '';

    if (textLike && file.size <= maxTextBytes) {
      contentText = await readFileAsText(file);
    } else if (textLike) {
      notify('info', '1MB가 넘는 텍스트 파일은 본문 대신 메타데이터만 저장합니다.');
    }

    setResourceDraft((draft) => ({
      ...draft,
      type: 'FILE',
      title: draft.title || file.name,
      fileName: file.name,
      mimeType: file.type || 'unknown',
      sizeBytes: file.size,
      contentText,
    }));
  }

  async function saveReview(draft: Omit<ReviewScore, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!selectedIdea) return;
    try {
      const totalAverage = calculateReviewAverage(draft);
      const payload = {
        ...draft,
        totalAverage,
        verdict: getReviewVerdict(totalAverage),
        updatedAt: now(),
      };
      if (review) {
        await db.reviewScores.update(review.id, payload);
      } else {
        await db.reviewScores.add({ ...payload, id: createId('review'), createdAt: now() });
      }
      notify('success', '검토 점수를 저장했습니다.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : '검토 저장에 실패했습니다.');
    }
  }

  async function generateDefaultStages() {
    if (!selectedIdea || !window.confirm('기본 실행 단계를 추가할까요? 기존 단계는 유지됩니다.')) return;
    const baseOrder = stages.length;
    const timestamp = now();
    await db.stages.bulkAdd(
      stageTemplates.map((template, index) => ({
        ...template,
        id: createId('stage'),
        ideaId: selectedIdea.id,
        order: baseOrder + index + 1,
        difficulty: 3,
        status: 'TODO' as StageStatus,
        resourceIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );
    notify('success', '기본 단계를 만들었습니다.');
  }

  async function addStage() {
    if (!selectedIdea) return;
    const timestamp = now();
    await db.stages.add({
      id: createId('stage'),
      ideaId: selectedIdea.id,
      order: stages.length + 1,
      title: '새 실행 단계',
      goal: '',
      inputRequired: '',
      outputExpected: '',
      doneCriteria: '',
      difficulty: 3,
      status: 'TODO',
      resourceIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async function updateStage(stageId: string, changes: Partial<Stage>) {
    await db.stages.update(stageId, { ...changes, updatedAt: now() });
  }

  async function deleteStage(stage: Stage) {
    if (!window.confirm(`"${stage.title}" 단계를 삭제할까요?`)) return;
    await db.transaction('rw', [db.stages, db.resources, db.flowNodes, db.flowEdges], async () => {
      await db.stages.delete(stage.id);
      await db.resources.where('linkedStageId').equals(stage.id).modify({ linkedStageId: undefined });
      const nodes = await db.flowNodes.where('refStageId').equals(stage.id).toArray();
      const nodeIds = nodes.map((node) => node.id);
      await db.flowNodes.bulkDelete(nodeIds);
      if (nodeIds.length > 0) {
        await db.flowEdges.where('source').anyOf(nodeIds).delete();
        await db.flowEdges.where('target').anyOf(nodeIds).delete();
      }
    });
    notify('info', '단계를 삭제했습니다.');
  }

  async function savePrompt() {
    if (!selectedIdea) return;
    if (!promptDraft.title.trim() || !promptDraft.body.trim()) {
      notify('error', '프롬프트 제목과 본문을 입력해주세요.');
      return;
    }
    const timestamp = now();
    const prompt: PromptTemplate = {
      ...promptDraft,
      id: createId('prompt'),
      ideaId: selectedIdea.id,
      stageId: promptDraft.stageId || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.promptTemplates.add(prompt);
    setPromptDraft(emptyPrompt());
    notify('success', '프롬프트를 저장했습니다.');
  }

  async function copyPrompt(prompt: PromptTemplate) {
    await copyTextToClipboard(prompt.body);
    notify('success', '프롬프트를 클립보드에 복사했습니다.');
  }

  async function copyAgentPrompt(body: string) {
    await copyTextToClipboard(body);
    notify('success', '에이전트 요청서를 클립보드에 복사했습니다.');
  }

  function makeAiReviewPrompt() {
    if (!selectedIdea) return '';
    return buildAiReviewPrompt({
      idea: selectedIdea,
      resources,
      review,
      stages,
      prompts,
      flowNodes,
      flowEdges,
    });
  }

  async function copyAiReviewPrompt() {
    const prompt = makeAiReviewPrompt();
    if (!prompt) return;
    await copyTextToClipboard(prompt);
    notify('success', 'AI 검토 요청서를 클립보드에 복사했습니다.');
  }

  async function copyAiReviewPromptWithFocus(focusTitle: string, focusInstruction: string) {
    const prompt = makeAiReviewPrompt();
    if (!prompt) return;
    await copyTextToClipboard(`${prompt}

---

## 추가 검토 관점: ${focusTitle}

${focusInstruction}

답변은 반드시 아래 섹션으로 나누어 작성해주세요.
- 결론
- 부족 자료
- 위험
- 다음 행동`);
    notify('success', `${focusTitle} 요청서를 클립보드에 복사했습니다.`);
  }

  function downloadAiReviewPrompt() {
    if (!selectedIdea) return;
    downloadText(`${selectedIdea.title.replace(/[\\/:*?"<>|]/g, '-')}-ai-review-prompt.md`, makeAiReviewPrompt(), 'text/markdown;charset=utf-8');
  }

  async function saveAiReport(draft: AiReportDraft) {
    if (!selectedIdea) return;
    const timestamp = now();
    const report: AiReport = {
      ...draft,
      id: createId('ai-report'),
      ideaId: selectedIdea.id,
      title: draft.title.trim() || 'AI 검토 리포트',
      conclusion: draft.conclusion.trim(),
      rawResponse: draft.rawResponse.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (!report.conclusion && !report.rawResponse) {
      notify('error', 'AI 응답 또는 결론을 입력해주세요.');
      return;
    }
    await db.aiReports.add(report);
    notify('success', 'AI 리포트 초안을 저장했습니다.');
  }

  async function deleteAiReport(report: AiReport) {
    if (!window.confirm(`"${report.title}" AI 리포트를 삭제할까요?`)) return;
    await db.aiReports.delete(report.id);
    notify('info', 'AI 리포트를 삭제했습니다.');
  }

  async function createResourcesFromAiReport(report: AiReport) {
    if (!selectedIdea || report.missingResources.length === 0) return;
    const existingTitles = new Set(resources.map((resource) => resource.title.trim().toLowerCase()));
    const timestamp = now();
    const candidates: Resource[] = report.missingResources
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !existingTitles.has(`[AI 부족] ${item}`.toLowerCase()))
      .map((item) => ({
        id: createId('resource'),
        ideaId: selectedIdea.id,
        type: 'NOTE',
        title: `[AI 부족] ${item}`,
        summary: `AI 리포트 "${report.title}"에서 보강이 필요하다고 표시한 자료입니다.`,
        contentText: item,
        tags: ['ai-report', 'missing-resource'],
        importance: 3,
        reviewStatus: 'INSUFFICIENT',
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

    if (candidates.length === 0) {
      notify('info', '추가할 새 부족 자료가 없습니다.');
      return;
    }

    await db.resources.bulkAdd(candidates);
    setTab('resources');
    notify('success', `부족 자료 ${candidates.length}개를 리소스 후보로 추가했습니다.`);
  }

  async function createStagesFromAiReport(report: AiReport) {
    if (!selectedIdea || report.nextActions.length === 0) return;
    const existingTitles = new Set(stages.map((stage) => stage.title.trim().toLowerCase()));
    const timestamp = now();
    const baseOrder = stages.length;
    const candidates: Stage[] = report.nextActions
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !existingTitles.has(`[AI 다음] ${item}`.toLowerCase()))
      .map((item, index) => ({
        id: createId('stage'),
        ideaId: selectedIdea.id,
        order: baseOrder + index + 1,
        title: `[AI 다음] ${item}`,
        goal: item,
        inputRequired: `AI 리포트 "${report.title}"의 다음 행동 제안`,
        outputExpected: '실행 결과와 판단 근거',
        doneCriteria: '실행 결과가 기록되고 다음 판단이 가능해진다.',
        difficulty: 3,
        status: 'TODO',
        resourceIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

    if (candidates.length === 0) {
      notify('info', '추가할 새 실행 단계가 없습니다.');
      return;
    }

    await db.stages.bulkAdd(candidates);
    setTab('stages');
    notify('success', `다음 행동 ${candidates.length}개를 실행 단계로 추가했습니다.`);
  }

  async function createRiskNodesFromAiReport(report: AiReport) {
    if (!selectedIdea || report.risks.length === 0) return;
    const existingTitles = new Set(flowNodes.map((node) => node.title.trim().toLowerCase()));
    const timestamp = now();
    const candidates: FlowNode[] = report.risks
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !existingTitles.has(`[AI 위험] ${item}`.toLowerCase()))
      .map((item, index) => ({
        id: createId('node'),
        ideaId: selectedIdea.id,
        type: 'ISSUE',
        title: `[AI 위험] ${item}`,
        description: `AI 리포트 "${report.title}"에서 확인된 위험입니다.`,
        status: 'BLOCKED',
        position: { x: 120 + (index % 3) * 250, y: 420 + Math.floor(index / 3) * 150 },
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

    if (candidates.length === 0) {
      notify('info', '추가할 새 위험 카드가 없습니다.');
      return;
    }

    await db.flowNodes.bulkAdd(candidates);
    setSelectedFlowNodeId(candidates[0]?.id);
    setSelectedFlowEdgeId(undefined);
    setTab('flow');
    notify('success', `위험 ${candidates.length}개를 흐름 이슈 카드로 추가했습니다.`);
  }

  async function deleteFlowNode(nodeId: string) {
    await db.transaction('rw', [db.flowNodes, db.flowEdges], async () => {
      await db.flowNodes.delete(nodeId);
      await db.flowEdges.where('source').equals(nodeId).delete();
      await db.flowEdges.where('target').equals(nodeId).delete();
    });
    setSelectedFlowNodeId(undefined);
    setSelectedFlowEdgeId(undefined);
    notify('info', '노드를 삭제했습니다.');
  }

  async function updateFlowNode(nodeId: string, changes: Partial<FlowNode>) {
    await db.flowNodes.update(nodeId, { ...changes, updatedAt: now() });
  }

  async function updateFlowEdge(edgeId: string, changes: Partial<FlowEdge>) {
    await db.flowEdges.update(edgeId, changes);
  }

  async function deleteFlowEdge(edgeId: string) {
    await db.flowEdges.delete(edgeId);
    setSelectedFlowEdgeId(undefined);
    notify('info', '연결선을 삭제했습니다.');
  }

  async function syncStagesToFlow() {
    if (!selectedIdea) return;
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    if (sortedStages.length === 0) {
      notify('info', '동기화할 단계가 없습니다.');
      return;
    }

    const timestamp = now();
    const stageIdSet = new Set(sortedStages.map((stage) => stage.id));
    const existingByStage = new Map(flowNodes.filter((node) => node.refStageId).map((node) => [node.refStageId, node]));
    const staleStageNodes = flowNodes.filter((node) => node.refStageId && !stageIdSet.has(node.refStageId));
    const staleNodeIds = new Set(staleStageNodes.map((node) => node.id));
    const syncedNodes: FlowNode[] = sortedStages.map((stage, index) => {
      const existing = existingByStage.get(stage.id);
      return {
        id: existing?.id ?? createId('node'),
        ideaId: selectedIdea.id,
        type: 'STAGE',
        title: existing?.title ?? stage.title,
        description: existing?.description ?? stage.goal,
        status: existing?.status ?? stage.status,
        refStageId: stage.id,
        position: existing?.position ?? { x: 90 + index * 245, y: 150 + (index % 2) * 95 },
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
    });
    const syncedNodeIds = syncedNodes.map((node) => node.id);
    const generatedEdges: FlowEdge[] = syncedNodeIds.slice(0, -1).map((source, index) => ({
      id: createId('edge'),
      ideaId: selectedIdea.id,
      source,
      target: syncedNodeIds[index + 1],
      label: '다음',
      type: 'NEXT',
      createdAt: timestamp,
    }));
    const edgeIdsToDelete = flowEdges
      .filter((edge) => edge.type === 'NEXT' || staleNodeIds.has(edge.source) || staleNodeIds.has(edge.target))
      .map((edge) => edge.id);

    await db.transaction('rw', [db.flowNodes, db.flowEdges], async () => {
      if (staleNodeIds.size > 0) {
        await db.flowNodes.bulkDelete([...staleNodeIds]);
      }
      await db.flowNodes.bulkPut(syncedNodes);
      if (edgeIdsToDelete.length > 0) {
        await db.flowEdges.bulkDelete(edgeIdsToDelete);
      }
      if (generatedEdges.length > 0) {
        await db.flowEdges.bulkAdd(generatedEdges);
      }
    });

    notify('success', '단계와 진행 트리를 정리했습니다.');
  }

  async function addFlowNode(type: FlowNodeType) {
    if (!selectedIdea) return;
    const timestamp = now();
    const node: FlowNode = {
      id: createId('node'),
      ideaId: selectedIdea.id,
      type,
      title: `${flowTypeLabels[type]} 노드`,
      description: '',
      position: { x: 120 + Math.random() * 360, y: 120 + Math.random() * 260 },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.flowNodes.add(node);
    setSelectedFlowNodeId(node.id);
    setSelectedFlowEdgeId(undefined);
  }

  const reactFlowNodes: Node[] = useMemo(
    () =>
      flowNodes.map((node) => {
        const palette = flowNodeStyles[node.type];
        return {
          id: node.id,
          position: node.position,
          data: {
            label: (
              <div className="flex h-[104px] w-48 flex-col justify-between px-2 py-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black" style={{ color: palette.accent }}>
                  <FlowTypeIcon type={node.type} size={13} />
                  <span>{flowTypeLabels[node.type]}</span>
                </div>
                <div className="grid min-h-0 place-items-center text-center">
                  <div className="line-clamp-2 text-sm font-black leading-5 text-ink">{node.title || '제목 없음'}</div>
                  {node.description ? <div className="mt-1 max-w-40 truncate text-[11px] font-semibold text-ink/45">{node.description}</div> : null}
                </div>
                <div className="flex justify-center">
                  <span className={classNames('rounded px-2 py-0.5 text-[10px] font-black', statusBadgeClass(node.status))}>
                    {node.status ? stageStatusLabels[node.status] : '상태 없음'}
                  </span>
                </div>
              </div>
            ),
          },
          selected: selectedFlowNodeId === node.id,
          style: {
            background: palette.bg,
            borderColor: selectedFlowNodeId === node.id ? '#b45641' : palette.border,
            borderWidth: selectedFlowNodeId === node.id ? 2 : 1,
            minWidth: 206,
            minHeight: 116,
          },
        };
      }),
    [flowNodes, selectedFlowNodeId],
  );

  const reactFlowEdges: Edge[] = useMemo(
    () =>
      flowEdges.map((edge) => {
        const style = edgeStyles[edge.type];
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || edgeTypeLabels[edge.type],
          animated: edge.type === 'BRANCH',
          selected: selectedFlowEdgeId === edge.id,
          style: {
            stroke: selectedFlowEdgeId === edge.id ? '#b45641' : style.stroke,
            strokeWidth: selectedFlowEdgeId === edge.id ? 2.7 : 1.5,
            strokeDasharray: style.dash,
          },
          labelStyle: {
            fill: selectedFlowEdgeId === edge.id ? '#b45641' : '#49694d',
            fontWeight: 800,
            fontSize: 11,
          },
        };
      }),
    [flowEdges, selectedFlowEdgeId],
  );

  async function onConnect(connection: Connection) {
    if (!selectedIdea || !connection.source || !connection.target) return;
    await db.flowEdges.add({
      id: createId('edge'),
      ideaId: selectedIdea.id,
      source: connection.source,
      target: connection.target,
      type: 'BRANCH',
      label: '분기',
      createdAt: now(),
    });
  }

  async function onNodesChange(changes: NodeChange[]) {
    applyNodeChanges(changes, reactFlowNodes);
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        await db.flowNodes.update(change.id, { position: change.position, updatedAt: now() });
      }
      if (change.type === 'remove') {
        await deleteFlowNode(change.id);
      }
    }
  }

  async function onEdgesChange(changes: EdgeChange[]) {
    applyEdgeChanges(changes, reactFlowEdges);
    for (const change of changes) {
      if (change.type === 'remove') {
        await deleteFlowEdge(change.id);
      }
    }
  }

  async function exportJson() {
    const payload = await exportBackup();
    downloadText(`idea-route-builder-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    const timestamp = now();
    window.localStorage.setItem('idea-route-builder:last-backup-at', timestamp);
    setLastBackupAt(timestamp);
  }

  async function exportMarkdown() {
    if (!selectedIdea) return;
    const markdown = buildIdeaMarkdown({
      idea: selectedIdea,
      resources,
      review,
      stages,
      prompts,
      aiReports,
    });
    downloadText(`${selectedIdea.title.replace(/[\\/:*?"<>|]/g, '-')}.md`, markdown, 'text/markdown;charset=utf-8');
  }

  async function copyMarkdown() {
    if (!selectedIdea) return;
    const markdown = buildIdeaMarkdown({
      idea: selectedIdea,
      resources,
      review,
      stages,
      prompts,
      aiReports,
    });
    await copyTextToClipboard(markdown);
    notify('success', '선택 아이디어 Markdown을 클립보드에 복사했습니다.');
  }

  async function importJson(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      notify('error', 'JSON 백업 파일만 가져올 수 있습니다.');
      return;
    }
    try {
      const text = await readFileAsText(file);
      const json = JSON.parse(text) as unknown;
      assertBackupPayload(json);
      const payload = json as BackupPayload;
      setPendingBackupImport({ payload, fileName: file.name });
    } catch (error) {
      notify('error', error instanceof Error ? error.message : '백업 가져오기에 실패했습니다.');
    }
  }

  async function confirmBackupImport(mode: 'replace' | 'merge') {
    if (!pendingBackupImport) return;
    await importBackup(pendingBackupImport.payload, mode);
    setPendingBackupImport(undefined);
    notify('success', mode === 'replace' ? '백업으로 교체했습니다.' : '백업 데이터를 병합했습니다.');
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f3ea_0%,#eef4ef_48%,#f9eadf_100%)] text-ink">
      <GuideDialog guideKey={guideOpen} onClose={() => setGuideOpen(undefined)} />
      <header className="border-b border-ink/10 bg-paper/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-pollen">
              <GitBranch size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Do Dream</h1>
              <p className="text-sm text-ink/60">아이디어를 해드림, 실행을 두드림. Idea Route Builder</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton
              onClick={() => {
                setIsCreatingIdea(true);
                setSelectedIdeaId(undefined);
                setSelectedRouteTemplateId('plain');
                setRouteGoal('');
                setTab('idea');
              }}
            >
              <Plus size={16} /> 새 아이디어
            </AppButton>
            <AppButton onClick={seedSample}>
              <Sparkles size={16} /> 샘플 추가
            </AppButton>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-ink/10 bg-white/78 p-4 shadow-panel lg:min-h-[calc(100vh-138px)]">
          <div className="grid gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-ink/35" size={16} />
              <input className={inputClass('pl-9')} placeholder="제목, 요약, 태그 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className={inputClass()} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IdeaStatus | 'ALL')}>
              <option value="ALL">전체 상태</option>
              {Object.entries(ideaStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-2">
            {filteredIdeas.length === 0 ? (
              <EmptyState
                icon={<FileText size={19} />}
                title="아이디어가 없습니다"
                body="샘플 데이터를 넣어 전체 흐름을 먼저 확인하거나 새 아이디어를 저장해보세요."
                action={<AppButton onClick={seedSample}>샘플 추가</AppButton>}
              />
            ) : (
              filteredIdeas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => {
                    setIsCreatingIdea(false);
                    setSelectedIdeaId(idea.id);
                    setTab('dashboard');
                  }}
                  className={classNames(
                    'rounded-2xl border p-3 text-left transition',
                    selectedIdeaId === idea.id ? 'border-moss bg-cloud' : 'border-ink/10 bg-white hover:border-moss/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-5">{idea.title}</p>
                    <span className="rounded bg-pollen/25 px-2 py-0.5 text-xs font-bold text-ink">P{idea.priority}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink/62">{idea.summary || '요약 없음'}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="rounded bg-ink/6 px-2 py-0.5 text-xs font-semibold text-ink/65">{ideaStatusLabels[idea.status]}</span>
                    {idea.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0 rounded-[2rem] border border-ink/10 bg-white/80 shadow-panel">
          <div className="border-b border-ink/10 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-moss">Workspace</p>
                <h2 className="mt-1 text-xl font-black">{selectedIdea?.title ?? '새 아이디어 작성'}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <Metric label="리소스" value={stats.resourceCount} />
                <Metric label="단계" value={stats.stageCount} />
                <Metric label="프롬프트" value={stats.promptCount} />
                <Metric label="트리" value={stats.flowNodeCount} />
              </div>
            </div>
            <nav className="mt-4 flex flex-wrap items-center gap-2">
              {tabItems.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  aria-current={tab === value ? 'page' : undefined}
                  className={classNames(
                    'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition',
                    tab === value ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-cloud',
                  )}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {tab !== 'idea' && !selectedIdea ? (
              <EmptyState
                icon={<Info size={20} />}
                title="아이디어를 먼저 선택해주세요"
                body="왼쪽 목록에서 아이디어를 고르거나 새 아이디어를 저장한 뒤 대시보드와 세부 화면을 사용할 수 있습니다."
                action={<AppButton onClick={() => setTab('idea')}>새 아이디어 작성</AppButton>}
              />
            ) : null}
            {tab === 'dashboard' && selectedIdea ? (
              <DashboardPanelView
                idea={selectedIdea}
                resources={resources}
                stages={stages}
                prompts={prompts}
                review={review}
                aiReports={aiReports}
                flowNodes={flowNodes}
                routeTemplate={activeRouteTemplate}
                agentPlugins={activeAgentPlugins}
                tutorialMission={tutorialMission}
                onTutorialMissionAction={startTutorialMission}
                onDismissTutorialMission={dismissTutorialMission}
                setTab={setTab}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'idea' ? (
              <IdeaPanelView
                draft={ideaDraft}
                selectedIdea={selectedIdea}
                setDraft={setIdeaDraft}
                routeTemplates={routeTemplates}
                recommendedRouteTemplates={recommendedRouteTemplates}
                routeGoal={routeGoal}
                setRouteGoal={setRouteGoal}
                selectedRouteTemplateId={selectedRouteTemplateId}
                setSelectedRouteTemplateId={setSelectedRouteTemplateId}
                applyRouteTemplate={applySelectedRouteTemplate}
                saveIdea={saveIdea}
                deleteIdea={deleteIdea}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'resources' && selectedIdea ? (
              <ResourcesPanelView
                resourceDraft={resourceDraft}
                setResourceDraft={setResourceDraft}
                saveResource={saveResource}
                handleResourceFile={handleResourceFile}
                resources={resources}
                stages={stages}
                notify={notify}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'stages' && selectedIdea ? (
              <StagesPanelView
                stages={stages}
                resources={resources}
                prompts={prompts}
                generateDefaultStages={generateDefaultStages}
                addStage={addStage}
                updateStage={updateStage}
                deleteStage={deleteStage}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'prompts' && selectedIdea ? (
              <PromptsPanelView
                promptDraft={promptDraft}
                setPromptDraft={setPromptDraft}
                prompts={prompts}
                agentPlugins={activeAgentPlugins}
                stages={stages}
                savePrompt={savePrompt}
                copyPrompt={copyPrompt}
                copyAgentPrompt={copyAgentPrompt}
                notify={notify}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'review' && selectedIdea ? (
              <ReviewPanelView
                ideaId={selectedIdea.id}
                review={review}
                aiReports={aiReports}
                routeTemplate={activeRouteTemplate}
                saveReview={saveReview}
                copyAiReviewPrompt={copyAiReviewPrompt}
                copyAiReviewPromptWithFocus={copyAiReviewPromptWithFocus}
                downloadAiReviewPrompt={downloadAiReviewPrompt}
                saveAiReport={saveAiReport}
                deleteAiReport={deleteAiReport}
                createResourcesFromAiReport={createResourcesFromAiReport}
                createStagesFromAiReport={createStagesFromAiReport}
                createRiskNodesFromAiReport={createRiskNodesFromAiReport}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'flow' && selectedIdea ? (
              <FlowPanelView
                flowNodes={flowNodes}
                flowEdges={flowEdges}
                selectedFlowNode={selectedFlowNode}
                selectedFlowEdge={selectedFlowEdge}
                reactFlowNodes={reactFlowNodes}
                reactFlowEdges={reactFlowEdges}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeSelect={(nodeId) => {
                  setSelectedFlowNodeId(nodeId);
                  setSelectedFlowEdgeId(undefined);
                }}
                onEdgeSelect={(edgeId) => {
                  setSelectedFlowEdgeId(edgeId);
                  setSelectedFlowNodeId(undefined);
                }}
                clearFlowSelection={() => {
                  setSelectedFlowNodeId(undefined);
                  setSelectedFlowEdgeId(undefined);
                }}
                updateFlowNode={updateFlowNode}
                updateFlowEdge={updateFlowEdge}
                deleteFlowNode={deleteFlowNode}
                deleteFlowEdge={deleteFlowEdge}
                syncStagesToFlow={syncStagesToFlow}
                addFlowNode={addFlowNode}
                onGuide={setGuideOpen}
              />
            ) : null}
            {tab === 'backup' && selectedIdea ? (
              <BackupPanelView
                exportJson={exportJson}
                exportMarkdown={exportMarkdown}
                copyMarkdown={copyMarkdown}
                importJson={importJson}
                pendingImport={pendingBackupImport}
                confirmImport={confirmBackupImport}
                cancelImport={() => setPendingBackupImport(undefined)}
                lastBackupAt={lastBackupAt}
                onGuide={setGuideOpen}
              />
            ) : null}
          </div>
        </section>
      </main>

      {toast ? (
        <div
          className={classNames(
            'fixed bottom-5 right-5 z-50 max-w-sm rounded-md px-4 py-3 text-sm font-semibold shadow-panel',
            toast.type === 'error' && 'bg-clay text-white',
            toast.type === 'success' && 'bg-moss text-white',
            toast.type === 'info' && 'bg-ink text-white',
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
