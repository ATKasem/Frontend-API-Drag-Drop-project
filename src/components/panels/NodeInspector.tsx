import { Braces, FileJson, GitBranch, Globe2 } from 'lucide-react';
import { selectSelectedNode, useWorkflowStore } from '../../state/workflowStore';
import type { ApiMethod, NodeKind, WorkflowNode } from '../../types/workflow';

const iconByKind: Record<NodeKind, typeof Globe2> = {
  api: Globe2,
  transform: Braces,
  condition: GitBranch,
  output: FileJson,
};

export function NodeInspector() {
  const selectedNode = useWorkflowStore(selectSelectedNode);
  const hasUnsavedChanges = useWorkflowStore((state) => state.hasUnsavedChanges);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);

  return (
    <aside className="sidebar sidebar--right" aria-label="Node inspector">
      <div className="sidebar-header">
        <span className="eyebrow">Inspector</span>
        <h2>Settings</h2>
      </div>

      {!selectedNode ? (
        <div className="empty-panel">
          <h3>No node selected</h3>
          <p>Select a node on the canvas to edit its settings.</p>
        </div>
      ) : (
        <div className="inspector-content" key={selectedNode.id}>
          <InspectorHeader node={selectedNode} />

          <div className={`inspector-save-state ${hasUnsavedChanges ? 'inspector-save-state--dirty' : ''}`}>
            <span />
            {hasUnsavedChanges ? 'Unsaved changes' : 'Saved locally'}
          </div>

          <PanelSection title="General">
            <Field label="Node title">
              <input
                value={selectedNode.data.config.label}
                onChange={(event) => updateNodeConfig(selectedNode.id, { label: event.target.value })}
              />
            </Field>
          </PanelSection>

          {selectedNode.data.kind === 'api' ? <ApiSettings node={selectedNode} /> : null}
          {selectedNode.data.kind === 'transform' ? <TransformSettings node={selectedNode} /> : null}
          {selectedNode.data.kind === 'condition' ? <ConditionSettings node={selectedNode} /> : null}
          {selectedNode.data.kind === 'output' ? <OutputSettings node={selectedNode} /> : null}
        </div>
      )}
    </aside>
  );
}

function InspectorHeader({ node }: { node: WorkflowNode }) {
  const Icon = iconByKind[node.data.kind];

  return (
    <div className={`inspector-node-summary inspector-node-summary--${node.data.kind}`}>
      <div className="summary-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <h3>{node.data.config.label}</h3>
        <p>{node.data.status}</p>
      </div>
    </div>
  );
}

function ApiSettings({ node }: { node: WorkflowNode }) {
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);

  return (
    <>
      <PanelSection title="Request">
        <Field label="URL">
          <input
            value={node.data.config.url ?? ''}
            onChange={(event) => updateNodeConfig(node.id, { url: event.target.value })}
            placeholder="https://api.example.com/data"
            spellCheck={false}
          />
        </Field>

        <Field label="Method">
          <select
            value={node.data.config.method ?? 'GET'}
            onChange={(event) => updateNodeConfig(node.id, { method: event.target.value as ApiMethod })}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </Field>
      </PanelSection>

      <RuntimePreview node={node} />
    </>
  );
}

function TransformSettings({ node }: { node: WorkflowNode }) {
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);

  return (
    <>
      <PanelSection title="Transform">
        <Field label="Transform code">
          <textarea
            className="code-input"
            value={node.data.config.code ?? ''}
            onChange={(event) => updateNodeConfig(node.id, { code: event.target.value })}
            spellCheck={false}
            rows={8}
          />
        </Field>
      </PanelSection>

      <RuntimePreview node={node} />
    </>
  );
}

function ConditionSettings({ node }: { node: WorkflowNode }) {
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);

  return (
    <>
      <PanelSection title="Branch Rule">
        <Field label="Condition">
          <input
            value={node.data.config.condition ?? ''}
            onChange={(event) => updateNodeConfig(node.id, { condition: event.target.value })}
            placeholder="data.ok === true"
            spellCheck={false}
          />
        </Field>
      </PanelSection>

      <RuntimePreview node={node} />
    </>
  );
}

function OutputSettings({ node }: { node: WorkflowNode }) {
  return <RuntimePreview node={node} />;
}

function RuntimePreview({ node }: { node: WorkflowNode }) {
  return (
    <section className="runtime-panel">
      <div>
        <span className="eyebrow">Runtime</span>
        <h3>{node.data.status}</h3>
      </div>
      {node.data.error ? <p className="runtime-error">{node.data.error}</p> : null}
      {node.data.result !== undefined ? <pre>{JSON.stringify(node.data.result, null, 2)}</pre> : <p>No result yet</p>}
    </section>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-section">
      <h3>{title}</h3>
      <div className="settings-card">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
