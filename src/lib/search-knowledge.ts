import "server-only";

import { generateEmbeddings } from "@/lib/embeddings";
import { KNOWLEDGE_SEARCH_DEFAULTS } from "@/lib/knowledge-search-config";
import { createClient } from "@/lib/supabase/server";

type SearchKnowledgeInput = {
  chatbotId: string;
  query: string;
  limit?: number;
};

export type KnowledgeSearchMatch = {
  chunk_id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export class KnowledgeSearchError extends Error {
  constructor(public readonly safeMessage: string) {
    super(safeMessage);
    this.name = "KnowledgeSearchError";
  }
}

function logSearchError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; message?: string; name?: string })
      : null;

  console.error("[knowledge-search]", {
    operation,
    code: details?.code ?? details?.name ?? "unknown",
    message: details?.message ?? "Unknown semantic search error",
  });
}

export async function searchKnowledge({
  chatbotId,
  query,
  limit = KNOWLEDGE_SEARCH_DEFAULTS.topK,
}: SearchKnowledgeInput): Promise<KnowledgeSearchMatch[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new KnowledgeSearchError("Enter a question to search.");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    logSearchError("auth.getClaims", authError);
    throw new KnowledgeSearchError(
      "Your session has expired. Log in and try again.",
    );
  }

  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chatbotError || !chatbot) {
    logSearchError("chatbots.ownership", chatbotError);
    throw new KnowledgeSearchError("This chatbot could not be found.");
  }

  const [queryEmbedding] = await generateEmbeddings([normalizedQuery]);
  const matchCount = Math.min(
    Math.max(Math.floor(limit), 1),
    KNOWLEDGE_SEARCH_DEFAULTS.maxResults,
  );
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    target_chatbot_id: chatbotId,
    match_count: matchCount,
    similarity_threshold:
      KNOWLEDGE_SEARCH_DEFAULTS.similarityThreshold,
  });

  if (error) {
    logSearchError("match_document_chunks", error);
    throw new KnowledgeSearchError(
      "Semantic search could not be completed. Try again.",
    );
  }

  return (data ?? []) as KnowledgeSearchMatch[];
}
