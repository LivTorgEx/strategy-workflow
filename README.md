# @livtorgex/strategy-workflow

Shared workflow graph view for LivTorgEx applications. The component renders
workflow topology and current-node progress without exposing workflow schemas,
execution code, or node configuration.

```tsx
import { WorkflowGraphView, type WorkflowGraph } from "@livtorgex/strategy-workflow";

const graph: WorkflowGraph = {
  nodes: [{ node_key: "entry", name: "Entry" }],
  edges: [],
};

<WorkflowGraphView graph={graph} currentNodeKeys={new Set(["entry"])} />;
```

Import the package stylesheet in the application's global stylesheet:

```css
@import "@livtorgex/strategy-workflow/style.css";
```

The package uses `@livtorgex/ui-kit` for labels and status badges and React Flow
for graph interaction, viewport controls, and automatic fitting.

## Development

- `pnpm lint` runs ESLint with Prettier formatting rules.
- `pnpm format` formats the package files.
- `pnpm format:check` checks formatting.
- `pnpm type-check` checks TypeScript types.

Husky runs lint, formatting, and type checks before each commit.
