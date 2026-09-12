import React from 'react';
import { Terminal, ShieldCheck, Cpu, Database, Download, Copy, Check } from 'lucide-react';
import { PYTHON_SCRIPT_CODE } from '../data/ragScript';

interface HeaderProps {
  activeTab: 'script' | 'terminal' | 'config' | 'architecture';
  setActiveTab: (tab: 'script' | 'terminal' | 'config' | 'architecture') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PYTHON_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SCRIPT_CODE], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'local_rag.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Local RAG System</h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% Offline
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ollama (Llama 3 / Mistral) + Local Embeddings + ChromaDB Vector Store
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center space-x-6 text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span>Inference: <strong className="text-zinc-200">Localhost (Ollama)</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <span>Vector DB: <strong className="text-zinc-200">ChromaDB (Disk)</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">$0.00 API Cost</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyScript}
              id="copy-py-btn"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              {copied ? 'Copied Code!' : 'Copy Script'}
            </button>

            <button
              onClick={handleDownload}
              id="download-py-btn"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download local_rag.py</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-zinc-850 pt-2 pb-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('script')}
            id="tab-script"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            📜 Script & Pip Setup
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            id="tab-terminal"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            💻 Interactive CLI Simulator
          </button>

          <button
            onClick={() => setActiveTab('config')}
            id="tab-config"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            ⚙️ Parameter Tuner & CLI Generator
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            id="tab-architecture"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            🧠 Pipeline Architecture & Specs
          </button>
        </div>

      </div>
    </header>
  );
};
