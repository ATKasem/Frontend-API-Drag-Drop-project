import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useCallback } from 'react';
import { useWorkflowStore } from '../../state/workflowStore';
import { DRAG_NODE_MIME, type NodeKind } from '../../types/workflow';
import { WorkflowNodeCard } from '../nodes/WorkflowNodeCard';

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeCard,
};

export function WorkflowCanvas() {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const addNode = useWorkflowStore((state) => state.addNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const kind = event.dataTransfer.getData(DRAG_NODE_MIME) as NodeKind;
      if (!kind) {
        return;
      }

      addNode({
        kind,
        position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      });
    },
    [addNode, screenToFlowPosition],
  );

  return (
    <div
      className="flow-shell"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'default', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(137, 154, 178, 0.22)" gap={26} size={0.9} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          className="workflow-minimap"
          pannable
          zoomable
          nodeColor={(node) => {
            const kind = node.data?.kind;
            if (kind === 'api') return '#5eead4';
            if (kind === 'transform') return '#a7f3d0';
            if (kind === 'condition') return '#fbbf24';
            return '#93c5fd';
          }}
        />
      </ReactFlow>
    </div>
  );
}
