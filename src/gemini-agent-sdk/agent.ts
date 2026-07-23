import { GoogleGenAI, Part } from '@google/genai';
import { AgentOptions, AgentTool, TaskResult } from './types';
import { createGenAIClient } from './auth';

/**
 * Custom Gemini Agent SDK
 * Wraps the Google GenAI SDK to provide a fully autonomous agent loop.
 */
export class GeminiAgent {
  private ai: GoogleGenAI;
  private model: string;
  private systemInstruction?: string;
  private toolsMap: Map<string, AgentTool>;
  private temperature?: number;

  constructor(options: AgentOptions = {}) {
    this.ai = createGenAIClient({ apiKey: options.apiKey, oauthToken: options.oauthToken });
    this.model = options.model || 'gemini-2.5-pro';
    this.systemInstruction = options.systemInstruction;
    this.temperature = options.temperature;
    this.toolsMap = new Map((options.tools || []).map(t => [t.declaration.name, t]));
  }

  /**
   * Executes a task autonomously by reasoning and calling tools until completion.
   */
  async runTask(prompt: string): Promise<TaskResult> {
    console.log(`[GeminiAgent] Starting task with model ${this.model}...`);
    
    const chat = this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: this.systemInstruction,
        temperature: this.temperature,
        tools: this.toolsMap.size > 0 ? [{ 
          functionDeclarations: Array.from(this.toolsMap.values()).map(t => t.declaration) 
        }] : undefined,
      }
    });

    let response = await chat.sendMessage({ message: prompt });
    let iteration = 0;
    const maxIterations = 15; // Prevent infinite loops

    while (response.functionCalls && response.functionCalls.length > 0 && iteration < maxIterations) {
      iteration++;
      console.log(`[GeminiAgent] Iteration ${iteration}: Model requested ${response.functionCalls.length} tool(s).`);
      
      const functionResponses: Part[] = [];
      
      for (const call of response.functionCalls) {
        console.log(`[GeminiAgent] Executing tool: ${call.name}`);
        const tool = this.toolsMap.get(call.name);
        
        if (tool) {
          try {
            const result = await tool.handler(call.args);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result }
              }
            });
          } catch (error: any) {
            console.error(`[GeminiAgent] Error executing ${call.name}:`, error);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: error.message || 'Unknown error occurred' }
              }
            });
          }
        } else {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: `Tool ${call.name} not found in agent configuration.` }
            }
          });
        }
      }

      console.log(`[GeminiAgent] Sending tool results back to model...`);
      response = await chat.sendMessage({ message: functionResponses });
    }

    if (iteration >= maxIterations) {
      console.warn(`[GeminiAgent] Reached max iterations (${maxIterations}). Terminating loop.`);
    }

    return {
      text: response.text || 'Task completed.',
      iterations: iteration
    };
  }
}
