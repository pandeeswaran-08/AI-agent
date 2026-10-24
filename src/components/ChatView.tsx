import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIModel } from '../types';
import { ThreeNeuralCore } from './ThreeNeuralCore';
import { executeBuiltinMCPTool } from '../services/mcpService';
import {
  Send,
  Square,
  Sparkles,
  Brain,
  Copy,
  Check,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  currentModel: AIModel;
  onOpenModelModal: () => void;
  onOpenMCPModal: () => void;
  onClearChat: () => void;
  lang: 'en' | 'ta';
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  currentModel,
  onOpenModelModal,
  onOpenMCPModal,
  onClearChat,
  lang,
}) => {
  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sandboxOutput, setSandboxOutput] = useState<{ [key: string]: any }>({});
  const [is3DExpanded, setIs3DExpanded] = useState(false);
  const [show3DCore, setShow3DCore] = useState(true);
  const [openReasoningMap, setOpenReasoningMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Audio synthesize via Web Audio API (No external sound files)
  const playChime = (type: 'send' | 'receive') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      if (type === 'send') {
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(740, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
    } catch {
      // AudioContext not allowed before user gesture
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;
    const text = inputText.trim();
    setInputText('');
    playChime('send');
    onSendMessage(text);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunCodeInSandbox = async (codeId: string, code: string) => {
    try {
      const result = await executeBuiltinMCPTool('run_javascript_code', { code });
      setSandboxOutput((prev) => ({ ...prev, [codeId]: result }));
    } catch (err: any) {
      setSandboxOutput((prev) => ({
        ...prev,
        [codeId]: { status: 'error', error: err.message },
      }));
    }
  };

  const handleExportChat = () => {
    const md = messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'User' : m.modelName || 'Assistant'} (${new Date(
            m.timestamp
          ).toLocaleTimeString()})\n\n${m.reasoning ? `> **Reasoning:**\n> ${m.reasoning}\n\n` : ''}${
            m.content
          }\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jx-chat-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleReasoning = (id: string) => {
    setOpenReasoningMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick suggestion prompts
  const suggestions = [
    {
      label: lang === 'ta' ? 'தமிழ் கவிதை / யோசனை' : 'Creative Writing in Tamil/English',
      prompt:
        lang === 'ta'
          ? 'தொழில்நுட்பம் மற்றும் செயற்கை நுண்ணறிவு பற்றி ஒரு அழகான தமிழ் கவிதை எழுது.'
          : 'Write a futuristic cyberpunk haiku about neural networks and quantum light.',
    },
    {
      label: lang === 'ta' ? 'பைதான் கோடிங் & டெஸ்டிங்' : 'Python Fast Algorithm',
      prompt:
        'Write an optimized Python algorithm with LRU cache and type annotations to find all prime factors.',
    },
    {
      label: lang === 'ta' ? 'MCP ஆர்க்கிடெக்சர் விளக்கம்' : 'Model Context Protocol Deep Dive',
      prompt:
        'Explain how MCP (Model Context Protocol) connects LLMs to local developer tools, databases, and runtime sandboxes.',
    },
    {
      label: lang === 'ta' ? 'React + Three.js அனிமேஷன்' : 'React Three.js PBR Architecture',
      prompt:
        'Explain how to build high-performance 3D scenes in React Three.js with zero-404 procedural materials and studio lighting.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Top Bar with 3D Core Toggle & Action Buttons */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {/* Active Model Switcher Pill */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-[220px]">
              {currentModel.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
              FREE
            </span>
          </button>

          {/* MCP Tools Button */}
          <button
            onClick={onOpenMCPModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>MCP Tools</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle 3D Core View */}
          <button
            onClick={() => setShow3DCore(!show3DCore)}
            title={show3DCore ? 'Hide 3D Neural Scene' : 'Show 3D Neural Scene'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
              show3DCore
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            3D CORE: {show3DCore ? 'ON' : 'OFF'}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable Audio Chimes' : 'Enable Audio Chimes'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export Chat */}
          {messages.length > 0 && (
            <button
              onClick={handleExportChat}
              title="Export Conversation as Markdown"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              title="Clear Current Chat"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded 3D Neural AI Companion Viewport */}
      {show3DCore && (
        <div className="p-4 pb-0 z-10 shrink-0">
          <ThreeNeuralCore
            isGenerating={isGenerating}
            activeModelName={currentModel.name}
            isExpanded={is3DExpanded}
            onToggleExpand={() => setIs3DExpanded(!is3DExpanded)}
          />
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          // Empty State / Welcome Screen
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 py-8">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 font-black text-slate-950 text-2xl tracking-wider">
                JX
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              {lang === 'ta' ? 'JX Chat - இலவச AI மாடல்கள்' : 'Welcome to JX Chat'}
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md">
              {lang === 'ta'
                ? 'API key தேவையில்லை! Kilo Code இன் Auto Free, Nemotron 550B, Cohere Code மற்றும் MCP கருவிகளுடன் உடனடி பயன்பாடு.'
                : '100% anonymous free models via Kilo AI Gateway and Pollinations with zero API keys required.'}
            </p>

            {/* Feature Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                ✓ 200 Requests / Hour
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300">
                ✓ Deep Reasoning Streaming
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                ✓ MCP Sandbox & Web Search
              </span>
            </div>

            {/* Quick Prompt Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s.prompt)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                    <span>{s.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages Feed
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isReasoningOpen = openReasoningMap[msg.id] ?? false;

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-3xl mx-auto ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Role / Model Label */}
                <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono text-slate-400">
                  <span>{isUser ? 'You' : msg.modelName || 'JX Assistant'}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Assistant Reasoning Dropdown (if present) */}
                {!isUser && msg.reasoning && (
                  <div className="w-full mb-3 rounded-xl bg-slate-900/90 border border-purple-500/30 overflow-hidden">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-mono text-purple-300 hover:bg-purple-950/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold">Deep Reasoning Thoughts</span>
                        <span className="text-[10px] text-slate-400">
                          ({msg.reasoning.length} chars)
                        </span>
                      </div>
                      {isReasoningOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isReasoningOpen && (
                      <div className="p-3.5 pt-1 text-xs font-mono text-slate-300 border-t border-purple-500/20 bg-slate-950/60 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {msg.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative group p-4 sm:p-5 rounded-2xl max-w-full text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg backdrop-blur-sm'
                  }`}
                >
                  {/* Content parser: handles code blocks cleanly */}
                  <div className="space-y-3 font-sans break-words whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* If streaming typing indicator */}
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                  )}

                  {/* Bottom Action Footer for Assistant Message */}
                  {!isUser && !msg.isStreaming && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>Provider: {msg.provider.toUpperCase()}</span>
                        {msg.metrics?.latencyMs && <span>• {msg.metrics.latencyMs}ms</span>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar & Control Dock */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md z-20">
        <div className="max-w-3xl mx-auto">
          {/* Active Generation Status & Stop Button */}
          {isGenerating && (
            <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Generating response anonymously from {currentModel.name}...</span>
              </div>
              <button
                onClick={onStopGeneration}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Prompt Input Container */}
          <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500/80 shadow-2xl transition-colors">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder={
                lang === 'ta'
                  ? 'ஏதேனும் கேள்விகள் கேட்கவும் அல்லது கோடிங் எழுதச் சொல்லவும் (Enter to send)...'
                  : 'Ask anything, request code, or task the free models (Enter to send, Shift+Enter for newline)...'
              }
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none max-h-36 focus:outline-none"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isGenerating}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                inputText.trim() && !isGenerating
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Under-input info */}
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
            <span>JX Chat • Free Gateway</span>
            <span className="text-cyan-400/80">Anonymous Token Stream Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
