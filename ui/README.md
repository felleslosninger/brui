# @brui/ui

React sidebar component for chat-based interaction with a brui-powered application.

## Install

```bash
npm install @brui/ui
```

## Usage

```tsx
import { Sidebar } from '@brui/ui';
import { Setup } from 'brui-client';
import { createConfig } from './config';

const config = createConfig();
const functions = { /* your function registry */ };
const run = Setup(config, functions);

function App() {
  return (
    <Sidebar
      onSubmit={async (input) => {
        const result = await run(input, { interactionMode: 'Act' });
        return result;
      }}
    />
  );
}
```

See the root [README](../README.md) for full integration details.