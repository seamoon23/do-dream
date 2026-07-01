import Dexie, { type Table } from 'dexie';
import type {
  BackupPayload,
  AiReport,
  FlowEdge,
  FlowNode,
  Idea,
  PromptTemplate,
  Resource,
  ReviewScore,
  Stage,
} from '../types/domain';

export class IdeaRouteDb extends Dexie {
  ideas!: Table<Idea, string>;
  resources!: Table<Resource, string>;
  reviewScores!: Table<ReviewScore, string>;
  stages!: Table<Stage, string>;
  flowNodes!: Table<FlowNode, string>;
  flowEdges!: Table<FlowEdge, string>;
  promptTemplates!: Table<PromptTemplate, string>;
  aiReports!: Table<AiReport, string>;

  constructor() {
    super('IdeaRouteBuilderDb');

    this.version(1).stores({
      ideas: 'id, status, priority, updatedAt, *tags',
      resources: 'id, ideaId, type, reviewStatus, linkedStageId, updatedAt, *tags',
      reviewScores: 'id, ideaId, verdict, updatedAt',
      stages: 'id, ideaId, order, status, promptTemplateId',
      flowNodes: 'id, ideaId, type, refStageId, refPromptId',
      flowEdges: 'id, ideaId, source, target, type',
      promptTemplates: 'id, ideaId, stageId, tool, updatedAt',
    });

    this.version(2).stores({
      ideas: 'id, status, priority, updatedAt, *tags',
      resources: 'id, ideaId, type, reviewStatus, linkedStageId, updatedAt, *tags',
      reviewScores: 'id, ideaId, verdict, updatedAt',
      stages: 'id, ideaId, order, status, promptTemplateId',
      flowNodes: 'id, ideaId, type, refStageId, refPromptId',
      flowEdges: 'id, ideaId, source, target, type',
      promptTemplates: 'id, ideaId, stageId, tool, updatedAt',
      aiReports: 'id, ideaId, sourceTool, updatedAt',
    });
  }
}

export const db = new IdeaRouteDb();

export async function exportBackup(): Promise<BackupPayload> {
  return {
    app: 'IdeaRouteBuilder',
    version: 3,
    exportedAt: new Date().toISOString(),
    data: {
      ideas: await db.ideas.toArray(),
      resources: await db.resources.toArray(),
      reviewScores: await db.reviewScores.toArray(),
      stages: await db.stages.toArray(),
      flowNodes: await db.flowNodes.toArray(),
      flowEdges: await db.flowEdges.toArray(),
      promptTemplates: await db.promptTemplates.toArray(),
      aiReports: await db.aiReports.toArray(),
    },
  };
}

export function assertBackupPayload(value: unknown): asserts value is BackupPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('백업 파일이 JSON 객체가 아닙니다.');
  }

  const payload = value as BackupPayload;
  if (payload.app !== 'IdeaRouteBuilder' || ![1, 2, 3].includes(payload.version) || !payload.data) {
    throw new Error('Idea Route Builder 백업 파일 형식이 아닙니다.');
  }

  const requiredTables: Array<keyof BackupPayload['data']> = [
    'ideas',
    'resources',
    'reviewScores',
    'stages',
    'flowNodes',
    'flowEdges',
    'promptTemplates',
  ];

  for (const table of requiredTables) {
    if (!Array.isArray(payload.data[table])) {
      throw new Error(`${table} 테이블이 올바르지 않습니다.`);
    }
  }

  if (payload.data.aiReports !== undefined && !Array.isArray(payload.data.aiReports)) {
    throw new Error('aiReports 테이블이 올바르지 않습니다.');
  }
}

export async function importBackup(payload: BackupPayload, mode: 'replace' | 'merge') {
  await db.transaction(
    'rw',
    [db.ideas, db.resources, db.reviewScores, db.stages, db.flowNodes, db.flowEdges, db.promptTemplates, db.aiReports],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.ideas.clear(),
          db.resources.clear(),
          db.reviewScores.clear(),
          db.stages.clear(),
          db.flowNodes.clear(),
          db.flowEdges.clear(),
          db.promptTemplates.clear(),
          db.aiReports.clear(),
        ]);
      }

      await Promise.all([
        db.ideas.bulkPut(payload.data.ideas),
        db.resources.bulkPut(payload.data.resources),
        db.reviewScores.bulkPut(payload.data.reviewScores),
        db.stages.bulkPut(payload.data.stages),
        db.flowNodes.bulkPut(payload.data.flowNodes),
        db.flowEdges.bulkPut(payload.data.flowEdges),
        db.promptTemplates.bulkPut(payload.data.promptTemplates),
        db.aiReports.bulkPut(payload.data.aiReports ?? []),
      ]);
    },
  );
}
