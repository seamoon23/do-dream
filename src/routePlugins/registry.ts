import { novelFirstEpisodeTemplate } from './novelFirstEpisode';
import { plainRouteTemplate } from './plain';
import type { RouteTemplate } from './types';

export const routeTemplates: RouteTemplate[] = [plainRouteTemplate, novelFirstEpisodeTemplate];

export function getRouteTemplateById(id?: string): RouteTemplate | undefined {
  if (!id) return undefined;
  return routeTemplates.find((template) => template.id === id);
}

export function getEffectiveRouteTemplate(templateId?: string): RouteTemplate {
  return getRouteTemplateById(templateId) ?? plainRouteTemplate;
}
