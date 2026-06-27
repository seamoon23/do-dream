import type { ReviewScore, ReviewVerdict } from '../types/domain';

type ScoreInput = Pick<
  ReviewScore,
  | 'problemClarity'
  | 'userValue'
  | 'implementationDifficulty'
  | 'resourceReadiness'
  | 'techFit'
  | 'scalability'
  | 'monetizationPotential'
  | 'riskLevel'
>;

export function calculateReviewAverage(score: ScoreInput): number {
  const values = [
    score.problemClarity,
    score.userValue,
    score.implementationDifficulty,
    score.resourceReadiness,
    score.techFit,
    score.scalability,
    score.monetizationPotential,
    score.riskLevel,
  ];

  if (!values.every((value) => Number.isFinite(value) && value >= 1 && value <= 5)) {
    throw new Error('검토 점수는 모든 항목이 1~5 사이여야 합니다.');
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export function getReviewVerdict(avg: number): ReviewVerdict {
  if (avg >= 4) return 'RECOMMENDED';
  if (avg >= 3) return 'NEEDS_MORE_RESOURCE';
  return 'ON_HOLD';
}

export const verdictLabels: Record<ReviewVerdict, string> = {
  RECOMMENDED: '실행 추천',
  NEEDS_MORE_RESOURCE: '자료 보강 후 실행',
  ON_HOLD: '보류 추천',
};
