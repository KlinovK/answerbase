"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";

import {
  type BillingActionState,
  downgradeToFree,
  upgradeToPro,
} from "@/app/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLANS, type Plan } from "@/lib/plans";

const initialState: BillingActionState = { status: "idle", message: "" };

const proFeatures = [
  `${PLANS.pro.chatbotLimit} chatbots`,
  `${PLANS.pro.documentsPerChatbot} documents per chatbot`,
  "Custom widget appearance",
  "Remove Answerbase branding",
];

export function BillingPlanActions({ currentPlan }: { currentPlan: Plan }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [upgradeState, upgradeAction, upgrading] = useActionState(
    upgradeToPro,
    initialState,
  );
  const [downgradeState, downgradeAction, downgrading] = useActionState(
    downgradeToFree,
    initialState,
  );

  const status =
    upgradeState.status !== "idle" ? upgradeState : downgradeState;

  return (
    <div>
      {status.status !== "idle" ? (
        <p
          role={status.status === "error" ? "alert" : "status"}
          className={
            status.status === "error"
              ? "mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "mb-4 rounded-lg bg-muted px-3 py-2 text-sm"
          }
        >
          {status.message}
        </p>
      ) : null}

      {currentPlan === "free" ? (
        <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
          <DialogTrigger render={<Button size="lg" />}>
            Upgrade to Pro
          </DialogTrigger>
          <DialogContent showCloseButton={!upgrading} className="sm:max-w-md">
            <form action={upgradeAction} className="contents">
              <DialogHeader>
                <DialogTitle>Upgrade to Pro</DialogTitle>
                <DialogDescription>
                  Unlock higher limits and a fully customized customer widget.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
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
                <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                  Demo checkout — no real payment will be charged.
                </p>
                {upgradeState.status === "error" ? (
                  <p role="alert" className="text-sm text-destructive">
                    {upgradeState.message}
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUpgradeOpen(false)}
                  disabled={upgrading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={upgrading}>
                  {upgrading ? "Upgrading..." : "Confirm upgrade"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <div>
          <p className="mb-3 text-sm font-medium">Manage plan</p>
          <Dialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              Downgrade to Free
            </DialogTrigger>
            <DialogContent
              showCloseButton={!downgrading}
              className="sm:max-w-md"
            >
              <form action={downgradeAction} className="contents">
                <DialogHeader>
                  <DialogTitle>Downgrade to Free</DialogTitle>
                  <DialogDescription>
                    Your data will not be deleted. Your usage must fit within
                    the Free plan limits before the downgrade can complete.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-sm">
                  <p>
                    Free includes {PLANS.free.chatbotLimit} chatbot and{" "}
                    {PLANS.free.documentsPerChatbot} documents per chatbot.
                  </p>
                  <p className="rounded-lg bg-muted px-3 py-2">
                    Custom colors will be preserved, but the default appearance
                    and Answerbase branding will be shown while on Free.
                  </p>
                  {downgradeState.status === "error" ? (
                    <p role="alert" className="text-destructive">
                      {downgradeState.message}
                    </p>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDowngradeOpen(false)}
                    disabled={downgrading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={downgrading}>
                    {downgrading ? "Downgrading..." : "Confirm downgrade"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
