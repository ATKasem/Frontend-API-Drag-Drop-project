import { FolderOpen, Loader2, Play, Save } from 'lucide-react';
import { useWorkflowStore } from '../../state/workflowStore';

export function TopBar() {
  const workflowStatus = useWorkflowStore((state) => state.workflowStatus);
  const lastMessage = useWorkflowStore((state) => state.lastMessage);
  const hasUnsavedChanges = useWorkflowStore((state) => state.hasUnsavedChanges);
  const runWorkflow = useWorkflowStore((state) => state.runWorkflow);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow);
  const isRunning = workflowStatus === 'Running';
  const statusLabel = workflowStatus === 'Complete' ? 'Success' : workflowStatus;

  return (
    <header className="top-bar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          API
        </div>
        <div>
          <h1>API Workflow Studio</h1>
          <p>{lastMessage}</p>
        </div>
      </div>

      <div className={`status-pill status-pill--${workflowStatus.toLowerCase()}`} aria-live="polite">
        <span />
        {statusLabel}
      </div>

      <div className="top-actions">
        <div className={`save-indicator ${hasUnsavedChanges ? 'save-indicator--dirty' : ''}`} aria-live="polite">
          <span />
          {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
        </div>
        <button className="toolbar-button" type="button" onClick={saveWorkflow}>
          <Save size={16} aria-hidden="true" />
          Save
        </button>
        <button className="toolbar-button" type="button" onClick={loadWorkflow}>
          <FolderOpen size={16} aria-hidden="true" />
          Load
        </button>
        <button className="run-button" type="button" onClick={runWorkflow} disabled={isRunning}>
          {isRunning ? <Loader2 className="is-spinning" size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {isRunning ? 'Running' : 'Run Workflow'}
        </button>
      </div>
    </header>
  );
}
