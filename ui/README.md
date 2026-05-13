# @brui/ui

React sidebar component for chat-based interaction with a brui-powered application.

## Install

```bash
npm install @brui/ui
```

## Usage

```tsx
import { Sidebar } from '@brui/ui';
import { Configuration, FunctionRegistry } from 'brui-client';

const config: Configuration = { /* your config */ };
const functions: FunctionRegistry = { /* your function registry */ };

function App() {
  return (
    <Sidebar
      config={config}
      functions={functions}
      context={{ key: 'value' }}   // optional extra context
      includePageContext            // optional: send visible page text to the model
    />
  );
}
```

See the root [README](../README.md) for full integration details.