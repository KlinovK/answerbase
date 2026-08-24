import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { DeleteDocumentButton } from "@/components/delete-document-button";
import { ReprocessDocumentButton } from "@/components/reprocess-document-button";
import { SemanticSearchTest } from "@/components/semantic-search-test";
import { UploadDocumentDialog } from "@/components/upload-document-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize, MAX_DOCUMENT_SIZE_MB } from "@/lib/documents";
import {
  getDocumentLimitMessage,
  isPlan,
  PLANS,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getFileTypeLabel(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return "PDF";
    case "text/markdown":
      return "Markdown";
    default:
      return "TXT";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "Uploaded";
  }
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatbotId } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const chatbotResult = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chatbotResult.error || !chatbotResult.data) {
    notFound();
  }

  const [documentsResult, profileResult] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, name, mime_type, size_bytes, status, error_message, created_at",
      )
      .eq("chatbot_id", chatbotId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan").eq("id", userId).single(),
  ]);

  if (documentsResult.error) {
    throw new Error("Unable to load knowledge documents.");
  }

  if (
    profileResult.error ||
    !profileResult.data ||
    !isPlan(profileResult.data.plan)
  ) {
    throw new Error("Unable to load the current plan.");
  }

  const documents = documentsResult.data ?? [];
  const plan = profileResult.data.plan;
  const documentLimit = PLANS[plan].documentsPerChatbot;
  const remainingDocuments = Math.max(documentLimit - documents.length, 0);
  const limitMessage =
    remainingDocuments === 0 ? getDocumentLimitMessage(plan) : undefined;

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Knowledge</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Upload documents your chatbot should use to answer questions.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            PDF, TXT, and Markdown · {MAX_DOCUMENT_SIZE_MB} MB maximum per file · {remainingDocuments}{" "}
            of {documentLimit} remaining
          </p>
        </div>
        <UploadDocumentDialog
          chatbotId={chatbotId}
          limitMessage={limitMessage}
        />
      </div>

      {limitMessage ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{limitMessage}</p>
          {plan === "free" ? (
            <Link
              href="/dashboard/billing"
              className="text-sm font-medium underline underline-offset-4"
            >
              Upgrade to Pro
            </Link>
          ) : null}
        </div>
      ) : null}

      {documents.length === 0 ? (
        <Card className="mt-8 border-dashed py-16 shadow-none sm:py-20">
          <CardContent className="flex flex-col items-center px-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <FileText
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
            </div>
            <h3 className="mt-4 text-base font-medium">
              No knowledge sources yet
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Upload your first document to start building your chatbot&apos;s
              knowledge base.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8 gap-0 py-0 shadow-none">
          <ul className="divide-y divide-border" aria-label="Knowledge documents">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {document.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getFileTypeLabel(document.mime_type)} ·{" "}
                      {formatFileSize(document.size_bytes)} ·{" "}
                      {createdDateFormatter.format(new Date(document.created_at))}
                    </p>
                    {document.status === "failed" && document.error_message ? (
                      <p className="mt-2 max-w-xl text-xs text-destructive">
                        {document.error_message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2 sm:justify-end">
                  <span
                    className={
                      document.status === "failed"
                        ? "rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                        : "rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {getStatusLabel(document.status)}
                  </span>
                  {document.status !== "processing" ? (
                    <ReprocessDocumentButton
                      chatbotId={chatbotId}
                      documentId={document.id}
                      documentName={document.name}
                    />
                  ) : null}
                  <DeleteDocumentButton
                    chatbotId={chatbotId}
                    documentId={document.id}
                    documentName={document.name}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SemanticSearchTest chatbotId={chatbotId} />
    </section>
  );
}
