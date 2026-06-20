// One-time script: create the Pinecone index for the corpus vector store.
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Store 1: Vector Index"
// - Embedding model: text-embedding-3-small (1536 dimensions)
// - Metric: cosine
// - Serverless tier
//
// Run with: npx tsx --env-file=.env.local scripts/create-pinecone-index.ts (from build1-advisor/)
// Requires PINECONE_API_KEY and PINECONE_INDEX_NAME in .env.local.
// --env-file is required — tsx does not auto-load .env.local on its own.
//
// Cloud/region default to aws/us-east-1 (Pinecone's common serverless default).
// Override via PINECONE_CLOUD / PINECONE_REGION in .env.local if your account
// uses a different cloud or region.

import { Pinecone } from "@pinecone-database/pinecone";
import type { ServerlessSpecCloudEnum } from "@pinecone-database/pinecone";

const EMBEDDING_DIMENSIONS = 1536; // text-embedding-3-small output size
const METRIC = "cosine" as const;

function loadEnv(): { apiKey: string; indexName: string; cloud: ServerlessSpecCloudEnum; region: string } {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  const missing: string[] = [];
  if (!apiKey) missing.push("PINECONE_API_KEY");
  if (!indexName) missing.push("PINECONE_INDEX_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in build1-advisor/.env.local before running this script.`,
    );
  }

  const cloud = (process.env.PINECONE_CLOUD ?? "aws") as ServerlessSpecCloudEnum;
  const region = process.env.PINECONE_REGION ?? "us-east-1";

  return { apiKey: apiKey!, indexName: indexName!, cloud, region };
}

async function main() {
  const { apiKey, indexName, cloud, region } = loadEnv();
  const pinecone = new Pinecone({ apiKey });

  const existing = await pinecone.listIndexes();
  const alreadyExists = existing.indexes?.some((idx) => idx.name === indexName) ?? false;

  if (alreadyExists) {
    const description = await pinecone.describeIndex(indexName);
    console.log(`Index "${indexName}" already exists. Status: ${description.status?.state ?? "unknown"}.`);
    console.log("No action taken.");
    return;
  }

  console.log(`Creating index "${indexName}" (dimension=${EMBEDDING_DIMENSIONS}, metric=${METRIC}, cloud=${cloud}, region=${region})...`);

  await pinecone.createIndex({
    name: indexName,
    dimension: EMBEDDING_DIMENSIONS,
    metric: METRIC,
    spec: {
      serverless: { cloud, region },
    },
    waitUntilReady: true,
  });

  const description = await pinecone.describeIndex(indexName);
  console.log(`Created index "${indexName}". Status: ${description.status?.state ?? "unknown"}.`);
}

main().catch((error) => {
  console.error("create-pinecone-index.ts failed:", error);
  process.exit(1);
});
