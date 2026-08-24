"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";

import {
  type DocumentActionState,
  uploadDocument,
} from "@/app/dashboard/chatbots/[id]/knowledge/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  MAX_DOCUMENT_SIZE_MB,
  validateDocumentFile,
} from "@/lib/documents";

const initialState: DocumentActionState = {
  status: "idle",
  message: "",
};

type UploadDocumentDialogProps = {
  chatbotId: string;
  limitMessage?: string;
};

export function UploadDocumentDialog({
  chatbotId,
  limitMessage,
}: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [clientError, setClientError] = useState("");
  const uploadForChatbot = uploadDocument.bind(null, chatbotId);
  const [state, formAction, pending] = useActionState(
    uploadForChatbot,
    initialState,
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");

    if (!file) {
      setClientError("");
      return;
    }

    const validation = validateDocumentFile(file);
    setClientError(validation.valid ? "" : validation.message);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) {
      setOpen(nextOpen);
    }
  }

  const errorMessage = clientError ||
    (state.status === "error" ? state.message : "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="lg"
            disabled={Boolean(limitMessage)}
          />
        }
      >
        <Upload aria-hidden="true" data-icon="inline-start" />
        Upload documents
      </DialogTrigger>
      <DialogContent showCloseButton={!pending} className="sm:max-w-md">
        <form action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              Add a PDF, TXT, or Markdown file to this chatbot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="knowledge-file">Document</Label>
              <Input
                id="knowledge-file"
                name="file"
                type="file"
                accept={DOCUMENT_ACCEPT_ATTRIBUTE}
                onChange={handleFileChange}
                required
                disabled={pending || Boolean(limitMessage)}
                className="h-auto py-1.5"
              />
              <p className="text-xs text-muted-foreground">
                PDF, TXT, or Markdown. Maximum {MAX_DOCUMENT_SIZE_MB} MB.
              </p>
            </div>

            {limitMessage ? (
              <p
                role="status"
                className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
              >
                {limitMessage}
              </p>
            ) : errorMessage ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                pending || Boolean(limitMessage) || !fileName || Boolean(clientError)
              }
            >
              {pending ? "Uploading..." : "Upload document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
