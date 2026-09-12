# 100% Local RAG System (Ollama + LangChain + ChromaDB)

A complete, production-ready, air-gapped Retrieval-Augmented Generation (RAG) system running **100% locally on your machine**. Zero external API calls, zero API costs, and total data privacy.

---

## 📋 System Requirements & Architecture

- **OS**: macOS, Linux, or Windows (WSL2 recommended for Windows)
- **Python**: Version 3.9 or higher (Python 3.10 / 3.11 recommended)
- **Local LLM Runner**: [Ollama](https://ollama.com/)
- **Default LLM**: `llama3` (Meta Llama 3 8B) or `mistral` (Mistral 7B)
- **Default Embeddings**: `nomic-embed-text` (768-dimensional local dense embeddings)
- **Vector Database**: [ChromaDB](https://www.trychroma.com/) (persisted locally to disk in `./chroma_db`)
- **Document Formats**: PDF (`.pdf`), Plain Text (`.txt`), Markdown (`.md`)

---

## 🚀 Quick Setup Guide (Step-by-Step)

### Step 1: Install & Start Ollama

If you don't have Ollama installed yet:

- **macOS / Linux**:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```
- **Windows**:
  Download the installer from [https://ollama.com/download](https://ollama.com/download).

Verify Ollama is active by running:
```bash
ollama --version
```
*(If Ollama is not already running in the background, run `ollama serve` in a terminal window).*

---

### Step 2: Download the Local Models

Pull both the lightweight embedding model and your preferred LLM:

```bash
# 1. Pull the local embedding model (~274 MB)
ollama pull nomic-embed-text

# 2. Pull the default conversational LLM (~4.7 GB)
ollama pull llama3

# (Optional: If you prefer Mistral 7B)
ollama pull mistral
```

---

### Step 3: Clone or Set Up Your Project Folder

Create your project directory and set up a virtual environment:

```bash
# Create project folder
mkdir local-rag
cd local-rag

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment:
# On macOS / Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
```

---

### Step 4: Install Python Dependencies

Install the requirements using the provided `requirements.txt`:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

*(Or install directly via single command)*:
```bash
pip install langchain langchain-community langchain-core langchain-text-splitters langchain-ollama langchain-chroma chromadb pypdf sentence-transformers
```

---

### Step 5: Add Your Documents

Create a `data/` folder and place any number of `.pdf`, `.txt`, or `.md` files inside:

```bash
mkdir data
# Copy your private files into data/
cp /path/to/my_manual.pdf ./data/
cp /path/to/notes.txt ./data/
```

> **Note**: If `data/` is empty on your first run, the script will automatically create a sample document `data/sample_ai_notes.txt` so you can test immediately.

---

### Step 6: Run the Local RAG System

Start the interactive terminal session:

```bash
python local_rag.py
```

The script will automatically:
1. Initialize the local embedding model (`nomic-embed-text`).
2. Scan `./data` for `.pdf` and `.txt` files.
3. Split documents into 1,000-character chunks with 200-character overlap.
4. Generate embeddings and save the index to `./chroma_db` on disk.
5. Launch the interactive chat loop with real-time streaming output.

---

## 💬 Terminal Chat Commands

When the prompt `You:` appears, you can:
- **Ask any question**: Type your prompt and press <kbd>Enter</kbd>. The model will stream an answer grounded **only** in your local context chunks.
- **Inspect sources**: Type `sources` to display the exact top 3 text snippets, source files, and page numbers retrieved from ChromaDB for your last question.
- **Clear screen**: Type `clear` to reset the terminal view.
- **Exit session**: Type `exit`, `quit`, or `q` to safely flush the ChromaDB index and exit.

### Example Terminal Session

```text
======================================================================
 🚀 100% LOCAL RAG SYSTEM READY (Ollama + ChromaDB)
======================================================================

You: What were the key revenue numbers for Q3?

Assistant: According to quarterly_financial_report.pdf, the Q3 operating 
revenue reached $48.2M, representing an 18.5% year-over-year increase.

You: sources

------------------------------------------------------------
Top 3 Retrieved Chunks for: 'What were the key revenue numbers for Q3?'
------------------------------------------------------------
[Chunk 1] Source: quarterly_financial_report.pdf | Page 2
Total operating revenue for Q3 reached $48.2M, reflecting an 18.5% YoY growth...
------------------------------------------------------------

You: exit
[!] Exiting Local RAG session. Goodbye!
```

---

## ⚙️ Custom CLI Options & Flags

You can customize the pipeline directly via command-line arguments:

```bash
# Use Mistral instead of Llama 3:
python local_rag.py --llm mistral

# Point to a custom document directory:
python local_rag.py --data /Users/me/Documents/WorkPDFs

# Retrieve top 5 chunks instead of 3:
python local_rag.py --top-k 5

# Customize chunk size and overlap:
python local_rag.py --chunk-size 1200 --chunk-overlap 250

# Force re-indexing of documents (if you added new files to data/):
python local_rag.py --reindex

# Use local HuggingFace embeddings (all-MiniLM-L6-v2) instead of Ollama:
python local_rag.py --embeddings huggingface
```

### Full CLI Options Reference

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--data` | `./data` | Directory or path to `.pdf`, `.txt`, `.md` files |
| `--db-dir` | `./chroma_db` | Disk directory where ChromaDB stores vector indexes |
| `--llm` | `llama3` | Ollama model name (`llama3`, `mistral`, `deepseek-r1`, `phi3`) |
| `--embeddings` | `ollama` | Embedding provider: `ollama` or `huggingface` |
| `--embed-model` | `nomic-embed-text` | Model name for embeddings |
| `--chunk-size` | `1000` | Characters per document chunk |
| `--chunk-overlap` | `200` | Overlap characters between adjacent chunks |
| `--top-k` | `3` | Number of most relevant chunks to feed into prompt |
| `--temp` | `0.2` | Generation temperature (lower = more deterministic) |
| `--reindex` | `False` | Force re-reading and re-embedding files into ChromaDB |

---

## 🛠️ Troubleshooting

### 1. `ConnectionRefusedError: [Errno 111] Connection refused (port 11434)`
**Cause**: The Ollama background service is not running.  
**Fix**: Open a terminal and run `ollama serve`. Keep this running in the background.

### 2. `ollama._types.ResponseError: model 'llama3' not found`
**Cause**: The model has not been downloaded yet.  
**Fix**: Run `ollama pull llama3` in your terminal.

### 3. `ollama._types.ResponseError: model 'nomic-embed-text' not found`
**Cause**: The embedding model is missing.  
**Fix**: Run `ollama pull nomic-embed-text`.

### 4. Added new documents, but they aren't appearing in search results
**Cause**: By default, ChromaDB re-uses the existing vector database on disk to save time.  
**Fix**: Add the `--reindex` flag to force re-reading your files:
```bash
python local_rag.py --reindex
```

---

## 🔒 Privacy & Security Guarantee

- **Zero Outbound Traffic**: Ollama binds exclusively to `localhost:11434`.
- **Zero Cloud Storage**: Document vectors and metadata are stored on local disk inside `./chroma_db`.
- **Air-Gapped Ready**: Once the models and Python packages are downloaded, this system runs completely offline without any internet connection.
