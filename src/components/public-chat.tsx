"use client";

import { useState, useTransition } from "react";
import { Bot, Send, User } from "lucide-react";

import { askPublicChatbot } from "@/app/embed/[publicId]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAYGROUND_CONFIG } from "@/lib/playground-config";

type Source = { fileName: string; page?: number };

type Message =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      sources: Source[];
    };

export function PublicChat({
  publicId,
  chatbotName,
  welcomeMessage,
  accentColor,
  showBranding,
}: {
  publicId: string;
  chatbotName: string;
  welcomeMessage: string;
  accentColor: string;
  showBranding: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage,
      sources: [],
    },
  ]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    const submittedQuestion = question.trim();

    if (!submittedQuestion) {
      setError("Enter a question to send.");
      return;
    }

    if (submittedQuestion.length > PLAYGROUND_CONFIG.maxQuestionLength) {
      setError(
        `Keep your question to ${PLAYGROUND_CONFIG.maxQuestionLength} characters or fewer.`,
      );
      return;
    }

    setError("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: submittedQuestion,
      },
    ]);
    setQuestion("");

    const formData = new FormData();
    formData.set("question", submittedQuestion);

    startTransition(async () => {
      const result = await askPublicChatbot(publicId, formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    });
  }

  return (
    <main className="flex h-svh min-h-0 flex-col bg-background">
      <header
        className="flex shrink-0 items-center gap-3 border-b px-4 py-3 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-white/15">
          <Bot aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{chatbotName}</h1>
          <p className="text-xs text-white/75">AI support chatbot</p>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5"
        aria-live="polite"
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end gap-2.5">
              <div className="max-w-[82%] rounded-2xl rounded-br-md bg-muted px-3.5 py-2.5">
                <p className="whitespace-pre-wrap break-words text-sm leading-5">
                  {message.content}
                </p>
              </div>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border">
                <User aria-hidden="true" className="size-3.5 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Bot aria-hidden="true" className="size-3.5" />
              </div>
              <div className="min-w-0 max-w-[82%] pt-0.5">
                <p className="whitespace-pre-wrap break-words text-sm leading-5">
                  {message.content}
                </p>
                {message.sources.length > 0 ? (
                  <div className="mt-3 border-t pt-2.5">
                    <p className="text-[0.7rem] font-medium">Sources</p>
                    <ul className="mt-1 space-y-0.5 text-[0.7rem] text-muted-foreground">
                      {message.sources.map((source) => (
                        <li key={`${source.fileName}-${source.page ?? "file"}`}>
                          {source.fileName}
                          {source.page ? ` · Page ${source.page}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ),
        )}

        {pending ? (
          <div className="flex items-start gap-2.5" role="status">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Bot aria-hidden="true" className="size-3.5" />
            </div>
            <p className="pt-1 text-sm text-muted-foreground">Thinking...</p>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t bg-background p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="public-chat-question" className="sr-only">
              Ask a question
            </Label>
            <Input
              id="public-chat-question"
              name="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question..."
              maxLength={PLAYGROUND_CONFIG.maxQuestionLength}
              autoComplete="off"
              disabled={pending}
              required
              className="h-9"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={pending || !question.trim()}
            aria-label="Send question"
            style={{ backgroundColor: accentColor }}
          >
            <Send aria-hidden="true" />
          </Button>
        </form>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {showBranding ? (
          <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
            Powered by Answerbase
          </p>
        ) : null}
      </div>
    </main>
  );
}
