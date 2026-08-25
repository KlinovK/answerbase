import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/app/auth/actions";
import { Brand } from "@/components/brand";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

const AUTH_DEBUG_TAG = "[auth-first-request-debug]";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  console.info(AUTH_DEBUG_TAG, {
    stage: "dashboard_layout_user_verification",
    pathname: "/dashboard",
    userExists: Boolean(data?.claims?.sub),
    userId: data?.claims?.sub ?? null,
    authErrorCode: error?.code ?? null,
    authErrorMessage: error?.message ?? null,
  });

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-svh bg-muted/20 md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r bg-background md:flex md:min-h-svh md:flex-col">
        <div className="flex h-16 items-center px-5">
          <Brand href="/dashboard" />
        </div>
        <Separator />
        <DashboardNavigation />
        <form action={logout} className="mt-auto border-t p-3">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start px-3 text-muted-foreground"
          >
            <LogOut aria-hidden="true" data-icon="inline-start" />
            Log out
          </Button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="border-b bg-background md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Brand href="/dashboard" />
            <form action={logout}>
              <Button type="submit" variant="ghost" aria-label="Log out">
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </form>
          </div>
          <DashboardNavigation mobile />
        </header>
        <main className="p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
