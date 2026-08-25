import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/env";

const AUTH_DEBUG_TAG = "[auth-first-request-debug]";

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const isDashboardRoot = request.nextUrl.pathname === "/dashboard";
  const incomingSupabaseCookieNames = isDashboardRoot
    ? request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-"))
        .sort()
    : [];

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  if (isDashboardRoot) {
    try {
      const { data, error } = await supabase.auth.getUser();

      console.info(AUTH_DEBUG_TAG, {
        stage: "proxy_dashboard_user_verification",
        pathname: request.nextUrl.pathname,
        supabaseCookiesPresent: incomingSupabaseCookieNames.length > 0,
        supabaseCookieNames: incomingSupabaseCookieNames,
        userExists: Boolean(data.user),
        userId: data.user?.id ?? null,
        authErrorCode: error?.code ?? null,
        authErrorMessage: error?.message ?? null,
      });
    } catch (error) {
      console.error(AUTH_DEBUG_TAG, {
        stage: "proxy_dashboard_user_verification",
        pathname: request.nextUrl.pathname,
        supabaseCookiesPresent: incomingSupabaseCookieNames.length > 0,
        supabaseCookieNames: incomingSupabaseCookieNames,
        userExists: false,
        userId: null,
        authErrorCode: null,
        authErrorMessage:
          error instanceof Error
            ? error.message
            : "Unexpected authentication error",
      });
    }
  }

  return response;
}
