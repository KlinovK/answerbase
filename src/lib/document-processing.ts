import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";

import { KNOWLEDGE_BUCKET } from "@/lib/documents";
import {
  EmbeddingGenerationError,
  generateEmbeddings,
} from "@/lib/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";

const TARGET_CHUNK_CHARACTERS = 2400;
const MAX_BASE_CHUNK_CHARACTERS = 2800;
const MIN_CHUNK_CHARACTERS = 700;
const CHUNK_OVERLAP_CHARACTERS = 320;

type ProcessDocumentInput = {
  documentId: string;
  chatbotId: string;
  userId: string;
  userClient: SupabaseClient;
};

type ExtractedSection = {
  content: string;
  page?: number;
};

type DocumentChunk = {
  content: string;
  chunk_index: number;
  embedding?: number[];
  metadata: {
    fileName: string;
    page?: number;
  };
};

type ProcessingResult =
  | { success: true }
  | { success: false; message: string };

class DocumentProcessingError extends Error {
  constructor(
    public readonly safeMessage: string,
    message = safeMessage,
  ) {
    super(message);
    this.name = "DocumentProcessingError";
  }
}

function logProcessingError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; message?: string; name?: string })
      : null;

  console.error("[document-processing]", {
    operation,
    code: details?.code ?? details?.name ?? "unknown",
    message: details?.message ?? "Unknown processing error",
  });
}

export function normalizeDocumentText(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n[\t ]+\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findSplitPoint(text: string) {
  const preferredStart = Math.floor(TARGET_CHUNK_CHARACTERS * 0.7);
  const candidate = text.slice(preferredStart, TARGET_CHUNK_CHARACTERS + 1);
  const paragraphBreak = candidate.lastIndexOf("\n");

  if (paragraphBreak >= 0) {
    return preferredStart + paragraphBreak + 1;
  }

  const sentenceBreak = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf("? "),
    candidate.lastIndexOf("! "),
  );

  if (sentenceBreak >= 0) {
    return preferredStart + sentenceBreak + 2;
  }

  const wordBreak = candidate.lastIndexOf(" ");
  return wordBreak >= 0
    ? preferredStart + wordBreak + 1
    : TARGET_CHUNK_CHARACTERS;
}

function splitLongSection(text: string) {
  const pieces: string[] = [];
  let remaining = text.trim();

  while (remaining.length > MAX_BASE_CHUNK_CHARACTERS) {
    const splitPoint = findSplitPoint(remaining);
    pieces.push(remaining.slice(0, splitPoint).trim());
    remaining = remaining.slice(splitPoint).trim();
  }

  if (remaining) {
    pieces.push(remaining);
  }

  return pieces;
}

function buildBaseChunks(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongSection(paragraph));
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (
      current &&
      (candidate.length > MAX_BASE_CHUNK_CHARACTERS ||
        current.length >= TARGET_CHUNK_CHARACTERS)
    ) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  if (
    chunks.length > 1 &&
    chunks.at(-1)!.length < MIN_CHUNK_CHARACTERS &&
    chunks.at(-2)!.length + chunks.at(-1)!.length + 2 <=
      MAX_BASE_CHUNK_CHARACTERS
  ) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] = `${chunks.at(-1)}\n\n${last}`;
  }

  return chunks;
}

function getOverlap(text: string) {
  if (text.length <= CHUNK_OVERLAP_CHARACTERS) {
    return text;
  }

  const suffix = text.slice(-CHUNK_OVERLAP_CHARACTERS);
  const firstBoundary = suffix.search(/[\s]/);
  return firstBoundary >= 0 ? suffix.slice(firstBoundary).trim() : suffix;
}

export function chunkDocumentText(text: string) {
  const baseChunks = buildBaseChunks(text);

  return baseChunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    const overlap = getOverlap(baseChunks[index - 1]);
    return overlap ? `${overlap}\n\n${chunk}` : chunk;
  });
}

async function extractTextDocument(file: Blob) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const normalized = normalizeDocumentText(text);

    if (!normalized) {
      throw new DocumentProcessingError("This document does not contain text.");
    }

    return [{ content: normalized }] satisfies ExtractedSection[];
  } catch (error) {
    if (error instanceof DocumentProcessingError) {
      throw error;
    }

    throw new DocumentProcessingError(
      "The text file is not valid UTF-8.",
      error instanceof Error ? error.message : undefined,
    );
  }
}

async function extractPdfDocument(file: Blob) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = (Array.isArray(text) ? text : [text])
      .map((pageText, index) => ({
        content: normalizeDocumentText(pageText),
        page: index + 1,
      }))
      .filter((page) => Boolean(page.content));

    if (pages.length === 0) {
      throw new DocumentProcessingError(
        "Scanned PDFs are not supported yet.",
      );
    }

    return pages;
  } catch (error) {
    if (error instanceof DocumentProcessingError) {
      throw error;
    }

    throw new DocumentProcessingError(
      "The PDF could not be read. Make sure it is a valid PDF file.",
      error instanceof Error ? error.message : undefined,
    );
  }
}

async function extractDocument(file: Blob, mimeType: string) {
  switch (mimeType) {
    case "text/plain":
    case "text/markdown":
      return extractTextDocument(file);
    case "application/pdf":
      return extractPdfDocument(file);
    default:
      throw new DocumentProcessingError(
        "This document type is not supported for processing.",
      );
  }
}

function createChunks(sections: ExtractedSection[], fileName: string) {
  const chunks: DocumentChunk[] = [];

  for (const section of sections) {
    for (const content of chunkDocumentText(section.content)) {
      chunks.push({
        content,
        chunk_index: chunks.length,
        metadata: {
          fileName,
          ...(section.page ? { page: section.page } : {}),
        },
      });
    }
  }

  if (chunks.length === 0) {
    throw new DocumentProcessingError("This document does not contain text.");
  }

  return chunks;
}

async function setFailedStatus(
  userClient: SupabaseClient,
  documentId: string,
  chatbotId: string,
  userId: string,
  message: string,
) {
  const { error } = await userClient
    .from("documents")
    .update({ status: "failed", error_message: message })
    .eq("id", documentId)
    .eq("chatbot_id", chatbotId)
    .eq("user_id", userId);

  if (error) {
    logProcessingError("documents.status.failed", error);
  }
}

export async function processDocument({
  documentId,
  chatbotId,
  userId,
  userClient,
}: ProcessDocumentInput): Promise<ProcessingResult> {
  const [documentResult, chatbotResult] = await Promise.all([
    userClient
      .from("documents")
      .select("id, name, storage_path, mime_type")
      .eq("id", documentId)
      .eq("chatbot_id", chatbotId)
      .eq("user_id", userId)
      .maybeSingle(),
    userClient
      .from("chatbots")
      .select("id")
      .eq("id", chatbotId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (
    documentResult.error ||
    !documentResult.data ||
    chatbotResult.error ||
    !chatbotResult.data
  ) {
    logProcessingError(
      "ownership.verify",
      documentResult.error ?? chatbotResult.error,
    );
    return { success: false, message: "Document not found." };
  }

  const document = documentResult.data;
  const { error: processingStatusError } = await userClient
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentId)
    .eq("chatbot_id", chatbotId)
    .eq("user_id", userId);

  if (processingStatusError) {
    logProcessingError("documents.status.processing", processingStatusError);
    return {
      success: false,
      message: "Document processing could not be started.",
    };
  }

  try {
    const { data: file, error: downloadError } = await userClient.storage
      .from(KNOWLEDGE_BUCKET)
      .download(document.storage_path);

    if (downloadError || !file) {
      logProcessingError("storage.download", downloadError);
      throw new DocumentProcessingError(
        "The uploaded file could not be read. Try uploading it again.",
      );
    }

    const sections = await extractDocument(file, document.mime_type);
    const chunks = createChunks(sections, document.name);
    let embeddings: number[][];

    try {
      embeddings = await generateEmbeddings(
        chunks.map((chunk) => chunk.content),
      );
    } catch (error) {
      if (error instanceof EmbeddingGenerationError) {
        throw new DocumentProcessingError(error.safeMessage);
      }

      throw error;
    }

    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));
    const adminClient = createAdminClient();
    const { error: replaceError } = await adminClient.rpc(
      "replace_document_chunks",
      {
        target_document_id: documentId,
        target_chatbot_id: chatbotId,
        target_user_id: userId,
        replacement_chunks: chunksWithEmbeddings,
      },
    );

    if (replaceError) {
      logProcessingError("document_chunks.replace", replaceError);
      throw new DocumentProcessingError(
        "The document text could not be saved. Try again.",
      );
    }

    const { error: readyStatusError } = await userClient
      .from("documents")
      .update({ status: "ready", error_message: null })
      .eq("id", documentId)
      .eq("chatbot_id", chatbotId)
      .eq("user_id", userId);

    if (readyStatusError) {
      logProcessingError("documents.status.ready", readyStatusError);
      throw new DocumentProcessingError(
        "The document was processed, but its status could not be updated.",
      );
    }

    return { success: true };
  } catch (error) {
    logProcessingError("process", error);
    const safeMessage =
      error instanceof DocumentProcessingError
        ? error.safeMessage
        : "The document could not be processed. Try again.";

    await setFailedStatus(
      userClient,
      documentId,
      chatbotId,
      userId,
      safeMessage,
    );

    return { success: false, message: safeMessage };
  }
}
