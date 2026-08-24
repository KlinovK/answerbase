import "server-only";

import {
  createOpenAIClient,
  OpenAIConfigurationError,
} from "@/lib/openai-client";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

// This keeps each request comfortably below the API's aggregate input limit for
// the current ~600-token document chunks while avoiding one request per chunk.
const EMBEDDING_BATCH_SIZE = 100;

export class EmbeddingGenerationError extends Error {
  constructor(
    public readonly safeMessage =
      "Document embeddings could not be generated. Try again.",
  ) {
    super(safeMessage);
    this.name = "EmbeddingGenerationError";
  }
}

function logEmbeddingError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as {
          code?: string;
          message?: string;
          name?: string;
          status?: number;
        })
      : null;

  console.error("[embeddings]", {
    operation,
    code: details?.code ?? details?.status ?? details?.name ?? "unknown",
    message: details?.message ?? "Unknown embedding error",
  });
}

export async function generateEmbeddings(inputs: string[]) {
  if (inputs.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  try {
    const openai = createOpenAIClient();

    for (let start = 0; start < inputs.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = inputs.slice(start, start + EMBEDDING_BATCH_SIZE);
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: "float",
      });
      const ordered = [...response.data].sort(
        (first, second) => first.index - second.index,
      );

      if (
        ordered.length !== batch.length ||
        ordered.some(
          (item, index) =>
            item.index !== index ||
            item.embedding.length !== EMBEDDING_DIMENSIONS,
        )
      ) {
        throw new Error("Embedding response shape did not match its input batch.");
      }

      embeddings.push(...ordered.map((item) => item.embedding));
    }
  } catch (error) {
    logEmbeddingError("embeddings.create", error);

    if (error instanceof OpenAIConfigurationError) {
      throw new EmbeddingGenerationError(
        "Document embeddings are not configured. Contact support.",
      );
    }

    if (error instanceof EmbeddingGenerationError) {
      throw error;
    }

    throw new EmbeddingGenerationError();
  }

  if (embeddings.length !== inputs.length) {
    throw new EmbeddingGenerationError();
  }

  return embeddings;
}
