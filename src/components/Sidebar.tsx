import React, { useState, useEffect } from 'react';
import { ChatSession, AIModel } from '../types';
import { RateLimitTracker } from '../services/aiService';
import {
  MessageSquare,
  Plus,
  Sparkles,
  Cpu,
  Boxes,
  Trash2,
  Globe2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Gauge,
  X,
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  activeMode: 'chat' | 'agent' | 'visualizer';
  onChangeMode: (mode: 'chat' | 'agent' | 'visualizer') => void;
  onOpenModelModal: () => void;
  onOpenMCPModal: () => void;
  currentModel: AIModel;
  lang: 'en' | 'ta';
  onToggleLang: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  activeMode,
  onChangeMode,
  onOpenModelModal,
  onOpenMCPModal,
  currentModel,
  lang,
  onToggleLang,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [rateStats, setRateStats] = useState(() => RateLimitTracker.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setRateStats(RateLimitTracker.getStats());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const ratePercent = Math.min(100, Math.round((rateStats.used / rateStats.max) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-slate-950 text-sm tracking-wider">
                JX
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                  JX CHAT
                </span>
                <span className="block text-[10px] font-mono text-cyan-400">FREE AI GATEWAY</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggleLang}
                title="Change Language (English / தமிழ்)"
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                {lang === 'ta' ? 'EN' : 'தமிழ்'}
              </button>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onChangeMode('chat');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'ta' ? 'புதிய அரட்டை (New Chat)' : 'Start New Chat'}</span>
          </button>

          {/* Primary Navigation Modes */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onChangeMode('chat');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>{lang === 'ta' ? 'அரட்டை முறை' : 'AI Chat Mode'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => {
                onChangeMode('agent');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeMode === 'agent'
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{lang === 'ta' ? 'தன்னாட்சி ஏஜென்ட்' : 'Autonomous Agent'}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">
                PRO
              </span>
            </button>

            <button
              onClick={() => {
                onOpenMCPModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'ta' ? 'MCP கருவிகள் & சர்வர்' : 'MCP Connect Hub'}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
                5 Tools
              </span>
            </button>

            <button
              onClick={() => {
                onChangeMode('visualizer');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeMode === 'visualizer'
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>{lang === 'ta' ? '3D நியூரல் கோர்' : '3D Neural Scene'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Middle Chat Sessions History */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              {lang === 'ta' ? 'அரட்டை வரலாறு' : 'Chat History'}
            </span>
            <span className="text-xs font-mono text-slate-600">{sessions.length}</span>
          </div>

          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  onChangeMode('chat');
                  onCloseMobile();
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  s.id === currentSessionId && activeMode === 'chat'
                    ? 'bg-slate-900 text-cyan-300 border border-slate-800'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                  <span className="truncate">{s.title || 'Untitled Conversation'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Active Model & Rate Limit Counter */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          {/* Active Model Pill */}
          <div
            onClick={onOpenModelModal}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Active Free Model
              </span>
              <span className="text-[10px] font-mono text-slate-400 hover:text-white">Change</span>
            </div>
            <div className="text-xs font-semibold text-white truncate">{currentModel.name}</div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Zero API Key Required</span>
            </div>
          </div>

          {/* Kilo 200 req/hr rate limit meter */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-[11px]">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Kilo Free Quota
              </span>
              <span className="text-[11px] text-cyan-300 font-bold">
                {rateStats.remaining} / {rateStats.max} left
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, (rateStats.remaining / rateStats.max) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>200 req/hr per IP</span>
              <span>Resets ~{rateStats.resetMinutes}m</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
