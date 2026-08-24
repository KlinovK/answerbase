"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { KNOWLEDGE_BUCKET } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

export type DeleteChatbotState = {
  status: "idle" | "error";
  message: string;
};

type SupabaseErrorDetails = {
  code?: string;
  message?: string;
  statusCode?: string | number;
};

function logDeletionError(
  operation: string,
  error: SupabaseErrorDetails | null,
  context?: Record<string, string | number | boolean>,
) {
  if (process.env.NODE_ENV === "production") return;

  console.error("[delete-chatbot]", {
    operation,
    code: error?.code ?? error?.statusCode ?? "unknown",
    message: error?.message ?? "Unknown Supabase error",
    ...context,
  });
}

export async function deleteChatbot(
  chatbotId: string,
  previousState: DeleteChatbotState,
  formData: FormData,
): Promise<DeleteChatbotState> {
  void previousState;
  void formData;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    logDeletionError("auth.getClaims", authError, {
      authenticatedUserPresent: Boolean(userId),
    });
    return {
      status: "error",
      message: "Your session has expired. Log in and try again.",
    };
  }

  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id, public_id")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chatbotError || !chatbot) {
    logDeletionError("chatbots.ownership", chatbotError, {
      chatbotFound: Boolean(chatbot),
    });
    return {
      status: "error",
      message: "This chatbot could not be found.",
    };
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("chatbot_id", chatbot.id)
    .eq("user_id", userId);

  if (documentsError || !documents) {
    logDeletionError("documents.storage-paths", documentsError);
    return {
      status: "error",
      message: "We could not prepare this chatbot for deletion. Try again.",
    };
  }

  const expectedStoragePrefix = `${userId}/${chatbot.id}/`;
  const storagePaths = documents.map((document) => document.storage_path);
  const hasUnexpectedPath = storagePaths.some(
    (storagePath) => !storagePath.startsWith(expectedStoragePrefix),
  );

  if (hasUnexpectedPath) {
    logDeletionError("documents.validate-storage-paths", null, {
      pathCount: storagePaths.length,
      expectedPathStructure:
        "<userId>/<chatbotId>/<documentId>/<safeFileName>",
    });
    return {
      status: "error",
      message: "We could not safely verify this chatbot's files. Contact support.",
    };
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(KNOWLEDGE_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      logDeletionError("storage.remove", storageError, {
        pathCount: storagePaths.length,
        pathStructure: "<userId>/<chatbotId>/<documentId>/<safeFileName>",
      });
      return {
        status: "error",
        message:
          "Some knowledge files could not be removed. The chatbot was not deleted; try again.",
      };
    }
  }

  const { data: deletedChatbot, error: deleteError } = await supabase
    .from("chatbots")
    .delete()
    .eq("id", chatbot.id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleteError || !deletedChatbot) {
    logDeletionError("chatbots.delete", deleteError, {
      storageFilesRemoved: storagePaths.length,
    });
    return {
      status: "error",
      message:
        "Knowledge files were removed, but the chatbot could not be deleted. Try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath(`/embed/${chatbot.public_id}`);
  redirect("/dashboard?status=chatbot-deleted");
}
