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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth-callback]", {
        operation: "exchange_code_for_session",
        sessionExists: false,
        userExists: false,
        errorCode: error.code ?? null,
        errorMessage: error.message,
      });
      return NextResponse.redirect(getLoginErrorRedirect(request));
    }

    console.info("[auth-callback]", {
      operation: "exchange_code_for_session",
      sessionExists: Boolean(data.session),
      userExists: Boolean(data.user),
      userId: data.user?.id ?? null,
      errorCode: null,
      errorMessage: null,
    });
  } catch (error) {
    console.error("[auth-callback]", {
      operation: "exchange_code_for_session",
      sessionExists: false,
      userExists: false,
      errorCode: null,
      errorMessage:
        error instanceof Error ? error.message : "Unexpected callback error",
    });
    return NextResponse.redirect(getLoginErrorRedirect(request));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
