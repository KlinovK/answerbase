import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ChatbotNavigation } from "@/components/chatbot-navigation";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export default async function ChatbotLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("id, name, description")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !chatbot) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to chatbots
      </Link>

      <header className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {chatbot.name}
        </h1>
        {chatbot.description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {chatbot.description}
          </p>
        ) : null}
      </header>

      <ChatbotNavigation chatbotId={chatbot.id} />
      <Separator className="mt-2" />

      {children}
    </div>
  );
}
