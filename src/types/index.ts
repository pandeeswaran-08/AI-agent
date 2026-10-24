export type Role = 'user' | 'assistant' | 'system';

export type AIProvider = 'kilo' | 'pollinations' | 'puter' | 'custom';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  contextLength?: number;
  isFree: boolean;
  category: 'Auto' | 'Reasoning' | 'Coding' | 'Vision' | 'Fast' | 'Experimental';
  badge?: string;
  supportsReasoning?: boolean;
}

export interface MessageMetrics {
  latencyMs?: number;
  tokens?: number;
  speed?: number; // tokens/sec
}

export interface MCPToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  provider: AIProvider;
  reasoning?: string;
  isStreaming?: boolean;
  metrics?: MessageMetrics;
  mcpCalls?: MCPToolCall[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId: string;
  systemPrompt?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  category: 'system' | 'web' | 'code' | 'data';
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; required?: boolean }>;
    required?: string[];
  };
  enabled: boolean;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'builtin' | 'sse' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  latencyMs?: number;
  tools: MCPTool[];
}

export interface AgentStep {
  id: string;
  title: string;
  thought?: string;
  tool?: string;
  toolArgs?: any;
  toolResult?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  goal: string;
  modelId: string;
  status: 'idle' | 'planning' | 'running' | 'completed' | 'failed';
  steps: AgentStep[];
  finalResult?: string;
  createdAt: number;
  completedAt?: number;
}
