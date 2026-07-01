import { novelEditorAgent } from './novel/editorAgent';
import { novelIdeaMeetingAgent } from './novel/ideaMeetingAgent';
import { novelProofreaderAgent } from './novel/proofreaderAgent';
import { novelReaderFeedbackAgent } from './novel/readerFeedbackAgent';
import type { AgentPlugin } from './types';

export const agentPlugins: AgentPlugin[] = [
  novelIdeaMeetingAgent,
  novelEditorAgent,
  novelProofreaderAgent,
  novelReaderFeedbackAgent,
];

export function getAgentsForTemplate(templateId?: string): AgentPlugin[] {
  if (!templateId) return agentPlugins;

  return agentPlugins.filter((agent) => {
    if (!agent.supportedTemplateIds || agent.supportedTemplateIds.length === 0) {
      return true;
    }

    return agent.supportedTemplateIds.includes(templateId);
  });
}
