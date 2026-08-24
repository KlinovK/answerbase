"use server";

import {
  generateGroundedAnswerFromMatches,
  GroundedAnswerError,
  type AnswerSource,
} from "@/lib/grounded-answer";
import { PLAYGROUND_CONFIG } from "@/lib/playground-config";
import { resolvePublicChatbot } from "@/lib/public-chatbot";
import { searchPublicKnowledge } from "@/lib/public-knowledge-search";
import { checkPublicChatRateLimit } from "@/lib/public-rate-limit";
import { KnowledgeSearchError } from "@/lib/search-knowledge";
import { CHATBOT_PUBLIC_ID_PATTERN } from "@/lib/widget-config";

export type PublicChatResult =
  | { success: true; answer: string; sources: AnswerSource[] }
  | { success: false; error: string };

function logPublicChatError(error: unknown) {
  if (process.env.NODE_ENV === "production") return;

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; name?: string })
      : null;

  console.error("[public-chat]", {
    operation: "ask-public-chatbot",
    code: details?.code ?? details?.name ?? "unknown",
    model: PLAYGROUND_CONFIG.model,
  });
}

export async function askPublicChatbot(
  publicId: string,
  formData: FormData,
): Promise<PublicChatResult> {
  const questionValue = formData.get("question");
  const question =
    typeof questionValue === "string" ? questionValue.trim() : "";

  if (!CHATBOT_PUBLIC_ID_PATTERN.test(publicId)) {
    return { success: false, error: "This chatbot is unavailable." };
  }

  if (!question) {
    return { success: false, error: "Enter a question to send." };
  }

  if (question.length > PLAYGROUND_CONFIG.maxQuestionLength) {
    return {
      success: false,
      error: `Keep your question to ${PLAYGROUND_CONFIG.maxQuestionLength} characters or fewer.`,
    };
  }

  const rateLimit = await checkPublicChatRateLimit(publicId);

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many questions. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  try {
    const chatbot = await resolvePublicChatbot(publicId);

    if (!chatbot) {
      return { success: false, error: "This chatbot is unavailable." };
    }

    const matches = await searchPublicKnowledge({
      chatbotId: chatbot.chatbotId,
      query: question,
    });
    const result = await generateGroundedAnswerFromMatches({
      question,
      matches,
    });

    return {
      success: true,
      answer: result.answer,
      sources: result.sources,
    };
  } catch (error) {
    logPublicChatError(error);

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
