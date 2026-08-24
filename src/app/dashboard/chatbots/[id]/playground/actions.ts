"use server";

import {
  generateGroundedAnswer,
  GroundedAnswerError,
  type AnswerSource,
} from "@/lib/grounded-answer";
import { PLAYGROUND_CONFIG } from "@/lib/playground-config";
import { KnowledgeSearchError } from "@/lib/search-knowledge";

export type AskChatbotResult =
  | {
      success: true;
      answer: string;
      sources: AnswerSource[];
    }
  | {
      success: false;
      error: string;
    };

function logPlaygroundError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; name?: string })
      : null;

  console.error("[playground]", {
    operation: "ask-chatbot",
    code: details?.code ?? details?.name ?? "unknown",
    model: PLAYGROUND_CONFIG.model,
  });
}

export async function askChatbot(
  chatbotId: string,
  formData: FormData,
): Promise<AskChatbotResult> {
  const questionValue = formData.get("question");
  const question =
    typeof questionValue === "string" ? questionValue.trim() : "";

  if (!question) {
    return { success: false, error: "Enter a question to send." };
  }

  if (question.length > PLAYGROUND_CONFIG.maxQuestionLength) {
    return {
      success: false,
      error: `Keep your question to ${PLAYGROUND_CONFIG.maxQuestionLength} characters or fewer.`,
    };
  }

  try {
    const result = await generateGroundedAnswer({ chatbotId, question });

    return {
      success: true,
      answer: result.answer,
      sources: result.sources,
    };
  } catch (error) {
    logPlaygroundError(error);

    if (error instanceof KnowledgeSearchError) {
      return { success: false, error: error.safeMessage };
    }

    if (error instanceof GroundedAnswerError) {
      return { success: false, error: error.safeMessage };
    }

    return {
      success: false,
      error: "The chatbot could not answer right now. Try again.",
    };
  }
}
