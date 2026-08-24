import "server-only";

import { headers } from "next/headers";

const HOST_PATTERN = /^(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:]+\])(?::\d{1,5})?$/;

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || requestHeaders.get("host")?.trim();

  if (!host || !HOST_PATTERN.test(host)) {
    throw new Error("Unable to determine the application origin.");
  }

  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
        ? "http"
        : "https";

  return new URL(`${protocol}://${host}`).origin;
}
