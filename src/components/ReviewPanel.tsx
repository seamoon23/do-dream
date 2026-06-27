import { Clipboard, Copy, Download, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { emptyAiReportDraft, parseAiReportResponse, type AiReportDraft } from '../lib/aiReport';
import { type GuideKey, promptToolLabels, reviewFields, verdictLabels } from '../lib/content';
import { parseTags, tagsToText } from '../lib/format';
import { calculateReviewAverage, getReviewVerdict } from '../lib/review';
import type { AiReport, AiReportSource, ReviewScore } from '../types/domain';
import { AppButton, BriefCard, EmptyState, Field, inputClass, SectionIntro } from './ui';

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

const aiFocusPresets = [
  {
    title: '개발자 관점',
    body: '구현 난이도, 기술 선택, 로컬 저장 안정성, 예상 버그, 먼저 만들어야 할 최소 기능을 중심으로 검토해주세요.',
  },
  {
    title: '사용자 관점',
    body: '처음 보는 사용자가 어디서 헷갈릴지, 어떤 안내가 필요한지, 첫 성공 경험을 어떻게 줄지 중심으로 검토해주세요.',
  },
  {
    title: '리스크 관점',
    body: '데이터 손실, 복원 실패, 과도한 복잡도, 잘못된 기대 형성, 장기 유지보수 위험을 우선순위로 정리해주세요.',
  },
  {
    title: '출시 관점',
    body: 'MVP로 공개하기 전 반드시 고쳐야 할 것, 미뤄도 되는 것, 첫 사용자 테스트 시나리오를 나누어 제안해주세요.',
  },
];

export function ReviewPanelView(props: {
  ideaId: string;
  review?: ReviewScore;
  aiReports: AiReport[];
  saveReview: (draft: Omit<ReviewScore, 'id' | 'createdAt' | 'updatedAt'>) => void;
  copyAiReviewPrompt: () => void;
  copyAiReviewPromptWithFocus: (focusTitle: string, focusInstruction: string) => void;
  downloadAiReviewPrompt: () => void;
  saveAiReport: (draft: AiReportDraft) => void;
  deleteAiReport: (report: AiReport) => void;
  createResourcesFromAiReport: (report: AiReport) => void;
  createStagesFromAiReport: (report: AiReport) => void;
  createRiskNodesFromAiReport: (report: AiReport) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const {
    ideaId,
    review,
    aiReports,
    saveReview,
    copyAiReviewPrompt,
    copyAiReviewPromptWithFocus,
    downloadAiReviewPrompt,
    saveAiReport,
    deleteAiReport,
    createResourcesFromAiReport,
    createStagesFromAiReport,
    createRiskNodesFromAiReport,
    onGuide,
  } = props;
  const [draft, setDraft] = useState(defaultReview(ideaId));

  useEffect(() => {
    setDraft(review ? { ...review } : defaultReview(ideaId));
  }, [ideaId, review]);

  const average = calculateReviewAverage(draft);
  const verdict = getReviewVerdict(average);

  return (
    <div className="grid gap-5">
      <SectionIntro guideKey="review" onGuide={onGuide} />
      <div className="rounded-3xl border border-ink/10 bg-pollen/15 p-4 text-sm leading-6 text-ink/70">
        <strong>중요:</strong> 직접 AI API를 호출하지 않습니다. 점수는 수동 판단이고, AI 협업 리포트는 다른 AI 대화창의 답변을 저장하는 워크플로우입니다.
      </div>
      <div className="grid gap-3 xl:grid-cols-[220px_1fr]">
        <div className="rounded-3xl bg-ink p-5 text-white">
          <p className="text-sm font-bold text-white/60">평균 점수</p>
          <p className="mt-2 text-5xl font-black">{average}</p>
          <p className="mt-2 font-bold text-pollen">{verdictLabels[verdict]}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {reviewFields.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              <div className="flex items-center gap-3">
                <input
                  className="w-full accent-moss"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={Number(draft[field.key])}
                  onChange={(event) => setDraft((value) => ({ ...value, [field.key]: Number(event.target.value) }))}
                />
                <span className="grid h-9 w-9 place-items-center rounded-md bg-cloud text-sm font-black">{Number(draft[field.key])}</span>
              </div>
            </Field>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Field label="부족 자료" hint="쉼표로 구분합니다. 예: 경쟁 서비스, 가격, 법적 리스크">
          <input className={inputClass()} value={draft.missingResources.join(', ')} onChange={(event) => setDraft((value) => ({ ...value, missingResources: parseTags(event.target.value) }))} />
        </Field>
        <Field label="검토 메모">
          <textarea className={inputClass('min-h-24')} value={draft.memo} onChange={(event) => setDraft((value) => ({ ...value, memo: event.target.value }))} />
        </Field>
      </div>
      <AppButton variant="primary" className="w-fit" onClick={() => saveReview({ ...draft, totalAverage: average, verdict })}>
        <Save size={16} /> 검토 저장
      </AppButton>
      <AiReviewSection
        aiReports={aiReports}
        copyAiReviewPrompt={copyAiReviewPrompt}
        copyAiReviewPromptWithFocus={copyAiReviewPromptWithFocus}
        downloadAiReviewPrompt={downloadAiReviewPrompt}
        saveAiReport={saveAiReport}
        deleteAiReport={deleteAiReport}
        createResourcesFromAiReport={createResourcesFromAiReport}
        createStagesFromAiReport={createStagesFromAiReport}
        createRiskNodesFromAiReport={createRiskNodesFromAiReport}
      />
    </div>
  );
}

function AiReviewSection(props: {
  aiReports: AiReport[];
  copyAiReviewPrompt: () => void;
  copyAiReviewPromptWithFocus: (focusTitle: string, focusInstruction: string) => void;
  downloadAiReviewPrompt: () => void;
  saveAiReport: (draft: AiReportDraft) => void;
  deleteAiReport: (report: AiReport) => void;
  createResourcesFromAiReport: (report: AiReport) => void;
  createStagesFromAiReport: (report: AiReport) => void;
  createRiskNodesFromAiReport: (report: AiReport) => void;
}) {
  const {
    aiReports,
    copyAiReviewPrompt,
    copyAiReviewPromptWithFocus,
    downloadAiReviewPrompt,
    saveAiReport,
    deleteAiReport,
    createResourcesFromAiReport,
    createStagesFromAiReport,
    createRiskNodesFromAiReport,
  } = props;
  const [draft, setDraft] = useState<AiReportDraft>(emptyAiReportDraft);

  function updateRawResponse(rawResponse: string) {
    const parsed = parseAiReportResponse(rawResponse);
    setDraft((value) => ({
      ...value,
      conclusion: parsed.conclusion,
      missingResources: parsed.missingResources,
      risks: parsed.risks,
      nextActions: parsed.nextActions,
      rawResponse,
    }));
  }

  async function handleSave() {
    await saveAiReport(draft);
    setDraft(emptyAiReportDraft());
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white/86 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-moss">AI 협업 리포트</p>
          <h3 className="mt-1 text-xl font-black">요청서를 복사하고, AI 답변을 저장하세요</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">
            API를 호출하지 않습니다. 요청서를 다른 AI 대화창에 붙여넣고, 받은 답변을 다시 붙여넣으면 결론/부족 자료/위험/다음 행동을 구조화합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AppButton variant="primary" onClick={copyAiReviewPrompt}>
            <Copy size={16} /> 기본 요청서 복사
          </AppButton>
          <AppButton onClick={downloadAiReviewPrompt}>
            <Download size={16} /> Markdown 저장
          </AppButton>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-cloud/55 p-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-moss">관점별 요청서</p>
            <p className="mt-1 text-sm text-ink/60">같은 데이터를 다른 각도로 검토받고 싶을 때 사용합니다.</p>
          </div>
          <span className="text-xs font-bold text-ink/45">복사 후 원하는 AI 대화창에 붙여넣기</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {aiFocusPresets.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => copyAiReviewPromptWithFocus(preset.title, preset.body)}
              className="rounded-2xl border border-ink/10 bg-white/86 p-4 text-left transition hover:border-moss hover:bg-white"
            >
              <p className="font-black">{preset.title}</p>
              <p className="mt-2 text-xs leading-5 text-ink/58">{preset.body}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Field label="리포트 제목">
              <input className={inputClass()} value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} />
            </Field>
            <Field label="AI 도구">
              <select className={inputClass()} value={draft.sourceTool} onChange={(event) => setDraft((value) => ({ ...value, sourceTool: event.target.value as AiReportSource }))}>
                {Object.entries(promptToolLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
                <option value="OTHER">기타</option>
              </select>
            </Field>
          </div>
          <Field label="AI 응답 붙여넣기" hint="요청서 형식대로 답변하면 결론, 부족 자료, 위험, 다음 행동을 자동으로 나눕니다.">
            <textarea className={inputClass('min-h-56 font-mono')} value={draft.rawResponse} onChange={(event) => updateRawResponse(event.target.value)} />
          </Field>
          <AppButton variant="primary" className="w-fit" onClick={() => void handleSave()}>
            <Save size={16} /> AI 리포트 저장
          </AppButton>
        </div>

        <div className="grid gap-3 rounded-3xl bg-cloud/65 p-4">
          <Field label="추출된 결론">
            <textarea className={inputClass('min-h-28')} value={draft.conclusion} onChange={(event) => setDraft((value) => ({ ...value, conclusion: event.target.value }))} />
          </Field>
          <Field label="부족 자료" hint="쉼표로 구분합니다.">
            <input className={inputClass()} value={tagsToText(draft.missingResources)} onChange={(event) => setDraft((value) => ({ ...value, missingResources: parseTags(event.target.value) }))} />
          </Field>
          <Field label="위험" hint="쉼표로 구분합니다.">
            <input className={inputClass()} value={tagsToText(draft.risks)} onChange={(event) => setDraft((value) => ({ ...value, risks: parseTags(event.target.value) }))} />
          </Field>
          <Field label="다음 행동" hint="쉼표로 구분합니다.">
            <input className={inputClass()} value={tagsToText(draft.nextActions)} onChange={(event) => setDraft((value) => ({ ...value, nextActions: parseTags(event.target.value) }))} />
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <h4 className="text-sm font-black text-moss">저장된 AI 리포트</h4>
        {aiReports.length === 0 ? (
          <EmptyState icon={<Sparkles size={20} />} title="저장된 AI 리포트가 없습니다" body="요청서를 복사해 다른 AI 대화창에서 검토받은 뒤, 답변을 붙여넣어 저장해보세요." />
        ) : (
          aiReports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-ink/10 bg-white/88 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-black text-moss">{report.sourceTool}</p>
                  <h4 className="mt-1 font-black">{report.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{report.conclusion || '결론 없음'}</p>
                </div>
                <AppButton className="shrink-0" variant="danger" onClick={() => deleteAiReport(report)}>
                  <Trash2 size={16} /> 삭제
                </AppButton>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <BriefCard title="부족 자료" body={report.missingResources.join(', ') || '-'} />
                <BriefCard title="위험" body={report.risks.join(', ') || '-'} />
                <BriefCard title="다음 행동" body={report.nextActions.join(', ') || '-'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-cloud/55 p-3">
                <span className="rounded-full bg-white px-3 py-2 text-sm font-black text-moss shadow-soft">후속 처리</span>
                <AppButton disabled={report.missingResources.length === 0} onClick={() => createResourcesFromAiReport(report)}>
                  <Clipboard size={16} /> 리소스 후보
                </AppButton>
                <AppButton disabled={report.nextActions.length === 0} onClick={() => createStagesFromAiReport(report)}>
                  <Save size={16} /> 실행 단계
                </AppButton>
                <AppButton disabled={report.risks.length === 0} onClick={() => createRiskNodesFromAiReport(report)}>
                  <Sparkles size={16} /> 위험 카드
                </AppButton>
              </div>
              <details className="mt-4 rounded-2xl bg-cloud/60 p-3">
                <summary className="cursor-pointer text-sm font-black text-moss">원문 보기</summary>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-ink p-4 text-sm leading-6 text-white">{report.rawResponse || '-'}</pre>
              </details>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
