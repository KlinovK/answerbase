"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";

import {
  testSemanticSearch,
  type SemanticSearchActionState,
} from "@/app/dashboard/chatbots/[id]/knowledge/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SemanticSearchActionState = {
  status: "idle",
  message: "",
  matches: [],
};

type SemanticSearchTestProps = {
  chatbotId: string;
};

export function SemanticSearchTest({ chatbotId }: SemanticSearchTestProps) {
  const searchThisKnowledge = testSemanticSearch.bind(null, chatbotId);
  const [state, formAction, pending] = useActionState(
    searchThisKnowledge,
    initialState,
  );

  return (
    <Card className="mt-8 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Semantic search test</CardTitle>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
            Internal
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify which knowledge chunks match a question. This does not generate
          an AI answer.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="semantic-search-query">Test semantic search</Label>
            <Input
              id="semantic-search-query"
              name="query"
              type="search"
              placeholder="What is the refund period?"
              maxLength={500}
              required
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending} className="sm:self-end">
            <Search aria-hidden="true" />
            {pending ? "Searching..." : "Search"}
          </Button>
        </form>

        {state.status === "error" ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        {state.status === "success" && state.matches.length === 0 ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {state.message}
          </p>
        ) : null}

        {state.matches.length > 0 ? (
          <ol className="mt-5 space-y-3" aria-label="Semantic search results">
            {state.matches.map((match) => (
              <li key={match.chunkId} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{match.sourceName}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {(match.similarity * 100).toFixed(1)}% similarity
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {match.preview}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  );
}
