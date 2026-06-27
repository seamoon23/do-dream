import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { Network, RefreshCcw, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { flowTypeLabels, type GuideKey, stageStatusLabels } from '../lib/content';
import type { FlowEdge, FlowNode, FlowNodeType, StageStatus } from '../types/domain';
import { edgeTypeLabels, statusBadgeClass } from './flowVisuals';
import { AppButton, classNames, EmptyState, Field, inputClass, SectionIntro } from './ui';

type FlowFilter = 'ALL' | 'BLOCKED' | 'DOING' | 'ISSUE';

export function FlowPanelView(props: {
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
  selectedFlowNode?: FlowNode;
  selectedFlowEdge?: FlowEdge;
  reactFlowNodes: Node[];
  reactFlowEdges: Edge[];
  onConnect: (connection: Connection) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeSelect: (nodeId?: string) => void;
  onEdgeSelect: (edgeId?: string) => void;
  clearFlowSelection: () => void;
  updateFlowNode: (nodeId: string, changes: Partial<FlowNode>) => void;
  updateFlowEdge: (edgeId: string, changes: Partial<FlowEdge>) => void;
  deleteFlowNode: (nodeId: string) => void;
  deleteFlowEdge: (edgeId: string) => void;
  syncStagesToFlow: () => void;
  addFlowNode: (type: FlowNodeType) => void;
  onGuide: (key: GuideKey) => void;
}) {
  const {
    flowNodes,
    flowEdges,
    selectedFlowNode,
    selectedFlowEdge,
    reactFlowNodes,
    reactFlowEdges,
    onConnect,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    onEdgeSelect,
    clearFlowSelection,
    updateFlowNode,
    updateFlowEdge,
    deleteFlowNode,
    deleteFlowEdge,
    syncStagesToFlow,
    addFlowNode,
    onGuide,
  } = props;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FlowFilter>('ALL');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredFlowNodes = flowNodes.filter((node) => {
    const queryMatch =
      !normalizedQuery ||
      [node.title, node.description ?? '', flowTypeLabels[node.type], node.status ? stageStatusLabels[node.status] : '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const filterMatch =
      filter === 'ALL' ||
      (filter === 'BLOCKED' && node.status === 'BLOCKED') ||
      (filter === 'DOING' && node.status === 'DOING') ||
      (filter === 'ISSUE' && (node.type === 'ISSUE' || node.type === 'DECISION' || node.type === 'BRANCH'));
    return queryMatch && filterMatch;
  });
  const filteredNodeIds = new Set(filteredFlowNodes.map((node) => node.id));
  const filteredReactFlowNodes = reactFlowNodes.filter((node) => filteredNodeIds.has(node.id));
  const filteredReactFlowEdges = reactFlowEdges.filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target));
  const blockedCount = flowNodes.filter((node) => node.status === 'BLOCKED').length;
  const issueCount = flowNodes.filter((node) => node.type === 'ISSUE' || node.type === 'DECISION' || node.type === 'BRANCH').length;

  return (
    <div className="grid gap-4">
      <SectionIntro guideKey="flow" onGuide={onGuide} />
      <div className="rounded-3xl border border-ink/10 bg-white/82 p-3">
        <div className="grid gap-3 px-2 py-2">
          <div>
            <p className="text-sm font-black text-moss">지금 어디서 막혔나요?</p>
            <p className="mt-1 text-sm text-ink/58">카드를 누르면 오른쪽에서 고치고, 카드를 끌어 흐름을 정리할 수 있어요.</p>
          </div>
          <div className="grid gap-2 rounded-[1.25rem] bg-cloud/60 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <AppButton className="whitespace-nowrap" variant="primary" onClick={syncStagesToFlow}>
                <RefreshCcw size={16} /> 단계 목록 반영
              </AppButton>
              <span className="rounded-full bg-white px-3 py-2 text-sm font-black text-moss shadow-soft">카드 추가</span>
              <AppButton className="whitespace-nowrap" onClick={() => addFlowNode('ISSUE')}>막힌 점</AppButton>
              <AppButton className="whitespace-nowrap" onClick={() => addFlowNode('DECISION')}>결정 필요</AppButton>
              <AppButton className="whitespace-nowrap" onClick={() => addFlowNode('BRANCH')}>대안 흐름</AppButton>
            </div>
            <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2">
                <Search size={16} className="text-moss" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-ink/35"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="카드 제목, 메모, 상태 검색"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  ['ALL', `전체 ${flowNodes.length}`],
                  ['DOING', '진행 중'],
                  ['BLOCKED', `막힘 ${blockedCount}`],
                  ['ISSUE', `이슈 ${issueCount}`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value as FlowFilter)}
                    className={classNames(
                      'rounded-full border px-3 py-2 text-sm font-bold transition',
                      filter === value ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink/65 hover:border-moss',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="px-1 text-xs font-semibold text-ink/52">
              현재 보기: 카드 {filteredFlowNodes.length}개 / 연결 {filteredReactFlowEdges.length}개
            </p>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[520px] overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white md:h-[680px]">
            {flowNodes.length === 0 ? (
              <EmptyState
                icon={<Network size={20} />}
                title="아직 흐름 카드가 없습니다"
                body="단계 목록을 반영하면 실행 단계가 카드로 생기고, 막힌 점이나 결정이 필요한 부분을 추가할 수 있습니다."
                action={<AppButton onClick={syncStagesToFlow}>단계 목록 반영</AppButton>}
              />
            ) : filteredFlowNodes.length === 0 ? (
              <EmptyState icon={<Search size={20} />} title="조건에 맞는 카드가 없습니다" body="검색어나 필터를 줄이면 다시 전체 흐름을 볼 수 있습니다." />
            ) : (
              <ReactFlow
                nodes={filteredReactFlowNodes}
                edges={filteredReactFlowEdges}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_, node) => onNodeSelect(node.id)}
                onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
                onPaneClick={clearFlowSelection}
                fitView
                deleteKeyCode={null}
              >
                <Background color="#d6ded2" gap={18} />
                <MiniMap pannable zoomable />
                <Controls />
              </ReactFlow>
            )}
          </div>
          <FlowInspector
            selectedFlowNode={selectedFlowNode}
            selectedFlowEdge={selectedFlowEdge}
            flowEdges={flowEdges}
            updateFlowNode={updateFlowNode}
            updateFlowEdge={updateFlowEdge}
            deleteFlowNode={deleteFlowNode}
            deleteFlowEdge={deleteFlowEdge}
          />
        </div>
      </div>
    </div>
  );
}

function FlowInspector(props: {
  selectedFlowNode?: FlowNode;
  selectedFlowEdge?: FlowEdge;
  flowEdges: FlowEdge[];
  updateFlowNode: (nodeId: string, changes: Partial<FlowNode>) => void;
  updateFlowEdge: (edgeId: string, changes: Partial<FlowEdge>) => void;
  deleteFlowNode: (nodeId: string) => void;
  deleteFlowEdge: (edgeId: string) => void;
}) {
  const { selectedFlowNode, selectedFlowEdge, flowEdges, updateFlowNode, updateFlowEdge, deleteFlowNode, deleteFlowEdge } = props;
  const [nodeDraft, setNodeDraft] = useState({
    type: 'ISSUE' as FlowNodeType,
    title: '',
    status: '' as StageStatus | '',
    description: '',
  });
  const [edgeDraft, setEdgeDraft] = useState({
    type: 'NEXT' as FlowEdge['type'],
    label: '',
  });

  useEffect(() => {
    if (!selectedFlowNode) return;
    setNodeDraft({
      type: selectedFlowNode.type,
      title: selectedFlowNode.title,
      status: selectedFlowNode.status ?? '',
      description: selectedFlowNode.description ?? '',
    });
  }, [selectedFlowNode?.id, selectedFlowNode?.type, selectedFlowNode?.title, selectedFlowNode?.status, selectedFlowNode?.description]);

  useEffect(() => {
    if (!selectedFlowEdge) return;
    setEdgeDraft({
      type: selectedFlowEdge.type,
      label: selectedFlowEdge.label ?? '',
    });
  }, [selectedFlowEdge?.id, selectedFlowEdge?.type, selectedFlowEdge?.label]);

  function saveNodeDraft() {
    if (!selectedFlowNode) return;
    updateFlowNode(selectedFlowNode.id, {
      type: nodeDraft.type,
      title: nodeDraft.title.trim() || `${flowTypeLabels[nodeDraft.type]} 노드`,
      status: nodeDraft.status || undefined,
      description: nodeDraft.description,
    });
  }

  function saveEdgeDraft() {
    if (!selectedFlowEdge) return;
    updateFlowEdge(selectedFlowEdge.id, {
      type: edgeDraft.type,
      label: edgeDraft.label.trim() || undefined,
    });
  }

  if (selectedFlowNode) {
    const connectedCount = flowEdges.filter((edge) => edge.source === selectedFlowNode.id || edge.target === selectedFlowNode.id).length;

    return (
      <aside className="rounded-[1.75rem] border border-ink/10 bg-[linear-gradient(180deg,#fffaf0_0%,#eef4ef_100%)] p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-moss">선택한 카드 고치기</p>
            <p className="mt-1 text-xs font-semibold text-ink/55">제목, 상태, 메모만 먼저 적어도 흐름 구분이 쉬워집니다.</p>
          </div>
          <span className={classNames('rounded-full px-3 py-1 text-xs font-black', statusBadgeClass(nodeDraft.status || undefined))}>
            {nodeDraft.status ? stageStatusLabels[nodeDraft.status] : '상태 없음'}
          </span>
        </div>
        <div className="grid gap-3">
          <Field label="제목" hint="예: 결제 정책 보류, 자료 부족, A안/B안 분기">
            <input
              className={inputClass()}
              value={nodeDraft.title}
              onChange={(event) => setNodeDraft((draft) => ({ ...draft, title: event.target.value }))}
              onBlur={saveNodeDraft}
            />
          </Field>
          <div>
            <p className="mb-2 text-sm font-bold text-ink">지금 상태</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stageStatusLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setNodeDraft((draft) => ({ ...draft, status: value as StageStatus }));
                    updateFlowNode(selectedFlowNode.id, { status: value as StageStatus });
                  }}
                  className={classNames(
                    'rounded-full border px-3 py-2 text-sm font-bold transition',
                    nodeDraft.status === value ? 'border-moss bg-moss text-white' : 'border-ink/10 bg-white/80 text-ink/65 hover:bg-cloud',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="메모" hint="무슨 이슈인지, 어떤 선택지인지, 왜 분기됐는지 적어주세요.">
            <textarea
              className={inputClass('min-h-32')}
              value={nodeDraft.description}
              onChange={(event) => setNodeDraft((draft) => ({ ...draft, description: event.target.value }))}
              onBlur={saveNodeDraft}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <AppButton variant="primary" onClick={saveNodeDraft}>
            <Save size={16} /> 수정 내용 저장
          </AppButton>
        </div>
        <details className="mt-4 rounded-2xl bg-white/65 p-3">
          <summary className="cursor-pointer text-sm font-black text-moss">자세히</summary>
          <div className="mt-3 grid gap-3">
            <Field label="카드 유형">
              <select
                className={inputClass()}
                value={nodeDraft.type}
                onChange={(event) => setNodeDraft((draft) => ({ ...draft, type: event.target.value as FlowNodeType }))}
                onBlur={saveNodeDraft}
              >
                {Object.entries(flowTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs leading-5 text-ink/58">
              연결 {connectedCount}개. {selectedFlowNode.refStageId ? '단계에서 만들어진 카드지만, 여기서 별도 제목과 메모를 적어도 단계 동기화가 기존 편집 내용을 덮어쓰지 않습니다.' : '추가 카드로 이슈, 결정, 대안 흐름을 표시하는 데 쓰면 좋습니다.'}
            </p>
            <AppButton variant="danger" className="w-fit" onClick={() => deleteFlowNode(selectedFlowNode.id)}>
              <Trash2 size={16} /> 카드 삭제
            </AppButton>
          </div>
        </details>
      </aside>
    );
  }

  if (selectedFlowEdge) {
    return (
      <aside className="rounded-[1.75rem] border border-ink/10 bg-cloud/75 p-4">
        <div className="mb-4 flex flex-col gap-2">
          <div>
            <p className="text-sm font-black text-moss">선택한 연결 고치기</p>
            <p className="mt-1 text-xs font-semibold text-ink/55">어떤 조건으로 이어지는지 짧게 적어주세요.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Field label="라벨" hint="예: 자료 충분하면, 리스크 발생 시, A안을 선택">
            <input
              className={inputClass()}
              value={edgeDraft.label}
              onChange={(event) => setEdgeDraft((draft) => ({ ...draft, label: event.target.value }))}
              onBlur={saveEdgeDraft}
              placeholder={edgeTypeLabels[edgeDraft.type]}
            />
          </Field>
          <Field label="연결 유형">
            <select
              className={inputClass()}
              value={edgeDraft.type}
              onChange={(event) => setEdgeDraft((draft) => ({ ...draft, type: event.target.value as FlowEdge['type'] }))}
              onBlur={saveEdgeDraft}
            >
              {Object.entries(edgeTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <AppButton variant="primary" onClick={saveEdgeDraft}>
            <Save size={16} /> 수정 내용 저장
          </AppButton>
        </div>
        <details className="mt-4 rounded-2xl bg-white/65 p-3">
          <summary className="cursor-pointer text-sm font-black text-moss">관리</summary>
          <AppButton variant="danger" className="mt-3 w-fit" onClick={() => deleteFlowEdge(selectedFlowEdge.id)}>
            <Trash2 size={16} /> 연결 삭제
          </AppButton>
        </details>
      </aside>
    );
  }

  return (
    <aside className="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/70 p-5 text-sm leading-6 text-ink/62">
      <p className="font-black text-ink">카드를 선택해보세요</p>
      <p className="mt-2">카드나 연결선을 클릭하면 여기에서 제목, 상태, 메모, 연결 조건을 빠르게 고칠 수 있습니다.</p>
    </aside>
  );
}
