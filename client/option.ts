import type { Option } from './types';
import type { InferenceToolCall } from './inference/types';

export async function selectOption(
    options: Option[],
  toolCalls: InferenceToolCall[]
): Promise<Set<Option>> {
  const selectedTools = new Set<Option>();
  for(const call of toolCalls) {
    if(!call.function || !call.function.name) {
      throw new Error('No tool selected by the model');
    }

    const matchingOption = options.find(opt => opt.name === call.function.name);
    if(matchingOption){
      selectedTools.add(matchingOption);
    }
  }

  return selectedTools;
}

export async function extractParameters(
  toolCalls: InferenceToolCall[]
): Promise<Record<string, unknown>> {
  if (!toolCalls || toolCalls.length === 0) {
    return {};
  }
  return toolCalls[0].function.arguments || {};
}
