import { type NextRequest, NextResponse } from "next/server";

import { createAuthRouteClient } from "@/lib/supabase/auth-route";

const AUTH_DEBUG_TAG = "[auth-first-request-debug]";

function getLoginErrorRedirect(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "auth_callback");
  return redirectUrl;
}

function getSupabaseCookieNames(
  cookies: { name: string }[],
) {
  return cookies
    .map(({ name }) => name)
    .filter((name) => name.startsWith("sb-"))
    .sort();
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const response = NextResponse.redirect(getLoginErrorRedirect(request));
  const supabase = createAuthRouteClient(request, response);
  const incomingSupabaseCookieNames = getSupabaseCookieNames(
    request.cookies.getAll(),
  );
  let incomingUserId: string | null = null;
  let incomingUserErrorCode: string | null = null;
  let incomingUserErrorMessage: string | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    incomingUserId = data.user?.id ?? null;
    incomingUserErrorCode = error?.code ?? null;
    incomingUserErrorMessage = error?.message ?? null;
  } catch (error) {
    incomingUserErrorMessage =
      error instanceof Error ? error.message : "Unexpected authentication error";
  }

  console.info(AUTH_DEBUG_TAG, {
    stage: "callback_before_exchange",
    pathname: request.nextUrl.pathname,
    codeExists: Boolean(code),
    incomingUserExists: Boolean(incomingUserId),
    incomingUserId,
    incomingUserErrorCode,
    incomingUserErrorMessage,
    incomingSupabaseCookieNames,
  });

  let destination = getLoginErrorRedirect(request);
  let exchangeSuccess = false;
  let exchangeUserId: string | null = null;
  let exchangeErrorCode: string | null = null;
  let exchangeErrorMessage: string | null = null;

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );

      exchangeSuccess = !error && Boolean(data.session && data.user);
      exchangeUserId = data.user?.id ?? null;
      exchangeErrorCode = error?.code ?? null;
      exchangeErrorMessage = error?.message ?? null;

      if (!error && data.session && data.user) {
        destination = new URL("/dashboard", request.url);
      }
    } catch (error) {
      exchangeErrorMessage =
        error instanceof Error ? error.message : "Unexpected exchange error";
      // Fall through and accept only an independently verified existing session.
    }
  }

  if (!exchangeSuccess) {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        destination = new URL("/dashboard", request.url);
      }
    } catch {
      // Missing or invalid sessions use the same safe login error below.
    }
  }

  response.headers.set("Location", destination.toString());

  const responseSupabaseCookieNames = getSupabaseCookieNames(
    response.cookies.getAll(),
  );

  console.info(AUTH_DEBUG_TAG, {
    stage: "callback_after_exchange",
    exchangeAttempted: Boolean(code),
    exchangeSuccess,
    exchangeUserId,
    exchangeErrorCode,
    exchangeErrorMessage,
    destinationPathname: destination.pathname,
    supabaseCookieKeyCount: responseSupabaseCookieNames.length,
    supabaseCookieKeyNames: responseSupabaseCookieNames,
  });

  const setCookieHeaders = response.headers.getSetCookie();

  console.info(AUTH_DEBUG_TAG, {
    stage: "callback_before_redirect",
    responseStatus: response.status,
    destinationPathname: destination.pathname,
    hasSetCookieHeaders: setCookieHeaders.length > 0,
    setCookieHeaderCount: setCookieHeaders.length,
  });

  return response;
}
