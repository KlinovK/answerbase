import { type NextRequest, NextResponse } from "next/server";

import { createAuthRouteClient } from "@/lib/supabase/auth-route";

function getLoginErrorRedirect(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "auth_callback");
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const response = NextResponse.redirect(getLoginErrorRedirect(request));
  const supabase = createAuthRouteClient(request, response);

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );

      if (!error && data.session && data.user) {
        response.headers.set(
          "Location",
          new URL("/dashboard", request.url).toString(),
        );
        return response;
      }
    } catch {
      // Fall through and accept only an independently verified existing session.
    }
  }

  try {
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) {
      response.headers.set(
        "Location",
        new URL("/dashboard", request.url).toString(),
      );
      return response;
    }
  } catch {
    // Missing or invalid sessions use the same safe login error below.
  }

  return response;
}
