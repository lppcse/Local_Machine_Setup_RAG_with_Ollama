#!/usr/bin/env python3
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

    # If directory, find all .pdf and .txt / .md files
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
        separators=["\n\n", "\n", " ", ""]
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

    # If DB doesn't exist or reindexing requested
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
            f"--- [Chunk {i} | Source: {Path(source).name}{page_info}] ---\n"
            f"{doc.page_content.strip()}"
        )
    return "\n\n".join(formatted_chunks)


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
    print("\n" + "=" * 70)
    print(" 🚀 100% LOCAL RAG SYSTEM READY (Ollama + ChromaDB)")
    print("=" * 70)
    print(" Commands:")
    print("   - Type your question and press Enter")
    print("   - Type 'sources' to inspect top retrieved chunks for last query")
    print("   - Type 'clear' to clear the terminal screen")
    print("   - Type 'exit' or 'quit' or 'q' to shut down")
    print("=" * 70 + "\n")

    last_query = None
    last_retrieved_docs = []

    while True:
        try:
            user_input = input("\n\033[1;36mYou:\033[0m ").strip()

            if not user_input:
                continue

            # Command: Exit
            if user_input.lower() in ["exit", "quit", "q"]:
                print("\n[!] Exiting Local RAG session. Goodbye!")
                break

            # Command: Clear
            if user_input.lower() == "clear":
                os.system("cls" if os.name == "nt" else "clear")
                continue

            # Command: View Last Sources
            if user_input.lower() == "sources":
                if not last_retrieved_docs:
                    print("\n[!] No previous query to inspect sources for.")
                    continue
                print("\n" + "-" * 50)
                print(f"Top {len(last_retrieved_docs)} Retrieved Chunks for: '{last_query}'")
                print("-" * 50)
                for idx, doc in enumerate(last_retrieved_docs, 1):
                    src = doc.metadata.get("source", "Unknown")
                    page = doc.metadata.get("page", None)
                    p_str = f" | Page {page + 1}" if page is not None else ""
                    print(f"\n[Chunk {idx}] Source: {src}{p_str}")
                    print(doc.page_content.strip()[:400] + ("..." if len(doc.page_content) > 400 else ""))
                print("-" * 50)
                continue

            # Retrieve relevant chunks
            last_query = user_input
            last_retrieved_docs = retriever.invoke(user_input)

            # Stream or generate the response
            print(f"\n\033[1;32mAssistant:\033[0m ", end="", flush=True)
            for chunk in rag_chain.stream(user_input):
                print(chunk, end="", flush=True)
            print()

        except KeyboardInterrupt:
            print("\n\n[!] Session interrupted by user. Exiting...")
            break
        except Exception as e:
            print(f"\n[!] Error during inference: {e}")
            print("Tip: Ensure Ollama is running (`ollama serve`) and model is pulled.")


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

    print("\n" + "=" * 70)
    print(" 🛠️  CONFIGURING LOCAL RAG PIPELINE")
    print("=" * 70)
    print(f" • Document Source   : {args.data}")
    print(f" • Vector Store Path : {args.db_dir}")
    print(f" • Local LLM Model   : {args.llm} (via Ollama)")
    print(f" • Embedding Engine  : {args.embeddings} ({args.embed_model})")
    print(f" • Chunking          : size={args.chunk_size}, overlap={args.chunk_overlap}")
    print(f" • Retrieval Top-K   : {args.top_k}")
    print("=" * 70 + "\n")

    # Step 1: Initialize Embeddings
    try:
        embeddings = get_embedding_function(
            embedding_type=args.embeddings,
            model_name=args.embed_model
        )
    except Exception as e:
        print(f"[!] Failed to initialize embeddings: {e}")
        print("[!] Ensure Ollama is running and run: ollama pull nomic-embed-text")
        sys.exit(1)

    # Step 2: Ingestion or Load Existing DB
    db_exists = os.path.exists(args.db_dir) and bool(os.listdir(args.db_dir))
    chunks = []

    if not db_exists or args.reindex:
        raw_docs = load_documents_from_path(args.data)
        if not raw_docs:
            if not db_exists:
                print(f"\n[!] Notice: No documents found in '{args.data}'.")
                print(f"[*] Creating sample document in '{args.data}/sample_ai_notes.txt'...")
                os.makedirs(args.data, exist_ok=True)
                sample_file = os.path.join(args.data, "sample_ai_notes.txt")
                with open(sample_file, "w", encoding="utf-8") as f:
                    f.write(
                        "Local Retrieval-Augmented Generation (RAG) Architecture\n"
                        "------------------------------------------------------\n"
                        "Local RAG allows organizations to query their private proprietary documents\n"
                        "without transmitting confidential data over external APIs.\n\n"
                        "Key components include:\n"
                        "1. Local LLM Server: Ollama manages quantization, GPU offloading, and execution of models like Llama 3 or Mistral.\n"
                        "2. Embedding Model: Nomic-embed-text provides high quality 768-dimensional dense vector representations.\n"
                        "3. Vector Store: ChromaDB stores chunk vectors with HNSW indexing for sub-millisecond approximate nearest neighbor searches.\n"
                        "4. Retrieval Strategy: Top-k chunks are dynamically inserted into prompt templates to ground the model.\n"
                    )
                raw_docs = load_documents_from_path(sample_file)
        chunks = split_documents(raw_docs, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)

    # Step 3: Initialize Vector Store
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

    # Step 4: Configure Retriever (Top-K)
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": args.top_k}
    )

    # Step 5: Initialize Local LLM & RAG Chain
    try:
        llm = get_local_llm(model_name=args.llm, temperature=args.temp)
        rag_chain = build_rag_chain(retriever=retriever, llm=llm)
    except Exception as e:
        print(f"[!] Failed to initialize Ollama LLM: {e}")
        print("[!] Ensure Ollama is running (`ollama serve`) and model is pulled (`ollama pull llama3`).")
        sys.exit(1)

    # Step 6: Start Terminal Interactive Loop
    run_interactive_cli(retriever=retriever, rag_chain=rag_chain)


if __name__ == "__main__":
    main()
