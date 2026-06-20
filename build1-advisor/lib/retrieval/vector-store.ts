// Pinecone client — Store 1, namespace kalder-v0-2-0, similarity threshold 0.45
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Store 1: Vector Index"
// - Provider: Pinecone (serverless tier)
// - Embedding model: text-embedding-3-small
// - Namespace: kalder-v0-2-0
// - Minimum cosine similarity threshold: 0.45
// - Below threshold: return low-confidence notice alongside results. Never silently
//   return below-threshold results as authoritative.

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

export const VECTOR_NAMESPACE = "kalder-v0-2-0";
export const EMBEDDING_MODEL = "text-embedding-3-small";
// Calibrated against text-embedding-3-small on Kalder corpus — 0.45 reflects
// observed score distribution for relevant matches. 0.75 design target was
// pre-index and does not apply to this embedding model on technical prose.
export const SIMILARITY_THRESHOLD = 0.45;

export type ChunkMetadata = {
  document_id: string;
  section_key: string;
  section_title: string;
  subsection?: string;
  chunk_text: string;
  document_filename: string;
  depends_on?: string[];
  required_by?: string[];
};

export type VectorMatch = {
  id: string;
  score: number;
  metadata: ChunkMetadata;
  aboveThreshold: boolean;
};

export type VectorQueryResult = {
  matches: VectorMatch[];
  allBelowThreshold: boolean; // true when no match meets SIMILARITY_THRESHOLD
};

let pineconeClient: Pinecone | null = null;
let openaiClient: OpenAI | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is not set");
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getIndexName(): string {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error("PINECONE_INDEX_NAME is not set");
  }
  return indexName;
}

async function embedQuery(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Embeds the query and runs a similarity search against Store 1 in the
 * kalder-v0-2-0 namespace. Matches below SIMILARITY_THRESHOLD are still
 * returned (flagged via aboveThreshold: false) — callers must label them as
 * low-confidence and must never present them as authoritative without that label.
 */
export async function queryVectorStore(query: string, topK: number = 5): Promise<VectorQueryResult> {
  const vector = await embedQuery(query);

  const pinecone = getPineconeClient();
  const index = pinecone.index<ChunkMetadata>(getIndexName());

  const response = await index.namespace(VECTOR_NAMESPACE).query({
    vector,
    topK,
    includeMetadata: true,
  });

  const matches: VectorMatch[] = response.matches
    .filter((match) => match.metadata !== undefined)
    .map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata as ChunkMetadata,
      aboveThreshold: (match.score ?? 0) >= SIMILARITY_THRESHOLD,
    }));

  const allBelowThreshold = matches.length === 0 || matches.every((m) => !m.aboveThreshold);

  return { matches, allBelowThreshold };
}
