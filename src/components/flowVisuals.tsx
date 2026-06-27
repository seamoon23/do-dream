import { Check, Clipboard, GitBranch, Info, Network } from 'lucide-react';
import type { FlowEdge, FlowNodeType, StageStatus } from '../types/domain';

export const edgeTypeLabels: Record<FlowEdge['type'], string> = {
  NEXT: '다음',
  BRANCH: '분기',
  ROLLBACK: '되돌림',
  ALTERNATIVE: '대안',
  DEPENDENCY: '의존',
};

export const flowNodeStyles: Record<FlowNodeType, { bg: string; border: string; accent: string }> = {
  STAGE: { bg: '#ffffff', border: '#bfd3c1', accent: '#49694d' },
  PROMPT: { bg: '#f2f0ff', border: '#b9b1df', accent: '#5e558e' },
  ISSUE: { bg: '#fff4ed', border: '#e8b9a9', accent: '#b45641' },
  DECISION: { bg: '#eef4ef', border: '#9eb79f', accent: '#49694d' },
  BRANCH: { bg: '#fff8e8', border: '#e8c878', accent: '#9a6b12' },
  DONE: { bg: '#edf7f0', border: '#8cb593', accent: '#2f6b42' },
};

export const edgeStyles: Record<FlowEdge['type'], { stroke: string; dash?: string }> = {
  NEXT: { stroke: '#78906e' },
  BRANCH: { stroke: '#9a6b12', dash: '6 5' },
  ROLLBACK: { stroke: '#b45641', dash: '3 4' },
  ALTERNATIVE: { stroke: '#5e558e', dash: '8 4' },
  DEPENDENCY: { stroke: '#49694d', dash: '2 5' },
};

export function FlowTypeIcon(props: { type: FlowNodeType; size?: number }) {
  const size = props.size ?? 14;
  if (props.type === 'STAGE') return <Check size={size} />;
  if (props.type === 'PROMPT') return <Clipboard size={size} />;
  if (props.type === 'ISSUE') return <Info size={size} />;
  if (props.type === 'DECISION') return <GitBranch size={size} />;
  if (props.type === 'BRANCH') return <Network size={size} />;
  return <Check size={size} />;
}

export function statusBadgeClass(status?: StageStatus) {
  if (status === 'DONE') return 'bg-moss text-white';
  if (status === 'DOING') return 'bg-pollen/35 text-ink';
  if (status === 'BLOCKED') return 'bg-clay text-white';
  if (status === 'SKIPPED') return 'bg-ink/10 text-ink/55';
  return 'bg-cloud text-ink/60';
}
