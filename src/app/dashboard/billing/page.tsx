import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { BillingPlanActions } from "@/components/billing-plan-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isPlan, PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) redirect("/login");

  const [profileResult, chatbotCountResult] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).single(),
    supabase
      .from("chatbots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (
    profileResult.error ||
    !profileResult.data ||
    !isPlan(profileResult.data.plan)
  ) {
    throw new Error("Unable to load the current plan.");
  }

  if (chatbotCountResult.error || chatbotCountResult.count === null) {
    throw new Error("Unable to load plan usage.");
  }

  const plan = profileResult.data.plan;
  const currentPlan = PLANS[plan];
  const proFeatures = [
    `Up to ${PLANS.pro.chatbotLimit} AI chatbots`,
    `${PLANS.pro.documentsPerChatbot} documents per chatbot`,
    "AI Playground",
    "Embeddable widget",
    "Custom widget appearance",
    "Remove Answerbase branding",
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Manage your Answerbase plan and usage.
        </p>
      </div>

      <p className="mt-6 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
        Demo billing — no real payment will be charged.
      </p>

      {status === "upgraded" || status === "downgraded" ? (
        <p role="status" className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">
          {status === "upgraded"
            ? "You're now on Pro."
            : "You're now on the Free plan."}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-xl">{currentPlan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-3xl font-semibold tracking-tight">
                ${currentPlan.priceMonthly}
              </span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </div>
            <div>
              <p className="text-sm font-medium">Plan usage</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Chatbots: {chatbotCountResult.count} / {currentPlan.chatbotLimit}
              </p>
            </div>
          </CardContent>
        </Card>

        {plan === "free" ? (
          <Card className="border-foreground/20 shadow-none">
            <CardHeader>
              <CardDescription>Available plan</CardDescription>
              <CardTitle className="text-xl">{PLANS.pro.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-3xl font-semibold tracking-tight">
                  ${PLANS.pro.priceMonthly}
                </span>
                <span className="text-sm text-muted-foreground"> / month</span>
              </div>
              <ul className="space-y-2 text-sm">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <BillingPlanActions currentPlan={plan} />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Included with Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2 text-sm">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <BillingPlanActions currentPlan={plan} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
