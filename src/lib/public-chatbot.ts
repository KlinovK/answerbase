import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isPlan, PLANS } from "@/lib/plans";
import {
  CHATBOT_PUBLIC_ID_PATTERN,
  normalizeAccentColor,
  WIDGET_CONFIG,
} from "@/lib/widget-config";

export type ResolvedPublicChatbot = {
  chatbotId: string;
  publicId: string;
  name: string;
  welcomeMessage: string;
  accentColor: string;
  showBranding: boolean;
};

function logPublicChatbotError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; name?: string })
      : null;

  console.error("[public-chatbot]", {
    operation,
    code: details?.code ?? details?.name ?? "unknown",
  });
}

export async function resolvePublicChatbot(
  publicId: string,
): Promise<ResolvedPublicChatbot | null> {
  if (!CHATBOT_PUBLIC_ID_PATTERN.test(publicId)) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("chatbots")
    .select("id, public_id, name, welcome_message, accent_color, user_id")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    logPublicChatbotError("chatbots.resolve-public-id", error);
    throw new Error("Public chatbot lookup failed.");
  }

  if (!data) {
    return null;
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("plan")
    .eq("id", data.user_id)
    .maybeSingle();

  if (profileError) {
    logPublicChatbotError("profiles.resolve-owner-plan", profileError);
    throw new Error("Public chatbot plan lookup failed.");
  }

  const profilePlan = profile?.plan;
  const plan =
    typeof profilePlan === "string" && isPlan(profilePlan)
      ? profilePlan
      : "free";
  const features = PLANS[plan];

  return {
    chatbotId: data.id,
    publicId: data.public_id,
    name: data.name,
    welcomeMessage: data.welcome_message,
    accentColor: features.widgetCustomization
      ? normalizeAccentColor(data.accent_color)
      : WIDGET_CONFIG.defaultAccentColor,
    showBranding: !features.removeBranding,
  };
}
