import React, { useState } from 'react';
import { MCPServerConfig, MCPTool } from '../types';
import { MCPServerManager, executeBuiltinMCPTool } from '../services/mcpService';
import {
  X,
  Server,
  Wrench,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Activity,
} from 'lucide-react';

interface MCPHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ta';
}

export const MCPHubModal: React.FC<MCPHubModalProps> = ({ isOpen, onClose, lang }) => {
  const [servers, setServers] = useState<MCPServerConfig[]>(() => MCPServerManager.getServers());
  const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || 'builtin-core');
  const [activeTab, setActiveTab] = useState<'tools' | 'test' | 'addServer'>('tools');

  // Test sandbox state
  const [testToolName, setTestToolName] = useState<string>('web_search');
  const [testArgs, setTestArgs] = useState<string>('{\n  "query": "Model Context Protocol architecture 2026"\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Add custom server state
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerType, setNewServerType] = useState<'sse' | 'custom'>('sse');

  if (!isOpen) return null;

  const currentServer = servers.find((s) => s.id === selectedServerId) || servers[0];

  const handleToggleTool = (toolName: string) => {
    const updated = servers.map((s) => {
      if (s.id === selectedServerId) {
        return {
          ...s,
          tools: s.tools.map((t) => (t.name === toolName ? { ...t, enabled: !t.enabled } : t)),
        };
      }
      return s;
    });
    setServers(updated);
    MCPServerManager.saveServers(updated);
  };

  const handleRunTest = async () => {
    setIsExecuting(true);
    setTestResult(null);
    try {
      const parsedArgs = JSON.parse(testArgs);
      const res = await executeBuiltinMCPTool(testToolName, parsedArgs);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        error: err.message || 'Invalid JSON parameters or execution failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) return;

    const newServer: MCPServerConfig = {
      id: 'server_' + Date.now(),
      name: newServerName.trim(),
      url: newServerUrl.trim(),
      type: newServerType,
      status: 'connected',
      latencyMs: 14,
      tools: [
        {
          name: `${newServerName.toLowerCase().replace(/\s+/g, '_')}_query`,
          description: `Custom MCP query endpoint hosted on ${newServerUrl}`,
          category: 'system',
          enabled: true,
          parameters: {
            type: 'object',
            properties: { payload: { type: 'string', description: 'Raw payload' } },
          },
        },
      ],
    };

    const next = [...servers, newServer];
    setServers(next);
    MCPServerManager.saveServers(next);
    setSelectedServerId(newServer.id);
    setActiveTab('tools');
    setNewServerName('');
    setNewServerUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {lang === 'ta' ? 'மாடல் சூழல் நெறிமுறை (MCP) மையம்' : 'Model Context Protocol (MCP) Hub'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ta'
                  ? 'வெளிப்புற மற்றும் உள்ளமைக்கப்பட்ட கருவிகளை AI மாடல்களுடன் இணைக்கவும்'
                  : 'Connect external tools, local servers, and runtime execution environments to JX models.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Server Selector Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {lang === 'ta' ? 'MCP சர்வர்கள்' : 'MCP Servers'}
                </span>
                <span className="text-xs font-mono text-cyan-400">{servers.length}</span>
              </div>

              <div className="space-y-1.5">
                {servers.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSelectedServerId(srv.id);
                      setActiveTab('tools');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      selectedServerId === srv.id
                        ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Server className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{srv.name}</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        srv.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('addServer')}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer border border-slate-700/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'புதிய MCP சர்வர் இணை' : 'Connect New MCP Server'}</span>
            </button>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Server Status Ribbon */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{currentServer.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      currentServer.status === 'connected'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentServer.status.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{currentServer.url}</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('tools')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'tools' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'ta' ? 'கருவிகள்' : 'Tools'} ({currentServer.tools.length})
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'test' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'ta' ? 'சோதனை சாண்ட்பாக்ஸ்' : 'Test Sandbox'}
                </button>
              </div>
            </div>

            {/* Tab 1: Tools List */}
            {activeTab === 'tools' && (
              <div className="mt-5 space-y-3">
                {currentServer.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-mono font-medium text-white">{tool.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleTool(tool.name)}
                      className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        tool.enabled
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {tool.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Test Sandbox */}
            {activeTab === 'test' && (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    {lang === 'ta' ? 'கருவியை தேர்ந்தெடுக்கவும்:' : 'Select Tool to Test:'}
                  </label>
                  <select
                    value={testToolName}
                    onChange={(e) => {
                      setTestToolName(e.target.value);
                      if (e.target.value === 'web_search') {
                        setTestArgs('{\n  "query": "Model Context Protocol architecture 2026"\n}');
                      } else if (e.target.value === 'run_javascript_code') {
                        setTestArgs('{\n  "code": "const x = [1, 2, 3, 4]; console.log(x.map(n => n * 10)); return 42;"\n}');
                      } else if (e.target.value === 'math_scientific_calculator') {
                        setTestArgs('{\n  "expression": "Math.sin(Math.PI / 4) * 100"\n}');
                      } else if (e.target.value === 'file_system_explorer') {
                        setTestArgs('{\n  "action": "list",\n  "path": "/workspace"\n}');
                      } else {
                        setTestArgs('{}');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {currentServer.tools.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    {lang === 'ta' ? 'JSON அளவுருக்கள் (Arguments):' : 'JSON Parameters (Payload):'}
                  </label>
                  <textarea
                    value={testArgs}
                    onChange={(e) => setTestArgs(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={isExecuting}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Executing...' : 'Run Tool in MCP Sandbox'}</span>
                </button>

                {testResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span>Result Status:</span>
                      <span className={testResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                        {testResult.status?.toUpperCase()}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Connect Custom MCP Server */}
            {activeTab === 'addServer' && (
              <div className="mt-5 space-y-4">
                <h4 className="text-sm font-semibold text-white">
                  {lang === 'ta' ? 'புதிய MCP சர்வரை உள்ளமைக்கவும்' : 'Configure Custom MCP Endpoint'}
                </h4>
                <p className="text-xs text-slate-400">
                  Connect your local development server or remote MCP cluster via Server-Sent Events (SSE) or WebSocket.
                </p>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Server Name</label>
                  <input
                    type="text"
                    placeholder="e.g. My Local Python MCP Server"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Endpoint URL (SSE / HTTP)</label>
                  <input
                    type="text"
                    placeholder="e.g. http://localhost:8000/sse"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('tools')}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddServer}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    Register MCP Server
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
