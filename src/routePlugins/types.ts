import type { EdgeType, FlowNodeType, PromptTool, Resource, ResourceType, StageStatus } from '../types/domain';

export type RouteTemplateCategory =
  | 'plain'
  | 'writing'
  | 'publishing'
  | 'app'
  | 'web'
  | 'game'
  | 'monetization'
  | 'automation'
  | 'custom';

export type RouteTemplateSeedStage = {
  title: string;
  order: number;
  status?: StageStatus;
  difficulty?: number;
  goal: string;
  doneCriteria: string;
  requiredInputs?: string;
  expectedOutput?: string;
  tags?: string[];
};

export type RouteTemplateSeedPrompt = {
  title: string;
  tool?: PromptTool;
  body: string;
  stageTitle?: string;
  variables?: string[];
  version?: number;
  tags?: string[];
};

export type RouteTemplateSeedResource = {
  type: ResourceType;
  title: string;
  summary?: string;
  contentText?: string;
  importance?: Resource['importance'];
  reviewStatus?: Resource['reviewStatus'];
  tags?: string[];
};

export type RouteTemplateSeedFlowNode = {
  title: string;
  nodeType?: FlowNodeType;
  status?: StageStatus;
  memo?: string;
  stageTitle?: string;
};

export type RouteTemplateSeedFlowEdge = {
  sourceTitle: string;
  targetTitle: string;
  label?: string;
  edgeType?: EdgeType;
};

export type RouteTemplateReviewCriterion = {
  key: string;
  label: string;
  description: string;
  lowGuide?: string;
  highGuide?: string;
};

export type RouteTemplateHomeCard = {
  key: string;
  title: string;
  description: string;
};

export type RouteTemplate = {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  category: RouteTemplateCategory;
  recommendedFor: string[];
  outcome: string;
  tags: string[];
  seedStages: RouteTemplateSeedStage[];
  seedPrompts: RouteTemplateSeedPrompt[];
  seedResources?: RouteTemplateSeedResource[];
  seedFlowNodes?: RouteTemplateSeedFlowNode[];
  seedFlowEdges?: RouteTemplateSeedFlowEdge[];
  reviewCriteria?: RouteTemplateReviewCriterion[];
  homeCards?: RouteTemplateHomeCard[];
  starterQuestions?: string[];
  keywordHints?: string[];
};
