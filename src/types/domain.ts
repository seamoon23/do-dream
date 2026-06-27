export type IdeaStatus =
  | 'COLLECTED'
  | 'REVIEWING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DONE'
  | 'ARCHIVED';

export type ResourceType = 'LINK' | 'NOTE' | 'FILE' | 'TEXT' | 'CODE' | 'PROMPT' | 'IMAGE_NOTE';

export type ReviewVerdict = 'RECOMMENDED' | 'NEEDS_MORE_RESOURCE' | 'ON_HOLD';

export type StageStatus = 'TODO' | 'DOING' | 'BLOCKED' | 'DONE' | 'SKIPPED';

export type FlowNodeType = 'STAGE' | 'PROMPT' | 'ISSUE' | 'DECISION' | 'BRANCH' | 'DONE';

export type PromptTool = 'CODEX' | 'CLAUDE_CODE' | 'GEMINI' | 'GENERAL';

export type EdgeType = 'NEXT' | 'BRANCH' | 'ROLLBACK' | 'ALTERNATIVE' | 'DEPENDENCY';

export type AiReportSource = PromptTool | 'OTHER';

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
  type: EdgeType;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  ideaId?: string;
  stageId?: string;
  tool: PromptTool;
  title: string;
  body: string;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiReport {
  id: string;
  ideaId: string;
  title: string;
  sourceTool: AiReportSource;
  conclusion: string;
  missingResources: string[];
  risks: string[];
  nextActions: string[];
  rawResponse: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupPayload {
  app: 'IdeaRouteBuilder';
  version: 1 | 2;
  exportedAt: string;
  data: {
    ideas: Idea[];
    resources: Resource[];
    reviewScores: ReviewScore[];
    stages: Stage[];
    flowNodes: FlowNode[];
    flowEdges: FlowEdge[];
    promptTemplates: PromptTemplate[];
    aiReports?: AiReport[];
  };
}
