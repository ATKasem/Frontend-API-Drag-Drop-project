import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Check, CircleAlert, FileJson, GitBranch, Globe2, Loader2 } from 'lucide-react';
import type { NodeKind, WorkflowNode } from '../../types/workflow';

const iconByKind: Record<NodeKind, typeof Globe2> = {
  api: Globe2,
  transform: Braces,
  condition: GitBranch,
  output: FileJson,
};

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const Icon = iconByKind[data.kind];
  const hasInput = data.kind !== 'api';
  const hasOutput = data.kind !== 'output';

  return (
    <section className={`workflow-node workflow-node--${data.kind} workflow-node--${data.status} ${selected ? 'is-selected' : ''}`}>
      {hasInput ? <Handle className="node-handle node-handle--input" type="target" position={Position.Left} id="in" /> : null}

      <header className="workflow-node-header">
        <span className="workflow-node-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
        <div>
          <h3>{data.config.label}</h3>
          <p>{getNodeSubtitle(data.kind)}</p>
        </div>
        <NodeStatusIcon status={data.status} />
      </header>

      <div className="workflow-node-body">{renderNodePreview(data.kind, data)}</div>

      {data.error ? <div className="node-error">{data.error}</div> : null}

      {hasOutput && data.kind !== 'condition' ? (
        <Handle className="node-handle node-handle--output" type="source" position={Position.Right} id="out" />
      ) : null}

      {data.kind === 'condition' ? (
        <>
          <Handle
            className="node-handle node-handle--output node-handle--true"
            type="source"
            position={Position.Right}
            id="true"
          />
          <Handle
            className="node-handle node-handle--output node-handle--false"
            type="source"
            position={Position.Right}
            id="false"
          />
          <span className="branch-label branch-label--true">T</span>
          <span className="branch-label branch-label--false">F</span>
        </>
      ) : null}
    </section>
  );
}

function NodeStatusIcon({ status }: { status: WorkflowNode['data']['status'] }) {
  if (status === 'running') {
    return <Loader2 className="node-status-icon is-spinning" size={16} aria-label="Running" />;
  }

  if (status === 'success') {
    return <Check className="node-status-icon node-status-icon--success" size={16} aria-label="Success" />;
  }

  if (status === 'error') {
    return <CircleAlert className="node-status-icon node-status-icon--error" size={16} aria-label="Error" />;
  }

  return <span className="node-status-dot" aria-label="Idle" />;
}

function getNodeSubtitle(kind: NodeKind) {
  switch (kind) {
    case 'api':
      return 'request';
    case 'transform':
      return 'mapper';
    case 'condition':
      return 'branch';
    case 'output':
      return 'result';
    default:
      return assertNever(kind);
  }
}

function renderNodePreview(kind: NodeKind, data: WorkflowNode['data']) {
  switch (kind) {
    case 'api':
      return (
        <>
          <span>{data.config.method}</span>
          <strong>{data.config.url}</strong>
        </>
      );
    case 'transform':
      return <code>{data.config.code}</code>;
    case 'condition':
      return <code>{data.config.condition}</code>;
    case 'output':
      return <JsonPreview value={data.result} />;
    default:
      return assertNever(kind);
  }
}

function JsonPreview({ value }: { value: unknown }) {
  if (value === undefined) {
    return <span>Waiting for data</span>;
  }

  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported node kind: ${value}`);
}
