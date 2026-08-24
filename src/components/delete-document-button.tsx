"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import {
  deleteDocument,
  type DocumentActionState,
} from "@/app/dashboard/chatbots/[id]/knowledge/actions";
import { Button } from "@/components/ui/button";

const initialState: DocumentActionState = {
  status: "idle",
  message: "",
};

type DeleteDocumentButtonProps = {
  chatbotId: string;
  documentId: string;
  documentName: string;
};

export function DeleteDocumentButton({
  chatbotId,
  documentId,
  documentName,
}: DeleteDocumentButtonProps) {
  const deleteSelectedDocument = deleteDocument.bind(
    null,
    chatbotId,
    documentId,
  );
  const [state, formAction, pending] = useActionState(
    deleteSelectedDocument,
    initialState,
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Delete ${documentName}? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`Delete ${documentName}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          {pending ? "Deleting..." : "Delete"}
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
