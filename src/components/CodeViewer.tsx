import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2, FileText } from 'lucide-react';
import { PYTHON_SCRIPT_CODE, README_CONTENT, COMPANY_POLICIES_TEXT } from '../data/ragScript';

export const CodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'script' | 'requirements' | 'readme' | 'policies'>('script');
  const [copied, setCopied] = useState(false);

  const requirementsText = `# Core LangChain packages
langchain>=0.2.0
langchain-community>=0.2.0
langchain-core>=0.2.0
langchain-text-splitters>=0.2.0

# Ollama integration
langchain-ollama>=0.1.0
ollama>=0.2.0

# Vector Database
langchain-chroma>=0.1.0
chromadb>=0.5.0

# Document loaders & processing
pypdf>=4.2.0

# Optional: Local HuggingFace embeddings
sentence-transformers>=3.0.0`;

  const currentContent = 
    activeFile === 'script' 
      ? PYTHON_SCRIPT_CODE 
      : activeFile === 'requirements' 
        ? requirementsText 
        : activeFile === 'readme'
          ? README_CONTENT
          : COMPANY_POLICIES_TEXT;
  
  const currentFileName = 
    activeFile === 'script' 
      ? 'local_rag.py' 
      : activeFile === 'requirements' 
        ? 'requirements.txt' 
        : activeFile === 'readme'
          ? 'README.md'
          : 'company_policies.txt';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mimeType = 
      activeFile === 'script' 
        ? 'text/x-python' 
        : activeFile === 'readme' 
          ? 'text/markdown' 
          : 'text/plain';
    const blob = new Blob([currentContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = currentContent.split('\n');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* File Header Bar */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFile('script')}
            id="tab-view-local-rag"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFile === 'script'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            local_rag.py
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              Primary Script
            </span>
          </button>

          <button
            onClick={() => setActiveFile('policies')}
            id="tab-view-policies"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFile === 'policies'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            company_policies.txt
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
              Data Document
            </span>
          </button>

          <button
            onClick={() => setActiveFile('requirements')}
            id="tab-view-requirements"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFile === 'requirements'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            requirements.txt
          </button>

          <button
            onClick={() => setActiveFile('readme')}
            id="tab-view-readme"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFile === 'readme'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            README.md
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              Setup Guide
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            {lines.length} lines • UTF-8
          </span>

          <button
            onClick={handleCopy}
            id="copy-viewer-btn"
            className="px-3 py-1.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : `Copy ${currentFileName}`}
          </button>

          <button
            onClick={handleDownload}
            id="download-viewer-btn"
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto bg-[#0d1117] p-4 text-xs font-mono leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isComment = line.trim().startsWith('#') || line.trim().startsWith('"""') || line.trim().startsWith('===');
              const isImport = line.trim().startsWith('import ') || line.trim().startsWith('from ');
              const isDef = line.trim().startsWith('def ') || line.trim().startsWith('class ');

              let lineClass = 'text-zinc-300';
              if (isComment) lineClass = 'text-zinc-500 italic';
              else if (isImport) lineClass = 'text-purple-300 font-semibold';
              else if (isDef) lineClass = 'text-cyan-300 font-semibold';
              else if (line.includes('return ') || line.includes('yield ') || line.includes('raise ')) lineClass = 'text-amber-300';

              return (
                <tr key={idx} className="hover:bg-zinc-800/40">
                  <td className="w-12 text-right pr-4 text-zinc-600 select-none user-select-none font-mono text-[11px] align-top">
                    {lineNum}
                  </td>
                  <td className={`whitespace-pre font-mono ${lineClass}`}>
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Feature Highlights */}
      <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> LangChain LCEL Syntax
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disk ChromaDB Persisted
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Token-by-Token Streaming
          </span>
        </div>
        <div className="text-zinc-500 font-mono">
          Ready to run: python local_rag.py
        </div>
      </div>
    </div>
  );
};
