import type { Metadata } from "next";
import Script from "next/script";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { resolvePublicChatbot } from "@/lib/public-chatbot";

export const metadata: Metadata = {
  title: "Northstar — Demo Store",
  description: "A customer-site demo for the Answerbase support widget.",
};

export default async function DemoStorePage({
  searchParams,
}: {
  searchParams: Promise<{ chatbot?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const publicId = Array.isArray(resolvedSearchParams.chatbot)
    ? resolvedSearchParams.chatbot[0]
    : resolvedSearchParams.chatbot;
  const chatbot = publicId ? await resolvePublicChatbot(publicId) : null;

  return (
    <main className="min-h-svh bg-[#f5f7fb] text-[#172033]">
      <header className="border-b border-[#dfe5ef] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-lg font-bold tracking-tight">Northstar</p>
          <nav aria-label="Demo store navigation" className="hidden gap-7 text-sm text-[#5d6678] sm:flex">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <button className="rounded-lg bg-[#335cff] px-4 py-2 text-sm font-semibold text-white">
            Start free
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-28">
        <div>
          <p className="text-sm font-semibold text-[#335cff]">Customer workspace</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            One place for your team to plan and ship better work.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#5d6678]">
            Northstar brings projects, feedback, and decisions together so growing
            teams can move with clarity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#335cff] px-5 py-3 text-sm font-semibold text-white">
              Try Northstar
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
            <button className="rounded-lg border border-[#cfd7e6] bg-white px-5 py-3 text-sm font-semibold">
              View demo
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-[0_24px_70px_rgba(38,52,85,0.12)]">
          <div className="rounded-xl bg-[#172033] p-6 text-white">
            <Sparkles aria-hidden="true" className="size-6 text-[#87a0ff]" />
            <p className="mt-12 text-sm text-white/60">This week</p>
            <p className="mt-2 text-2xl font-semibold">Your team shipped 12 projects</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e5e9f1] p-4">
              <CheckCircle2 aria-hidden="true" className="size-5 text-[#335cff]" />
              <p className="mt-6 text-sm font-semibold">Clear priorities</p>
            </div>
            <div className="rounded-xl border border-[#e5e9f1] p-4">
              <ShieldCheck aria-hidden="true" className="size-5 text-[#335cff]" />
              <p className="mt-6 text-sm font-semibold">Secure by default</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#dfe5ef] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {[
            ["Plan together", "Turn ideas into focused, achievable roadmaps."],
            ["Stay aligned", "Keep decisions and context close to the work."],
            ["Move faster", "Reduce status meetings and unblock your team."],
          ].map(([title, description]) => (
            <div key={title}>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#687286]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {!publicId ? (
        <p className="fixed bottom-5 left-5 max-w-xs rounded-lg border border-[#dfe5ef] bg-white p-3 text-xs text-[#687286] shadow-sm">
          Open this demo from a chatbot&apos;s Widget settings to load its live
          Answerbase widget.
        </p>
      ) : null}

      {publicId && !chatbot ? (
        <p className="fixed bottom-5 left-5 max-w-xs rounded-lg border border-red-200 bg-white p-3 text-xs text-red-700 shadow-sm">
          The selected demo chatbot is unavailable.
        </p>
      ) : null}

      {chatbot ? (
        <Script
          id={`answerbase-widget-${chatbot.publicId}`}
          src="/widget.js"
          data-chatbot-id={chatbot.publicId}
          strategy="afterInteractive"
        />
      ) : null}
    </main>
  );
}
