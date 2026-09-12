import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, RefreshCw, FileText, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { TerminalMessage, RetrievedChunk } from '../types';
import { PRECONFIGURED_DOCS } from '../data/ragScript';

export const InteractiveTerminal: React.FC = () => {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: 'init-1',
      type: 'system',
      text: `[✓] Connected to local Ollama server at http://localhost:11434
[✓] Local Embedding: nomic-embed-text (768-dim)
[✓] ChromaDB loaded: ./chroma_db (3 local documents indexed, 76 total chunks)
[✓] Active LLM: llama3 (temperature=0.2)

======================================================================
 🚀 100% LOCAL RAG SYSTEM READY (Ollama + ChromaDB)
======================================================================
 Commands:
   - Type your question and press Enter
   - Type 'sources' to inspect top retrieved chunks for last query
   - Type 'clear' to clear the terminal screen
   - Type 'exit' to simulate shutting down
======================================================================`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastChunks, setLastChunks] = useState<RetrievedChunk[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Simulated knowledge retrieval matching local documents
  const sampleQA: Record<string, { answer: string; chunks: RetrievedChunk[] }> = {
    revenue: {
      answer: "According to the Quarterly Financial Report, total operating revenue for Q3 reached $48.2M, representing an 18.5% year-over-year growth. In addition, R&D expenditures were $11.4M with high priority allocated to edge AI and on-premise inference systems.",
      chunks: [
        {
          index: 1,
          source: "quarterly_financial_report.pdf",
          page: 2,
          similarityScore: 0.89,
          content: "Total operating revenue for Q3 reached $48.2M, reflecting an 18.5% YoY growth. R&D expenses totaled $11.4M with key focus on edge AI inference and private on-premise hardware deployment."
        },
        {
          index: 2,
          source: "quarterly_financial_report.pdf",
          page: 4,
          similarityScore: 0.82,
          content: "Gross margin for the quarter stabilized at 68.2%, driven by reduced external cloud compute fees due to the transition to local inference clusters."
        },
        {
          index: 3,
          source: "server_infrastructure_spec.txt",
          page: 1,
          similarityScore: 0.73,
          content: "Capital expenditure on local compute infrastructure yielded a 40% reduction in external API recurring billing throughout Q2 and Q3."
        }
      ]
    },
    server: {
      answer: "The infrastructure specification states that all on-premise compute nodes run Ubuntu 24.04 LTS with CUDA 12.4. The local Ollama daemon binds strictly to 127.0.0.1:11434 with persistent model caching and dual NVIDIA RTX 4090 GPUs for sub-second token generation.",
      chunks: [
        {
          index: 1,
          source: "server_infrastructure_spec.txt",
          page: 1,
          similarityScore: 0.93,
          content: "All on-premise compute nodes run Ubuntu 24.04 LTS with CUDA 12.4. Local Ollama daemon binds to 127.0.0.1:11434 with persistent model cache."
        },
        {
          index: 2,
          source: "server_infrastructure_spec.txt",
          page: 2,
          similarityScore: 0.85,
          content: "Hardware Configuration: Dual RTX 4090 24GB VRAM per worker node. ChromaDB vector database is hosted on NVMe SSD arrays with direct memory-mapped file access."
        },
        {
          index: 3,
          source: "security_compliance_policy.pdf",
          page: 3,
          similarityScore: 0.74,
          content: "Network security rules: Port 11434 must remain strictly bound to localhost loopback or internal wireguard mesh. No public internet ingress is permitted."
        }
      ]
    },
    security: {
      answer: "According to Mandate SEC-04 in the Security Compliance Policy, proprietary engineering and corporate documents are strictly prohibited from leaving the intranet perimeter. Commercial cloud-based LLM APIs are banned for Level 3 intellectual property, requiring all RAG pipelines to run on local hardware.",
      chunks: [
        {
          index: 1,
          source: "security_compliance_policy.pdf",
          page: 2,
          similarityScore: 0.94,
          content: "Mandate SEC-04: Proprietary engineering documents must never leave intranet perimeter. Cloud-based LLM APIs are prohibited for Level 3 IP."
        },
        {
          index: 2,
          source: "security_compliance_policy.pdf",
          page: 5,
          similarityScore: 0.86,
          content: "Data retention: Local vector stores (ChromaDB) must utilize encrypted local block volumes and must not replicate to non-approved external cloud object stores."
        },
        {
          index: 3,
          source: "server_infrastructure_spec.txt",
          page: 3,
          similarityScore: 0.77,
          content: "Audit logging: All prompt and retrieval queries in the local RAG CLI loop are retained in rotating local disk logs without external telemetry."
        }
      ]
    },
    onboarding: {
      answer: "According to Section 1 of company_policies.txt, employee onboarding requires submitting Form I-9/National ID verification within 3 business days, IT hardware/credential provisioning on Day 1, and mandatory compliance training (Security, Privacy, Conduct) within 14 calendar days. In addition, new hires follow a structured 30-60-90 day milestone plan under an introductory 90-day probationary period.",
      chunks: [
        {
          index: 1,
          source: "company_policies.txt",
          page: 1,
          similarityScore: 0.96,
          content: "1.1 First-Day Orientation & Verification: All new hires must complete formal orientation with People Operations on their first business day: Form I-9 submitted within 3 business days; mandatory compliance training within first 14 calendar days."
        },
        {
          index: 2,
          source: "company_policies.txt",
          page: 1,
          similarityScore: 0.91,
          content: "1.2 The 30-60-90 Day Onboarding Plan: Days 1-30: System access, team shadow sessions, SOPs. Days 31-60: Starter task ownership. Days 61-90: Full functional autonomy, KPI alignment."
        },
        {
          index: 3,
          source: "company_policies.txt",
          page: 1,
          similarityScore: 0.85,
          content: "1.3 Probationary Period: All new full-time employees are subject to an introductory 90-day probationary period evaluated bi-weekly."
        }
      ]
    },
    leave: {
      answer: "Under Section 2 (Leave & Time-Off Policy) in company_policies.txt: Full-time employees accrue 20 days of Paid Time Off (PTO) per year (up to 5 days rollover allowed into next year). In addition, employees receive 10 paid sick days annually (medical note required if absent >3 consecutive days; 2 days usable for mental wellness). Eligible employees also receive 16 weeks of 100% paid parental leave for primary caregivers (6 weeks for secondary caregivers).",
      chunks: [
        {
          index: 1,
          source: "company_policies.txt",
          page: 2,
          similarityScore: 0.95,
          content: "2.1 Annual Paid Time Off (PTO): Full-time employees accrue 20 days of PTO per calendar year (1.67 days/month). Max 5 days rollover into the next calendar year. Advance notice: 2 weeks notice for 3+ consecutive days."
        },
        {
          index: 2,
          source: "company_policies.txt",
          page: 2,
          similarityScore: 0.92,
          content: "2.2 Sick and Medical Leave: 10 paid sick days per year. Absences > 3 consecutive working days require a physician note. Up to 2 days may be taken as mental wellness recharge days."
        },
        {
          index: 3,
          source: "company_policies.txt",
          page: 2,
          similarityScore: 0.87,
          content: "2.3 Parental & Family Leave: 16 weeks of 100% paid parental leave for primary caregivers; 6 weeks for secondary caregivers after 6 months continuous active service."
        }
      ]
    },
    exit: {
      answer: "Under Section 3 (Exit & Separation Policy) in company_policies.txt: Individual contributors must provide at least 2 weeks (14 calendar days) written notice, while managers require 4 weeks. The employee must complete a formal Knowledge Transfer (KT) document, conduct two handover briefing sessions, and return all company equipment (laptop, security badges, tokens) by 5:00 PM on their final working day. Accrued unused PTO is paid out in the final paycheck.",
      chunks: [
        {
          index: 1,
          source: "company_policies.txt",
          page: 3,
          similarityScore: 0.96,
          content: "3.1 Resignation & Notice Periods: Individual contributors: Minimum 2 weeks (14 calendar days) written notice. Team leads/managers: Minimum 4 weeks notice."
        },
        {
          index: 2,
          source: "company_policies.txt",
          page: 3,
          similarityScore: 0.93,
          content: "3.2 Knowledge Transfer & Handover: Must complete a structured KT document, transfer project ownership, and conduct at least two handover briefing meetings."
        },
        {
          index: 3,
          source: "company_policies.txt",
          page: 3,
          similarityScore: 0.89,
          content: "3.3 Company Asset Return & 3.4 Final Paycheck: Return laptops, monitors, badges, and tokens by 5:00 PM on last day. Unused accrued PTO paid out on final settlement."
        }
      ]
    }
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isGenerating) return;

    setInput('');

    // Handle CLI commands
    if (query.toLowerCase() === 'clear') {
      setMessages([]);
      return;
    }

    if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit' || query.toLowerCase() === 'q') {
      setMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, type: 'user', text: query, timestamp: new Date().toLocaleTimeString() },
        { id: `s-${Date.now()}`, type: 'system', text: '[!] Exiting Local RAG session. ChromaDB flushed to disk. Goodbye!', timestamp: new Date().toLocaleTimeString() }
      ]);
      return;
    }

    if (query.toLowerCase() === 'sources') {
      if (!lastChunks || lastChunks.length === 0) {
        setMessages(prev => [
          ...prev,
          { id: `u-${Date.now()}`, type: 'user', text: query, timestamp: new Date().toLocaleTimeString() },
          { id: `s-${Date.now()}`, type: 'system', text: '[!] No previous query found to display sources for.', timestamp: new Date().toLocaleTimeString() }
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, type: 'user', text: query, timestamp: new Date().toLocaleTimeString() },
        {
          id: `src-${Date.now()}`,
          type: 'sources',
          text: `Retrieved ${lastChunks.length} chunks from local ChromaDB:`,
          timestamp: new Date().toLocaleTimeString(),
          chunks: lastChunks
        }
      ]);
      return;
    }

    // Process normal query
    const userMsgId = `u-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: userMsgId, type: 'user', text: query, timestamp: new Date().toLocaleTimeString() }
    ]);

    setIsGenerating(true);

    // Determine relevant QA or fallback
    const qLower = query.toLowerCase();
    let match = sampleQA.revenue;
    if (qLower.includes('onboard') || qLower.includes('new hire') || qLower.includes('probation') || qLower.includes('orientation') || qLower.includes('i-9') || qLower.includes('30-60-90')) {
      match = sampleQA.onboarding;
    } else if (qLower.includes('leave') || qLower.includes('pto') || qLower.includes('vacation') || qLower.includes('sick') || qLower.includes('parental') || qLower.includes('holiday') || qLower.includes('time off') || qLower.includes('time-off')) {
      match = sampleQA.leave;
    } else if (qLower.includes('exit') || qLower.includes('resign') || qLower.includes('notice') || qLower.includes('handover') || qLower.includes('separation') || qLower.includes('asset') || qLower.includes('last day')) {
      match = sampleQA.exit;
    } else if (qLower.includes('server') || qLower.includes('hardware') || qLower.includes('ubuntu') || qLower.includes('spec') || qLower.includes('gpu')) {
      match = sampleQA.server;
    } else if (qLower.includes('security') || qLower.includes('cloud') || qLower.includes('policy') || qLower.includes('compliance') || qLower.includes('api')) {
      match = sampleQA.security;
    } else if (qLower.includes('revenue') || qLower.includes('profit') || qLower.includes('financial') || qLower.includes('money') || qLower.includes('q3')) {
      match = sampleQA.revenue;
    } else {
      // General synthesised answer
      match = {
        answer: `Based on the local documents in ./data, the query relates to internal operational policies. The context highlights that all inference operations run offline using Ollama with persistent ChromaDB storage to guarantee complete privacy and zero data leakage.`,
        chunks: [
          {
            index: 1,
            source: "security_compliance_policy.pdf",
            page: 1,
            similarityScore: 0.81,
            content: "Policy guidelines require all document ingestion to remain confined to on-premise hardware storage nodes."
          },
          {
            index: 2,
            source: "server_infrastructure_spec.txt",
            page: 2,
            similarityScore: 0.75,
            content: "Local vector search utilizes ChromaDB with HNSW indexes for sub-5ms cosine retrieval."
          },
          {
            index: 3,
            source: "quarterly_financial_report.pdf",
            page: 1,
            similarityScore: 0.69,
            content: "Strategic initiatives in Q3 center on autonomous private AI pipelines."
          }
        ]
      };
    }

    setLastChunks(match.chunks);

    // Simulate streaming response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          type: 'assistant',
          text: match.answer,
          timestamp: new Date().toLocaleTimeString(),
          chunks: match.chunks
        }
      ]);
      setIsGenerating(false);
    }, 650);
  };

  const samplePrompts = [
    "What is the employee onboarding and 30-60-90 day plan?",
    "How many PTO and sick leave days do employees get?",
    "What is the exit policy, notice period, and asset return process?",
    "What was the Q3 operating revenue and R&D spending?",
    "What are the on-premise server and GPU specs?",
    "sources"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Sidebar: Ingested Local Documents */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Ingested Local Files (./data)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            These sample documents simulate what the script indexes automatically into ChromaDB:
          </p>
          <div className="space-y-2.5">
            {PRECONFIGURED_DOCS.map((doc) => (
              <div key={doc.id} className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between font-mono text-zinc-200">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">{doc.size}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                  <span>{doc.pages} pages</span>
                  <span className="text-emerald-400 font-mono">{doc.chunkCount} chunks</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 italic bg-zinc-900/50 p-1.5 rounded">
                  "{doc.snippet}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Test Prompts
          </h4>
          <div className="space-y-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isGenerating}
                className="w-full text-left text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 rounded-md px-2.5 py-1.5 transition-colors font-mono cursor-pointer flex items-center justify-between group"
              >
                <span className="truncate">{prompt}</span>
                <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div className="lg:col-span-3 flex flex-col h-[640px] bg-[#0c0e14] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Terminal Title Bar */}
        <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-zinc-400 ml-2 flex items-center gap-1">
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              bash - python local_rag.py --llm llama3 --top-k 3
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMessages([])}
              title="Clear terminal"
              className="text-zinc-500 hover:text-zinc-300 text-xs p-1 rounded hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5 rounded">
              CLI Active
            </span>
          </div>
        </div>

        {/* Terminal Content Stream */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-300 space-y-4 leading-relaxed">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.type === 'system' && (
                <pre className="text-zinc-500 whitespace-pre-wrap font-mono select-text bg-zinc-950/40 p-2.5 rounded border border-zinc-900">
                  {msg.text}
                </pre>
              )}

              {msg.type === 'user' && (
                <div className="flex items-start space-x-2 text-zinc-100">
                  <span className="text-cyan-400 font-bold select-none">You:</span>
                  <span className="text-zinc-200 select-text">{msg.text}</span>
                </div>
              )}

              {msg.type === 'assistant' && (
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold select-none">Assistant:</span>
                    <span className="text-zinc-200 select-text leading-relaxed">{msg.text}</span>
                  </div>

                  {msg.chunks && msg.chunks.length > 0 && (
                    <div className="ml-5 mt-2 bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-[11px]">
                      <div className="text-zinc-400 font-semibold mb-1.5 flex items-center justify-between">
                        <span className="text-emerald-400">⚡ Top {msg.chunks.length} Retrieved Chunks (ChromaDB):</span>
                        <span className="text-[10px] text-zinc-500">Type 'sources' for full text</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {msg.chunks.map((chunk) => (
                          <div key={chunk.index} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-400">
                            <div className="flex items-center justify-between text-zinc-300 font-mono text-[10px]">
                              <span className="truncate">{chunk.source}</span>
                              <span className="text-emerald-400">{Math.round(chunk.similarityScore * 100)}%</span>
                            </div>
                            <div className="text-zinc-500 mt-1 line-clamp-2 text-[10px]">
                              {chunk.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {msg.type === 'sources' && msg.chunks && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-3">
                  <div className="text-emerald-400 font-bold">
                    --- Top {msg.chunks.length} Grounding Chunks from ChromaDB ---
                  </div>
                  {msg.chunks.map((c) => (
                    <div key={c.index} className="border-t border-zinc-900 pt-2">
                      <div className="text-zinc-400 font-semibold">
                        [Chunk {c.index}] Source: <span className="text-zinc-200">{c.source}</span> {c.page ? `| Page ${c.page}` : ''} | Score: {(c.similarityScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-zinc-300 text-xs mt-1 bg-zinc-900/60 p-2 rounded">
                        {c.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center space-x-2 text-zinc-400">
              <span className="text-emerald-400 font-bold">Assistant:</span>
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Retrieving chunks from ChromaDB & streaming tokens via Ollama...
              </span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center space-x-2"
        >
          <span className="text-cyan-400 font-mono font-bold select-none text-xs pl-1">
            You:
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or type 'sources', 'clear', 'exit'..."
            disabled={isGenerating}
            id="terminal-cli-input"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            id="terminal-submit-btn"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

      </div>

    </div>
  );
};
