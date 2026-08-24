"use client";

import { useState, useTransition } from "react";
import { Bot, Send, User } from "lucide-react";

import { askChatbot } from "@/app/dashboard/chatbots/[id]/playground/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAYGROUND_CONFIG } from "@/lib/playground-config";

type Source = {
  fileName: string;
  page?: number;
};

type Message =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      content: string;
      sources: Source[];
    };

export function PlaygroundChat({
  chatbotId,
  chatbotName,
}: {
  chatbotId: string;
  chatbotName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

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
      const result = await askChatbot(chatbotId, formData);

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
    <section className="mt-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Playground</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat with {chatbotName} using its current knowledge base.
        </p>
      </div>

      <Card className="mt-6 min-h-[34rem] gap-0 overflow-hidden py-0 shadow-none">
        <div
          className="flex min-h-[27rem] flex-1 flex-col px-4 py-6 sm:px-6"
          aria-live="polite"
        >
          {messages.length === 0 && !pending ? (
            <div className="m-auto max-w-md text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
                <Bot aria-hidden="true" className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-medium">Test your chatbot</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ask questions to see how your chatbot answers using your knowledge
                base.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end gap-3">
                    <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-3 sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      <User aria-hidden="true" className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot aria-hidden="true" className="size-4" />
                    </div>
                    <div className="min-w-0 max-w-3xl pt-1">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.content}
                      </p>
                      {message.sources.length > 0 ? (
                        <div className="mt-4 border-t pt-3">
                          <p className="text-xs font-medium">Sources</p>
                          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
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
                <div className="flex items-start gap-3" role="status">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot aria-hidden="true" className="size-4" />
                  </div>
                  <p className="pt-1.5 text-sm text-muted-foreground">Thinking...</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t bg-background p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="playground-question" className="sr-only">
                Ask a question
              </Label>
              <Input
                id="playground-question"
                name="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question..."
                maxLength={PLAYGROUND_CONFIG.maxQuestionLength}
                autoComplete="off"
                disabled={pending}
                required
                className="h-10"
              />
            </div>
            <Button type="submit" size="lg" disabled={pending || !question.trim()}>
              <Send aria-hidden="true" />
              {pending ? "Thinking..." : "Send"}
            </Button>
          </form>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
