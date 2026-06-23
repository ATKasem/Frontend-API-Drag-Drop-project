# Portfolio Summary

## Short Pitch

Visual API Workflow Builder is a polished React + TypeScript app for composing API workflows on a drag-and-drop canvas. It shows frontend product sense, typed state management, custom React Flow nodes, and a tested workflow execution engine.

## Resume Bullet Options

- Built a visual API workflow builder in React + TypeScript using React Flow and Zustand, featuring draggable custom nodes, live inspector editing, local workflow persistence, and simulated execution states.
- Designed and implemented a Figma-style workflow canvas with custom node cards, directional connectors, grouped node library, and a polished dark SaaS interface.
- Added Vitest coverage for workflow traversal, conditional branching, unsupported transform errors, and cycle detection in a browser-independent execution engine.

## Interview Talking Points

- I separated canvas rendering, node settings, workflow state, and execution logic so each part can change independently.
- I constrained transform execution instead of using `eval`, which keeps the browser demo safer and gives a clear path to server-side sandboxing later.
- I used React Flow for the graph primitives rather than hand-rolling drag, zoom, pan, and edge behavior.
- I added tests around the workflow engine because traversal and branching rules are more important than snapshotting the UI.

## Suggested Project Description

A high-end developer tool prototype for building API workflows visually. Users can drag API, transform, condition, and output nodes onto a canvas, connect them, edit node settings, save the workflow locally, and run a simulated execution pipeline with per-node status feedback.
