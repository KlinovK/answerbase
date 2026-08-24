"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import {
  createChatbot,
  type CreateChatbotState,
} from "@/app/dashboard/chatbots/actions";
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

const initialState: CreateChatbotState = {
  status: "idle",
  message: "",
};

type CreateChatbotDialogProps = {
  limitMessage?: string;
};

export function CreateChatbotDialog({
  limitMessage,
}: CreateChatbotDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [state, formAction, pending] = useActionState(
    createChatbot,
    initialState,
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) {
      setOpen(nextOpen);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            disabled={Boolean(limitMessage)}
          />
        }
      >
        <Plus aria-hidden="true" data-icon="inline-start" />
        New chatbot
      </DialogTrigger>
      <DialogContent showCloseButton={!pending} className="sm:max-w-md">
        <form action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>Create chatbot</DialogTitle>
            <DialogDescription>
              Give your chatbot a name and an optional description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="chatbot-name">Name</Label>
              <Input
                id="chatbot-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Customer Support"
                maxLength={60}
                required
                autoFocus
                disabled={pending || Boolean(limitMessage)}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatbot-description">Description</Label>
              <textarea
                id="chatbot-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Answers questions about our product and policies."
                maxLength={200}
                rows={4}
                disabled={pending || Boolean(limitMessage)}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/200 characters
              </p>
            </div>

            {limitMessage ? (
              <p
                role="status"
                className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
              >
                {limitMessage}
              </p>
            ) : state.status === "error" ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {state.message}
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
            <Button type="submit" disabled={pending || Boolean(limitMessage)}>
              {pending ? "Creating..." : "Create chatbot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
