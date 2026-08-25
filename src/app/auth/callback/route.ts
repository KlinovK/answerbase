import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getLoginErrorRedirect(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "auth_callback");
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(getLoginErrorRedirect(request));
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(getLoginErrorRedirect(request));
    }
  } catch {
    return NextResponse.redirect(getLoginErrorRedirect(request));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
