# Answerbase

Answerbase is an embeddable AI support chatbot builder that turns company documents into a grounded knowledge assistant. Users can upload company knowledge, process and embed documents, test their assistant, embed it on a website, and manage Free or Pro access.

## Live demo

[https://answerbase-drab.vercel.app](https://answerbase-drab.vercel.app)

Billing is mocked for this take-home MVP. No real payment information is collected or charged.

## Before trying the live demo

The hosted demo uses Supabase's built-in authentication email delivery. Email/password authentication and email confirmation are implemented and enabled, but custom SMTP is not configured.

Supabase's default demo email provider is heavily rate-limited—currently approximately two confirmation emails per hour. Reviewers may therefore encounter:

> Too many confirmation emails were requested. Try again later.

This is an email-delivery limitation of the hosted demo environment, not an Answerbase authentication failure or an intentional registration limit. A production deployment should configure a dedicated SMTP provider such as Resend, Postmark, SendGrid, or Amazon SES.

## Core features

- Supabase email/password authentication with email confirmation
- Chatbot creation, configuration, and deletion
- PDF, TXT, and Markdown knowledge uploads
- Private document storage in Supabase Storage
- Document text extraction, normalization, and chunking
- OpenAI document and query embeddings
- pgvector semantic search
- Grounded RAG answers with source citations
- Chatbot Playground and semantic-search testing
- Public chatbot and embeddable website Widget
- Widget welcome-message and Pro appearance customization
- Server-enforced Free and Pro feature gates
- Mock upgrade and downgrade billing flows
- Responsive landing page and application UI

## Product flow

The core retrieval-augmented generation pipeline is:

```text
Upload documents
→ extract text
→ normalize and chunk
→ generate embeddings
→ store vectors in Supabase PostgreSQL
→ embed the user's question
→ run similarity search
→ retrieve relevant context
→ generate a grounded answer
→ return the answer and sources
```

PDF text is extracted page by page; TXT and Markdown files are processed as text. Retrieved document content is passed to the answer model as untrusted reference context, and the model is instructed to answer only from that context.

## Architecture

| Area | Implementation |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Application | Next.js Server Components, Route Handlers, and Server Actions |
| Data | Supabase PostgreSQL with pgvector |
| Authentication | Supabase Auth with cookie-based SSR sessions |
| Storage | Private Supabase Storage bucket for knowledge documents |
| Authorization | PostgreSQL Row Level Security plus server-side ownership checks |
| AI | OpenAI `text-embedding-3-small` embeddings and `gpt-4.1-mini` grounded answer generation |
| Deployment | Vercel application, Supabase backend, OpenAI API |

## Security model

- RLS isolates authenticated profiles, chatbots, documents, and document chunks by user ownership.
- Server Actions derive `user_id` from the authenticated Supabase user rather than trusting browser input.
- Chatbot ownership is verified server-side before private data is read or changed.
- Public Widget routes accept a generated `public_id`; the server resolves it to the internal chatbot record instead of trusting a private chatbot UUID.
- Public retrieval is scoped to the chatbot resolved from that `public_id`.
- `OPENAI_API_KEY` and `SUPABASE_SECRET_KEY` are used only by server-side modules.
- Knowledge files remain in a private Storage bucket. Public chat responses do not expose raw Storage paths.
- Chatbot, document, Playground, Widget, and branding limits are enforced server-side.
- Uploaded document content is treated as untrusted RAG context and cannot override the application's grounding instructions.

## Free and Pro

| | Free | Pro |
| --- | --- | --- |
| Price | $0 | $19/month |
| Chatbots | 1 | Up to 10 |
| Documents | 5 per chatbot | 50 per chatbot |
| AI Playground | Included | Included |
| Embeddable Widget | Included | Included |
| Widget appearance | Default appearance | Custom accent color |
| Branding | Answerbase branding | Branding can be removed |

Billing is mocked for this take-home MVP. No real payment information is collected or charged.

## Demo walkthrough

Before signing up, note the Supabase demo email rate limit described above.

1. Create an account and confirm the email address.
2. Create a Chatbot.
3. Upload a PDF, TXT, or Markdown document under Knowledge.
4. Wait for processing to reach **Ready**.
5. Test semantic search from the Knowledge page.
6. Ask a question in Playground and verify the grounded answer and Sources.
7. Configure the Widget and copy its embed snippet.
8. Open Demo Store and ask the same question through the public Widget.
9. Try the mock Pro upgrade and its additional feature gates.

## Screenshots

No product screenshots are currently committed. Before final submission, capture real screenshots from the deployed application for:

- Landing page
- Knowledge upload, processing status, and semantic-search results
- Playground answer with Sources
- Widget settings and Demo Store
- Billing with Free and Pro plans

## Local development

```bash
git clone https://github.com/KlinovK/answerbase.git
cd answerbase
npm install
cp .env.example .env.local
npm run dev
```

Configure these variables in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
OPENAI_API_KEY
```

Then open [http://localhost:3000](http://localhost:3000).

The publishable Supabase variables are used by browser and SSR clients. `SUPABASE_SECRET_KEY` and `OPENAI_API_KEY` are server-only and must never be exposed to client code or prefixed with `NEXT_PUBLIC_`.

## Database setup

Supabase migrations are stored in [`supabase/migrations`](supabase/migrations) and must be applied to the target Supabase project in filename order:

1. `20260824000000_create_profiles_and_chatbots.sql` — profiles, Chatbots, automatic profile creation, ownership RLS, and public Chatbot IDs.
2. `20260824010000_create_documents_and_storage.sql` — documents, ownership RLS, the private `knowledge-documents` bucket, and Storage policies.
3. `20260824020000_fix_knowledge_storage_insert_policy.sql` — corrected Storage INSERT policy qualification for user/Chatbot paths.
4. `20260824030000_create_document_chunks.sql` — document chunks, ownership RLS, and controlled chunk replacement.
5. `20260824040000_add_embeddings_and_semantic_search.sql` — pgvector, 1,536-dimensional embeddings, and scoped semantic search.

Apply the migrations using the Supabase CLI or the Supabase SQL workflow used for the target project. Creating local migration files does not apply them to a remote database automatically.

The Storage bucket allows PDF, plain-text, and Markdown MIME types. The application caps uploads at 4 MB so Server Action requests remain below the configured Vercel request limit; the bucket retains a 10 MB upper limit.

## Embedding a Chatbot

The Widget page generates a snippet using the deployed application origin and the Chatbot's generated `public_id`:

```html
<script
  src="https://YOUR_DOMAIN/widget.js"
  data-chatbot-id="bot_xxxxxxxxxxxx">
</script>
```

`widget.js` derives its origin from its own script URL and loads `/embed/[publicId]` in an iframe. The launcher is mounted in an isolated shadow root, and the Chatbot UI runs inside the iframe so host-page styles do not interfere with it.

## Deployment

The application is deployed to Vercel, with Supabase providing Auth, PostgreSQL, pgvector, and private Storage, and OpenAI providing embeddings and grounded answer generation.

For a new deployment:

1. Import the repository as a Next.js project in Vercel.
2. Configure all four environment variables listed above for the intended Vercel environment.
3. Apply the migrations to the target Supabase project.
4. Configure Supabase Auth URL settings with the production Site URL and callback URL. For the current demo, the callback is `https://answerbase-drab.vercel.app/auth/callback`.
5. Redeploy after changing environment variables.

Keep `http://localhost:3000/**` as an additional Supabase redirect URL for local development. Production-quality email delivery also requires configuring a dedicated SMTP provider in Supabase.

## Project scope

This take-home MVP deliberately focuses on the complete document-to-Widget product flow. It does not include:

- Real Stripe payments
- Custom SMTP
- Conversation persistence
- Teams or organizations
- Background workers
- Advanced analytics
- Custom domains
- Web crawling or URL ingestion

Mock billing was chosen because the assignment explicitly allows it. Supabase's built-in email delivery was retained for the demo instead of adding production SMTP. These are deliberate scope decisions, not application defects.

## Development and validation

TypeScript strict mode is enabled. Before submission, the repository is validated with:

```bash
npm run lint
npm run build
git diff --check
```

The repository does not currently define a CI/CD workflow; deployment is handled through Vercel.
