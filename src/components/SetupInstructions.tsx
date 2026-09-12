import React from 'react';
import { Copy, Check, Terminal, Box, Download, Shield, Sparkles, FolderTree } from 'lucide-react';
import { PIP_COMMANDS, OLLAMA_COMMANDS, RUN_COMMANDS } from '../data/ragScript';

export const SetupInstructions: React.FC = () => {
  const [copiedPip, setCopiedPip] = React.useState(false);
  const [copiedOllama, setCopiedOllama] = React.useState(false);
  const [copiedRun, setCopiedRun] = React.useState(false);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                Zero External APIs
              </span>
              <span className="text-xs text-zinc-400 font-mono">ollama + chroma + langchain</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-2">
              100% Local RAG Architecture
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              This system runs completely on your machine. Documents are ingested from local folders, split into semantic chunks, vectorized via local embeddings, stored in a persistent ChromaDB database on disk, and queried via local Ollama models (Llama 3 or Mistral) in an interactive terminal chat loop.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-zinc-500">Target Environment</div>
              <div className="text-sm font-mono text-zinc-300">Localhost / Intranet</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Deliverable 1: Pip Install Commands */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  1. Install Python Dependencies
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(PIP_COMMANDS, setCopiedPip)}
                id="copy-pip-btn"
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedPip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPip ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Installs LangChain core, Ollama bridge, ChromaDB, PDF parsing, and optional local HuggingFace embeddings:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
              <span className="text-emerald-400 select-none">$ </span>
              {PIP_COMMANDS}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Includes: <code className="text-zinc-300">langchain-ollama</code>, <code className="text-zinc-300">langchain-chroma</code>, <code className="text-zinc-300">pypdf</code></span>
            <span className="text-emerald-400">Python 3.9+</span>
          </div>
        </div>

        {/* Deliverable 2: Ollama Model Pull Commands */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  2. Pull Local Models via Ollama
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(OLLAMA_COMMANDS, setCopiedOllama)}
                id="copy-ollama-btn"
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedOllama ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedOllama ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Pull the embedding model and your preferred LLM into your local Ollama storage:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 space-y-1 overflow-x-auto">
              <div><span className="text-emerald-400 select-none">$ </span>ollama pull nomic-embed-text <span className="text-zinc-500"># 274MB embedding model</span></div>
              <div><span className="text-emerald-400 select-none">$ </span>ollama pull llama3 <span className="text-zinc-500"># 4.7GB (Meta Llama 3 8B)</span></div>
              <div className="text-zinc-500"># Optional alternatives:</div>
              <div><span className="text-emerald-400 select-none">$ </span>ollama pull mistral <span className="text-zinc-500"># 4.1GB (Mistral 7B)</span></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Ollama default host: <code className="text-zinc-300">127.0.0.1:11434</code></span>
            <span className="text-purple-400">Runs on GPU or CPU</span>
          </div>
        </div>

      </div>

      {/* Recommended Project Directory Layout & Running Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Directory Layout */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:col-span-1">
          <div className="flex items-center space-x-2 mb-3">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Folder Layout</h3>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 font-mono text-xs text-zinc-300 leading-relaxed">
            <div>my_local_rag/</div>
            <div className="text-emerald-400">├── local_rag.py <span className="text-zinc-500"># The script</span></div>
            <div className="text-zinc-400">├── requirements.txt</div>
            <div className="text-cyan-400">├── data/ <span className="text-zinc-500"># Put your files here</span></div>
            <div className="text-zinc-400">│   ├── document1.pdf</div>
            <div className="text-zinc-400">│   └── notes.txt</div>
            <div className="text-amber-400">└── chroma_db/ <span className="text-zinc-500"># Auto-created</span></div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            Drop any number of <code className="text-zinc-300">.pdf</code> and <code className="text-zinc-300">.txt</code> files into <code className="text-zinc-300">./data</code>. They will be indexed automatically on first run.
          </p>
        </div>

        {/* Running the Script */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">3. Launch Your Interactive RAG Session</h3>
              </div>
              <button
                onClick={() => copyToClipboard(RUN_COMMANDS, setCopiedRun)}
                id="copy-run-btn"
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRun ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRun ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 space-y-1.5 overflow-x-auto">
              <div className="text-zinc-500"># Run with default settings:</div>
              <div><span className="text-emerald-400 select-none">$ </span>python local_rag.py</div>
              <div className="text-zinc-500 pt-1"># Or with custom options:</div>
              <div><span className="text-emerald-400 select-none">$ </span>python local_rag.py --data ./data --llm llama3 --top-k 3</div>
              <div><span className="text-emerald-400 select-none">$ </span>python local_rag.py --llm mistral --embeddings huggingface --reindex</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Interactive Commands: <code className="text-emerald-400">sources</code>, <code className="text-emerald-400">clear</code>, <code className="text-emerald-400">exit</code>
            </span>
            <span className="text-zinc-500">Persistence is automatic to ChromaDB</span>
          </div>
        </div>

      </div>

    </div>
  );
};
