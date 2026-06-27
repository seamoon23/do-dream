# 03. 데이터 모델

## TypeScript 도메인 타입

```ts
export type IdeaStatus =
  | 'COLLECTED'
  | 'REVIEWING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DONE'
  | 'ARCHIVED';

export type ResourceType =
  | 'LINK'
  | 'NOTE'
  | 'FILE'
  | 'TEXT'
  | 'CODE'
  | 'PROMPT'
  | 'IMAGE_NOTE';

export type ReviewVerdict =
  | 'RECOMMENDED'
  | 'NEEDS_MORE_RESOURCE'
  | 'ON_HOLD';

export type StageStatus =
  | 'TODO'
  | 'DOING'
  | 'BLOCKED'
  | 'DONE'
  | 'SKIPPED';

export type FlowNodeType =
  | 'STAGE'
  | 'PROMPT'
  | 'ISSUE'
  | 'DECISION'
  | 'BRANCH'
  | 'DONE';

export interface Idea {
  id: string;
  title: string;
  summary: string;
  problem: string;
  targetUser: string;
  expectedValue: string;
  monetizationNote?: string;
  status: IdeaStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  ideaId: string;
  type: ResourceType;
  title: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  contentText?: string;
  summary?: string;
  tags: string[];
  importance: 1 | 2 | 3 | 4 | 5;
  reviewStatus: 'UNREVIEWED' | 'VALID' | 'INSUFFICIENT' | 'DISCARDED';
  linkedStageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewScore {
  id: string;
  ideaId: string;
  problemClarity: number;
  userValue: number;
  implementationDifficulty: number;
  resourceReadiness: number;
  techFit: number;
  scalability: number;
  monetizationPotential: number;
  riskLevel: number;
  totalAverage: number;
  verdict: ReviewVerdict;
  missingResources: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  ideaId: string;
  order: number;
  title: string;
  goal: string;
  inputRequired: string;
  outputExpected: string;
  doneCriteria: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: StageStatus;
  promptTemplateId?: string;
  resourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FlowNode {
  id: string;
  ideaId: string;
  type: FlowNodeType;
  title: string;
  description?: string;
  status?: StageStatus;
  refStageId?: string;
  refPromptId?: string;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface FlowEdge {
  id: string;
  ideaId: string;
  source: string;
  target: string;
  label?: string;
  type: 'NEXT' | 'BRANCH' | 'ROLLBACK' | 'ALTERNATIVE' | 'DEPENDENCY';
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  ideaId?: string;
  stageId?: string;
  tool: 'CODEX' | 'CLAUDE_CODE' | 'GEMINI' | 'GENERAL';
  title: string;
  body: string;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

## Dexie 스키마 예시

```ts
import Dexie, { Table } from 'dexie';

export class IdeaRouteDb extends Dexie {
  ideas!: Table<Idea, string>;
  resources!: Table<Resource, string>;
  reviewScores!: Table<ReviewScore, string>;
  stages!: Table<Stage, string>;
  flowNodes!: Table<FlowNode, string>;
  flowEdges!: Table<FlowEdge, string>;
  promptTemplates!: Table<PromptTemplate, string>;

  constructor() {
    super('IdeaRouteBuilderDb');

    this.version(1).stores({
      ideas: 'id, status, priority, updatedAt, *tags',
      resources: 'id, ideaId, type, reviewStatus, linkedStageId, updatedAt, *tags',
      reviewScores: 'id, ideaId, verdict, updatedAt',
      stages: 'id, ideaId, order, status, promptTemplateId',
      flowNodes: 'id, ideaId, type, refStageId, refPromptId',
      flowEdges: 'id, ideaId, source, target, type',
      promptTemplates: 'id, ideaId, stageId, tool, updatedAt'
    });
  }
}
```

## 계산 규칙

```ts
export function calculateReviewAverage(score: Omit<ReviewScore, 'totalAverage' | 'verdict'>): number {
  const values = [
    score.problemClarity,
    score.userValue,
    score.implementationDifficulty,
    score.resourceReadiness,
    score.techFit,
    score.scalability,
    score.monetizationPotential,
    score.riskLevel
  ];

  const validValues = values.filter((v) => Number.isFinite(v) && v >= 1 && v <= 5);
  if (validValues.length !== values.length) {
    throw new Error('검토 점수는 모든 항목이 1~5 사이여야 합니다.');
  }

  return Number((validValues.reduce((sum, v) => sum + v, 0) / validValues.length).toFixed(2));
}

export function getReviewVerdict(avg: number): ReviewVerdict {
  if (avg >= 4) return 'RECOMMENDED';
  if (avg >= 3) return 'NEEDS_MORE_RESOURCE';
  return 'ON_HOLD';
}
```

## 백업 포맷

```ts
export interface BackupPayload {
  app: 'IdeaRouteBuilder';
  version: 1;
  exportedAt: string;
  data: {
    ideas: Idea[];
    resources: Resource[];
    reviewScores: ReviewScore[];
    stages: Stage[];
    flowNodes: FlowNode[];
    flowEdges: FlowEdge[];
    promptTemplates: PromptTemplate[];
  };
}
```
