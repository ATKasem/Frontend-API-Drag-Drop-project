import { NodeLibrary } from '../sidebar/NodeLibrary';
import { WorkflowCanvas } from '../canvas/WorkflowCanvas';
import { NodeInspector } from '../panels/NodeInspector';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace-shell">
        <NodeLibrary />
        <main className="canvas-region" aria-label="Workflow canvas">
          <WorkflowCanvas />
        </main>
        <NodeInspector />
      </div>
    </div>
  );
}
