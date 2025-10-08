import { setup } from './core';
import type { Configuration } from './types';

const testConfig: Configuration = {
  options: [
    {
      kind: "option",
      type: "tool",
      name: "greetTool",
      spec: {
        type: "function",
        function: {
          name: "greet",
          description: "Greet someone by name",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person's name" }
            },
            required: ["name"]
          }
        }
      }
    }
  ],
  actions: [
    {
      kind: "action",
      type: "function",
      name: "callGreetFunction",
      spec: { function_name: "greetUser" }
    },
    {
      kind: "action",
      type: "event",
      name: "uiNotification",
      spec: { event_name: "ui:notify" }
    }
  ],
  decisions: [
    {
      kind: "decision",
      name: "handleGreeting",
      spec: { 
        if: ["greetTool"], 
        then: ["callGreetFunction", "uiNotification"]
      }
    }
  ],
  inference: {
    kind: "inference",
    name: "default",
    spec: { name: "local-nano", provider: "ollama" }
  }
};

const functions = {
  greetUser: async (args: any) => {
    console.log('[Function Action] greetUser called');
    console.log('  Args:', args);
    return { message: `Hello, ${args.name}!` };
  }
};

async function test() {
  console.log('Testing Core: Function + Event Actions\n');
  
  try {
    const eventTarget = await setup(testConfig, functions);
    
    eventTarget.addEventListener('ui:notify', (event: any) => {
      console.log('[Event Action] ui:notify dispatched');
      console.log('  Detail:', event.detail);
    });
    
    eventTarget.addEventListener('chat:output', (event: any) => {
      const { success, option, parameters, results, error } = event.detail;
      
      console.log('\n--- Results ---');
      console.log('Status:', success ? 'Success' : 'Error');
      
      if (success) {
        console.log('Option:', option);
        console.log('Parameters:', parameters);
        console.log('Actions executed:', results?.length || 0);
        console.log('\nAction results:');
        results?.forEach((r: any, i: number) => {
          console.log(`  ${i + 1}. ${r.action}:`, r.result);
        });
      } else {
        console.log('Error:', error);
      }
      
      process.exit(0);
    });
    
    const query = 'Please greet Alice';
    console.log('Sending query:', query);
    console.log('\nThis will trigger:');
    console.log('  1. LLM selects tool');
    console.log('  2. LLM extracts parameters');
    console.log('  3. Execute function action (calls greetUser)');
    console.log('  4. Execute event action (dispatches ui:notify)\n');
    
    eventTarget.dispatchEvent(new CustomEvent('chat:input', {
      detail: { query }
    }));
    
  } catch (error: any) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

test();
