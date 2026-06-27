import type { AiReport } from '../types/domain';

export type AiReportDraft = Omit<AiReport, 'id' | 'ideaId' | 'createdAt' | 'updatedAt'>;

export const emptyAiReportDraft = (): AiReportDraft => ({
  title: 'AI 검토 리포트',
  sourceTool: 'GENERAL',
  conclusion: '',
  missingResources: [],
  risks: [],
  nextActions: [],
  rawResponse: '',
});

function getMarkdownSection(markdown: string, title: string) {
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let collecting = false;

  for (const lineValue of lines) {
    const heading = lineValue.replace(/^#+\s*/, '').trim();
    if (/^##+\s+/.test(lineValue) && collecting) break;
    if (heading === title) {
      collecting = true;
      continue;
    }
    if (collecting) result.push(lineValue);
  }

  return result.join('\n').trim();
}

function sectionToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((item) => item && item !== '-')
    .slice(0, 8);
}

export function parseAiReportResponse(rawResponse: string): AiReportDraft {
  const conclusion = getMarkdownSection(rawResponse, '결론') || rawResponse.trim().slice(0, 500);
  return {
    ...emptyAiReportDraft(),
    conclusion,
    missingResources: sectionToList(getMarkdownSection(rawResponse, '부족 자료')),
    risks: sectionToList(getMarkdownSection(rawResponse, '위험')),
    nextActions: sectionToList(getMarkdownSection(rawResponse, '다음 행동')),
    rawResponse,
  };
}
