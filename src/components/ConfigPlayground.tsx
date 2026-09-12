import React, { useState } from 'react';
import { Sliders, Copy, Check, Terminal, Cpu, Database, Play } from 'lucide-react';
import { RAGConfig } from '../types';

export const ConfigPlayground: React.FC = () => {
  const [config, setConfig] = useState<RAGConfig>({
    llmModel: 'llama3',
    embeddingEngine: 'ollama',
    embeddingModel: 'nomic-embed-text',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 3,
    temperature: 0.2,
    dataPath: './data',
    dbDir: './chroma_db'
  });

  const [copiedCmd, setCopiedCmd] = useState(false);

  const generatedCommand = `python local_rag.py \\
  --data ${config.dataPath} \\
  --db-dir ${config.dbDir} \\
  --llm ${config.llmModel} \\
  --embeddings ${config.embeddingEngine} \\
  --embed-model ${config.embeddingModel} \\
  --chunk-size ${config.chunkSize} \\
  --chunk-overlap ${config.chunkOverlap} \\
  --top-k ${config.topK} \\
  --temp ${config.temperature}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleEmbeddingEngineChange = (engine: 'ollama' | 'huggingface') => {
    setConfig(prev => ({
      ...prev,
      embeddingEngine: engine,
      embeddingModel: engine === 'ollama' ? 'nomic-embed-text' : 'sentence-transformers/all-MiniLM-L6-v2'
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Configuration Controls */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-zinc-100">
            Pipeline Parameter Tuner
          </h2>
        </div>

        {/* 1. Local LLM Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Local LLM Model (via Ollama)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">ollama pull &lt;model&gt;</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'llama3', name: 'Llama 3 (8B)', vram: '4.7 GB' },
              { id: 'mistral', name: 'Mistral (7B)', vram: '4.1 GB' },
              { id: 'deepseek-r1:8b', name: 'DeepSeek R1 (8B)', vram: '4.9 GB' },
              { id: 'phi3', name: 'Phi-3 Mini (3.8B)', vram: '2.4 GB' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, llmModel: m.id as any }))}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  config.llmModel === m.id
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-zinc-100 ring-1 ring-emerald-500'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-mono text-xs font-semibold">{m.name}</div>
                <div className="text-[10px] text-zinc-500 mt-1">VRAM: {m.vram}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Embedding Engine */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" /> Local Embedding Provider
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Zero Cloud Costs</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleEmbeddingEngineChange('ollama')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                config.embeddingEngine === 'ollama'
                  ? 'border-purple-500/80 bg-purple-500/10 text-zinc-100 ring-1 ring-purple-500'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-xs text-zinc-200">Ollama Embeddings</div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">nomic-embed-text</div>
              <p className="text-[10px] text-zinc-500 mt-1">768 dimensions • Fast local quantization via Ollama</p>
            </button>

            <button
              type="button"
              onClick={() => handleEmbeddingEngineChange('huggingface')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                config.embeddingEngine === 'huggingface'
                  ? 'border-purple-500/80 bg-purple-500/10 text-zinc-100 ring-1 ring-purple-500'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-xs text-zinc-200">HuggingFace Local</div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">all-MiniLM-L6-v2</div>
              <p className="text-[10px] text-zinc-500 mt-1">384 dimensions • Runs natively on PyTorch CPU/MPS</p>
            </button>
          </div>
        </div>

        {/* 3. Text Chunking Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-300 font-medium">Chunk Size (chars)</span>
              <span className="font-mono text-emerald-400 font-bold">{config.chunkSize}</span>
            </div>
            <input
              type="range"
              min="400"
              max="2500"
              step="100"
              value={config.chunkSize}
              onChange={(e) => setConfig(prev => ({ ...prev, chunkSize: parseInt(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Default: 1000 characters per slice
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-300 font-medium">Chunk Overlap</span>
              <span className="font-mono text-emerald-400 font-bold">{config.chunkOverlap}</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={config.chunkOverlap}
              onChange={(e) => setConfig(prev => ({ ...prev, chunkOverlap: parseInt(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Default: 200 chars (preserves sentence context)
            </span>
          </div>
        </div>

        {/* 4. Top-K & Temperature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-300 font-medium">Retrieval Top-K Chunks</span>
              <span className="font-mono text-cyan-400 font-bold">{config.topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={config.topK}
              onChange={(e) => setConfig(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Specifies top relevant chunks injected into prompt
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-300 font-medium">LLM Temperature</span>
              <span className="font-mono text-amber-400 font-bold">{config.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.temperature}
              onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Lower (0.1 - 0.3) prevents hallucinations
            </span>
          </div>
        </div>

      </div>

      {/* Generated CLI Command & Explanation */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Dynamic Command Generator
                </h3>
              </div>
              <button
                onClick={copyCommand}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              Copy and run this exact command in your terminal to execute your customized pipeline:
            </p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
              {generatedCommand}
            </div>

            <div className="mt-4 space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>No Cloud Overhead:</strong> Embeddings and token generation run on your hardware.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>ChromaDB Persistence:</strong> Reindexing is skipped on subsequent runs unless <code className="text-zinc-200">--reindex</code> is passed.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>Strict Grounding:</strong> Prompt template instructs the model not to hallucinate if context is insufficient.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 text-xs">
              <div className="text-zinc-300 font-semibold mb-1">Pre-flight Checklist:</div>
              <ol className="list-decimal list-inside text-zinc-500 space-y-1 font-mono text-[11px]">
                <li>ollama serve is active</li>
                <li>ollama pull {config.llmModel} complete</li>
                <li>ollama pull {config.embeddingModel.split('/')[0]} complete</li>
                <li>files placed in {config.dataPath}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
