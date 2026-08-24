import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
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
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
