import { FunctionDeclaration } from '@google/genai';

export interface AgentTool {
  declaration: FunctionDeclaration;
  handler: (args: any) => Promise<any> | any;
}

export interface AgentOptions {
  model?: string;
  systemInstruction?: string;
  tools?: AgentTool[];
  temperature?: number;
  apiKey?: string;
  oauthToken?: string;
}

export interface TaskResult {
  text: string;
  iterations: number;
}
