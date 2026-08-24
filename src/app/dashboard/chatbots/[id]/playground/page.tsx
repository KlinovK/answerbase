import { notFound, redirect } from "next/navigation";

import { PlaygroundChat } from "@/components/playground-chat";
import { createClient } from "@/lib/supabase/server";

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatbotId } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("id, name")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !chatbot) {
    notFound();
  }

  return <PlaygroundChat chatbotId={chatbot.id} chatbotName={chatbot.name} />;
}
