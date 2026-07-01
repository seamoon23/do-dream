import { Archive, Check, Clipboard, Copy, Download, FileInput, ListChecks, Plus, RefreshCcw, Route, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { AgentPlugin } from '../agentPlugins/types';
import { db } from '../db/database';
import { type GuideKey, ideaStatusLabels, promptToolLabels, resourceTypeLabels, stageStatusLabels } from '../lib/content';
import { formatBytes, parseTags, tagsToText } from '../lib/format';
import type { RouteTemplate } from '../routePlugins/types';
import type { BackupPayload, Idea, PromptTemplate, PromptTool, Resource, ResourceType, Stage, StageStatus } from '../types/domain';
import { AppButton, classNames, EmptyState, Field, inputClass, SectionIntro } from './ui';

type ToastType = 'success' | 'error' | 'info';
type IdeaDraft = Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
type ResourceDraft = Omit<Resource, 'id' | 'ideaId' | 'createdAt' | 'updatedAt'>;
type PromptDraft = Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>;

function now() {
  return new Date().toISOString();
}

export function IdeaPanelView(props: {
  draft: IdeaDraft;
  selectedIdea?: Idea;
  setDraft: React.Dispatch<React.SetStateAction<IdeaDraft>>;
  routeTemplates: RouteTemplate[];
  recommendedRouteTemplates: RouteTemplate[];
  routeGoal: string;
  setRouteGoal: (value: string) => void;
  selectedRouteTemplateId: string;
  setSelectedRouteTemplateId: (value: string) => void;
  applyRouteTemplate: (templateId: string) => void;
  saveIdea: () => void;
  deleteIdea: () => void;
  onGuide: (key: GuideKey) => void;
}) {
  const {
    draft,
    selectedIdea,
    setDraft,
    routeTemplates,
    recommendedRouteTemplates,
    routeGoal,
    setRouteGoal,
    selectedRouteTemplateId,
    setSelectedRouteTemplateId,
    applyRouteTemplate,
    saveIdea,
    deleteIdea,
    onGuide,
  } = props;
  const visibleTemplates = [
    ...recommendedRouteTemplates,
    ...routeTemplates.filter((template) => !recommendedRouteTemplates.some((recommended) => recommended.id === template.id)),
  ];
  const selectedTemplate = routeTemplates.find((template) => template.id === selectedRouteTemplateId);
  const appliedTemplateId = selectedIdea?.templateId ?? 'plain';
  const canApplyTemplate = Boolean(selectedIdea && selectedRouteTemplateId !== 'plain');

  return (
    <div className="grid gap-4">
      <SectionIntro guideKey="idea" onGuide={onGuide} />
      <div className="rounded-3xl border border-ink/10 bg-white/88 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black text-moss">Route Template</p>
            <h3 className="mt-1 text-lg font-black">어떤 실행 루트로 시작할까요?</h3>
            <p className="mt-1 text-sm leading-6 text-ink/62">
              Plain Mode는 기존처럼 빈 보드로 시작합니다. 웹소설 루트는 저장 또는 적용 시 단계, 자료, 프롬프트, 흐름 노드를 자동으로 만듭니다.
            </p>
          </div>
          <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-moss">
            현재 선택: {selectedTemplate?.shortName ?? selectedTemplate?.name ?? 'Plain'}
          </span>
        </div>
        <div className="mt-4">
          <Field label="작업 목표" hint="예: 책을 쓰고 싶어, 웹소설을 써보고 싶어. 입력하면 로컬 키워드 매칭으로 추천합니다.">
            <input className={inputClass()} value={routeGoal} onChange={(event) => setRouteGoal(event.target.value)} placeholder="무엇을 해보고 싶나요?" />
          </Field>
        </div>
        {recommendedRouteTemplates.length > 0 ? (
          <div className="mt-3 rounded-2xl bg-pollen/18 px-4 py-3 text-sm font-semibold text-ink/68">
            추천 루트: {recommendedRouteTemplates.map((template) => template.name).join(', ')}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleTemplates.map((template) => {
            const selected = selectedRouteTemplateId === template.id;
            const isApplied = appliedTemplateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedRouteTemplateId(template.id)}
                className={classNames(
                  'rounded-3xl border p-4 text-left transition',
                  selected ? 'border-moss bg-cloud/80' : 'border-ink/10 bg-white hover:border-moss/50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{template.name}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{template.description}</p>
                  </div>
                  {selected ? <Check className="shrink-0 text-moss" size={18} /> : <Route className="shrink-0 text-ink/35" size={18} />}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink/55">
                  <span className="rounded bg-moss/10 px-2 py-1">단계 {template.seedStages.length}</span>
                  <span className="rounded bg-moss/10 px-2 py-1">프롬프트 {template.seedPrompts.length}</span>
                  <span className="rounded bg-moss/10 px-2 py-1">자료 {template.seedResources?.length ?? 0}</span>
                  {isApplied ? <span className="rounded bg-pollen/35 px-2 py-1 text-ink">적용됨</span> : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-ink/50">결과물: {template.outcome}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedIdea ? (
            <AppButton disabled={!canApplyTemplate} onClick={() => applyRouteTemplate(selectedRouteTemplateId)}>
              <Sparkles size={16} /> 선택 루트 적용
            </AppButton>
          ) : (
            <span className="text-sm font-semibold text-ink/55">새 아이디어 저장 시 선택한 루트가 자동 적용됩니다.</span>
          )}
          {selectedIdea?.templateAppliedAt ? (
            <span className="text-xs font-bold text-ink/45">마지막 적용: {new Date(selectedIdea.templateAppliedAt).toLocaleString()}</span>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white/85 p-4">
        <p className="mb-3 text-sm font-black text-moss">빠른 입력</p>
        <div className="grid gap-4">
          <Field label="제목" hint="왼쪽 목록과 대시보드에 보이는 대표 이름입니다.">
            <input className={inputClass()} value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="예: 고객 상담 자동 분류 보드" />
          </Field>
          <Field label="한 줄 요약">
            <textarea className={inputClass('min-h-20')} value={draft.summary} onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))} />
          </Field>
          <Field label="무엇을 해결하나요?">
            <textarea className={inputClass('min-h-28')} value={draft.problem} onChange={(event) => setDraft((value) => ({ ...value, problem: event.target.value }))} />
          </Field>
        </div>
      </div>
      <details className="rounded-3xl border border-ink/10 bg-cloud/55 p-4">
        <summary className="cursor-pointer text-sm font-black text-moss">자세히 입력</summary>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Field label="상태">
              <select className={inputClass()} value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as Idea['status'] }))}>
                {Object.entries(ideaStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="우선순위">
              <input className={inputClass()} type="number" min={1} max={5} value={draft.priority} onChange={(event) => setDraft((value) => ({ ...value, priority: Number(event.target.value) as Idea['priority'] }))} />
            </Field>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Field label="누가 쓰나요?">
              <textarea className={inputClass('min-h-24')} value={draft.targetUser} onChange={(event) => setDraft((value) => ({ ...value, targetUser: event.target.value }))} />
            </Field>
            <Field label="어떤 가치가 있나요?">
              <textarea className={inputClass('min-h-24')} value={draft.expectedValue} onChange={(event) => setDraft((value) => ({ ...value, expectedValue: event.target.value }))} />
            </Field>
            <Field label="수익화 메모">
              <textarea className={inputClass('min-h-24')} value={draft.monetizationNote} onChange={(event) => setDraft((value) => ({ ...value, monetizationNote: event.target.value }))} />
            </Field>
            <Field label="메모">
              <textarea className={inputClass('min-h-24')} value={draft.memo} onChange={(event) => setDraft((value) => ({ ...value, memo: event.target.value }))} />
            </Field>
          </div>
          <Field label="태그" hint="쉼표로 구분합니다. 예: ai, mvp, local-first">
            <input className={inputClass()} value={tagsToText(draft.tags)} onChange={(event) => setDraft((value) => ({ ...value, tags: parseTags(event.target.value) }))} />
          </Field>
        </div>
      </details>
      <div className="flex flex-wrap gap-2">
        <AppButton variant="primary" onClick={saveIdea}>
          <Save size={16} /> 아이디어 저장
        </AppButton>
        {selectedIdea ? (
          <AppButton variant="danger" onClick={deleteIdea}>
            <Trash2 size={16} /> 삭제
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}

export function ResourcesPanelView(props: {
  resourceDraft: ResourceDraft;
  setResourceDraft: React.Dispatch<React.SetStateAction<ResourceDraft>>;
  saveResource: () => void;
  handleResourceFile: (file?: File) => void;
  resources: Resource[];
  stages: Stage[];
  notify: (type: ToastType, message: string) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const { resourceDraft, setResourceDraft, saveResource, handleResourceFile, resources, stages, notify, onGuide } = props;
  const [resourceQuery, setResourceQuery] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | 'ALL'>('ALL');
  const [resourceReviewFilter, setResourceReviewFilter] = useState<Resource['reviewStatus'] | 'ALL'>('ALL');
  const normalizedResourceQuery = resourceQuery.trim().toLowerCase();
  const filteredResources = resources.filter((resource) => {
    const queryMatch =
      !normalizedResourceQuery ||
      [resource.title, resource.summary ?? '', resource.contentText ?? '', resource.url ?? '', resource.fileName ?? '', resource.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedResourceQuery);
    const typeMatch = resourceTypeFilter === 'ALL' || resource.type === resourceTypeFilter;
    const reviewMatch = resourceReviewFilter === 'ALL' || resource.reviewStatus === resourceReviewFilter;
    return queryMatch && typeMatch && reviewMatch;
  });

  async function updateResource(resourceId: string, changes: Partial<Resource>) {
    await db.resources.update(resourceId, { ...changes, updatedAt: now() });
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`"${resource.title}" 리소스를 삭제할까요?`)) return;
    await db.resources.delete(resource.id);
    notify('info', '리소스를 삭제했습니다.');
  }

  return (
    <div className="grid gap-5">
      <SectionIntro guideKey="resources" onGuide={onGuide} />
      <div className="rounded-3xl border border-ink/10 bg-cloud/55 p-4">
        <p className="mb-3 text-sm font-black text-moss">빠른 자료 등록</p>
        <div className="grid gap-3 xl:grid-cols-[180px_1fr_1fr]">
          <Field label="유형">
            <select className={inputClass()} value={resourceDraft.type} onChange={(event) => setResourceDraft((value) => ({ ...value, type: event.target.value as ResourceType }))}>
              {Object.entries(resourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="제목">
            <input className={inputClass()} value={resourceDraft.title} onChange={(event) => setResourceDraft((value) => ({ ...value, title: event.target.value }))} />
          </Field>
          <Field label="URL">
            <input className={inputClass()} value={resourceDraft.url} onChange={(event) => setResourceDraft((value) => ({ ...value, url: event.target.value }))} placeholder="https://..." />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <Field label="요약">
            <textarea className={inputClass('min-h-24')} value={resourceDraft.summary} onChange={(event) => setResourceDraft((value) => ({ ...value, summary: event.target.value }))} />
          </Field>
          <div className="flex items-end">
            <AppButton variant="primary" className="w-full" onClick={saveResource}>
              <Plus size={16} /> 리소스 추가
            </AppButton>
          </div>
        </div>
        <details className="mt-3 rounded-2xl bg-white/68 p-4">
          <summary className="cursor-pointer text-sm font-black text-moss">파일, 단계 연결, 태그 자세히</summary>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <Field label="파일 메타데이터" hint="파일 본문 자동 분석은 하지 않습니다. 텍스트 파일만 1MB 이하 본문 저장을 허용합니다.">
              <input className={inputClass('file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1 file:text-white')} type="file" onChange={(event) => handleResourceFile(event.target.files?.[0])} />
            </Field>
            <Field label="중요도">
              <input className={inputClass()} type="number" min={1} max={5} value={resourceDraft.importance} onChange={(event) => setResourceDraft((value) => ({ ...value, importance: Number(event.target.value) as Resource['importance'] }))} />
            </Field>
            <Field label="연결 단계">
              <select className={inputClass()} value={resourceDraft.linkedStageId} onChange={(event) => setResourceDraft((value) => ({ ...value, linkedStageId: event.target.value }))}>
                <option value="">없음</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.order}. {stage.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <Field label="본문/메모">
              <textarea className={inputClass('min-h-24')} value={resourceDraft.contentText} onChange={(event) => setResourceDraft((value) => ({ ...value, contentText: event.target.value }))} />
            </Field>
            <Field label="태그">
              <input className={inputClass()} value={tagsToText(resourceDraft.tags)} onChange={(event) => setResourceDraft((value) => ({ ...value, tags: parseTags(event.target.value) }))} />
            </Field>
          </div>
        </details>
        {resourceDraft.fileName ? (
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink/70">
            선택 파일: {resourceDraft.fileName} / {resourceDraft.mimeType} / {formatBytes(resourceDraft.sizeBytes)}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px]">
          <Field label="검색">
            <input className={inputClass()} value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} placeholder="제목, 요약, URL, 태그 검색" />
          </Field>
          <Field label="유형">
            <select className={inputClass()} value={resourceTypeFilter} onChange={(event) => setResourceTypeFilter(event.target.value as ResourceType | 'ALL')}>
              <option value="ALL">전체 유형</option>
              {Object.entries(resourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="검토 상태">
            <select className={inputClass()} value={resourceReviewFilter} onChange={(event) => setResourceReviewFilter(event.target.value as Resource['reviewStatus'] | 'ALL')}>
              <option value="ALL">전체 상태</option>
              <option value="UNREVIEWED">미검토</option>
              <option value="VALID">유효</option>
              <option value="INSUFFICIENT">부족</option>
              <option value="DISCARDED">폐기</option>
            </select>
          </Field>
        </div>
        <p className="mt-3 text-sm font-semibold text-ink/55">표시 중: {filteredResources.length}개 / 전체 {resources.length}개</p>
      </div>

      {resources.length === 0 ? (
        <EmptyState icon={<FileInput size={20} />} title="아직 리소스가 없습니다" body="링크, 메모, 파일 메타데이터를 추가하면 단계 설계와 검토에서 맥락이 살아납니다." />
      ) : filteredResources.length === 0 ? (
        <EmptyState icon={<FileInput size={20} />} title="조건에 맞는 리소스가 없습니다" body="검색어 또는 필터를 줄이면 다시 목록을 볼 수 있습니다." />
      ) : (
        <div className="grid gap-3">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="rounded-3xl border border-ink/10 bg-white/88 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-moss/10 px-2 py-0.5 text-xs font-bold text-moss">{resourceTypeLabels[resource.type]}</span>
                    <strong>{resource.title}</strong>
                    <span className="text-sm text-ink/50">중요도 {resource.importance}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{resource.summary || resource.contentText || resource.url || '요약 없음'}</p>
                  {resource.fileName ? (
                    <p className="mt-2 text-xs font-semibold text-ink/50">
                      {resource.fileName} / {resource.mimeType || 'unknown'} / {formatBytes(resource.sizeBytes)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <select className={inputClass('min-w-36')} value={resource.reviewStatus} onChange={(event) => updateResource(resource.id, { reviewStatus: event.target.value as Resource['reviewStatus'] })}>
                    <option value="UNREVIEWED">미검토</option>
                    <option value="VALID">유효</option>
                    <option value="INSUFFICIENT">부족</option>
                    <option value="DISCARDED">폐기</option>
                  </select>
                  <AppButton variant="danger" onClick={() => deleteResource(resource)} title="삭제">
                    <Trash2 size={16} />
                  </AppButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function StagesPanelView(props: {
  stages: Stage[];
  resources: Resource[];
  prompts: PromptTemplate[];
  generateDefaultStages: () => void;
  addStage: () => void;
  updateStage: (stageId: string, changes: Partial<Stage>) => void;
  deleteStage: (stage: Stage) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const { stages, resources, prompts, generateDefaultStages, addStage, updateStage, deleteStage, onGuide } = props;
  const [stageQuery, setStageQuery] = useState('');
  const [stageStatusFilter, setStageStatusFilter] = useState<StageStatus | 'ALL'>('ALL');
  const normalizedStageQuery = stageQuery.trim().toLowerCase();
  const filteredStages = stages.filter((stage) => {
    const queryMatch =
      !normalizedStageQuery ||
      [stage.title, stage.goal, stage.inputRequired, stage.outputExpected, stage.doneCriteria]
        .join(' ')
        .toLowerCase()
        .includes(normalizedStageQuery);
    const statusMatch = stageStatusFilter === 'ALL' || stage.status === stageStatusFilter;
    return queryMatch && statusMatch;
  });

  function toggleResource(stage: Stage, resourceId: string) {
    const resourceIds = stage.resourceIds.includes(resourceId) ? stage.resourceIds.filter((id) => id !== resourceId) : [...stage.resourceIds, resourceId];
    updateStage(stage.id, { resourceIds });
  }

  return (
    <div className="grid gap-4">
      <SectionIntro guideKey="stages" onGuide={onGuide} />
      <div className="flex flex-wrap gap-2">
        <AppButton variant="primary" onClick={addStage}>
          <Plus size={16} /> 단계 추가
        </AppButton>
        <AppButton onClick={generateDefaultStages}>
          <RefreshCcw size={16} /> 기본 단계 생성
        </AppButton>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_190px]">
          <Field label="검색">
            <input className={inputClass()} value={stageQuery} onChange={(event) => setStageQuery(event.target.value)} placeholder="단계 제목, 목표, 완료 기준 검색" />
          </Field>
          <Field label="상태">
            <select className={inputClass()} value={stageStatusFilter} onChange={(event) => setStageStatusFilter(event.target.value as StageStatus | 'ALL')}>
              <option value="ALL">전체 상태</option>
              {Object.entries(stageStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-sm font-semibold text-ink/55">표시 중: {filteredStages.length}개 / 전체 {stages.length}개</p>
      </div>
      {stages.length === 0 ? (
        <EmptyState icon={<ListChecks size={20} />} title="실행 단계가 없습니다" body="기본 단계를 생성한 뒤 아이디어에 맞게 제목, 완료 기준, 연결 리소스를 조정해보세요." action={<AppButton onClick={generateDefaultStages}>기본 단계 생성</AppButton>} />
      ) : filteredStages.length === 0 ? (
        <EmptyState icon={<ListChecks size={20} />} title="조건에 맞는 단계가 없습니다" body="검색어 또는 상태 필터를 줄이면 다시 목록을 볼 수 있습니다." />
      ) : (
        <div className="grid gap-3">
          {filteredStages.map((stage) => (
            <article key={stage.id} className="rounded-3xl border border-ink/10 bg-white/88 p-4">
              <div className="grid gap-3 xl:grid-cols-[80px_1fr_150px_120px_auto]">
                <Field label="순서">
                  <input className={inputClass()} type="number" min={1} value={stage.order} onChange={(event) => updateStage(stage.id, { order: Number(event.target.value) })} />
                </Field>
                <Field label="제목">
                  <input className={inputClass()} value={stage.title} onChange={(event) => updateStage(stage.id, { title: event.target.value })} />
                </Field>
                <Field label="상태">
                  <select className={inputClass()} value={stage.status} onChange={(event) => updateStage(stage.id, { status: event.target.value as StageStatus })}>
                    {Object.entries(stageStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="난이도">
                  <input className={inputClass()} type="number" min={1} max={5} value={stage.difficulty} onChange={(event) => updateStage(stage.id, { difficulty: Number(event.target.value) as Stage['difficulty'] })} />
                </Field>
                <div className="flex items-end">
                  <AppButton variant="danger" onClick={() => deleteStage(stage)}>
                    <Trash2 size={16} />
                  </AppButton>
                </div>
              </div>
              <details className="mt-3 rounded-2xl bg-cloud/55 p-4">
                <summary className="cursor-pointer text-sm font-black text-moss">목표, 완료 기준, 연결 자료 자세히</summary>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  <Field label="목표">
                    <textarea className={inputClass('min-h-20')} value={stage.goal} onChange={(event) => updateStage(stage.id, { goal: event.target.value })} />
                  </Field>
                  <Field label="완료 기준">
                    <textarea className={inputClass('min-h-20')} value={stage.doneCriteria} onChange={(event) => updateStage(stage.id, { doneCriteria: event.target.value })} />
                  </Field>
                  <Field label="필요 입력">
                    <textarea className={inputClass('min-h-20')} value={stage.inputRequired} onChange={(event) => updateStage(stage.id, { inputRequired: event.target.value })} />
                  </Field>
                  <Field label="예상 산출물">
                    <textarea className={inputClass('min-h-20')} value={stage.outputExpected} onChange={(event) => updateStage(stage.id, { outputExpected: event.target.value })} />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  <Field label="연결 프롬프트">
                    <select className={inputClass()} value={stage.promptTemplateId ?? ''} onChange={(event) => updateStage(stage.id, { promptTemplateId: event.target.value || undefined })}>
                      <option value="">없음</option>
                      {prompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div>
                    <p className="mb-2 text-sm font-semibold">연결 리소스</p>
                    <div className="flex flex-wrap gap-2">
                      {resources.length === 0 ? (
                        <span className="text-sm text-ink/50">리소스 없음</span>
                      ) : (
                        resources.map((resource) => (
                          <label key={resource.id} className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white/82 px-3 py-2 text-sm font-semibold">
                            <input type="checkbox" checked={stage.resourceIds.includes(resource.id)} onChange={() => toggleResource(stage, resource.id)} />
                            {resource.title}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function PromptsPanelView(props: {
  promptDraft: PromptDraft;
  setPromptDraft: React.Dispatch<React.SetStateAction<PromptDraft>>;
  prompts: PromptTemplate[];
  agentPlugins: AgentPlugin[];
  stages: Stage[];
  savePrompt: () => void;
  copyPrompt: (prompt: PromptTemplate) => void;
  copyAgentPrompt: (body: string) => void;
  notify: (type: ToastType, message: string) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const { promptDraft, setPromptDraft, prompts, agentPlugins, stages, savePrompt, copyPrompt, copyAgentPrompt, notify, onGuide } = props;
  const [promptQuery, setPromptQuery] = useState('');
  const [promptToolFilter, setPromptToolFilter] = useState<PromptTool | 'ALL'>('ALL');
  const [promptStageFilter, setPromptStageFilter] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');
  const normalizedPromptQuery = promptQuery.trim().toLowerCase();
  const filteredPrompts = prompts.filter((prompt) => {
    const queryMatch =
      !normalizedPromptQuery ||
      [prompt.title, prompt.body, prompt.variables.join(' '), promptToolLabels[prompt.tool]]
        .join(' ')
        .toLowerCase()
        .includes(normalizedPromptQuery);
    const toolMatch = promptToolFilter === 'ALL' || prompt.tool === promptToolFilter;
    const stageMatch =
      promptStageFilter === 'ALL' ||
      (promptStageFilter === 'LINKED' && Boolean(prompt.stageId)) ||
      (promptStageFilter === 'UNLINKED' && !prompt.stageId);
    return queryMatch && toolMatch && stageMatch;
  });

  async function deletePrompt(prompt: PromptTemplate) {
    if (!window.confirm(`"${prompt.title}" 프롬프트를 삭제할까요?`)) return;
    await db.promptTemplates.delete(prompt.id);
    await db.stages.where('promptTemplateId').equals(prompt.id).modify({ promptTemplateId: undefined });
    notify('info', '프롬프트를 삭제했습니다.');
  }

  return (
    <div className="grid gap-5">
      <SectionIntro guideKey="prompts" onGuide={onGuide} />
      {agentPlugins.length > 0 ? (
        <section className="rounded-3xl border border-ink/10 bg-white/88 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black text-moss">Agent Plugin 요청서</p>
              <h3 className="mt-1 text-lg font-black">프롬프트 준비 탭 &gt; 에이전트 요청서 카드 &gt; 복사</h3>
              <p className="mt-1 text-sm leading-6 text-ink/62">
                외부 AI API를 호출하지 않습니다. 필요한 요청서를 복사해 GPT, Claude, Gemini, Codex 같은 대화창에 붙여넣는 구조입니다.
              </p>
            </div>
            <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-moss">{agentPlugins.length}개 에이전트</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {agentPlugins.map((agent) => (
              <article key={agent.id} className="rounded-3xl border border-ink/10 bg-cloud/55 p-4">
                <p className="font-black">{agent.name}</p>
                <p className="mt-1 text-xs font-bold text-moss">{agent.roleName}</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">{agent.description}</p>
                <div className="mt-3 grid gap-2">
                  {agent.promptPresets.map((preset) => (
                    <div key={preset.id} className="rounded-2xl bg-white/88 p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-bold">{preset.title}</p>
                          <p className="mt-1 text-xs leading-5 text-ink/55">{preset.description}</p>
                        </div>
                        <AppButton className="shrink-0" onClick={() => copyAgentPrompt(preset.body)}>
                          <Clipboard size={16} /> 복사
                        </AppButton>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-ink/45">변수: {preset.variables?.join(', ') || '없음'}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="rounded-3xl border border-ink/10 bg-pollen/15 p-4 text-sm leading-6 text-ink/70">
        <strong>현재 역할:</strong> 이 화면은 자동 생성 AI가 아니라, 단계별로 재사용할 프롬프트를 저장하고 복사하는 라이브러리입니다.
      </div>
      <div className="rounded-3xl border border-ink/10 bg-cloud/55 p-4">
        <p className="mb-3 text-sm font-black text-moss">빠른 프롬프트 저장</p>
        <div className="grid gap-3 xl:grid-cols-[170px_1fr]">
          <Field label="도구">
            <select className={inputClass()} value={promptDraft.tool} onChange={(event) => setPromptDraft((value) => ({ ...value, tool: event.target.value as PromptTool }))}>
              {Object.entries(promptToolLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="제목">
            <input className={inputClass()} value={promptDraft.title} onChange={(event) => setPromptDraft((value) => ({ ...value, title: event.target.value }))} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label="본문">
            <textarea className={inputClass('min-h-40 font-mono')} value={promptDraft.body} onChange={(event) => setPromptDraft((value) => ({ ...value, body: event.target.value }))} placeholder="{{idea}}, {{stage_goal}} 같은 변수를 적어둘 수 있습니다." />
          </Field>
        </div>
        <details className="mt-3 rounded-2xl bg-white/68 p-4">
          <summary className="cursor-pointer text-sm font-black text-moss">단계 연결과 변수 자세히</summary>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <Field label="연결 단계">
              <select className={inputClass()} value={promptDraft.stageId ?? ''} onChange={(event) => setPromptDraft((value) => ({ ...value, stageId: event.target.value || undefined }))}>
                <option value="">없음</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.order}. {stage.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="변수" hint="쉼표로 구분합니다. 예: idea, stage_goal">
              <input className={inputClass()} value={promptDraft.variables.join(', ')} onChange={(event) => setPromptDraft((value) => ({ ...value, variables: parseTags(event.target.value) }))} />
            </Field>
          </div>
        </details>
        <AppButton variant="primary" className="mt-3" onClick={savePrompt}>
          <Plus size={16} /> 프롬프트 저장
        </AppButton>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px]">
          <Field label="검색">
            <input className={inputClass()} value={promptQuery} onChange={(event) => setPromptQuery(event.target.value)} placeholder="제목, 본문, 변수 검색" />
          </Field>
          <Field label="도구">
            <select className={inputClass()} value={promptToolFilter} onChange={(event) => setPromptToolFilter(event.target.value as PromptTool | 'ALL')}>
              <option value="ALL">전체 도구</option>
              {Object.entries(promptToolLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="단계 연결">
            <select className={inputClass()} value={promptStageFilter} onChange={(event) => setPromptStageFilter(event.target.value as 'ALL' | 'LINKED' | 'UNLINKED')}>
              <option value="ALL">전체</option>
              <option value="LINKED">연결됨</option>
              <option value="UNLINKED">미연결</option>
            </select>
          </Field>
        </div>
        <p className="mt-3 text-sm font-semibold text-ink/55">표시 중: {filteredPrompts.length}개 / 전체 {prompts.length}개</p>
      </div>

      {prompts.length === 0 ? (
        <EmptyState icon={<Clipboard size={20} />} title="프롬프트가 없습니다" body="단계별 작업 지시문을 저장해두면 Markdown Export에도 함께 포함됩니다." />
      ) : filteredPrompts.length === 0 ? (
        <EmptyState icon={<Clipboard size={20} />} title="조건에 맞는 프롬프트가 없습니다" body="검색어 또는 필터를 줄이면 다시 목록을 볼 수 있습니다." />
      ) : (
        <div className="grid gap-3">
          {filteredPrompts.map((prompt) => (
            <article key={prompt.id} className="rounded-3xl border border-ink/10 bg-white/88 p-4">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="font-bold">{prompt.title}</p>
                  <p className="text-sm text-ink/55">
                    {promptToolLabels[prompt.tool]} / v{prompt.version} / {prompt.variables.join(', ') || '변수 없음'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AppButton onClick={() => copyPrompt(prompt)}>
                    <Clipboard size={16} /> 복사
                  </AppButton>
                  <AppButton variant="danger" onClick={() => deletePrompt(prompt)}>
                    <Trash2 size={16} />
                  </AppButton>
                </div>
              </div>
              <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-ink p-3 text-sm leading-6 text-white">{prompt.body}</pre>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function BackupPanelView(props: {
  exportJson: () => void;
  exportMarkdown: () => void;
  copyMarkdown: () => void;
  importJson: (file?: File) => void;
  pendingImport?: { payload: BackupPayload; fileName: string };
  confirmImport: (mode: 'replace' | 'merge') => void;
  cancelImport: () => void;
  lastBackupAt: string;
  onGuide: (key: GuideKey) => void;
}) {
  const { exportJson, exportMarkdown, copyMarkdown, importJson, pendingImport, confirmImport, cancelImport, lastBackupAt, onGuide } = props;
  const lastBackupLabel = lastBackupAt ? new Date(lastBackupAt).toLocaleString() : '아직 JSON 백업 기록이 없습니다.';
  const backupAgeMs = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : Number.POSITIVE_INFINITY;
  const isBackupFresh = backupAgeMs < 1000 * 60 * 60 * 24;
  const backupStateLabel = isBackupFresh ? '오늘 백업 완료' : '오늘 백업 권장';

  return (
    <div className="grid gap-4">
      <SectionIntro guideKey="backup" onGuide={onGuide} />
      <div className="rounded-3xl border border-ink/10 bg-pollen/15 p-4 text-sm leading-6 text-ink/70">
        <strong>안전 팁:</strong> JSON은 IndexedDB 전체 복원용 백업이고, Markdown은 Codex나 문서에 넘기기 좋은 읽기 전용 정리본입니다. 복원 전에는 가져올 데이터 건수를 확인한 뒤 교체 또는 병합을 선택하세요.
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white/88 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-moss">마지막 JSON 백업</p>
            <p className="mt-1 text-sm text-ink/62">{lastBackupLabel}</p>
          </div>
          <span className={isBackupFresh ? 'rounded-full bg-moss px-3 py-2 text-sm font-black text-white' : 'rounded-full bg-pollen px-3 py-2 text-sm font-black text-ink'}>
            {backupStateLabel}
          </span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
          <p className="text-sm font-black text-moss">1. 중요한 변경 후</p>
          <p className="mt-2 text-sm leading-6 text-ink/62">아이디어, 단계, AI 리포트를 많이 고쳤다면 전체 JSON 백업을 먼저 남겨두세요.</p>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
          <p className="text-sm font-black text-moss">2. 복원 전 확인</p>
          <p className="mt-2 text-sm leading-6 text-ink/62">JSON 파일을 선택하면 앱이 포함된 데이터 개수를 보여주고, 교체 또는 병합을 선택하게 합니다.</p>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white/86 p-4">
          <p className="text-sm font-black text-moss">3. AI 전달용</p>
          <p className="mt-2 text-sm leading-6 text-ink/62">Markdown 복사는 현재 아이디어를 다른 AI 대화창이나 문서로 넘길 때 사용하세요.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <button onClick={exportJson} className="rounded-3xl border border-ink/10 bg-white/88 p-5 text-left transition hover:border-moss">
          <Download className="mb-4 text-moss" />
          <p className="font-black">전체 JSON 백업</p>
          <p className="mt-2 text-sm leading-6 text-ink/60">IndexedDB의 모든 테이블을 하나의 백업 파일로 내보냅니다.</p>
        </button>
        <button onClick={exportMarkdown} className="rounded-3xl border border-ink/10 bg-white/88 p-5 text-left transition hover:border-moss">
          <Archive className="mb-4 text-moss" />
          <p className="font-black">선택 아이디어 Markdown</p>
          <p className="mt-2 text-sm leading-6 text-ink/60">아이디어, 리소스, 검토, 단계, 프롬프트를 문서로 정리합니다.</p>
        </button>
        <button onClick={copyMarkdown} className="rounded-3xl border border-ink/10 bg-white/88 p-5 text-left transition hover:border-moss">
          <Copy className="mb-4 text-moss" />
          <p className="font-black">Markdown 복사</p>
          <p className="mt-2 text-sm leading-6 text-ink/60">선택 아이디어 정리본을 AI 대화창에 바로 붙여넣을 수 있게 복사합니다.</p>
        </button>
        <label className="cursor-pointer rounded-3xl border border-ink/10 bg-white/88 p-5 text-left transition hover:border-moss">
          <Upload className="mb-4 text-moss" />
          <p className="font-black">JSON 복원/병합</p>
          <p className="mt-2 text-sm leading-6 text-ink/60">백업 파일을 선택하면 교체 또는 병합을 선택할 수 있습니다.</p>
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void importJson(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      {pendingImport ? (
        <BackupImportDialog
          fileName={pendingImport.fileName}
          payload={pendingImport.payload}
          onReplace={() => confirmImport('replace')}
          onMerge={() => confirmImport('merge')}
          onCancel={cancelImport}
        />
      ) : null}
    </div>
  );
}

function BackupImportDialog(props: {
  fileName: string;
  payload: BackupPayload;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}) {
  const { fileName, payload, onReplace, onMerge, onCancel } = props;
  const rows = [
    ['아이디어', payload.data.ideas.length],
    ['자료', payload.data.resources.length],
    ['검토', payload.data.reviewScores.length],
    ['단계', payload.data.stages.length],
    ['프롬프트', payload.data.promptTemplates.length],
    ['흐름 카드', payload.data.flowNodes.length],
    ['연결선', payload.data.flowEdges.length],
    ['AI 리포트', payload.data.aiReports?.length ?? 0],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-[2rem] bg-paper p-5 shadow-panel">
        <div>
          <p className="text-sm font-black text-moss">JSON 복원 미리보기</p>
          <h2 className="mt-1 text-2xl font-black">{fileName}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            포함된 데이터 개수를 확인한 뒤 방식을 선택하세요. 교체는 기존 IndexedDB 데이터를 지우고 백업으로 바꾸며, 병합은 기존 데이터 위에 백업 데이터를 추가/갱신합니다.
          </p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {rows.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/86 px-4 py-3">
              <span className="font-bold">{label}</span>
              <span className="rounded-full bg-cloud px-3 py-1 text-sm font-black text-moss">{count}개</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-pollen/18 p-4 text-sm leading-6 text-ink/68">
          <strong>안전 팁:</strong> 교체를 선택하기 전에는 보관함의 전체 JSON 백업으로 현재 상태를 한 번 더 저장해두면 좋습니다.
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <AppButton onClick={onCancel}>취소</AppButton>
          <AppButton onClick={onMerge}>
            <Upload size={16} /> 병합
          </AppButton>
          <AppButton variant="danger" onClick={onReplace}>
            <RefreshCcw size={16} /> 교체
          </AppButton>
        </div>
      </div>
    </div>
  );
}
