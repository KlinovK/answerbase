"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bot, Check, Clipboard, ExternalLink } from "lucide-react";

import { saveWidgetSettings } from "@/app/dashboard/chatbots/[id]/widget/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAccentColor, WIDGET_CONFIG } from "@/lib/widget-config";

export function WidgetSettings({
  chatbotId,
  chatbotName,
  publicId,
  initialWelcomeMessage,
  initialAccentColor,
  canCustomizeAppearance,
  showBranding,
  embedCode,
}: {
  chatbotId: string;
  chatbotName: string;
  publicId: string;
  initialWelcomeMessage: string;
  initialAccentColor: string;
  canCustomizeAppearance: boolean;
  showBranding: boolean;
  embedCode: string;
}) {
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const previewAccent = normalizeAccentColor(accentColor);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    const formData = new FormData();
    formData.set("welcomeMessage", welcomeMessage);

    if (canCustomizeAppearance) {
      formData.set("accentColor", accentColor);
    }
    setStatus({ type: "idle", message: "" });

    startTransition(async () => {
      const result = await saveWidgetSettings(chatbotId, formData);
      setStatus({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    });
  }

  async function copyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({
        type: "error",
        message: "The embed code could not be copied. Select and copy it manually.",
      });
    }
  }

  return (
    <section className="mt-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Widget</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize and embed {chatbotName} on your website.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="widget-welcome-message">Welcome message</Label>
                  <Input
                    id="widget-welcome-message"
                    name="welcomeMessage"
                    value={welcomeMessage}
                    onChange={(event) => setWelcomeMessage(event.target.value)}
                    maxLength={WIDGET_CONFIG.maxWelcomeMessageLength}
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="widget-accent-color">Accent color</Label>
                    {!canCustomizeAppearance ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        Pro
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-8 shrink-0 rounded-lg border"
                      style={{ backgroundColor: previewAccent }}
                    />
                    <Input
                      id="widget-accent-color"
                      name="accentColor"
                      value={accentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                      pattern="#[0-9A-Fa-f]{6}"
                      placeholder="#111827"
                      maxLength={7}
                      required
                      disabled={pending || !canCustomizeAppearance}
                    />
                  </div>
                  {!canCustomizeAppearance ? (
                    <p className="text-xs text-muted-foreground">
                      Custom widget appearance is available on Pro.{" "}
                      <Link
                        href="/dashboard/billing"
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        View plan
                      </Link>
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving..." : "Save changes"}
                  </Button>
                  {status.message ? (
                    <p
                      role={status.type === "error" ? "alert" : "status"}
                      className={
                        status.type === "error"
                          ? "text-sm text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {status.message}
                    </p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Embed on your website</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add this snippet before the closing body tag on your site.
              </p>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-5">
                <code>{embedCode}</code>
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyEmbedCode}>
                  {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                  {copied ? "Copied" : "Copy code"}
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/demo-store?chatbot=${publicId}`} />}
                >
                  <ExternalLink aria-hidden="true" />
                  Open demo store
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Live preview</p>
          <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div
              className="flex items-center gap-2.5 px-4 py-3 text-white"
              style={{ backgroundColor: previewAccent }}
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <Bot aria-hidden="true" className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{chatbotName}</p>
                <p className="text-[0.7rem] text-white/75">AI support chatbot</p>
              </div>
            </div>
            <div className="min-h-72 p-4">
              <div className="flex items-start gap-2.5">
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: previewAccent }}
                >
                  <Bot aria-hidden="true" className="size-3.5" />
                </div>
                <p className="max-w-[80%] pt-0.5 text-sm leading-5">
                  {welcomeMessage || "Your welcome message will appear here."}
                </p>
              </div>
            </div>
            <div className="border-t p-3">
              <div className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                Ask a question...
              </div>
              {showBranding ? (
                <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
                  Powered by Answerbase
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
