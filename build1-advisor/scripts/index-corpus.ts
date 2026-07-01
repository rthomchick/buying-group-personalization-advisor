// One-time script: chunk corpus docs → embed via OpenAI → push to Pinecone
// namespace kalder-v0-2-0
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Store 1: Vector Index"
// Reads all nine corpus documents from knowledge/ (kalder_docN_*.md), chunks at
// section (##) and subsection (###) granularity, embeds each chunk with
// text-embedding-3-small, and upserts to Pinecone namespace "kalder-v0-2-0".
//
// Run with: npx tsx --env-file=.env.local scripts/index-corpus.ts (from build1-advisor/)
// Requires PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY in .env.local.
// --env-file is required — tsx does not auto-load .env.local on its own.

import { readdirSync, readFileSync } from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import type { ChunkMetadata } from "../lib/retrieval/vector-store";

const VECTOR_NAMESPACE = "kalder-v0-2-0";
const EMBEDDING_MODEL = "text-embedding-3-small";

// Loaded lazily inside main() so a missing .env.local fails with a clear
// message instead of a cryptic SDK error deep in the call stack.
function loadEnv(): { pineconeApiKey: string; indexName: string; openaiApiKey: string } {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const missing: string[] = [];
  if (!pineconeApiKey) missing.push("PINECONE_API_KEY");
  if (!indexName) missing.push("PINECONE_INDEX_NAME");
  if (!openaiApiKey) missing.push("OPENAI_API_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in build1-advisor/.env.local before running this script.`,
    );
  }

  return { pineconeApiKey: pineconeApiKey!, indexName: indexName!, openaiApiKey: openaiApiKey! };
}

// Corpus docs live under knowledge/corpus/ (moved there in the 2026-06-21
// cleanup; this script previously pointed at knowledge/ itself, which no
// longer holds the doc files directly).
const KNOWLEDGE_DIR = path.resolve(__dirname, "../../knowledge/corpus");
// Case-insensitive on the "kalder" prefix: the corpus has one filename
// (doc9) with a capital K, which is a deliberate corpus characteristic per
// the corpus owner, not a typo for this script to "fix" by renaming.
const CORPUS_FILENAME_PATTERN = /^kalder_doc(\d+)_.+\.md$/i;
const EXPECTED_DOCUMENT_IDS = Array.from({ length: 9 }, (_, i) => `doc${i + 1}`);

type RawChunk = {
  sectionTitle: string;
  sectionKey: string | null;
  subsection?: string;
  chunkText: string;
};

function listCorpusFiles(): { filename: string; documentId: string; filePath: string }[] {
  const entries = readdirSync(KNOWLEDGE_DIR);
  const files = entries
    .filter((name) => CORPUS_FILENAME_PATTERN.test(name))
    .map((filename) => {
      const match = filename.match(CORPUS_FILENAME_PATTERN)!;
      return {
        filename,
        documentId: `doc${match[1]}`,
        filePath: path.join(KNOWLEDGE_DIR, filename),
      };
    })
    .sort((a, b) => Number(a.documentId.slice(3)) - Number(b.documentId.slice(3)));

  // Verify the exact set of expected document IDs is present, rather than a
  // bare count — this catches a missing/duplicated doc by name instead of
  // just "found N", and doesn't break if the corpus grows past 9 documents
  // of some other naming shape that happens to also match the pattern.
  const foundIds = new Set(files.map((f) => f.documentId));
  const missingIds = EXPECTED_DOCUMENT_IDS.filter((id) => !foundIds.has(id));
  const duplicateIds = files
    .map((f) => f.documentId)
    .filter((id, i, arr) => arr.indexOf(id) !== i);

  if (missingIds.length > 0 || duplicateIds.length > 0) {
    throw new Error(
      `Corpus document check failed under ${KNOWLEDGE_DIR}. ` +
        `Found: ${files.map((f) => f.filename).join(", ") || "(none)"}. ` +
        (missingIds.length > 0 ? `Missing: ${missingIds.join(", ")}. ` : "") +
        (duplicateIds.length > 0 ? `Duplicated document id(s): ${duplicateIds.join(", ")}.` : ""),
    );
  }

  return files;
}

// Extracts a §-style section key from a heading line, only when the heading
// text contains an unambiguous "Section N" or leading "N." / "N–M" numeral
// pattern. Headings with no numeric section marker (e.g. Document 1's topical
// headings) yield null — never fabricated.
function extractSectionKey(headingText: string): string | null {
  const sectionMatch = headingText.match(/Section\s+(\d+[a-zA-Z]?(?:[–-]\d+[a-zA-Z]?)?)/i);
  if (sectionMatch) return `§${sectionMatch[1]}`;

  const leadingNumeral = headingText.match(/^(\d+(?:\.\d+)?)\s/);
  if (leadingNumeral) return `§${leadingNumeral[1]}`;

  return null;
}

// Splits one document's markdown into chunks at ## (section) and ### (subsection)
// boundaries. A ## section's own intro text (before its first ###) becomes its
// own chunk. Each ### subsection becomes a chunk carrying its parent ##'s title
// as section_title and its own heading as subsection.
function chunkMarkdown(markdown: string): RawChunk[] {
  const lines = markdown.split("\n");
  const chunks: RawChunk[] = [];

  let currentSectionTitle: string | null = null;
  let currentSectionKey: string | null = null;
  let currentSubsection: string | undefined;
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!text || !currentSectionTitle) return;
    chunks.push({
      sectionTitle: currentSectionTitle,
      sectionKey: currentSectionKey,
      subsection: currentSubsection,
      chunkText: text,
    });
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      flush();
      currentSectionTitle = h2Match[1].trim();
      currentSectionKey = extractSectionKey(currentSectionTitle);
      currentSubsection = undefined;
      continue;
    }

    if (h3Match) {
      flush();
      currentSubsection = h3Match[1].trim();
      continue;
    }

    buffer.push(line);
  }
  flush();

  return chunks;
}

async function embedBatch(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((entry) => entry.embedding);
}

const EMBED_BATCH_SIZE = 50;
const UPSERT_BATCH_SIZE = 100;

async function main() {
  const { pineconeApiKey, indexName, openaiApiKey } = loadEnv();

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const index = pinecone.index<ChunkMetadata>(indexName).namespace(VECTOR_NAMESPACE);

  const files = listCorpusFiles();

  type PendingRecord = { id: string; chunkText: string; metadata: ChunkMetadata };
  const pending: PendingRecord[] = [];

  for (const file of files) {
    const markdown = readFileSync(file.filePath, "utf-8");
    const rawChunks = chunkMarkdown(markdown);

    rawChunks.forEach((chunk, i) => {
      const metadata: ChunkMetadata = {
        document_id: file.documentId,
        section_key: chunk.sectionKey ?? "",
        section_title: chunk.sectionTitle,
        chunk_text: chunk.chunkText,
        document_filename: file.filename,
        depends_on: [],
        required_by: [],
      };
      if (chunk.subsection) metadata.subsection = chunk.subsection;

      pending.push({
        id: `${file.documentId}_chunk_${i}`,
        chunkText: chunk.chunkText,
        metadata,
      });
    });

    console.log(`Chunked ${file.filename} → ${rawChunks.length} chunks`);
  }

  console.log(`\nTotal chunks to index: ${pending.length}`);

  let embeddedCount = 0;
  for (let i = 0; i < pending.length; i += EMBED_BATCH_SIZE) {
    const batch = pending.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedBatch(openai, batch.map((r) => r.chunkText));

    const upsertRecords = batch.map((record, j) => ({
      id: record.id,
      values: embeddings[j],
      metadata: record.metadata,
    }));

    for (let u = 0; u < upsertRecords.length; u += UPSERT_BATCH_SIZE) {
      await index.upsert(upsertRecords.slice(u, u + UPSERT_BATCH_SIZE));
    }

    embeddedCount += batch.length;
    console.log(`Embedded and upserted ${embeddedCount}/${pending.length} chunks`);
  }

  console.log(`\nDone. Indexed ${pending.length} chunks into namespace "${VECTOR_NAMESPACE}".`);
}

main().catch((error) => {
  console.error("index-corpus.ts failed:", error);
  process.exit(1);
});
