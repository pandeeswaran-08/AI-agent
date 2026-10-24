import React, { useState } from 'react';
import { AIModel } from '../types';
import { fetchLiveKiloModels } from '../services/aiService';
import {
  X,
  Search,
  Sparkles,
  Zap,
  Code2,
  Brain,
  Eye,
  RefreshCw,
  Check,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: AIModel[];
  onSelectModel: (model: AIModel) => void;
  selectedModelId: string;
  onRefreshModels: (newModels: AIModel[]) => void;
  lang: 'en' | 'ta';
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  onSelectModel,
  selectedModelId,
  onRefreshModels,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const categories = ['All', 'Auto', 'Reasoning', 'Coding', 'Fast', 'Vision'];

  const filtered = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const live = await fetchLiveKiloModels();
      onRefreshModels(live);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCategoryIcon = (category: AIModel['category']) => {
    switch (category) {
      case 'Auto':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'Reasoning':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'Coding':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'Fast':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Vision':
        return <Eye className="w-4 h-4 text-blue-400" />;
      default:
        return <Flame className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                {lang === 'ta' ? 'இலவச AI மாடல்கள் (API Key தேவையில்லை)' : 'Free AI Models (No API Key Required)'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ta'
                ? 'Kilo AI கேட்வே மற்றும் Pollinations நெட்வொர்க்கில் 200 req/hr வரம்புடன் இலவசமாக இயங்கும் மாடல்கள்.'
                : '100% anonymous inference via Kilo Gateway & Pollinations with generous 200 req/hr IP quotas.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ta' ? 'மாடல் பெயர் தேடு...' : 'Search models...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Refresh Live Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Fetch live models from Kilo Gateway"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.map((m) => {
            const isSelected = m.id === selectedModelId;
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectModel(m);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 shrink-0 mt-0.5">
                    {getCategoryIcon(m.category)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                      {m.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {m.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        No Key Required
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                      <span>ID: {m.id}</span>
                      {m.contextLength && (
                        <span>• Context: {(m.contextLength / 1000).toFixed(0)}k</span>
                      )}
                      <span>• Provider: {m.provider.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-cyan-400 font-semibold px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <button className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                      Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
