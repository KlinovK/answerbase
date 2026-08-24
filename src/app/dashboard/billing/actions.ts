"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isPlan, PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type BillingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function getAuthenticatedAccount() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    return {
      success: false,
      message: "Your session has expired. Log in and try again.",
    } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !isPlan(profile.plan)) {
    return {
      success: false,
      message: "We could not verify your plan. Refresh and try again.",
    } as const;
  }

  return { success: true, supabase, userId, plan: profile.plan } as const;
}

function revalidatePlanRoutes() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/embed/[publicId]", "page");
}

export async function upgradeToPro(
  previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  void previousState;
  void formData;

  const account = await getAuthenticatedAccount();

  if (!account.success) {
    return { status: "error", message: account.message };
  }

  if (account.plan === "pro") {
    return { status: "success", message: "You're already on Pro." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .update({ plan: "pro" })
    .eq("id", account.userId)
    .eq("plan", "free")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "We could not upgrade your plan. Try again.",
    };
  }

  revalidatePlanRoutes();
  redirect("/dashboard/billing?status=upgraded");
}

export async function downgradeToFree(
  previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  void previousState;
  void formData;

  const account = await getAuthenticatedAccount();

  if (!account.success) {
    return { status: "error", message: account.message };
  }

  if (account.plan === "free") {
    return { status: "success", message: "You're already on the Free plan." };
  }

  const { data: chatbots, error: chatbotsError } = await account.supabase
    .from("chatbots")
    .select("id")
    .eq("user_id", account.userId);

  if (chatbotsError || !chatbots) {
    return {
      status: "error",
      message: "We could not check your chatbot usage. Try again.",
    };
  }

  if (chatbots.length > PLANS.free.chatbotLimit) {
    return {
      status: "error",
      message: `Free allows ${PLANS.free.chatbotLimit} chatbot. Remove extra chatbots before downgrading.`,
    };
  }

  if (chatbots.length > 0) {
    const chatbotIds = chatbots.map((chatbot) => chatbot.id);
    const { data: documents, error: documentsError } = await account.supabase
      .from("documents")
      .select("chatbot_id")
      .eq("user_id", account.userId)
      .in("chatbot_id", chatbotIds);

    if (documentsError || !documents) {
      return {
        status: "error",
        message: "We could not check your document usage. Try again.",
      };
    }

    const documentCounts = new Map<string, number>();

    for (const document of documents) {
      const count = documentCounts.get(document.chatbot_id) ?? 0;
      documentCounts.set(document.chatbot_id, count + 1);
    }

    const exceedsDocumentLimit = Array.from(documentCounts.values()).some(
      (count) => count > PLANS.free.documentsPerChatbot,
    );

    if (exceedsDocumentLimit) {
      return {
        status: "error",
        message: `Free allows ${PLANS.free.documentsPerChatbot} documents per chatbot. Remove extra documents before downgrading.`,
      };
    }
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .update({ plan: "free" })
    .eq("id", account.userId)
    .eq("plan", "pro")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "We could not downgrade your plan. Try again.",
    };
  }

  revalidatePlanRoutes();
  redirect("/dashboard/billing?status=downgraded");
}
