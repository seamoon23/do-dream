export type AgentPluginCategory =
  | 'ideation'
  | 'planning'
  | 'editing'
  | 'proofreading'
  | 'reader-feedback'
  | 'market-review'
  | 'risk-review'
  | 'next-action'
  | 'custom';

export type AgentPromptPreset = {
  id: string;
  title: string;
  description: string;
  body: string;
  variables?: string[];
};

export type AgentPlugin = {
  id: string;
  name: string;
  roleName: string;
  description: string;
  category: AgentPluginCategory;
  supportedTemplateIds?: string[];
  tags: string[];
  promptPresets: AgentPromptPreset[];
};
