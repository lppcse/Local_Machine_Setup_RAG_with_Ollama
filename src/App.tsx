import React, { useState } from 'react';
import { Header } from './components/Header';
import { SetupInstructions } from './components/SetupInstructions';
import { CodeViewer } from './components/CodeViewer';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { ConfigPlayground } from './components/ConfigPlayground';
import { ArchitectureFlow } from './components/ArchitectureFlow';

export default function App() {
  const [activeTab, setActiveTab] = useState<'script' | 'terminal' | 'config' | 'architecture'>('script');

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'script' && (
          <div className="space-y-6">
            <SetupInstructions />
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span className="text-emerald-400">#</span> Production-Ready Python Script (<code className="text-zinc-300 font-mono text-xs">local_rag.py</code>)
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                  LangChain LCEL • ChromaDB • Ollama
                </span>
              </div>
              <CodeViewer />
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Interactive Terminal CLI Simulator
                </h2>
                <p className="text-xs text-zinc-400">
                  Simulates executing <code className="text-emerald-400 font-mono">python local_rag.py</code> directly on local files with top-3 vector retrieval.
                </p>
              </div>
            </div>
            <InteractiveTerminal />
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Pipeline Configuration & Parameter Tuner
              </h2>
              <p className="text-xs text-zinc-400">
                Adjust chunking windows, swap local LLM/embedding engines, and instantly produce copy-ready CLI invocation commands.
              </p>
            </div>
            <ConfigPlayground />
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                System Architecture & Hardware Guide
              </h2>
              <p className="text-xs text-zinc-400">
                Detailed dataflow, memory footprints for Llama 3 and Mistral, and local debugging steps.
              </p>
            </div>
            <ArchitectureFlow />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/60 bg-zinc-950/60 py-4 text-center text-xs text-zinc-500 font-mono">
        100% Local RAG System • Powered by LangChain, Ollama & ChromaDB • Zero External API Calls
      </footer>
    </div>
  );
}
