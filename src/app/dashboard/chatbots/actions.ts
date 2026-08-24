"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getChatbotLimitMessage,
  isPlan,
  PLANS,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type CreateChatbotState = {
  status: "idle" | "error";
  message: string;
};

function readChatbotInput(formData: FormData) {
  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");

  if (typeof nameValue !== "string") {
    return { success: false, error: "Chatbot name is required." } as const;
  }

  if (descriptionValue !== null && typeof descriptionValue !== "string") {
    return { success: false, error: "Description must be text." } as const;
  }

  const name = nameValue.trim();
  const description = descriptionValue?.trim() ?? "";

  if (!name) {
    return { success: false, error: "Chatbot name is required." } as const;
  }

  if (name.length > 60) {
    return {
      success: false,
      error: "Chatbot name must be 60 characters or fewer.",
    } as const;
  }

  if (description.length > 200) {
    return {
      success: false,
      error: "Description must be 200 characters or fewer.",
    } as const;
  }

  return {
    success: true,
    name,
    description: description || null,
  } as const;
}

export async function createChatbot(
  previousState: CreateChatbotState,
  formData: FormData,
): Promise<CreateChatbotState> {
  void previousState;

  const input = readChatbotInput(formData);

  if (!input.success) {
    return { status: "error", message: input.error };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    return {
      status: "error",
      message: "Your session has expired. Log in and try again.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !isPlan(profile.plan)) {
    return {
      status: "error",
      message: "We could not verify your plan. Refresh and try again.",
    };
  }

  const { count, error: countError } = await supabase
    .from("chatbots")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError || count === null) {
    return {
      status: "error",
      message: "We could not check your chatbot limit. Try again.",
    };
  }

  if (count >= PLANS[profile.plan].chatbotLimit) {
    return {
      status: "error",
      message: getChatbotLimitMessage(profile.plan),
    };
  }

  const { data: chatbot, error: insertError } = await supabase
    .from("chatbots")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
    })
    .select("id")
    .single();

  if (insertError || !chatbot) {
    return {
      status: "error",
      message: "We could not create your chatbot. Try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
