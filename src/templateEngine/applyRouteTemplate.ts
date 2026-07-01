import { db } from '../db/database';
import { getRouteTemplateById } from '../routePlugins/registry';
import type { Idea } from '../types/domain';
import { createRouteTemplateSeedData } from './createSeedData';

export type ApplyRouteTemplateOptions = {
  ideaId: Idea['id'];
  templateId: string;
};

export type ApplyRouteTemplateResult = {
  templateId: string;
  addedStages: number;
  addedResources: number;
  addedPrompts: number;
  addedFlowNodes: number;
  addedFlowEdges: number;
};

export async function applyRouteTemplate(options: ApplyRouteTemplateOptions): Promise<ApplyRouteTemplateResult> {
  const template = getRouteTemplateById(options.templateId);
  if (!template) {
    throw new Error('알 수 없는 루트 템플릿입니다.');
  }

  const timestamp = new Date().toISOString();
  const existing = await Promise.all([
    db.stages.where('ideaId').equals(options.ideaId).toArray(),
    db.resources.where('ideaId').equals(options.ideaId).toArray(),
    db.promptTemplates.where('ideaId').equals(options.ideaId).toArray(),
    db.flowNodes.where('ideaId').equals(options.ideaId).toArray(),
    db.flowEdges.where('ideaId').equals(options.ideaId).toArray(),
  ]);

  const seed = createRouteTemplateSeedData({
    ideaId: options.ideaId,
    template,
    timestamp,
    existing: {
      stages: existing[0],
      resources: existing[1],
      prompts: existing[2],
      flowNodes: existing[3],
      flowEdges: existing[4],
    },
  });

  await db.transaction('rw', [db.ideas, db.stages, db.resources, db.promptTemplates, db.flowNodes, db.flowEdges], async () => {
    await db.ideas.update(options.ideaId, {
      templateId: template.id,
      templateAppliedAt: timestamp,
      updatedAt: timestamp,
    });

    if (seed.stages.length > 0) await db.stages.bulkAdd(seed.stages);
    if (seed.resources.length > 0) await db.resources.bulkAdd(seed.resources);
    if (seed.prompts.length > 0) await db.promptTemplates.bulkAdd(seed.prompts);
    if (seed.flowNodes.length > 0) await db.flowNodes.bulkAdd(seed.flowNodes);
    if (seed.flowEdges.length > 0) await db.flowEdges.bulkAdd(seed.flowEdges);
  });

  return {
    templateId: template.id,
    addedStages: seed.stages.length,
    addedResources: seed.resources.length,
    addedPrompts: seed.prompts.length,
    addedFlowNodes: seed.flowNodes.length,
    addedFlowEdges: seed.flowEdges.length,
  };
}
