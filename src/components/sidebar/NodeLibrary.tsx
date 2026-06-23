import { Braces, FileJson, GitBranch, Globe2 } from 'lucide-react';
import { nodeTemplates } from '../../data/nodeTemplates';
import { DRAG_NODE_MIME, type NodeKind } from '../../types/workflow';

const iconByKind: Record<NodeKind, typeof Globe2> = {
  api: Globe2,
  transform: Braces,
  condition: GitBranch,
  output: FileJson,
};

const librarySections: Array<{ title: string; kinds: NodeKind[] }> = [
  { title: 'Core Nodes', kinds: ['api', 'transform'] },
  { title: 'Logic', kinds: ['condition'] },
  { title: 'Output', kinds: ['output'] },
];

export function NodeLibrary() {
  return (
    <aside className="sidebar sidebar--left" aria-label="Node library">
      <div className="sidebar-header">
        <span className="eyebrow">Library</span>
        <h2>Components</h2>
      </div>

      <div className="node-library-list">
        {librarySections.map((section) => (
          <section className="library-section" key={section.title}>
            <h3>{section.title}</h3>
            <div className="library-section-items">
              {section.kinds.map((kind) => {
                const template = nodeTemplates.find((nodeTemplate) => nodeTemplate.kind === kind);

                if (!template) {
                  return null;
                }

                const Icon = iconByKind[template.kind];

                return (
                  <article
                    className={`library-card library-card--${template.kind}`}
                    draggable
                    key={template.kind}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DRAG_NODE_MIME, template.kind);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <div className="library-icon" aria-hidden="true">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4>{template.title}</h4>
                      <p>{template.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
