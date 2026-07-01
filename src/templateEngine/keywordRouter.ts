import { routeTemplates } from '../routePlugins/registry';
import type { RouteTemplate } from '../routePlugins/types';

export function recommendTemplatesByKeyword(input: string): RouteTemplate[] {
  const normalized = input.trim().toLocaleLowerCase();
  if (!normalized) return [];

  return routeTemplates
    .filter((template) => template.keywordHints?.some((hint) => normalized.includes(hint.toLocaleLowerCase())))
    .slice(0, 3);
}
