import type { FlowEdge, FlowNode, Idea, PromptTemplate, Resource, Stage } from '../types/domain';
import { createId } from '../lib/format';
import type { RouteTemplate } from '../routePlugins/types';

export type ExistingTemplateData = {
  stages: Stage[];
  resources: Resource[];
  prompts: PromptTemplate[];
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
};

export type RouteTemplateSeedData = {
  stages: Stage[];
  resources: Resource[];
  prompts: PromptTemplate[];
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function clampDifficulty(value?: number): Stage['difficulty'] {
  const numberValue = Number(value ?? 3);
  return Math.min(5, Math.max(1, numberValue)) as Stage['difficulty'];
}

export function createRouteTemplateSeedData(params: {
  ideaId: Idea['id'];
  template: RouteTemplate;
  existing: ExistingTemplateData;
  timestamp: string;
}): RouteTemplateSeedData {
  const { ideaId, template, existing, timestamp } = params;
  const stages: Stage[] = [];
  const resources: Resource[] = [];
  const prompts: PromptTemplate[] = [];
  const flowNodes: FlowNode[] = [];
  const flowEdges: FlowEdge[] = [];

  const existingStageTitles = new Set(existing.stages.map((stage) => normalized(stage.title)));
  const stageIdsByTitle = new Map(existing.stages.map((stage) => [normalized(stage.title), stage.id]));

  for (const seedStage of template.seedStages) {
    const key = normalized(seedStage.title);
    if (existingStageTitles.has(key)) continue;

    const stage: Stage = {
      id: createId('stage'),
      ideaId,
      sourceTemplateId: template.id,
      order: seedStage.order,
      title: seedStage.title,
      goal: seedStage.goal,
      inputRequired: seedStage.requiredInputs ?? '',
      outputExpected: seedStage.expectedOutput ?? '',
      doneCriteria: seedStage.doneCriteria,
      difficulty: clampDifficulty(seedStage.difficulty),
      status: seedStage.status ?? 'TODO',
      resourceIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    stages.push(stage);
    existingStageTitles.add(key);
    stageIdsByTitle.set(key, stage.id);
  }

  const existingResourceTitles = new Set(existing.resources.map((resource) => normalized(resource.title)));
  for (const seedResource of template.seedResources ?? []) {
    const key = normalized(seedResource.title);
    if (existingResourceTitles.has(key)) continue;

    resources.push({
      id: createId('resource'),
      ideaId,
      sourceTemplateId: template.id,
      type: seedResource.type,
      title: seedResource.title,
      contentText: seedResource.contentText,
      summary: seedResource.summary ?? '',
      tags: seedResource.tags ?? [`template:${template.id}`],
      importance: seedResource.importance ?? 3,
      reviewStatus: seedResource.reviewStatus ?? 'UNREVIEWED',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    existingResourceTitles.add(key);
  }

  const existingPromptTitles = new Set(existing.prompts.map((prompt) => normalized(prompt.title)));
  for (const seedPrompt of template.seedPrompts) {
    const key = normalized(seedPrompt.title);
    if (existingPromptTitles.has(key)) continue;

    prompts.push({
      id: createId('prompt'),
      ideaId,
      stageId: seedPrompt.stageTitle ? stageIdsByTitle.get(normalized(seedPrompt.stageTitle)) : undefined,
      sourceTemplateId: template.id,
      tool: seedPrompt.tool ?? 'GENERAL',
      title: seedPrompt.title,
      body: seedPrompt.body,
      variables: seedPrompt.variables ?? [],
      version: seedPrompt.version ?? 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    existingPromptTitles.add(key);
  }

  const existingFlowNodeTitles = new Set(existing.flowNodes.map((node) => normalized(node.title)));
  const flowNodeIdsByTitle = new Map(existing.flowNodes.map((node) => [normalized(node.title), node.id]));

  (template.seedFlowNodes ?? []).forEach((seedNode, index) => {
    const key = normalized(seedNode.title);
    if (existingFlowNodeTitles.has(key)) return;

    const node: FlowNode = {
      id: createId('node'),
      ideaId,
      sourceTemplateId: template.id,
      type: seedNode.nodeType ?? 'STAGE',
      title: seedNode.title,
      description: seedNode.memo,
      status: seedNode.status,
      refStageId: seedNode.stageTitle ? stageIdsByTitle.get(normalized(seedNode.stageTitle)) : undefined,
      position: { x: 90 + (index % 5) * 230, y: 120 + Math.floor(index / 5) * 150 },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    flowNodes.push(node);
    existingFlowNodeTitles.add(key);
    flowNodeIdsByTitle.set(key, node.id);
  });

  const existingEdgeKeys = new Set(
    existing.flowEdges.map((edge) => `${edge.source}:${edge.target}:${edge.type}:${edge.label ?? ''}`),
  );

  for (const seedEdge of template.seedFlowEdges ?? []) {
    const source = flowNodeIdsByTitle.get(normalized(seedEdge.sourceTitle));
    const target = flowNodeIdsByTitle.get(normalized(seedEdge.targetTitle));
    if (!source || !target) continue;

    const type = seedEdge.edgeType ?? 'NEXT';
    const key = `${source}:${target}:${type}:${seedEdge.label ?? ''}`;
    if (existingEdgeKeys.has(key)) continue;

    flowEdges.push({
      id: createId('edge'),
      ideaId,
      sourceTemplateId: template.id,
      source,
      target,
      label: seedEdge.label,
      type,
      createdAt: timestamp,
    });
    existingEdgeKeys.add(key);
  }

  return { stages, resources, prompts, flowNodes, flowEdges };
}
