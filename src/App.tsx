import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, ChatMessage, AIModel } from './types';
import {
  DEFAULT_FREE_MODELS,
  fetchLiveKiloModels,
  streamChatCompletion,
} from './services/aiService';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { AgentTaskManager } from './components/AgentTaskManager';
import { VisualizerView } from './components/VisualizerView';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { MCPHubModal } from './components/MCPHubModal';
import { Menu } from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'jx_chat_sessions';
const STORAGE_KEY_SELECTED_MODEL = 'jx_chat_selected_model';
const STORAGE_KEY_LANG = 'jx_chat_language';

export default function App() {
  const [lang, setLang] = useState<'en' | 'ta'>(() => {
    return (localStorage.getItem(STORAGE_KEY_LANG) as 'en' | 'ta') || 'en';
  });

  const [models, setModels] = useState<AIModel[]>(DEFAULT_FREE_MODELS);
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_SELECTED_MODEL);
    const found = DEFAULT_FREE_MODELS.find((m) => m.id === savedId);
    return found || DEFAULT_FREE_MODELS[0];
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch {}

    const defaultId = 'session_' + Date.now();
    return [
      {
        id: defaultId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: DEFAULT_FREE_MODELS[0].id,
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(sessions[0]?.id || '');
  const [activeMode, setActiveMode] = useState<'chat' | 'agent' | 'visualizer'>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const abortControllerRef = useRef<(() => void) | null>(null);

  // Sync models from Kilo on initial mount
  useEffect(() => {
    fetchLiveKiloModels().then((liveModels) => {
      setModels(liveModels);
    });
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Save selected model
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, selectedModel.id);
    } catch {}
  }, [selectedModel]);

  // Save language
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {}
  }, [lang]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, modelId: model.id } : s))
    );
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModel.id,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fallback: ChatSession = {
        id: 'session_' + Date.now(),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: selectedModel.id,
      };
      setSessions([fallback]);
      setCurrentSessionId(fallback.id);
    } else {
      setSessions(remaining);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  const handleClearChat = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
      )
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      provider: selectedModel.provider,
    };

    const assistantPlaceholderId = 'msg_asst_' + Date.now();
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      provider: selectedModel.provider,
      isStreaming: true,
    };

    const nextMessages = [...(currentSession?.messages || []), userMessage, assistantMessage];

    // Update title if first message
    const updatedTitle =
      currentSession.messages.length === 0
        ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
        : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: nextMessages,
            }
          : s
      )
    );

    setIsGenerating(true);
    const startTime = Date.now();

    // Prepare history payload for LLM
    const promptHistory = [
      ...(currentSession?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: text },
    ];

    const systemPrompt =
      lang === 'ta'
        ? 'You are JX Chat, an elite AI assistant powered by free models and MCP tools. You are fluent in English, Tamil (தமிழ்), and Tanglish. Provide structured, accurate, and insightful answers.'
        : 'You are JX Chat, an elite AI assistant powered by free models and MCP tools. Deliver high-precision technical answers, clean code blocks, and structured explanations.';

    try {
      const cancel = await streamChatCompletion({
        messages: promptHistory,
        modelId: selectedModel.id,
        systemPrompt,
        callbacks: {
          onChunk: (chunkText) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = s.messages.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, content: chunkText } : m
                );
                return { ...s, messages: msgs };
              })
            );
          },
          onReasoning: (reasoningText) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = s.messages.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, reasoning: reasoningText } : m
                );
                return { ...s, messages: msgs };
              })
            );
          },
          onComplete: (fullText, finalReasoning) => {
            const latency = Date.now() - startTime;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = s.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content: fullText,
                        reasoning: finalReasoning || m.reasoning,
                        isStreaming: false,
                        metrics: { latencyMs: latency },
                      }
                    : m
                );
                return { ...s, messages: msgs };
              })
            );
            setIsGenerating(false);
          },
          onError: (err) => {
            console.error('Streaming error:', err);
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = s.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content:
                          m.content ||
                          `Connection note: Upstream provider returned an error (${err.message}). Try switching to "Kilo Auto Free (Smart Router)" or click another free model.`,
                        isStreaming: false,
                      }
                    : m
                );
                return { ...s, messages: msgs };
              })
            );
            setIsGenerating(false);
          },
        },
      });

      abortControllerRef.current = cancel;
    } catch (err: any) {
      console.error('Fatal invoke error:', err);
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const msgs = s.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m));
        return { ...s, messages: msgs };
      })
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Menu Hamburger */}
      <div className="lg:hidden fixed top-3 left-3 z-30">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        activeMode={activeMode}
        onChangeMode={setActiveMode}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenMCPModal={() => setIsMCPModalOpen(true)}
        currentModel={selectedModel}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ta' ? 'en' : 'ta')}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeMode === 'chat' && (
          <ChatView
            messages={currentSession?.messages || []}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            currentModel={selectedModel}
            onOpenModelModal={() => setIsModelModalOpen(true)}
            onOpenMCPModal={() => setIsMCPModalOpen(true)}
            onClearChat={handleClearChat}
            lang={lang}
          />
        )}

        {activeMode === 'agent' && (
          <AgentTaskManager currentModel={selectedModel} lang={lang} />
        )}

        {activeMode === 'visualizer' && <VisualizerView lang={lang} />}
      </main>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        onSelectModel={handleSelectModel}
        selectedModelId={selectedModel.id}
        onRefreshModels={setModels}
        lang={lang}
      />

      {/* MCP Hub Modal */}
      <MCPHubModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
