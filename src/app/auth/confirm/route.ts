import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createAuthRouteClient } from "@/lib/supabase/auth-route";

function getLoginErrorRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "auth_confirmation");
  return loginUrl;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const response = NextResponse.redirect(getLoginErrorRedirect(request));
  const supabase = createAuthRouteClient(request, response);

  if (tokenHash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

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
