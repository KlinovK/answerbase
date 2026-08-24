"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  deleteChatbot,
  type DeleteChatbotState,
} from "@/app/dashboard/chatbots/[id]/settings/actions";
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

const initialState: DeleteChatbotState = {
  status: "idle",
  message: "",
};

export function DeleteChatbotDialog({
  chatbotId,
  chatbotName,
}: {
  chatbotId: string;
  chatbotName: string;
}) {
  const [open, setOpen] = useState(false);
  const deleteSelectedChatbot = deleteChatbot.bind(null, chatbotId);
  const [state, formAction, pending] = useActionState(
    deleteSelectedChatbot,
    initialState,
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        <Trash2 aria-hidden="true" data-icon="inline-start" />
        Delete chatbot
      </DialogTrigger>
      <DialogContent showCloseButton={!pending} className="sm:max-w-md">
        <form action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>Delete {chatbotName}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the chatbot, its knowledge base, and
              uploaded files. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting..." : "Delete chatbot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
