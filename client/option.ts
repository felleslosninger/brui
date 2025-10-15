import type { Configuration, Option } from './types';
import type { Tool } from 'ollama';
import { Chat } from './inference';

export async function selectOption(
  options: Option[],
  userQuery: string,
  config: Configuration
): Promise<Option | null> {
  const tools: Tool[] = options.map(opt => ({
    type: 'function',
    function: {
      name: opt.name,
      description: opt.spec.function.description,
      parameters: opt.spec.function.parameters
    }
  }));
  const inferenceContext = {
    config: {
      inference: config.inference?.spec,
      decisions: { tools }
    }
  };
  const prompt = `Select the appropriate tool for: ${userQuery}`;
  const toolCalls = await Chat(prompt, inferenceContext);
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }
  const selectedTool = toolCalls[0];
  const matchingOption = options.find(opt => opt.name === selectedTool.function.name);
  return matchingOption || null;
}

export async function extractParameters(
  userQuery: string,
  option: Option,
  config: Configuration
): Promise<Record<string, unknown>> {
  const tools: Tool[] = [{
    type: 'function',
    function: {
      name: option.spec.function.name,
      description: option.spec.function.description,
      parameters: option.spec.function.parameters
    }
  }];
  const inferenceContext = {
    config: {
      inference: config.inference?.spec,
      decisions: { tools }
    }
  };
  const prompt = `Extract parameters for ${option.spec.function.name}: ${userQuery}`;
  const toolCalls = await Chat(prompt, inferenceContext);
  if (!toolCalls || toolCalls.length === 0) {
    return {};
  }
  return toolCalls[0].function.arguments || {};
}
