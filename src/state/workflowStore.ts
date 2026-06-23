import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react';
import { create } from 'zustand';
import { initialEdges, initialNodes } from '../data/initialWorkflow';
import { runWorkflowGraph } from '../engine/workflowRunner';
import type {
  AddNodeInput,
  ApiMethod,
  NodeConfig,
  NodeKind,
  NodeStatus,
  SavedWorkflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowStatus,
} from '../types/workflow';

const STORAGE_KEY = 'visual-api-workflow-builder';

type WorkflowState = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  workflowStatus: WorkflowStatus;
  lastMessage: string;
  hasUnsavedChanges: boolean;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (input: AddNodeInput) => void;
  selectNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, patch: Partial<NodeConfig>) => void;
  saveWorkflow: () => void;
  loadWorkflow: () => void;
  runWorkflow: () => Promise<void>;
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: 'api-1',
  workflowStatus: 'Idle',
  lastMessage: 'Idle',
  hasUnsavedChanges: false,

  onNodesChange: (changes) => {
    const hasCanvasChange = hasPersistedCanvasChange(changes);

    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      hasUnsavedChanges: state.hasUnsavedChanges || hasCanvasChange,
      lastMessage: hasCanvasChange ? 'Unsaved changes' : state.lastMessage,
    }));
  },

  onEdgesChange: (changes) => {
    const hasCanvasChange = hasPersistedCanvasChange(changes);

    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      hasUnsavedChanges: state.hasUnsavedChanges || hasCanvasChange,
      lastMessage: hasCanvasChange ? 'Unsaved changes' : state.lastMessage,
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        state.edges,
      ),
      hasUnsavedChanges: true,
      lastMessage: 'Unsaved changes',
    }));
  },

  addNode: ({ kind, position }) => {
    const id = `${kind}-${Date.now()}`;
    const node: WorkflowNode = {
      id,
      type: 'workflowNode',
      position,
      data: {
        kind,
        config: createDefaultConfig(kind),
        status: 'idle',
      },
    };

    set((state) => ({
      nodes: [...state.nodes, node],
      selectedNodeId: id,
      hasUnsavedChanges: true,
      lastMessage: 'Unsaved changes',
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  updateNodeConfig: (nodeId, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  ...patch,
                },
              },
            }
          : node,
      ),
      hasUnsavedChanges: true,
      lastMessage: 'Unsaved changes',
    }));
  },

  saveWorkflow: () => {
    const { nodes, edges } = get();

    try {
      const payload: SavedWorkflow = { nodes, edges };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      set({ lastMessage: 'Saved locally', hasUnsavedChanges: false });
    } catch {
      set({ lastMessage: 'Unable to save workflow', workflowStatus: 'Error' });
    }
  },

  loadWorkflow: () => {
    try {
      const rawWorkflow = window.localStorage.getItem(STORAGE_KEY);

      if (!rawWorkflow) {
        set({ lastMessage: 'No saved workflow found' });
        return;
      }

      const workflow = JSON.parse(rawWorkflow) as SavedWorkflow;

      if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
        throw new Error('Invalid saved workflow');
      }

      set({
        nodes: workflow.nodes,
        edges: workflow.edges,
        selectedNodeId: workflow.nodes[0]?.id ?? null,
        workflowStatus: 'Idle',
        lastMessage: 'Loaded saved workflow',
        hasUnsavedChanges: false,
      });
    } catch {
      set({ lastMessage: 'Saved workflow could not be loaded', workflowStatus: 'Error' });
    }
  },

  runWorkflow: async () => {
    const { nodes, edges, workflowStatus } = get();

    if (workflowStatus === 'Running') {
      return;
    }

    set({
      workflowStatus: 'Running',
      lastMessage: 'Running workflow',
      nodes: nodes.map(resetNodeRuntimeState),
    });

    try {
      await runWorkflowGraph(get().nodes, edges, {
        onNodeStart: (nodeId) => {
          set((state) => ({
            nodes: updateNodeRuntimeState(state.nodes, nodeId, 'running'),
          }));
        },
        onNodeSuccess: (nodeId, result) => {
          set((state) => ({
            nodes: updateNodeRuntimeState(state.nodes, nodeId, 'success', result),
          }));
        },
        onNodeError: (nodeId, message) => {
          set((state) => ({
            nodes: updateNodeRuntimeState(state.nodes, nodeId, 'error', undefined, message),
          }));
        },
      });

      set({ workflowStatus: 'Complete', lastMessage: 'Workflow complete' });
    } catch {
      set({ workflowStatus: 'Error', lastMessage: 'Workflow stopped on error' });
    }
  },
}));

function createDefaultConfig(kind: NodeKind): NodeConfig {
  switch (kind) {
    case 'api':
      return {
        label: 'API Request',
        method: 'GET' satisfies ApiMethod,
        url: 'https://api.example.com/data',
      };
    case 'transform':
      return {
        label: 'Transform',
        code: 'return data',
      };
    case 'condition':
      return {
        label: 'Condition',
        condition: 'data.ok === true',
      };
    case 'output':
      return {
        label: 'Output',
      };
    default:
      return assertNever(kind);
  }
}

function resetNodeRuntimeState(node: WorkflowNode): WorkflowNode {
  return {
    ...node,
    data: {
      ...node.data,
      status: 'idle',
      result: undefined,
      error: undefined,
    },
  };
}

function updateNodeRuntimeState(
  nodes: WorkflowNode[],
  nodeId: string,
  status: NodeStatus,
  result?: unknown,
  error?: string,
) {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          data: {
            ...node.data,
            status,
            result,
            error,
          },
        }
      : node,
  );
}

function hasPersistedCanvasChange(changes: Array<NodeChange<WorkflowNode> | EdgeChange<WorkflowEdge>>) {
  return changes.some((change) => change.type !== 'select');
}

function assertNever(value: never): never {
  throw new Error(`Unsupported node kind: ${value}`);
}

export function selectSelectedNode(state: WorkflowState) {
  return state.nodes.find((node) => node.id === state.selectedNodeId) ?? null;
}
