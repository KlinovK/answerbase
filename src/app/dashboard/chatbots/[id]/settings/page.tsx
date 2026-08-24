import { notFound, redirect } from "next/navigation";

import { DeleteChatbotDialog } from "@/components/delete-chatbot-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatbotId } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) redirect("/login");

  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("id, name")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !chatbot) notFound();

  return (
    <section className="mt-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Manage this chatbot.
        </p>
      </div>

      <Card className="mt-8 border-destructive/30 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
          <CardDescription>
            Destructive actions for this chatbot.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Delete chatbot</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Permanently delete this chatbot and its knowledge base. This
              action cannot be undone.
            </p>
          </div>
          <DeleteChatbotDialog
            chatbotId={chatbot.id}
            chatbotName={chatbot.name}
          />
        </CardContent>
      </Card>
    </section>
  );
}
