import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  FileCheck2,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Search,
  Upload,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAX_DOCUMENT_SIZE_MB } from "@/lib/documents";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const freeFeatures = [
  `${PLANS.free.chatbotLimit} chatbot`,
  `${PLANS.free.documentsPerChatbot} documents per chatbot`,
  "AI Playground",
  "Embeddable widget",
  "Answerbase branding",
];

const proFeatures = [
  `Up to ${PLANS.pro.chatbotLimit} chatbots`,
  `${PLANS.pro.documentsPerChatbot} documents per chatbot`,
  "AI Playground",
  "Embeddable widget",
  "Custom widget appearance",
  "Remove Answerbase branding",
];

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your knowledge",
    description:
      "Add PDF, TXT, or Markdown files containing your product, policy, and support information.",
  },
  {
    number: "02",
    icon: MessageSquareText,
    title: "Test your chatbot",
    description:
      "Ask real questions in the Playground and verify answers against your knowledge.",
  },
  {
    number: "03",
    icon: Code2,
    title: "Embed anywhere",
    description:
      "Add one script to your website and give visitors an AI support chatbot.",
  },
];

const features = [
  {
    icon: Bot,
    title: "Grounded answers",
    description:
      "Answers are generated from your uploaded company knowledge.",
  },
  {
    icon: FileCheck2,
    title: "Source citations",
    description: "See which knowledge source supported an answer.",
  },
  {
    icon: Search,
    title: "Semantic search",
    description:
      "Relevant information is retrieved using embeddings and vector search.",
  },
  {
    icon: Code2,
    title: "Embeddable widget",
    description: "Add the chatbot to a website with a small script.",
  },
  {
    icon: LockKeyhole,
    title: "Private knowledge",
    description: "Uploaded documents remain in private storage.",
  },
  {
    icon: FileText,
    title: "Custom appearance",
    description: "Pro users can customize the widget accent color.",
  },
];

const faqs = [
  {
    question: "What files can I upload?",
    answer: `PDF, TXT, and Markdown files up to ${MAX_DOCUMENT_SIZE_MB} MB.`,
  },
  {
    question: "How does Answerbase answer questions?",
    answer:
      "Answerbase retrieves relevant information from your uploaded knowledge and uses it to generate a grounded response.",
  },
  {
    question: "Can I embed the chatbot on my website?",
    answer:
      "Yes. Copy the generated script from the Widget page and add it to your website.",
  },
  {
    question: "Does the demo charge my card?",
    answer:
      "No. Billing in this MVP is simulated and no real payment is collected.",
  },
];

const sectionLinkClassName =
  "rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";
  const primaryLabel = isAuthenticated ? "Go to dashboard" : "Start for free";
  const pricingHref = isAuthenticated ? "/dashboard/billing" : "/signup";

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav
            aria-label="Landing page"
            className="hidden items-center gap-6 md:flex"
          >
            <Link href="#features" className={sectionLinkClassName}>
              Features
            </Link>
            <Link href="#how-it-works" className={sectionLinkClassName}>
              How it works
            </Link>
            <Link href="#pricing" className={sectionLinkClassName}>
              Pricing
            </Link>
          </nav>
          <nav aria-label="Account" className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard" className={buttonVariants()}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "px-2 sm:px-3",
                  )}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={cn(buttonVariants(), "px-3 sm:px-4")}
                >
                  Start for free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-muted-foreground">
                AI support, grounded in your knowledge
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Turn your company knowledge into an AI support chatbot
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Upload your docs, test your chatbot, and embed it on your
                website in minutes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={primaryHref}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full px-5 sm:w-auto",
                  )}
                >
                  {primaryLabel}
                  <ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
                <Link
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full px-5 sm:w-auto",
                  )}
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>

            <div
              className="rounded-2xl border bg-muted/30 p-2 shadow-sm sm:p-3"
              aria-label="Answerbase Knowledge and chatbot preview"
            >
              <div className="overflow-hidden rounded-xl border bg-background">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
                      <Bot aria-hidden="true" className="size-3.5" />
                    </div>
                    <p className="text-sm font-semibold">Customer Support</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Ready
                  </span>
                </div>

                <div className="grid md:grid-cols-[0.85fr_1.15fr]">
                  <div className="border-b p-4 md:border-r md:border-b-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Knowledge
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        ["refund-policy.txt", "TXT"],
                        ["product-guide.pdf", "PDF"],
                        ["shipping.md", "Markdown"],
                      ].map(([name, type]) => (
                        <div
                          key={name}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText
                              aria-hidden="true"
                              className="size-4 text-muted-foreground"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{name}</p>
                            <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                              {type}
                            </p>
                          </div>
                          <span className="text-[0.68rem] font-medium text-muted-foreground">
                            Ready
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/15 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Playground
                      </p>
                      <span className="text-[0.68rem] text-muted-foreground">
                        Grounded answer
                      </span>
                    </div>
                    <div className="mt-5 space-y-5">
                      <div className="flex justify-end">
                        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2.5 text-sm text-background">
                          What is the refund period?
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                          <Bot aria-hidden="true" className="size-3.5" />
                        </div>
                        <div className="min-w-0 max-w-[88%] rounded-2xl rounded-bl-md border bg-background px-3.5 py-3">
                          <p className="text-sm leading-5">
                            Our refund period is 30 days.
                          </p>
                          <div className="mt-3 border-t pt-2.5">
                            <p className="text-[0.68rem] font-medium">Source</p>
                            <p className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
                              <FileText aria-hidden="true" className="size-3" />
                              refund-policy.txt
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-20 border-y bg-muted/20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-muted-foreground">
                How it works
              </p>
              <h2
                id="how-it-works-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                From documents to answers in minutes
              </h2>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map(({ number, icon: Icon, title, description }) => (
                <li key={number}>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl border bg-background">
                      <Icon aria-hidden="true" className="size-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="features-heading"
          className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Built for support knowledge
              </p>
              <h2
                id="features-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Answers you can trace back to your content
              </h2>
              <p className="mt-4 text-muted-foreground">
                Answerbase turns the documents you already maintain into a
                chatbot your team can test and your customers can use.
              </p>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/20 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Embeddable widget
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                From Answerbase to your website
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                Copy one snippet and your support chatbot is ready to use. The
                widget loads the public chatbot configured in your dashboard.
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border bg-background p-2 shadow-sm">
              <div className="flex items-center gap-1.5 border-b px-3 py-2.5">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="ml-2 text-xs text-muted-foreground">
                  website.html
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-6 sm:text-sm">
                <code>{`<script
  src="https://your-answerbase-domain.com/widget.js"
  data-chatbot-id="bot_demo123456">
</script>`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Simple pricing
              </p>
              <h2
                id="pricing-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Start free, upgrade when you need more
              </h2>
              <p className="mt-4 text-muted-foreground">
                Test the full workflow on Free. Upgrade for higher limits and a
                customized customer-facing widget.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl">{PLANS.free.name}</CardTitle>
                  <CardDescription>{PLANS.free.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <div>
                    <span className="text-4xl font-semibold tracking-tight">
                      ${PLANS.free.priceMonthly}
                    </span>
                  </div>
                  <ul className="mt-8 space-y-3 text-sm">
                    {freeFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pricingHref}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "mt-8 w-full",
                    )}
                  >
                    Start for free
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-foreground/25 shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl">{PLANS.pro.name}</CardTitle>
                    <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                      Pro
                    </span>
                  </div>
                  <CardDescription>{PLANS.pro.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <div>
                    <span className="text-4xl font-semibold tracking-tight">
                      ${PLANS.pro.priceMonthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}/ month
                    </span>
                  </div>
                  <ul className="mt-8 space-y-3 text-sm">
                    {proFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pricingHref}
                    className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full")}
                  >
                    Start Pro
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="faq-heading"
          className="border-t bg-muted/20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">FAQ</p>
              <h2
                id="faq-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                A few practical details
              </h2>
            </div>
            <div className="mt-10 divide-y rounded-xl border bg-background px-5 sm:px-6">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="cursor-pointer list-none rounded-sm pr-8 text-sm font-medium outline-none marker:hidden focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {question}
                    <span
                      aria-hidden="true"
                      className="float-right -mr-6 text-muted-foreground group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-2 text-sm text-muted-foreground">
              AI support grounded in your knowledge.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-5">
            <Link href="#features" className={sectionLinkClassName}>
              Product
            </Link>
            <Link href="#pricing" className={sectionLinkClassName}>
              Pricing
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className={sectionLinkClassName}>
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className={sectionLinkClassName}>
                Log in
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
