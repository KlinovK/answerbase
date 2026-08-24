import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: authRedirectError } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-svh flex-col bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-5 sm:px-6">
        <Brand />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <AuthForm
          mode="login"
          initialError={
            authRedirectError === "auth_callback" ||
            authRedirectError === "auth_confirmation"
              ? "The confirmation link is invalid or has expired. Try logging in or sign up again."
              : undefined
          }
        />
      </div>
    </main>
  );
}
