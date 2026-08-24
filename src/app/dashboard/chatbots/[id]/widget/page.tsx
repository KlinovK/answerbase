import { notFound, redirect } from "next/navigation";

import { WidgetSettings } from "@/components/widget-settings";
import { isPlan, PLANS } from "@/lib/plans";
import { getRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccentColor, WIDGET_CONFIG } from "@/lib/widget-config";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatbotId } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) redirect("/login");

  const [chatbotResult, profileResult] = await Promise.all([
    supabase
      .from("chatbots")
      .select("id, public_id, name, welcome_message, accent_color")
      .eq("id", chatbotId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("plan").eq("id", userId).single(),
  ]);

  if (chatbotResult.error || !chatbotResult.data) notFound();

  if (
    profileResult.error ||
    !profileResult.data ||
    !isPlan(profileResult.data.plan)
  ) {
    throw new Error("Unable to load the current plan.");
  }

  const chatbot = chatbotResult.data;
  const plan = PLANS[profileResult.data.plan];
  const accentColor = plan.widgetCustomization
    ? normalizeAccentColor(chatbot.accent_color)
    : WIDGET_CONFIG.defaultAccentColor;

  const origin = await getRequestOrigin();
  const embedCode = `<script
  src="${origin}/widget.js"
  data-chatbot-id="${chatbot.public_id}">
</script>`;

  return (
    <WidgetSettings
      chatbotId={chatbot.id}
      chatbotName={chatbot.name}
      publicId={chatbot.public_id}
      initialWelcomeMessage={chatbot.welcome_message}
      initialAccentColor={accentColor}
      canCustomizeAppearance={plan.widgetCustomization}
      showBranding={!plan.removeBranding}
      embedCode={embedCode}
    />
  );
}
