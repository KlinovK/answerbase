"use server";

import { revalidatePath } from "next/cache";

import { isPlan, PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccentColor, WIDGET_CONFIG } from "@/lib/widget-config";

export type WidgetSettingsResult =
  | { success: true; message: string }
  | { success: false; message: string };

function logWidgetSettingsError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;

  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: string; name?: string })
      : null;

  console.error("[widget-settings]", {
    operation,
    code: details?.code ?? details?.name ?? "unknown",
  });
}

export async function saveWidgetSettings(
  chatbotId: string,
  formData: FormData,
): Promise<WidgetSettingsResult> {
  const welcomeValue = formData.get("welcomeMessage");
  const accentValue = formData.get("accentColor");
  const welcomeMessage =
    typeof welcomeValue === "string" ? welcomeValue.trim() : "";
  const accentColor =
    typeof accentValue === "string" ? accentValue.trim() : null;

  if (!welcomeMessage) {
    return { success: false, message: "Enter a welcome message." };
  }

  if (welcomeMessage.length > WIDGET_CONFIG.maxWelcomeMessageLength) {
    return {
      success: false,
      message: `Keep the welcome message to ${WIDGET_CONFIG.maxWelcomeMessageLength} characters or fewer.`,
    };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    return {
      success: false,
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
      success: false,
      message: "We could not verify your plan. Refresh and try again.",
    };
  }

  const canCustomizeAppearance = PLANS[profile.plan].widgetCustomization;

  if (!canCustomizeAppearance && accentValue !== null) {
    return {
      success: false,
      message: "Custom widget appearance is available on Pro.",
    };
  }

  if (
    canCustomizeAppearance &&
    (accentColor === null || normalizeAccentColor(accentColor) !== accentColor)
  ) {
    return {
      success: false,
      message: "Enter a valid six-digit hex color, such as #111827.",
    };
  }

  const updates: { welcome_message: string; accent_color?: string } = {
    welcome_message: welcomeMessage,
  };

  if (canCustomizeAppearance && accentColor) {
    updates.accent_color = accentColor;
  }

  const { data, error } = await supabase
    .from("chatbots")
    .update(updates)
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .select("public_id")
    .maybeSingle();

  if (error || !data) {
    logWidgetSettingsError("chatbots.update", error);
    return {
      success: false,
      message: "Widget settings could not be saved. Try again.",
    };
  }

  revalidatePath(`/dashboard/chatbots/${chatbotId}/widget`);
  revalidatePath(`/embed/${data.public_id}`);

  return { success: true, message: "Widget settings saved." };
}
