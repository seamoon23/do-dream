import { ArrowRight, FileText, MonitorSmartphone, Network, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { ideaStatusLabels, type GuideKey, verdictLabels } from '../lib/content';
import type { AgentPlugin } from '../agentPlugins/types';
import type { RouteTemplate } from '../routePlugins/types';
import type { AiReport, FlowNode, Idea, PromptTemplate, Resource, ReviewScore, Stage } from '../types/domain';
import { AppButton, BriefCard, ProgressCard, SectionIntro } from './ui';

type DashboardTabKey = GuideKey;

export function DashboardPanelView(props: {
  idea: Idea;
  resources: Resource[];
  stages: Stage[];
  prompts: PromptTemplate[];
  review?: ReviewScore;
  aiReports: AiReport[];
  flowNodes: FlowNode[];
  routeTemplate: RouteTemplate;
  agentPlugins: AgentPlugin[];
  setTab: (tab: DashboardTabKey) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const { idea, resources, stages, prompts, review, aiReports, flowNodes, routeTemplate, agentPlugins, setTab, onGuide } = props;
  const [demoOpen, setDemoOpen] = useState(false);
  const doneStages = stages.filter((stage) => stage.status === 'DONE').length;
  const blockedStages = stages.filter((stage) => stage.status === 'BLOCKED');
  const doingStage = stages.find((stage) => stage.status === 'DOING');
  const unreviewedResources = resources.filter((resource) => resource.reviewStatus === 'UNREVIEWED' || resource.reviewStatus === 'INSUFFICIENT');
  const progress = stages.length > 0 ? Math.round((doneStages / stages.length) * 100) : 0;
  const latestAiReport = aiReports[0];
  const recentlyUpdated = [...resources, ...stages, ...prompts]
    .map((item) => ({
      title: item.title,
      updatedAt: 'updatedAt' in item ? item.updatedAt : '',
      kind: 'type' in item ? '자료' : 'order' in item ? '단계' : '프롬프트',
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const currentConclusion = review
    ? verdictLabels[review.verdict]
    : resources.length < 2
      ? '자료를 더 모으면 판단이 쉬워져요'
      : stages.length === 0
        ? '실행 단계를 쪼갤 차례예요'
        : '첫 진행 판단을 남겨보세요';

  const currentReason = blockedStages[0]
    ? `${blockedStages[0].title} 단계가 막혀 있어요`
    : review?.missingResources.length
      ? `${review.missingResources[0]} 자료가 더 필요해요`
      : doingStage
        ? `${doingStage.title} 단계가 진행 중이에요`
        : '아직 명확한 막힘은 없습니다';

  const nextAction =
    resources.length === 0
      ? { tab: 'resources' as DashboardTabKey, label: '자료 1개 추가하기', body: '링크, 메모, 파일 메타데이터 중 하나만 넣어도 다음 판단이 훨씬 쉬워집니다.' }
      : stages.length === 0
        ? { tab: 'stages' as DashboardTabKey, label: '실행 단계를 만들기', body: '아이디어를 실제 행동 단위로 쪼개면 막히는 지점이 빨리 보입니다.' }
        : prompts.length === 0
          ? { tab: 'prompts' as DashboardTabKey, label: '프롬프트 하나 준비하기', body: '가장 가까운 실행 단계에 붙일 작업 지시문을 먼저 만들어두세요.' }
          : !review
            ? { tab: 'review' as DashboardTabKey, label: '진행 판단 남기기', body: '지금 진행할지, 보강할지, 보류할지 가볍게 체크해보세요.' }
            : flowNodes.length === 0
              ? { tab: 'flow' as DashboardTabKey, label: '흐름을 그림으로 보기', body: '단계와 이슈를 카드처럼 펼치면 다음 행동이 더 선명해집니다.' }
              : { tab: 'backup' as DashboardTabKey, label: '오늘 백업하기', body: 'IndexedDB는 로컬 저장소라 중요한 정리는 JSON 백업을 남겨두는 편이 안전합니다.' };

  const checklist = [
    { label: '아이디어 개요', done: Boolean(idea.title && idea.summary), tab: 'idea' as DashboardTabKey },
    { label: '자료 2개 이상', done: resources.length >= 2, tab: 'resources' as DashboardTabKey },
    { label: '실행 단계', done: stages.length > 0, tab: 'stages' as DashboardTabKey },
    { label: '프롬프트', done: prompts.length > 0, tab: 'prompts' as DashboardTabKey },
    { label: '진행 판단', done: Boolean(review), tab: 'review' as DashboardTabKey },
    { label: '흐름 카드', done: flowNodes.length > 0, tab: 'flow' as DashboardTabKey },
  ];

  return (
    <div className="grid gap-5">
      <SectionIntro guideKey="dashboard" onGuide={onGuide} />
      <section className="rounded-[2rem] border border-ink/10 bg-[linear-gradient(135deg,#fffaf0_0%,#eef4ef_100%)] p-6 shadow-panel">
        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <div>
            <p className="text-sm font-black text-moss">오늘의 다음 행동</p>
            <h3 className="mt-2 text-3xl font-black leading-tight">{nextAction.label}</h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">{nextAction.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AppButton variant="primary" onClick={() => setTab(nextAction.tab)}>
                바로 하기 <ArrowRight size={16} />
              </AppButton>
              <AppButton onClick={() => setTab('flow')}>
                <Network size={16} /> 흐름 보기
              </AppButton>
              <AppButton onClick={() => setTab('backup')}>
                <ShieldCheck size={16} /> 백업하기
              </AppButton>
              <AppButton onClick={() => setDemoOpen(true)}>
                <MonitorSmartphone size={16} /> 사용 예시 보기
              </AppButton>
            </div>
          </div>
          <div className="grid gap-3 rounded-3xl bg-white/75 p-4">
            <BriefCard title="현재 결론" body={currentConclusion} />
            <BriefCard title="막힌 이유" body={currentReason} />
          </div>
        </div>
      </section>

      {demoOpen ? <DemoTheater onClose={() => setDemoOpen(false)} /> : null}

      {routeTemplate.id !== 'plain' ? (
        <section className="rounded-3xl border border-ink/10 bg-white/86 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-moss">Route Template</p>
              <h3 className="mt-1 text-xl font-black">{routeTemplate.name}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">{routeTemplate.description}</p>
            </div>
            <AppButton className="shrink-0 whitespace-nowrap" onClick={() => setTab('prompts')}>
              <Sparkles size={16} /> 에이전트 요청서 보기
            </AppButton>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(routeTemplate.homeCards ?? []).map((card) => (
              <BriefCard key={card.key} title={card.title} body={card.description} />
            ))}
          </div>
          {agentPlugins.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-cloud/55 p-4">
              <p className="text-sm font-black text-moss">사용 가능한 에이전트</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {agentPlugins.map((agent) => agent.name).join(', ')} 요청서는 프롬프트 준비 탭에서 복사할 수 있습니다.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/86 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-moss">실행 준비 체크</p>
              <h3 className="mt-1 text-xl font-black">어디까지 정리됐나요?</h3>
            </div>
            <span className="rounded-full bg-cloud px-3 py-1 text-sm font-black text-moss">
              {checklist.filter((item) => item.done).length}/{checklist.length}
            </span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {checklist.map((item) => (
              <button
                key={item.label}
                onClick={() => setTab(item.tab)}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cloud/55 px-4 py-3 text-left transition hover:border-moss hover:bg-white"
              >
                <span className="font-bold">{item.label}</span>
                <span className={item.done ? 'text-sm font-black text-moss' : 'text-sm font-bold text-ink/42'}>{item.done ? '완료' : '필요'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/86 p-5">
          <p className="text-sm font-black text-moss">부족하거나 살펴볼 것</p>
          <div className="mt-4 grid gap-3">
            {blockedStages.length > 0 ? <BriefCard title="막힌 단계" body={blockedStages.map((stage) => stage.title).join(', ')} /> : null}
            {unreviewedResources.length > 0 ? <BriefCard title="자료 확인 필요" body={`${unreviewedResources.length}개 자료의 유효성이나 요약을 확인하면 좋아요.`} /> : null}
            {review?.missingResources.length ? <BriefCard title="검토상 부족 자료" body={review.missingResources.slice(0, 3).join(', ')} /> : null}
            {!blockedStages.length && !unreviewedResources.length && !review?.missingResources.length ? (
              <BriefCard title="좋은 상태" body="큰 막힘은 보이지 않습니다. 다음 행동을 하나 골라 진행해보세요." />
            ) : null}
          </div>
        </div>
      </section>

      {latestAiReport ? (
        <section className="rounded-3xl border border-moss/15 bg-white/86 p-5 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-moss">AI 검토 초안</p>
              <h3 className="mt-1 text-xl font-black">{latestAiReport.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/68">{latestAiReport.conclusion || '저장된 결론이 없습니다.'}</p>
            </div>
            <AppButton className="shrink-0 whitespace-nowrap" onClick={() => setTab('review')}>
              <Sparkles size={16} /> 리포트 보기
            </AppButton>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <BriefCard title="부족 자료" body={latestAiReport.missingResources[0] || '추가 부족 자료 없음'} />
            <BriefCard title="주요 위험" body={latestAiReport.risks[0] || '기록된 위험 없음'} />
            <BriefCard title="다음 행동" body={latestAiReport.nextActions[0] || '다음 행동 미정'} />
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-ink/10 bg-white/82 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-moss">
                {ideaStatusLabels[idea.status]} / 우선순위 P{idea.priority}
              </p>
              <h3 className="mt-1 text-2xl font-black">{idea.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/66">{idea.summary || '아직 요약이 없습니다.'}</p>
            </div>
            <AppButton className="shrink-0 whitespace-nowrap" onClick={() => setTab('idea')}>
              <FileText size={16} /> 개요 수정
            </AppButton>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <BriefCard title="문제" body={idea.problem || '문제를 한 문장으로 적어보세요.'} />
            <BriefCard title="대상 사용자" body={idea.targetUser || '누가 이 아이디어를 원하는지 적어보세요.'} />
            <BriefCard title="기대 가치" body={idea.expectedValue || '사용자가 얻는 변화를 적어보세요.'} />
          </div>
        </section>
        <section className="rounded-3xl border border-ink/10 bg-white/82 p-5">
          <p className="text-sm font-black text-moss">진행 온도</p>
          <div className="mt-4 h-4 overflow-hidden rounded-full bg-cloud">
            <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-ink/60">
            단계 {stages.length}개 중 {doneStages}개 완료, {progress}% 진행
          </p>
          <div className="mt-4 grid gap-2 text-sm text-ink/62">
            {doingStage ? <p>진행 중: {doingStage.title}</p> : <p>진행 중인 단계가 아직 없습니다.</p>}
            <p>최근 수정: {recentlyUpdated[0]?.title ?? '아직 기록 없음'}</p>
          </div>
        </section>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProgressCard title="리소스" value={`${resources.length}개`} body="참고 링크, 파일 메타데이터, 메모" onClick={() => setTab('resources')} />
        <ProgressCard title="단계" value={`${doneStages}/${stages.length}`} body={`완료율 ${progress}%`} onClick={() => setTab('stages')} />
        <ProgressCard title="프롬프트" value={`${prompts.length}개`} body="단계별 실행 지시문" onClick={() => setTab('prompts')} />
        <ProgressCard title="검토" value={review ? `${review.totalAverage}` : '-'} body={review ? verdictLabels[review.verdict] : '자료가 모인 뒤 평가'} onClick={() => setTab('review')} />
      </section>

      <section className="rounded-3xl border border-ink/10 bg-white/82 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">실행 흐름</h3>
          <AppButton onClick={() => setTab('flow')}>
            <Network size={16} /> 진행 트리 보기
          </AppButton>
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {[
            ['아이디어', '개요와 문제 정의'],
            ['리소스', '자료와 첨부 메타데이터'],
            ['단계', '실행 절차와 완료 기준'],
            ['프롬프트', '도구별 작업 지시문'],
            ['검토', '수동 평가와 보강 판단'],
          ].map(([label, body], index) => (
            <div key={label} className="rounded-2xl border border-ink/10 bg-cloud/70 p-4">
              <p className="text-xs font-black text-moss">0{index + 1}</p>
              <p className="mt-1 font-black">{label}</p>
              <p className="mt-2 text-xs leading-5 text-ink/58">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DemoTheater(props: { onClose: () => void }) {
  const steps = [
    {
      eyebrow: 'Step 1',
      title: '아이디어를 한 문장으로 잡기',
      body: '무엇을 만들고, 누구에게 필요한지 먼저 적습니다.',
      screen: ['아이디어 정리', '로컬 우선 리서치 보드', '혼자 빠르게 MVP를 판단하는 개인용 보드'],
      sample: 'idea',
    },
    {
      eyebrow: 'Step 2',
      title: '자료와 첨부 메타데이터 모으기',
      body: '링크, 파일명, MIME 타입, 요약, 태그를 정리합니다.',
      screen: ['자료 모으기', '요구사항 문서.md', 'local-first / backup / mvp'],
      sample: 'resources',
    },
    {
      eyebrow: 'Step 3',
      title: '실행 단계를 작게 나누기',
      body: '각 단계의 목표, 입력, 완료 기준을 가볍게 쪼갭니다.',
      screen: ['실행 계획', '1. 문제 정의', '2. MVP 범위 확정', '3. 구현 및 검증'],
      sample: 'stages',
    },
    {
      eyebrow: 'Step 4',
      title: 'AI에게 넘길 프롬프트 준비',
      body: 'API 호출 없이 복사 가능한 작업 지시문을 저장합니다.',
      screen: ['프롬프트 준비', '{{idea_title}}', '{{stage_goal}}', '{{done_criteria}}'],
      sample: 'prompt',
    },
    {
      eyebrow: 'Step 5',
      title: '진행 판단과 흐름 보기',
      body: '검토 결과를 리포트로 저장하고, 막힌 지점을 카드로 봅니다.',
      screen: ['진행 판단', '자료 보강 후 실행', '위험 카드 2개 / 다음 행동 3개'],
      sample: 'flow',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <style>
        {`
          @keyframes demoFade {
            0%, 6% { opacity: 0; transform: translateY(10px) scale(.985); }
            10%, 26% { opacity: 1; transform: translateY(0) scale(1); }
            31%, 100% { opacity: 0; transform: translateY(-8px) scale(.985); }
          }
          @keyframes demoProgress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}
      </style>
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-paper shadow-panel">
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-5">
          <div>
            <p className="text-sm font-black text-moss">3분 사용 흐름</p>
            <h2 className="mt-1 text-2xl font-black">영상처럼 보는 Do Dream</h2>
            <p className="mt-2 text-sm leading-6 text-ink/62">실제 데이터를 바꾸지 않는 안내용 미니 화면입니다. 앱의 기본 사용 흐름을 빠르게 훑어봅니다.</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white" onClick={props.onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[2rem] border border-ink/10 bg-ink p-3 shadow-soft">
            <div className="rounded-[1.5rem] bg-[#f7f6ef] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-clay" />
                <span className="h-3 w-3 rounded-full bg-pollen" />
                <span className="h-3 w-3 rounded-full bg-moss" />
                <span className="ml-auto text-xs font-black text-ink/40">local-first preview</span>
              </div>
              <div className="relative h-[420px] overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="absolute inset-0 grid gap-4 p-5 opacity-0"
                    style={{
                      animation: 'demoFade 10s linear infinite',
                      animationDelay: `${index * 2}s`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 rounded-3xl bg-cloud/70 px-5 py-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-moss">{step.screen[0]}</p>
                        <h3 className="mt-1 text-xl font-black">{step.screen[1]}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-moss shadow-soft">{step.eyebrow}</span>
                    </div>
                    <DemoSample kind={step.sample} />
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-pollen" style={{ animation: 'demoProgress 10s linear infinite' }} />
              </div>
            </div>
          </div>
          <div className="grid content-center gap-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-ink/10 bg-white/82 p-4">
                <p className="text-xs font-black text-moss">{step.eyebrow}</p>
                <h3 className="mt-1 font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoSample(props: { kind: string }) {
  if (props.kind === 'idea') {
    return (
      <div className="grid gap-3 rounded-3xl border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid gap-2">
          <p className="text-xs font-black text-moss">빠른 입력</p>
          <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 font-bold">로컬 우선 리서치 보드</div>
          <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/65">자료를 모으고 점수화해 실행 여부를 빠르게 판단한다.</div>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {['문제', '대상 사용자', '기대 가치'].map((label) => (
            <div key={label} className="rounded-2xl bg-cloud/70 p-3">
              <p className="text-xs font-black text-moss">{label}</p>
              <p className="mt-1 text-xs text-ink/58">샘플 값 입력됨</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (props.kind === 'resources') {
    return (
      <div className="grid gap-3">
        {[
          ['LINK', 'Local-first 참고 문서', '검토 완료'],
          ['FILE', 'requirements.md', '18 KB'],
          ['NOTE', '사용 시나리오 메모', '#workflow'],
        ].map(([type, title, meta]) => (
          <div key={title} className="flex items-center justify-between rounded-3xl border border-ink/10 bg-white p-4 shadow-soft">
            <div>
              <p className="text-xs font-black text-moss">{type}</p>
              <p className="mt-1 font-black">{title}</p>
            </div>
            <span className="rounded-full bg-cloud px-3 py-1 text-xs font-bold text-ink/58">{meta}</span>
          </div>
        ))}
      </div>
    );
  }

  if (props.kind === 'stages') {
    return (
      <div className="grid gap-3">
        {[
          ['01', '문제 정의', '완료'],
          ['02', '자료 수집과 정리', '진행'],
          ['03', 'MVP 범위 확정', '대기'],
        ].map(([order, title, status]) => (
          <div key={title} className="grid grid-cols-[44px_1fr_72px] items-center gap-3 rounded-3xl border border-ink/10 bg-white p-4 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cloud text-sm font-black text-moss">{order}</span>
            <div>
              <p className="font-black">{title}</p>
              <p className="text-xs text-ink/55">완료 기준과 연결 자료가 들어감</p>
            </div>
            <span className="rounded-full bg-moss/10 px-3 py-1 text-center text-xs font-black text-moss">{status}</span>
          </div>
        ))}
      </div>
    );
  }

  if (props.kind === 'prompt') {
    return (
      <div className="grid gap-3 rounded-3xl border border-ink/10 bg-ink p-4 text-white shadow-soft">
        <p className="text-xs font-black text-pollen">CODEX 프롬프트</p>
        <pre className="whitespace-pre-wrap text-sm leading-6 text-white/82">{`아이디어: {{idea_title}}
단계: {{stage_title}}
목표: {{stage_goal}}
완료 기준: {{done_criteria}}`}</pre>
        <div className="flex gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">복사 가능</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">단계 연결</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[270px] rounded-3xl border border-ink/10 bg-[radial-gradient(circle_at_25%_20%,#eef4ef_0,#fff_42%,#fffaf0_100%)] p-5 shadow-soft">
      <div className="absolute left-8 top-8 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
        <p className="text-xs font-black text-moss">단계</p>
        <p className="font-black">MVP 범위 확정</p>
      </div>
      <div className="absolute right-8 top-28 rounded-2xl border border-clay/25 bg-white p-4 shadow-soft">
        <p className="text-xs font-black text-clay">위험</p>
        <p className="font-black">백업 예외</p>
      </div>
      <div className="absolute bottom-8 left-28 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
        <p className="text-xs font-black text-moss">다음 행동</p>
        <p className="font-black">복원 문구 보강</p>
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 300" fill="none">
        <path d="M150 74 C240 90 275 118 360 146" stroke="#6f855f" strokeWidth="3" strokeDasharray="7 7" />
        <path d="M365 178 C315 230 250 238 210 232" stroke="#6f855f" strokeWidth="3" />
      </svg>
    </div>
  );
}
