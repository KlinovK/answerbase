"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import {
  reprocessDocument,
  type DocumentActionState,
} from "@/app/dashboard/chatbots/[id]/knowledge/actions";
import { Button } from "@/components/ui/button";

const initialState: DocumentActionState = {
  status: "idle",
  message: "",
};

type ReprocessDocumentButtonProps = {
  chatbotId: string;
  documentId: string;
  documentName: string;
};

export function ReprocessDocumentButton({
  chatbotId,
  documentId,
  documentName,
}: ReprocessDocumentButtonProps) {
  const reprocessSelectedDocument = reprocessDocument.bind(
    null,
    chatbotId,
    documentId,
  );
  const [state, formAction, pending] = useActionState(
    reprocessSelectedDocument,
    initialState,
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`Reprocess ${documentName}`}
          className="text-muted-foreground"
        >
          <RefreshCw aria-hidden="true" />
          {pending ? "Reprocessing..." : "Reprocess"}
        </Button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="max-w-64 text-right text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
