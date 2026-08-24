"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  KNOWLEDGE_BUCKET,
  sanitizeStorageFileName,
  validateDocumentFile,
} from "@/lib/documents";
import { processDocument } from "@/lib/document-processing";
import {
  getDocumentLimitMessage,
  isPlan,
  PLANS,
} from "@/lib/plans";
import {
  KnowledgeSearchError,
  searchKnowledge,
} from "@/lib/search-knowledge";
import { createClient } from "@/lib/supabase/server";

export type DocumentActionState = {
  status: "idle" | "error";
  message: string;
};

export type SemanticSearchMatch = {
  chunkId: string;
  documentId: string;
  sourceName: string;
  similarity: number;
  preview: string;
};

export type SemanticSearchActionState = {
  status: "idle" | "error" | "success";
  message: string;
  matches: SemanticSearchMatch[];
};

type SupabaseErrorDetails = {
  code?: string;
  message?: string;
  statusCode?: string | number;
};

function logDevelopmentError(
  operation: string,
  error: SupabaseErrorDetails | null,
  context?: Record<string, string | number | boolean>,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error("[knowledge-documents]", {
    operation,
    code: error?.code ?? error?.statusCode ?? "unknown",
    message: error?.message ?? "Unknown Supabase error",
    ...context,
  });
}

export async function uploadDocument(
  chatbotId: string,
  previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;

  const fileValue = formData.get("file");

  if (!(fileValue instanceof File)) {
    return { status: "error", message: "Choose a document to upload." };
  }

  const validation = validateDocumentFile(fileValue);

  if (!validation.valid) {
    return { status: "error", message: validation.message };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    logDevelopmentError("auth.getClaims", authError, {
      authenticatedUserPresent: Boolean(userId),
    });
    return {
      status: "error",
      message: "Your session has expired. Log in and try again.",
    };
  }

  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chatbotError || !chatbot) {
    logDevelopmentError("chatbots.ownership", chatbotError, {
      chatbotFound: Boolean(chatbot),
    });
    return {
      status: "error",
      message: "This chatbot could not be found.",
    };
  }

  const [profileResult, countResult] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).single(),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("chatbot_id", chatbotId)
      .eq("user_id", userId),
  ]);

  if (
    profileResult.error ||
    !profileResult.data ||
    !isPlan(profileResult.data.plan)
  ) {
    logDevelopmentError("profiles.plan", profileResult.error, {
      profileFound: Boolean(profileResult.data),
    });
    return {
      status: "error",
      message: "We could not verify your plan. Refresh and try again.",
    };
  }

  if (countResult.error || countResult.count === null) {
    logDevelopmentError("documents.count", countResult.error, {
      countReturned: countResult.count !== null,
    });
    return {
      status: "error",
      message: "We could not check your document limit. Try again.",
    };
  }

  const plan = profileResult.data.plan;

  if (countResult.count >= PLANS[plan].documentsPerChatbot) {
    return { status: "error", message: getDocumentLimitMessage(plan) };
  }

  const documentId = crypto.randomUUID();
  const safeFileName = sanitizeStorageFileName(
    fileValue.name,
    validation.extension,
  );
  const storagePath = `${userId}/${chatbotId}/${documentId}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, fileValue, {
      contentType: validation.canonicalMimeType,
      upsert: false,
    });

  if (uploadError) {
    logDevelopmentError("storage.upload", uploadError, {
      mimeType: validation.canonicalMimeType,
      sizeBytes: fileValue.size,
      pathSegmentCount: storagePath.split("/").length,
      pathStructure: "<userId>/<chatbotId>/<documentId>/<safeFileName>",
    });
    return {
      status: "error",
      message: "We could not upload that document. Try again.",
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    chatbot_id: chatbotId,
    user_id: userId,
    name: fileValue.name,
    storage_path: storagePath,
    mime_type: validation.canonicalMimeType,
    size_bytes: fileValue.size,
  });

  if (insertError) {
    logDevelopmentError("documents.insert", insertError, {
      mimeType: validation.canonicalMimeType,
      sizeBytes: fileValue.size,
    });
    const { error: cleanupError } = await supabase.storage
      .from(KNOWLEDGE_BUCKET)
      .remove([storagePath]);

    if (cleanupError) {
      logDevelopmentError("storage.rollback", cleanupError, {
        pathSegmentCount: storagePath.split("/").length,
        pathStructure: "<userId>/<chatbotId>/<documentId>/<safeFileName>",
      });
    }

    return {
      status: "error",
      message: cleanupError
        ? "The document could not be saved or cleaned up. Contact support before retrying."
        : "The document could not be saved. The uploaded file was removed; try again.",
    };
  }

  await processDocument({
    documentId,
    chatbotId,
    userId,
    userClient: supabase,
  });

  const knowledgePath = `/dashboard/chatbots/${chatbotId}/knowledge`;
  revalidatePath(knowledgePath);
  redirect(knowledgePath);
}

export async function deleteDocument(
  chatbotId: string,
  documentId: string,
  previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;
  void formData;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    logDevelopmentError("delete.auth.getClaims", authError, {
      authenticatedUserPresent: Boolean(userId),
    });
    return {
      status: "error",
      message: "Your session has expired. Log in and try again.",
    };
  }

  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chatbotError || !chatbot) {
    logDevelopmentError("delete.chatbots.ownership", chatbotError, {
      chatbotFound: Boolean(chatbot),
    });
    return { status: "error", message: "Document not found." };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .eq("chatbot_id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (documentError || !document) {
    logDevelopmentError("delete.documents.lookup", documentError, {
      documentFound: Boolean(document),
    });
    return { status: "error", message: "Document not found." };
  }

  const { error: storageError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .remove([document.storage_path]);

  if (storageError) {
    logDevelopmentError("delete.storage.remove", storageError, {
      pathSegmentCount: document.storage_path.split("/").length,
      pathStructure: "<userId>/<chatbotId>/<documentId>/<safeFileName>",
    });
    return {
      status: "error",
      message: "The document file could not be deleted. Try again.",
    };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id)
    .eq("chatbot_id", chatbotId)
    .eq("user_id", userId);

  if (deleteError) {
    logDevelopmentError("delete.documents.delete", deleteError);
    return {
      status: "error",
      message:
        "The file was deleted, but its record could not be removed. Try again.",
    };
  }

  revalidatePath(`/dashboard/chatbots/${chatbotId}/knowledge`);
  return { status: "idle", message: "" };
}

export async function reprocessDocument(
  chatbotId: string,
  documentId: string,
  previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;
  void formData;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    logDevelopmentError("reprocess.auth.getClaims", authError, {
      authenticatedUserPresent: Boolean(userId),
    });
    return {
      status: "error",
      message: "Your session has expired. Log in and try again.",
    };
  }

  const result = await processDocument({
    documentId,
    chatbotId,
    userId,
    userClient: supabase,
  });

  revalidatePath(`/dashboard/chatbots/${chatbotId}/knowledge`);

  return result.success
    ? { status: "idle", message: "" }
    : { status: "error", message: result.message };
}

export async function testSemanticSearch(
  chatbotId: string,
  previousState: SemanticSearchActionState,
  formData: FormData,
): Promise<SemanticSearchActionState> {
  void previousState;

  const queryValue = formData.get("query");
  const query = typeof queryValue === "string" ? queryValue.trim() : "";

  if (!query) {
    return {
      status: "error",
      message: "Enter a question to search.",
      matches: [],
    };
  }

  if (query.length > 500) {
    return {
      status: "error",
      message: "Keep the search question to 500 characters or fewer.",
      matches: [],
    };
  }

  try {
    const matches = await searchKnowledge({ chatbotId, query });

    return {
      status: "success",
      message:
        matches.length === 0
          ? "No chunks met the current similarity threshold."
          : "",
      matches: matches.map((match) => ({
        chunkId: match.chunk_id,
        documentId: match.document_id,
        sourceName:
          typeof match.metadata?.fileName === "string"
            ? match.metadata.fileName
            : "Knowledge document",
        similarity: match.similarity,
        preview:
          match.content.length > 280
            ? `${match.content.slice(0, 280).trimEnd()}…`
            : match.content,
      })),
    };
  } catch (error) {
    logDevelopmentError("semantic-search", {
      code: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : "Unknown search error",
    });

    return {
      status: "error",
      message:
        error instanceof KnowledgeSearchError
          ? error.safeMessage
          : "Semantic search could not be completed. Try again.",
      matches: [],
    };
  }
}
