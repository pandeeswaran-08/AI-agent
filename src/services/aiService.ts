import { AIModel, ChatMessage } from '../types';

export const KILO_PROXY_CHAT_URL = '/api/kilo/chat/completions';
export const KILO_PROXY_MODELS_URL = '/api/kilo/models';
export const KILO_DIRECT_GATEWAY_URL = 'https://api.kilo.ai/api/gateway';
export const KILO_DIRECT_CHAT_URL = `${KILO_DIRECT_GATEWAY_URL}/chat/completions`;
export const KILO_DIRECT_MODELS_URL = `${KILO_DIRECT_GATEWAY_URL}/models`;
export const POLLINATIONS_URL = 'https://text.pollinations.ai';

// Rate limit: 200 requests per hour per IP on Kilo
const RATE_LIMIT_MAX = 200;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const DEFAULT_FREE_MODELS: AIModel[] = [
  {
    id: 'kilo-auto/free',
    name: 'Kilo Auto Free (Smart Router)',
    provider: 'kilo',
    description: 'Automatically routes your request to the highest benchmarked active free model.',
    contextLength: 256000,
    isFree: true,
    category: 'Auto',
    badge: 'Recommended',
    supportsReasoning: true,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra 550B',
    provider: 'kilo',
    description: 'Massive 550B parameter model with deep reasoning and 1,000,000 token context.',
    contextLength: 1000000,
    isFree: true,
    category: 'Reasoning',
    badge: '1M Context',
    supportsReasoning: true,
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code',
    provider: 'kilo',
    description: 'High-performance coding model optimized for TypeScript, Python, and system logic.',
    contextLength: 256000,
    isFree: true,
    category: 'Coding',
    badge: 'Fast Code',
    supportsReasoning: false,
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside Laguna S 2.1',
    provider: 'kilo',
    description: 'Specialized autonomous coding agent model with 262k context.',
    contextLength: 262144,
    isFree: true,
    category: 'Coding',
    badge: 'Agentic',
    supportsReasoning: false,
  },
  {
    id: 'poolside/laguna-xs-2.1:free',
    name: 'Poolside Laguna XS 2.1',
    provider: 'kilo',
    description: 'Lightweight and ultra-responsive coding model for rapid completions.',
    contextLength: 262144,
    isFree: true,
    category: 'Coding',
    badge: 'Fast',
    supportsReasoning: false,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning',
    provider: 'kilo',
    description: 'Blazing fast inference with 1,000,000 context length for instant responses.',
    contextLength: 1000000,
    isFree: true,
    category: 'Fast',
    badge: 'Lightning',
    supportsReasoning: false,
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'NVIDIA Nemotron 3.5 Super VL',
    provider: 'kilo',
    description: 'Vision & complex multimodal model supporting 1M tokens.',
    contextLength: 1000000,
    isFree: true,
    category: 'Vision',
    badge: 'Vision 1M',
    supportsReasoning: true,
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots Studio Note 3 Preview',
    provider: 'kilo',
    description: 'Structured note-taking, summaries, and agent previews with 512k context.',
    contextLength: 512000,
    isFree: true,
    category: 'Reasoning',
    badge: '512k Context',
    supportsReasoning: false,
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid AI LFM 2.5 2.6B',
    provider: 'kilo',
    description: 'Liquid Neural Network architecture for efficient edge-like reasoning.',
    contextLength: 65536,
    isFree: true,
    category: 'Fast',
    badge: 'Liquid NN',
    supportsReasoning: false,
  },
  {
    id: 'recursive/flint-v1.0:free',
    name: 'Recursive Flint v1.0',
    provider: 'kilo',
    description: 'Recursive reasoning model built for step-by-step problem deconstruction.',
    contextLength: 262144,
    isFree: true,
    category: 'Reasoning',
    badge: 'Step-by-Step',
    supportsReasoning: true,
  },
  {
    id: 'xingchen-agi/xing4.0-29b-a4b:free',
    name: 'XingChen 4.0 29B',
    provider: 'kilo',
    description: 'Advanced 29B reasoning model with broad multi-domain knowledge.',
    contextLength: 262144,
    isFree: true,
    category: 'Reasoning',
    badge: '29B',
    supportsReasoning: true,
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Router',
    provider: 'kilo',
    description: 'Free multi-provider routing through Kilo gateway without credentials.',
    contextLength: 128000,
    isFree: true,
    category: 'Auto',
    badge: 'Multi-Router',
    supportsReasoning: false,
  },
  {
    id: 'openai-fast',
    name: 'Pollinations GPT-OSS 20B (Free)',
    provider: 'pollinations',
    description: 'High-speed reasoning model provided anonymously via Pollinations AI.',
    contextLength: 64000,
    isFree: true,
    category: 'Reasoning',
    badge: 'No Key Needed',
    supportsReasoning: true,
  },
];

// Helper to track request timestamps in LocalStorage for rate limit gauge
export class RateLimitTracker {
  private static STORAGE_KEY = 'jx_chat_kilo_requests';

  static recordRequest(): void {
    try {
      const now = Date.now();
      const timestamps = this.getValidTimestamps();
      timestamps.push(now);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(timestamps));
    } catch {
      // ignore storage errors
    }
  }

  static getValidTimestamps(): number[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      const timestamps: number[] = JSON.parse(data);
      const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
      return timestamps.filter((t) => t > cutoff);
    } catch {
      return [];
    }
  }

  static getStats(): { used: number; remaining: number; max: number; resetMinutes: number } {
    const valid = this.getValidTimestamps();
    const used = valid.length;
    const remaining = Math.max(0, RATE_LIMIT_MAX - used);

    let resetMinutes = 60;
    if (valid.length > 0) {
      const oldest = Math.min(...valid);
      const diffMs = oldest + RATE_LIMIT_WINDOW_MS - Date.now();
      resetMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
    }

    return {
      used,
      remaining,
      max: RATE_LIMIT_MAX,
      resetMinutes,
    };
  }
}

// Fetch live models from Kilo API
export async function fetchLiveKiloModels(): Promise<AIModel[]> {
  try {
    let res: Response;
    try {
      res = await fetch(KILO_PROXY_MODELS_URL);
      if (!res.ok) throw new Error('Proxy returned ' + res.status);
    } catch {
      // Fallback to direct URL
      res = await fetch(KILO_DIRECT_MODELS_URL);
    }

    if (!res.ok) {
      return DEFAULT_FREE_MODELS;
    }
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) {
      return DEFAULT_FREE_MODELS;
    }

    const freeModelsFromKilo: AIModel[] = json.data
      .filter((m: any) => m.id.includes(':free') || m.id.includes('/free') || (m.pricing && m.pricing.prompt === '0'))
      .map((m: any) => {
        let category: AIModel['category'] = 'Reasoning';
        const lower = m.id.toLowerCase();
        if (lower.includes('auto') || lower.includes('router')) category = 'Auto';
        else if (lower.includes('code') || lower.includes('laguna')) category = 'Coding';
        else if (lower.includes('lightning') || lower.includes('fast')) category = 'Fast';
        else if (lower.includes('vl') || lower.includes('vision')) category = 'Vision';

        return {
          id: m.id,
          name: m.name || m.id,
          provider: 'kilo' as const,
          description: m.description || `Free model powered by Kilo AI Gateway. Zero API key required.`,
          contextLength: m.top_provider?.context_length || 128000,
          isFree: true,
          category,
          badge: m.id === 'kilo-auto/free' ? 'Recommended' : category,
          supportsReasoning: m.id.includes('nemotron') || m.id.includes('auto') || m.id.includes('flint'),
        };
      });

    // Ensure Pollinations free model is appended
    const pollinationsModel = DEFAULT_FREE_MODELS.find((m) => m.provider === 'pollinations');
    if (pollinationsModel && !freeModelsFromKilo.some((m) => m.id === pollinationsModel.id)) {
      freeModelsFromKilo.push(pollinationsModel);
    }

    return freeModelsFromKilo.length > 0 ? freeModelsFromKilo : DEFAULT_FREE_MODELS;
  } catch (err) {
    console.warn('Could not fetch live Kilo models, using tested defaults:', err);
    return DEFAULT_FREE_MODELS;
  }
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete: (fullText: string, reasoning?: string) => void;
  onError: (error: Error) => void;
}

// Execute chat completion without API key
export async function streamChatCompletion({
  messages,
  modelId,
  systemPrompt,
  callbacks,
  temperature = 0.7,
}: {
  messages: Array<{ role: string; content: string }>;
  modelId: string;
  systemPrompt?: string;
  callbacks: StreamCallbacks;
  temperature?: number;
}): Promise<() => void> {
  let isAborted = false;
  const controller = new AbortController();

  const cancel = () => {
    isAborted = true;
    controller.abort();
  };

  // If Pollinations provider
  if (modelId === 'openai-fast') {
    (async () => {
      try {
        const promptPayload = [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ];

        const res = await fetch(POLLINATIONS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: promptPayload,
            model: 'openai-fast',
            stream: false,
          }),
        });

        if (!res.ok) {
          throw new Error(`Pollinations API returned status: ${res.status}`);
        }

        const text = await res.text();
        if (!isAborted) {
          callbacks.onChunk(text);
          callbacks.onComplete(text);
        }
      } catch (err: any) {
        if (!isAborted) callbacks.onError(err);
      }
    })();
    return cancel;
  }

  // Kilo AI Gateway execution
  (async () => {
    try {
      RateLimitTracker.recordRequest();

      const formattedMessages = [
        ...(systemPrompt
          ? [
              {
                role: 'system',
                content: systemPrompt,
              },
            ]
          : []),
        ...messages,
      ];

      let targetModel = modelId;

      const executeFetch = async (endpoint: string, modelToUse: string) => {
        return await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Absolutely NO Authorization header is sent. Kilo free tier is completely anonymous!
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelToUse,
            messages: formattedMessages,
            stream: true,
            temperature,
          }),
        });
      };

      // Try proxy endpoint first to bypass any browser CORS restrictions
      let activeEndpoint = KILO_PROXY_CHAT_URL;
      let res: Response;

      try {
        res = await executeFetch(activeEndpoint, targetModel);
        if (!res.ok && res.status === 404 && targetModel !== 'kilo-auto/free') {
          // If model failed, fallback to kilo-auto/free
          targetModel = 'kilo-auto/free';
          res = await executeFetch(activeEndpoint, targetModel);
        }
      } catch (err: any) {
        // If proxy failed, try direct Kilo gateway URL
        console.warn('Proxy chat request failed, trying direct Kilo URL:', err);
        activeEndpoint = KILO_DIRECT_CHAT_URL;
        res = await executeFetch(activeEndpoint, targetModel);
      }

      // If specific model returned error from upstream, fallback to kilo-auto/free!
      if (!res.ok && targetModel !== 'kilo-auto/free') {
        console.warn(`Model ${targetModel} returned status ${res.status}. Falling back to kilo-auto/free...`);
        callbacks.onReasoning?.(
          `[System Note: ${targetModel} is temporarily unavailable. Automatically rerouting to Kilo Auto Free router...]`
        );
        targetModel = 'kilo-auto/free';
        res = await executeFetch(activeEndpoint, targetModel);
      }

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Kilo Gateway error (${res.status}): ${errorBody || res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported or empty body');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullContent = '';
      let accumulatedReasoning = '';

      while (true) {
        if (isAborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            // Handle reasoning output if available (e.g. DeepSeek / Nemotron / Reflection)
            if (delta?.reasoning || delta?.reasoning_details) {
              const rText = delta.reasoning || (delta.reasoning_details?.[0]?.text ?? '');
              if (rText) {
                accumulatedReasoning += rText;
                callbacks.onReasoning?.(accumulatedReasoning);
              }
            }

            if (delta?.content) {
              fullContent += delta.content;
              callbacks.onChunk(fullContent);
            }
          } catch {
            // Ignore incomplete chunks
          }
        }
      }

      if (!isAborted) {
        callbacks.onComplete(fullContent, accumulatedReasoning || undefined);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error during streaming chat completion:', err);
      callbacks.onError(err);
    }
  })();

  return cancel;
}
