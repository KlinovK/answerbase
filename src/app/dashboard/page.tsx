import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, CalendarDays } from "lucide-react";

import { CreateChatbotDialog } from "@/components/create-chatbot-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getChatbotLimitMessage,
  isPlan,
  PLANS,
} from "@/lib/plans";
import { retryAuthenticatedReadOnce } from "@/lib/supabase/retry-authenticated-read";
import { createClient } from "@/lib/supabase/server";

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const [chatbotsResult, profileResult] = await Promise.all([
    retryAuthenticatedReadOnce(() =>
      supabase
        .from("chatbots")
        .select("id, name, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ),
    retryAuthenticatedReadOnce(() =>
      supabase.from("profiles").select("plan").eq("id", userId).single(),
    ),
  ]);

  if (chatbotsResult.error) {
    throw new Error("Unable to load chatbots.");
  }

  if (
    profileResult.error ||
    !profileResult.data ||
    !isPlan(profileResult.data.plan)
  ) {
    throw new Error("Unable to load the current plan.");
  }

  const chatbots = chatbotsResult.data ?? [];
  const plan = profileResult.data.plan;
  const atLimit = chatbots.length >= PLANS[plan].chatbotLimit;
  const limitMessage = atLimit ? getChatbotLimitMessage(plan) : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chatbots</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Create and manage your AI chatbots.
          </p>
        </div>
        {chatbots.length > 0 ? (
          <CreateChatbotDialog limitMessage={limitMessage} />
        ) : null}
      </div>

      {status === "chatbot-deleted" ? (
        <p role="status" className="mt-6 rounded-xl bg-muted px-4 py-3 text-sm">
          Chatbot deleted.
        </p>
      ) : null}

      {limitMessage ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{limitMessage}</p>
          {plan === "free" ? (
            <Link
              href="/dashboard/billing"
              className="text-sm font-medium underline underline-offset-4"
            >
              View Pro
            </Link>
          ) : null}
        </div>
      ) : null}

      {chatbots.length === 0 ? (
        <Card className="mt-8 border-dashed py-16 shadow-none sm:py-24">
          <CardContent className="flex flex-col items-center px-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <Bot aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-base font-medium">No chatbots yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first chatbot to get started.
            </p>
            <div className="mt-5">
              <CreateChatbotDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chatbots.map((chatbot) => (
            <Link
              key={chatbot.id}
              href={`/dashboard/chatbots/${chatbot.id}`}
              className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full hover:ring-foreground/20">
                <CardHeader>
                  <CardTitle>{chatbot.name}</CardTitle>
                  {chatbot.description ? (
                    <CardDescription className="line-clamp-2">
                      {chatbot.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <p className="text-sm font-medium">Ready to set up</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-3.5" />
                    Created {createdDateFormatter.format(new Date(chatbot.created_at))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
