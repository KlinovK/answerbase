import "server-only";

import { generateEmbeddings } from "@/lib/embeddings";
import { KNOWLEDGE_SEARCH_DEFAULTS } from "@/lib/knowledge-search-config";
import { PUBLIC_CHAT_CONFIG } from "@/lib/public-chat-config";
import {
  KnowledgeSearchError,
  type KnowledgeSearchMatch,
} from "@/lib/search-knowledge";
import { createAdminClient } from "@/lib/supabase/admin";

type StoredChunk = {
  id: string;
  document_id: string;
  content: string;
  metadata: unknown;
  embedding: unknown;
};

function parseEmbedding(value: unknown) {
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === "number")
      ? (value as number[])
      : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "number")
      ? (parsed as number[])
      : null;
  } catch {
    return null;
  }
}

function cosineSimilarity(first: number[], second: number[]) {
  if (first.length !== second.length || first.length === 0) {
    return null;
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < first.length; index += 1) {
    dotProduct += first[index] * second[index];
    firstMagnitude += first[index] * first[index];
    secondMagnitude += second[index] * second[index];
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return null;
  }

  return dotProduct / Math.sqrt(firstMagnitude * secondMagnitude);
}

function getMetadata(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function logPublicSearchError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; name?: string })
      : null;

  console.error("[public-knowledge-search]", {
    operation,
    code: details?.code ?? details?.name ?? "unknown",
  });
}

export async function searchPublicKnowledge({
  chatbotId,
  query,
  limit = KNOWLEDGE_SEARCH_DEFAULTS.playgroundTopK,
}: {
  chatbotId: string;
  query: string;
  limit?: number;
}): Promise<KnowledgeSearchMatch[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new KnowledgeSearchError("Enter a question to search.");
  }

  const [queryEmbedding] = await generateEmbeddings([normalizedQuery]);
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("document_chunks")
    .select("id, document_id, content, metadata, embedding")
    .eq("chatbot_id", chatbotId)
    .not("embedding", "is", null)
    .limit(PUBLIC_CHAT_CONFIG.maxChunksScanned);

  if (error) {
    logPublicSearchError("document-chunks.read", error);
    throw new KnowledgeSearchError(
      "Knowledge search could not be completed. Try again.",
    );
  }

  const matchCount = Math.min(
    Math.max(Math.floor(limit), 1),
    KNOWLEDGE_SEARCH_DEFAULTS.maxResults,
  );

  return ((data ?? []) as StoredChunk[])
    .map((chunk) => {
      const embedding = parseEmbedding(chunk.embedding);
      const similarity = embedding
        ? cosineSimilarity(queryEmbedding, embedding)
        : null;

      return similarity === null
        ? null
        : {
            chunk_id: chunk.id,
            document_id: chunk.document_id,
            content: chunk.content,
            metadata: getMetadata(chunk.metadata),
            similarity,
          };
    })
    .filter(
      (match): match is KnowledgeSearchMatch =>
        match !== null &&
        match.similarity >= KNOWLEDGE_SEARCH_DEFAULTS.similarityThreshold,
    )
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, matchCount);
}
