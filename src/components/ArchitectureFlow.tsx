import React from 'react';
import { Cpu, HardDrive, Shield, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ARCHITECTURE_STEPS } from '../data/ragScript';

export const ArchitectureFlow: React.FC = () => {
  return (
    <div className="space-y-8">
      
      {/* Visual Pipeline Steps */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-zinc-100">
            End-to-End Local RAG Lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARCHITECTURE_STEPS.map((step) => (
            <div
              key={step.step}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 flex items-center justify-center">
                    {step.step}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border bg-gradient-to-r ${step.color}`}>
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hardware & Memory Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Hardware & VRAM Sizing Guide
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Recommended local system specifications for smooth token generation and vector search:
          </p>
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">Llama 3 (8B Instruct - Q4_K_M)</div>
                <div className="text-[11px] text-zinc-500">General reasoning & strict adherence</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">~5.0 GB VRAM</span>
                <div className="text-[10px] text-zinc-500">or 8 GB System RAM</div>
              </div>
            </div>

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">Mistral (7B Instruct v0.3)</div>
                <div className="text-[11px] text-zinc-500">Fast token throughput on CPUs</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">~4.5 GB VRAM</span>
                <div className="text-[10px] text-zinc-500">or 8 GB System RAM</div>
              </div>
            </div>

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">nomic-embed-text (Ollama)</div>
                <div className="text-[11px] text-zinc-500">Dense 768-dim embeddings</div>
              </div>
              <div className="text-right">
                <span className="text-purple-400 font-bold">&lt; 350 MB VRAM</span>
                <div className="text-[10px] text-zinc-500">Extremely fast on CPU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Air-Gapped Guarantees */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Air-Gapped Privacy & Security Guarantees
              </h3>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Network Exfiltration:</strong> Documents never leave your machine. Ollama runs on <code className="text-zinc-300">127.0.0.1</code> and ChromaDB writes to a local SQLite/parquet file.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No Account or Token Quotas:</strong> No OpenAI, Anthropic, or HuggingFace Pro API keys needed. You have unlimited queries without metered billing.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Prompt Grounding:</strong> The prompt explicitly instructs the LLM to reply <em>"I do not have enough information..."</em> if context is missing, preventing hallucinated assertions.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400">
            <span className="text-emerald-400 font-semibold">Tip for Apple Silicon:</span> Ollama natively accelerates Metal on M1/M2/M3/M4 chips with zero configuration needed.
          </div>
        </div>

      </div>

      {/* Troubleshooting Common Issues */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Troubleshooting Common Errors
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="font-mono font-semibold text-amber-300 mb-1">
              ConnectionRefusedError: 11434
            </div>
            <p className="text-zinc-400 mb-2">
              Ollama is not running in the background.
            </p>
            <div className="font-mono text-emerald-400 bg-zinc-900 p-1.5 rounded">
              $ ollama serve
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="font-mono font-semibold text-amber-300 mb-1">
              Model 'llama3' not found
            </div>
            <p className="text-zinc-400 mb-2">
              The model weights have not been pulled yet.
            </p>
            <div className="font-mono text-emerald-400 bg-zinc-900 p-1.5 rounded">
              $ ollama pull llama3
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="font-mono font-semibold text-amber-300 mb-1">
              ChromaDB rebuild needed
            </div>
            <p className="text-zinc-400 mb-2">
              Added new PDF/TXT files and want to re-vectorize:
            </p>
            <div className="font-mono text-emerald-400 bg-zinc-900 p-1.5 rounded">
              $ python local_rag.py --reindex
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
