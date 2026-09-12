export type LLMModel = 'llama3' | 'mistral' | 'deepseek-r1:8b' | 'phi3';
export type EmbeddingEngine = 'ollama' | 'huggingface';

export interface RAGConfig {
  llmModel: LLMModel;
  embeddingEngine: EmbeddingEngine;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  temperature: number;
  dataPath: string;
  dbDir: string;
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt';
  size: string;
  pages: number;
  chunkCount: number;
  snippet: string;
}

export interface RetrievedChunk {
  index: number;
  source: string;
  page?: number;
  similarityScore: number;
  content: string;
}

export interface TerminalMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'sources';
  text: string;
  timestamp: string;
  chunks?: RetrievedChunk[];
}
