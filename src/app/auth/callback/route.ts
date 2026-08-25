import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getLoginErrorRedirect(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "auth_callback");
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");

  const supabase = await createClient();

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );

      if (!error) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Fall through and accept only an independently verified existing session.
    }
  }

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (!error && data?.claims?.sub) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch {
    // Missing or invalid sessions use the same safe login error below.
  }

  return NextResponse.redirect(getLoginErrorRedirect(request));
}
