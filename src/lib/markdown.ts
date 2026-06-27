import { ideaStatusLabels, promptToolLabels, resourceTypeLabels, stageStatusLabels, verdictLabels } from './content';
import { formatBytes } from './format';
import type { AiReport, FlowEdge, FlowNode, Idea, PromptTemplate, Resource, ReviewScore, Stage } from '../types/domain';

function line(value?: string) {
  return value?.trim() ? value.trim() : '-';
}

function checkbox(value: boolean) {
  return value ? '[x]' : '[ ]';
}

export function buildIdeaMarkdown(params: {
  idea: Idea;
  resources: Resource[];
  review?: ReviewScore;
  stages: Stage[];
  prompts: PromptTemplate[];
  aiReports?: AiReport[];
}) {
  const { idea, resources, review, stages, prompts, aiReports = [] } = params;
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));

  return `# ${idea.title}

## 1. 아이디어 개요
- 상태: ${ideaStatusLabels[idea.status]}
- 우선순위: ${idea.priority}
- 태그: ${idea.tags.join(', ') || '-'}
- 요약: ${line(idea.summary)}
- 문제: ${line(idea.problem)}
- 대상 사용자: ${line(idea.targetUser)}
- 기대 가치: ${line(idea.expectedValue)}
- 수익화 메모: ${line(idea.monetizationNote)}
- 메모: ${line(idea.memo)}

## 2. 리소스
${resources
  .map(
    (resource) => `### ${resource.title}
- 유형: ${resourceTypeLabels[resource.type]}
- 중요도: ${resource.importance}
- 검토 상태: ${resource.reviewStatus}
- URL: ${line(resource.url)}
- 파일: ${line(resource.fileName)} (${formatBytes(resource.sizeBytes)})
- MIME: ${line(resource.mimeType)}
- 태그: ${resource.tags.join(', ') || '-'}
- 요약: ${line(resource.summary)}
${resource.contentText ? `\n\`\`\`text\n${resource.contentText}\n\`\`\`` : ''}`,
  )
  .join('\n\n') || '-'}

## 3. 실행 단계
${stages
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((stage) => {
    const linkedPrompt = stage.promptTemplateId ? promptById.get(stage.promptTemplateId) : undefined;
    const linkedResources = stage.resourceIds.map((resourceId) => resourceById.get(resourceId)?.title).filter(Boolean);
    return `### ${stage.order}. ${stage.title}
- 상태: ${stageStatusLabels[stage.status]}
- 난이도: ${stage.difficulty}
- 목표: ${line(stage.goal)}
- 필요 입력: ${line(stage.inputRequired)}
- 예상 산출물: ${line(stage.outputExpected)}
- 완료 기준: ${line(stage.doneCriteria)}
- 연결 리소스: ${linkedResources.join(', ') || '-'}
- 연결 프롬프트: ${linkedPrompt?.title ?? '-'}
- 체크: ${checkbox(stage.status === 'DONE')} 완료`;
  })
  .join('\n\n') || '-'}

## 4. 프롬프트
${prompts
  .map(
    (prompt) => `### ${prompt.title}
- 도구: ${promptToolLabels[prompt.tool]}
- 버전: ${prompt.version}
- 변수: ${prompt.variables.join(', ') || '-'}

\`\`\`text
${prompt.body}
\`\`\``,
  )
  .join('\n\n') || '-'}

## 5. 진행 판단
${
  review
    ? `- 평균: ${review.totalAverage}
- 판정: ${verdictLabels[review.verdict]}
- 문제 명확성: ${review.problemClarity}
- 사용자 가치: ${review.userValue}
- 구현 난이도: ${review.implementationDifficulty}
- 자료 준비도: ${review.resourceReadiness}
- 기술 적합성: ${review.techFit}
- 확장성: ${review.scalability}
- 수익 가능성: ${review.monetizationPotential}
- 리스크 제어: ${review.riskLevel}
- 부족 자료: ${review.missingResources.join(', ') || '-'}
- 메모: ${line(review.memo)}`
    : '-'
}

## 6. AI 검토 리포트
${aiReports
  .map(
    (report) => `### ${report.title}
- 도구: ${report.sourceTool}
- 결론: ${line(report.conclusion)}
- 부족 자료: ${report.missingResources.join(', ') || '-'}
- 위험: ${report.risks.join(', ') || '-'}
- 다음 행동: ${report.nextActions.join(', ') || '-'}`,
  )
  .join('\n\n') || '-'}
`;
}

export function buildAiReviewPrompt(params: {
  idea: Idea;
  resources: Resource[];
  review?: ReviewScore;
  stages: Stage[];
  prompts: PromptTemplate[];
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}) {
  const context = buildIdeaMarkdown({
    idea: params.idea,
    resources: params.resources,
    review: params.review,
    stages: params.stages,
    prompts: params.prompts,
  });
  const flowSummary =
    params.flowNodes.length === 0
      ? '-'
      : params.flowNodes
          .map((node) => {
            const outgoing = params.flowEdges.filter((edge) => edge.source === node.id);
            return `- ${node.title} (${node.type}${node.status ? `/${node.status}` : ''}) -> ${
              outgoing.map((edge) => edge.label || edge.type).join(', ') || '끝'
            }`;
          })
          .join('\n');

  return `다음은 Idea Route Builder에서 정리한 아이디어 자료입니다.

역할:
- 당신은 냉정하지만 실행 친화적인 제품/개발 검토자입니다.
- 외부 자료를 새로 검색하지 말고, 아래에 제공된 정보만 근거로 판단하세요.
- 모르는 것은 추측하지 말고 "부족 자료"에 적어주세요.

검토 목표:
- 이 아이디어를 지금 진행해도 되는지 판단합니다.
- 부족한 자료, 주요 위험, 바로 다음 행동을 짧고 실행 가능하게 정리합니다.
- 칭찬보다 의사결정에 도움이 되는 피드백을 우선합니다.

반드시 아래 형식으로만 답변하세요. 각 항목은 1~5개 bullet로 제한하세요.

# AI 검토 리포트
## 결론
한 문단으로 진행/보강/보류 중 무엇이 적절한지 적어주세요.

## 부족 자료
-

## 위험
-

## 다음 행동
-

## 원문 메모
필요하면 추가 설명을 짧게 적어주세요.

---

${context}

## 7. 진행 트리 요약
${flowSummary}
`;
}
