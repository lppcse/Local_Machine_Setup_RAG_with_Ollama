export const PIP_COMMANDS = `pip install langchain langchain-community langchain-core langchain-text-splitters langchain-chroma langchain-ollama chromadb pypdf sentence-transformers`;

export const OLLAMA_COMMANDS = `# 1. Install & start Ollama (if not already installed)
# macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh
# Windows: Download from https://ollama.com/download

# 2. Pull the local embedding model (lightweight, 274MB)
ollama pull nomic-embed-text

# 3. Pull your preferred local LLM (e.g., Llama 3 8B or Mistral 7B)
ollama pull llama3

# (Optional alternative models)
# ollama pull mistral
# ollama pull deepseek-r1:8b`;

export const RUN_COMMANDS = `# Run with default settings (scans ./data directory, uses llama3 and nomic-embed-text):
python local_rag.py

# Or customize flags:
python local_rag.py --data ./my_docs --llm mistral --top-k 4 --reindex`;

export const PYTHON_SCRIPT_CODE = `#!/usr/bin/env python3
"""
=============================================================================
PRODUCTION-READY 100% LOCAL RAG SYSTEM (LangChain + Ollama + ChromaDB)
=============================================================================
Runs completely offline on your local machine with zero external API calls:
- Local LLM: Ollama (llama3, mistral, deepseek-r1, etc.)
- Local Embeddings: Ollama (nomic-embed-text) or HuggingFace (all-MiniLM-L6-v2)
- Local Vector Database: ChromaDB (persisted locally on disk)
- Document Ingestion: PDF (.pdf) & Text (.txt) loaders with chunking
- Retrieval Chain: Top-3 chunk semantic search with strict context prompting
- Terminal Loop: Interactive CLI with streaming responses and source tracing
=============================================================================
"""

import argparse
import os
import sys
import glob
from pathlib import Path
from typing import List

# ---------------------------------------------------------------------------
# LangChain Imports
# ---------------------------------------------------------------------------
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_chroma import Chroma

# Embedding options
from langchain_ollama import OllamaEmbeddings, ChatOllama

# Optional HuggingFace embeddings fallback
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False


# ---------------------------------------------------------------------------
# Configuration Defaults
# ---------------------------------------------------------------------------
DEFAULT_DATA_DIR = "./data"
DEFAULT_DB_DIR = "./chroma_db"
DEFAULT_LLM_MODEL = "llama3"
DEFAULT_EMBEDDING_MODEL = "nomic-embed-text"
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
DEFAULT_TOP_K = 3
OLLAMA_BASE_URL = "http://localhost:11434"


# ---------------------------------------------------------------------------
# 1. Embedding Model Setup
# ---------------------------------------------------------------------------
def get_embedding_function(embedding_type: str = "ollama", model_name: str = DEFAULT_EMBEDDING_MODEL):
    """
    Initializes and returns a local embedding model.
    No API keys or cloud connections required.
    """
    print(f"[*] Initializing local embeddings [{embedding_type}]: {model_name}...")
    if embedding_type.lower() == "ollama":
        return OllamaEmbeddings(
            model=model_name,
            base_url=OLLAMA_BASE_URL
        )
    elif embedding_type.lower() == "huggingface":
        if not HUGGINGFACE_AVAILABLE:
            raise ImportError(
                "sentence-transformers is not installed. "
                "Run: pip install sentence-transformers"
            )
        hf_model = model_name if model_name != DEFAULT_EMBEDDING_MODEL else "sentence-transformers/all-MiniLM-L6-v2"
        return HuggingFaceEmbeddings(
            model_name=hf_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
    else:
        raise ValueError(f"Unsupported embedding type: '{embedding_type}'. Choose 'ollama' or 'huggingface'.")


# ---------------------------------------------------------------------------
# 2. Local LLM Setup
# ---------------------------------------------------------------------------
def get_local_llm(model_name: str = DEFAULT_LLM_MODEL, temperature: float = 0.2):
    """
    Initializes and returns a local Ollama LLM instance with streaming support.
    """
    print(f"[*] Connecting to local LLM via Ollama: {model_name} (temperature={temperature})...")
    return ChatOllama(
        model=model_name,
        temperature=temperature,
        base_url=OLLAMA_BASE_URL
    )


# ---------------------------------------------------------------------------
# 3. Document Ingestion and Chunking
# ---------------------------------------------------------------------------
def load_single_file(file_path: str) -> List[Document]:
    """Loads a single .pdf or .txt document."""
    ext = Path(file_path).suffix.lower()
    try:
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
            return loader.load()
        elif ext in [".txt", ".md"]:
            loader = TextLoader(file_path, encoding="utf-8")
            return loader.load()
        else:
            print(f"[!] Warning: Skipping unsupported file type '{ext}': {file_path}")
            return []
    except Exception as e:
        print(f"[!] Error loading file {file_path}: {e}")
        return []


def load_documents_from_path(target_path: str) -> List[Document]:
    """
    Scans a directory or specific file path, supporting both .pdf and .txt files.
    """
    documents: List[Document] = []
    p = Path(target_path)

    if not p.exists():
        print(f"[!] Target path does not exist: {target_path}")
        return []

    if p.is_file():
        return load_single_file(str(p))

    print(f"[*] Scanning directory '{target_path}' for documents (.pdf, .txt, .md)...")
    for file_path in p.rglob("*"):
        if file_path.suffix.lower() in [".pdf", ".txt", ".md"]:
            docs = load_single_file(str(file_path))
            documents.extend(docs)

    print(f"[*] Loaded {len(documents)} raw document page(s)/section(s).")
    return documents


def split_documents(
    documents: List[Document],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> List[Document]:
    """
    Splits raw documents into overlapping text chunks for optimal semantic retrieval.
    """
    print(f"[*] Splitting text chunks (chunk_size={chunk_size}, chunk_overlap={chunk_overlap})...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\\n\\n", "\\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"[*] Created {len(chunks)} total chunks from ingested documents.")
    return chunks


# ---------------------------------------------------------------------------
# 4. Local Vector Database (ChromaDB)
# ---------------------------------------------------------------------------
def get_or_create_vectorstore(
    persist_directory: str,
    embeddings,
    chunks: List[Document] = None,
    force_reindex: bool = False
) -> Chroma:
    """
    Loads an existing local ChromaDB vector store or ingests new document chunks.
    All embeddings and index metadata are persisted to disk locally.
    """
    db_exists = os.path.exists(persist_directory) and bool(os.listdir(persist_directory))

    if db_exists and not force_reindex:
        print(f"[*] Loading existing Chroma vector store from '{persist_directory}'...")
        vectorstore = Chroma(
            persist_directory=persist_directory,
            embedding_function=embeddings
        )
        count = vectorstore._collection.count()
        print(f"[*] Connected to Chroma database ({count} vectors indexed).")
        return vectorstore

    if not chunks:
        if db_exists:
            return Chroma(persist_directory=persist_directory, embedding_function=embeddings)
        raise ValueError(
            f"No existing vector database found in '{persist_directory}' and no documents provided to ingest."
        )

    print(f"[*] Creating new persistent Chroma vector store at '{persist_directory}'...")
    os.makedirs(persist_directory, exist_ok=True)
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    count = vectorstore._collection.count()
    print(f"[✓] Successfully embedded and persisted {count} chunks to '{persist_directory}'.")
    return vectorstore


# ---------------------------------------------------------------------------
# 5. RAG Chain Construction
# ---------------------------------------------------------------------------
RAG_SYSTEM_PROMPT = """You are a helpful, accurate, and concise AI assistant powered by a local RAG pipeline.
Answer the question using ONLY the provided context snippets below.
If the answer cannot be found or deduced from the context, clearly state:
"I do not have enough information in the provided documents to answer that."
Do not make up facts or extrapolate beyond the provided text.

Context:
{context}

Question:
{question}

Answer:"""


def format_docs(docs: List[Document]) -> str:
    """
    Formats retrieved context documents with source metadata for attribution.
    """
    formatted_chunks = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", None)
        page_info = f" (Page {page + 1})" if page is not None else ""
        formatted_chunks.append(
            f"--- [Chunk {i} | Source: {Path(source).name}{page_info}] ---\\n"
            f"{doc.page_content.strip()}"
        )
    return "\\n\\n".join(formatted_chunks)


def build_rag_chain(retriever, llm):
    """
    Constructs an idiomatic LangChain Expression Language (LCEL) retrieval chain.
    """
    prompt = ChatPromptTemplate.from_template(RAG_SYSTEM_PROMPT)
    output_parser = StrOutputParser()

    chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | output_parser
    )
    return chain


# ---------------------------------------------------------------------------
# 6. Interactive Terminal Chat Loop
# ---------------------------------------------------------------------------
def run_interactive_cli(retriever, rag_chain):
    """
    Starts the interactive CLI session.
    """
    print("\\n" + "=" * 70)
    print(" 🚀 100% LOCAL RAG SYSTEM READY (Ollama + ChromaDB)")
    print("=" * 70)
    print(" Commands:")
    print("   - Type your question and press Enter")
    print("   - Type 'sources' to inspect top retrieved chunks for last query")
    print("   - Type 'clear' to clear the terminal screen")
    print("   - Type 'exit' or 'quit' or 'q' to shut down")
    print("=" * 70 + "\\n")

    last_query = None
    last_retrieved_docs = []

    while True:
        try:
            user_input = input("\\n\\033[1;36mYou:\\033[0m ").strip()

            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                print("\\n[!] Exiting Local RAG session. Goodbye!")
                break

            if user_input.lower() == "clear":
                os.system("cls" if os.name == "nt" else "clear")
                continue

            if user_input.lower() == "sources":
                if not last_retrieved_docs:
                    print("\\n[!] No previous query to inspect sources for.")
                    continue
                print("\\n" + "-" * 50)
                print(f"Top {len(last_retrieved_docs)} Retrieved Chunks for: '{last_query}'")
                print("-" * 50)
                for idx, doc in enumerate(last_retrieved_docs, 1):
                    src = doc.metadata.get("source", "Unknown")
                    page = doc.metadata.get("page", None)
                    p_str = f" | Page {page + 1}" if page is not None else ""
                    print(f"\\n[Chunk {idx}] Source: {src}{p_str}")
                    print(doc.page_content.strip()[:400] + ("..." if len(doc.page_content) > 400 else ""))
                print("-" * 50)
                continue

            last_query = user_input
            last_retrieved_docs = retriever.invoke(user_input)

            print(f"\\n\\033[1;32mAssistant:\\033[0m ", end="", flush=True)
            for chunk in rag_chain.stream(user_input):
                print(chunk, end="", flush=True)
            print()

        except KeyboardInterrupt:
            print("\\n\\n[!] Session interrupted by user. Exiting...")
            break
        except Exception as e:
            print(f"\\n[!] Error during inference: {e}")
            print("Tip: Ensure Ollama is running (\`ollama serve\`) and model is pulled.")


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="100% Local RAG with Ollama & ChromaDB")
    parser.add_argument("--data", default=DEFAULT_DATA_DIR, help="Path to document file or directory (.pdf, .txt)")
    parser.add_argument("--db-dir", default=DEFAULT_DB_DIR, help="Path to store/read ChromaDB vector store")
    parser.add_argument("--llm", default=DEFAULT_LLM_MODEL, help="Ollama LLM model name (e.g. llama3, mistral)")
    parser.add_argument("--embeddings", default="ollama", choices=["ollama", "huggingface"], help="Embedding engine")
    parser.add_argument("--embed-model", default=DEFAULT_EMBEDDING_MODEL, help="Embedding model name")
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE, help="Text splitter chunk size")
    parser.add_argument("--chunk-overlap", type=int, default=DEFAULT_CHUNK_OVERLAP, help="Text splitter chunk overlap")
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K, help="Number of retrieved context chunks")
    parser.add_argument("--reindex", action="store_true", help="Force re-indexing of documents even if DB exists")
    parser.add_argument("--temp", type=float, default=0.2, help="Temperature for local LLM generation")

    args = parser.parse_args()

    print("\\n" + "=" * 70)
    print(" 🛠️  CONFIGURING LOCAL RAG PIPELINE")
    print("=" * 70)
    print(f" • Document Source   : {args.data}")
    print(f" • Vector Store Path : {args.db_dir}")
    print(f" • Local LLM Model   : {args.llm} (via Ollama)")
    print(f" • Embedding Engine  : {args.embeddings} ({args.embed_model})")
    print(f" • Chunking          : size={args.chunk_size}, overlap={args.chunk_overlap}")
    print(f" • Retrieval Top-K   : {args.top_k}")
    print("=" * 70 + "\\n")

    try:
        embeddings = get_embedding_function(
            embedding_type=args.embeddings,
            model_name=args.embed_model
        )
    except Exception as e:
        print(f"[!] Failed to initialize embeddings: {e}")
        sys.exit(1)

    db_exists = os.path.exists(args.db_dir) and bool(os.listdir(args.db_dir))
    chunks = []

    if not db_exists or args.reindex:
        raw_docs = load_documents_from_path(args.data)
        if not raw_docs:
            if not db_exists:
                print(f"[*] Creating sample document in '{args.data}/sample_ai_notes.txt'...")
                os.makedirs(args.data, exist_ok=True)
                sample_file = os.path.join(args.data, "sample_ai_notes.txt")
                with open(sample_file, "w", encoding="utf-8") as f:
                    f.write(
                        "Local Retrieval-Augmented Generation (RAG) Architecture\\n"
                        "------------------------------------------------------\\n"
                        "Local RAG allows organizations to query their private proprietary documents\\n"
                        "without transmitting confidential data over external APIs.\\n\\n"
                        "Key components include:\\n"
                        "1. Local LLM Server: Ollama manages quantization, GPU offloading, and execution of models like Llama 3 or Mistral.\\n"
                        "2. Embedding Model: Nomic-embed-text provides high quality 768-dimensional dense vector representations.\\n"
                        "3. Vector Store: ChromaDB stores chunk vectors with HNSW indexing for sub-millisecond approximate nearest neighbor searches.\\n"
                        "4. Retrieval Strategy: Top-k chunks are dynamically inserted into prompt templates to ground the model.\\n"
                    )
                raw_docs = load_documents_from_path(sample_file)
        chunks = split_documents(raw_docs, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)

    try:
        vectorstore = get_or_create_vectorstore(
            persist_directory=args.db_dir,
            embeddings=embeddings,
            chunks=chunks,
            force_reindex=args.reindex
        )
    except Exception as e:
        print(f"[!] Vector store initialization failed: {e}")
        sys.exit(1)

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": args.top_k}
    )

    try:
        llm = get_local_llm(model_name=args.llm, temperature=args.temp)
        rag_chain = build_rag_chain(retriever=retriever, llm=llm)
    except Exception as e:
        print(f"[!] Failed to initialize Ollama LLM: {e}")
        sys.exit(1)

    run_interactive_cli(retriever=retriever, rag_chain=rag_chain)


if __name__ == "__main__":
    main()
`;

export const README_CONTENT = `# 100% Local RAG System (Ollama + LangChain + ChromaDB)

A complete, production-ready, air-gapped Retrieval-Augmented Generation (RAG) system running **100% locally on your machine**. Zero external API calls, zero API costs, and total data privacy.

---

## 📋 System Requirements & Architecture

- **OS**: macOS, Linux, or Windows (WSL2 recommended for Windows)
- **Python**: Version 3.9 or higher (Python 3.10 / 3.11 recommended)
- **Local LLM Runner**: [Ollama](https://ollama.com/)
- **Default LLM**: \`llama3\` (Meta Llama 3 8B) or \`mistral\` (Mistral 7B)
- **Default Embeddings**: \`nomic-embed-text\` (768-dimensional local dense embeddings)
- **Vector Database**: [ChromaDB](https://www.trychroma.com/) (persisted locally to disk in \`./chroma_db\`)
- **Document Formats**: PDF (\`.pdf\`), Plain Text (\`.txt\`), Markdown (\`.md\`)

---

## 🚀 Quick Setup Guide (Step-by-Step)

### Step 1: Install & Start Ollama
- **macOS / Linux**:
  \`\`\`bash
  curl -fsSL https://ollama.com/install.sh | sh
  \`\`\`
- **Windows**: Download installer from [https://ollama.com/download](https://ollama.com/download)

Verify Ollama is active:
\`\`\`bash
ollama --version
# (If not running, run 'ollama serve')
\`\`\`

### Step 2: Download the Local Models
\`\`\`bash
# 1. Pull the local embedding model (~274 MB)
ollama pull nomic-embed-text

# 2. Pull the default conversational LLM (~4.7 GB)
ollama pull llama3

# (Optional: Mistral 7B)
ollama pull mistral
\`\`\`

### Step 3: Set Up Project & Virtual Environment
\`\`\`bash
mkdir local-rag && cd local-rag
python3 -m venv venv

# macOS / Linux:
source venv/bin/activate
# Windows (CMD):
venv\\Scripts\\activate.bat
\`\`\`

### Step 4: Install Python Dependencies
\`\`\`bash
pip install -r requirements.txt
# Or:
pip install langchain langchain-community langchain-core langchain-text-splitters langchain-ollama langchain-chroma chromadb pypdf sentence-transformers
\`\`\`

### Step 5: Add Your Documents
\`\`\`bash
mkdir data
# Copy your private files into data/ (.pdf or .txt)
cp /path/to/my_notes.pdf ./data/
\`\`\`

### Step 6: Run the Local RAG System
\`\`\`bash
python local_rag.py
\`\`\`

---

## 💬 Terminal Chat Commands
- **Ask questions**: Type question and press Enter. Responses stream token-by-token.
- \`sources\`: Inspect the top-3 chunks, source filenames, and page numbers.
- \`clear\`: Clear screen.
- \`exit\` or \`quit\`: Flush ChromaDB index and exit.

## ⚙️ CLI Flags
- \`--data ./my_folder\`: Custom document path
- \`--llm mistral\`: Use Mistral instead of Llama 3
- \`--top-k 5\`: Retrieve top 5 chunks
- \`--reindex\`: Force rebuild ChromaDB vectors
- \`--embeddings huggingface\`: Use local sentence-transformers (all-MiniLM-L6-v2)`;

export const COMPANY_POLICIES_TEXT = `# STANDARD COMPANY POLICY HANDBOOK
# Document ID: POL-HR-2026-V1
# Effective Date: January 1, 2026
# Target Scope: All Full-Time, Part-Time, and Contract Employees

================================================================================
SECTION 1: EMPLOYEE ONBOARDING POLICY
================================================================================

1.1 First-Day Orientation & Verification
All new hires must complete formal orientation with People Operations on their first business day:
- Identity and Work Authorization verification (Form I-9 / National ID) must be submitted within 3 business days of hire.
- Hardware and credential provisioning: IT Security assigns a company laptop, standard security tokens, and corporate email access.
- Mandatory compliance training (Data Privacy, Information Security, and Workplace Conduct) must be completed within the first 14 calendar days.

1.2 The 30-60-90 Day Onboarding Plan
Each employee is assigned a department mentor and manager-reviewed milestone plan:
- Days 1 to 30: System access setup, team shadow sessions, reading technical/operational standard operating procedures (SOPs), and initial 1-on-1 check-ins.
- Days 31 to 60: Independent ownership of starter tasks, integration into sprint or team workflows, and 60-day progress review.
- Days 61 to 90: Full functional autonomy, key performance indicator (KPI) alignment, and 90-day formal onboarding evaluation.

1.3 Probationary Period
- All new full-time employees are subject to an introductory 90-day probationary period.
- During this window, performance, role alignment, and adherence to company policies are assessed bi-weekly.
- Successful completion transitions the employee to regular full-time standing.

================================================================================
SECTION 2: LEAVE & TIME-OFF POLICY
================================================================================

2.1 Annual Paid Time Off (PTO)
- Full-time employees accrue 20 days of Paid Time Off (PTO) per calendar year, accrued semi-monthly at 1.67 days per month.
- Rollover rule: Employees may roll over a maximum of 5 unused PTO days into the subsequent calendar year. Any additional unused days beyond 5 expire on December 31.
- Advance notice: Standard vacation requests of 3 consecutive days or more require at least 2 weeks advance written notice via the HR portal.

2.2 Sick and Medical Leave
- Employees receive 10 paid sick days per year, credited on January 1st (or prorated upon hire date).
- Consecutive absence: For medical absences lasting more than 3 consecutive working days, a signed physician note or medical clearance certificate is mandatory upon return.
- Mental health wellness: Up to 2 of the 10 sick days may be taken as dedicated mental wellness recharge days without medical documentation.

2.3 Parental & Family Leave
- Primary caregiver leave: 16 weeks of 100% paid parental leave following childbirth, adoption, or foster placement.
- Secondary caregiver leave: 6 weeks of 100% paid parental leave.
- Eligibility: Available to employees after completing 6 months of continuous active service.

2.4 Bereavement & Compassionate Leave
- Up to 5 consecutive paid business days for immediate family members (spouse, child, parent, sibling).
- Up to 3 consecutive paid business days for extended family members (grandparents, in-laws).

2.5 Public Holidays & Floating Holidays
- The organization observes 10 standard national public holidays per year.
- Employees are additionally granted 2 floating cultural/personal holidays annually.

================================================================================
SECTION 3: EXIT & SEPARATION POLICY
================================================================================

3.1 Resignation & Notice Periods
- Individual contributors (IC): Minimum 2 weeks (14 calendar days) formal written notice to their direct manager and People Operations.
- Team leads and managers: Minimum 4 weeks (28 calendar days) formal written notice.
- Directors and executive staff: Minimum 60 days formal written notice.
- Resignations must be submitted in writing or via the official HR portal, stating the last working day.

3.2 Knowledge Transfer & Handover Protocol
Prior to the final working day, the departing employee must:
- Complete a structured Knowledge Transfer (KT) document detailing open project status, file locations, repository permissions, and team contacts.
- Reassign or transfer ownership of ongoing tickets, documents, cloud projects, and distribution lists.
- Conduct at least two handover briefing meetings with the designated backfill or department manager.

3.3 Company Asset Return
By 5:00 PM on the final working day, the employee must return all corporate property:
- Hardware: Company laptops, external monitors, mobile testing devices, chargers, and peripherals.
- Access tokens: Physical keycards, building access badges, and YubiKeys/security tokens.
- Digital accounts: Single Sign-On (SSO), email, Git repositories, and communication channels are automatically revoked at 6:00 PM on the termination date.

3.4 Final Paycheck & Benefits Continuation
- Final settlement: Payment of all earned wages, along with payout of accrued, unused PTO (calculated up to the last day worked), will be issued on the next regular payroll cycle or in accordance with local statutory labor regulations.
- Health benefits: Active corporate health coverage continues through the final calendar day of the separation month.
- COBRA / benefits continuation package notices are delivered electronically within 14 days post-separation.

3.5 Exit Interview
- An optional, confidential exit interview with a People Operations specialist is scheduled during the final week to gather feedback on company culture, leadership, and operational tooling.`;

export const ARCHITECTURE_STEPS = [
  {
    step: "1",
    title: "Document Ingestion",
    desc: "Loads local .pdf via PyPDFLoader or .txt/.md via TextLoader from your private folders.",
    badge: "PyPDF & TextLoader",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30"
  },
  {
    step: "2",
    title: "Overlapping Chunking",
    desc: "RecursiveCharacterTextSplitter slices text into 1,000-char blocks with 200-char semantic overlaps.",
    badge: "1,000 / 200 Chunks",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30"
  },
  {
    step: "3",
    title: "Local Dense Embedding",
    desc: "Ollama (nomic-embed-text) or HuggingFace (all-MiniLM-L6-v2) generates 768-dim vectors on your CPU/GPU.",
    badge: "Zero Cloud API Calls",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30"
  },
  {
    step: "4",
    title: "ChromaDB Persistence",
    desc: "Embeddings and metadata are indexed via HNSW and saved directly to disk in ./chroma_db.",
    badge: "Persistent Disk Store",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
  },
  {
    step: "5",
    title: "Top-3 Vector Retrieval",
    desc: "When a user asks a question, Chroma finds the top 3 most semantically aligned context chunks.",
    badge: "Cosine / L2 Similarity",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    step: "6",
    title: "Prompt Grounding & Stream",
    desc: "Llama 3 or Mistral synthesizes a grounded answer using only retrieved context inside the CLI loop.",
    badge: "LCEL Streaming Chain",
    color: "from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30"
  }
];

export const PRECONFIGURED_DOCS = [
  {
    id: "doc-policy",
    name: "company_policies.txt",
    type: "txt" as const,
    size: "4.8 KB",
    pages: 3,
    chunkCount: 8,
    snippet: "POL-HR-2026: Employee Onboarding (I-9 verification, 30-60-90 day plan), Leave Policy (20 PTO days, 10 sick days, 16 wks parental), and Exit Policy (2 weeks notice, asset return, KT protocol)."
  },
  {
    id: "doc-1",
    name: "quarterly_financial_report.pdf",
    type: "pdf" as const,
    size: "1.4 MB",
    pages: 14,
    chunkCount: 38,
    snippet: "Total operating revenue for Q3 reached $48.2M, reflecting an 18.5% YoY growth. R&D expenses totaled $11.4M with key focus on edge AI inference."
  },
  {
    id: "doc-2",
    name: "server_infrastructure_spec.txt",
    type: "txt" as const,
    size: "142 KB",
    pages: 4,
    chunkCount: 16,
    snippet: "All on-premise compute nodes run Ubuntu 24.04 LTS with CUDA 12.4. Local Ollama daemon binds to 127.0.0.1:11434 with persistent model cache."
  },
  {
    id: "doc-3",
    name: "security_compliance_policy.pdf",
    type: "pdf" as const,
    size: "820 KB",
    pages: 9,
    chunkCount: 22,
    snippet: "Mandate SEC-04: Proprietary engineering documents must never leave intranet perimeter. Cloud-based LLM APIs are prohibited for Level 3 IP."
  }
];
