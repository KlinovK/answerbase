import "server-only";

import { headers } from "next/headers";

import { PUBLIC_CHAT_CONFIG } from "@/lib/public-chat-config";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimit = globalThis as typeof globalThis & {
  answerbasePublicChatRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  globalRateLimit.answerbasePublicChatRateLimits ??
  new Map<string, RateLimitEntry>();

globalRateLimit.answerbasePublicChatRateLimits = rateLimits;

function removeExpiredEntries(now: number) {
  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) {
      rateLimits.delete(key);
    }
  }
}

async function getClientKey(publicId: string) {
  const requestHeaders = await headers();
  const forwardedAddress = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const address =
    forwardedAddress || requestHeaders.get("x-real-ip")?.trim() || "unknown";

  return `${publicId}:${address.slice(0, 128)}`;
}

export async function checkPublicChatRateLimit(publicId: string) {
  const now = Date.now();
  removeExpiredEntries(now);

  if (rateLimits.size >= PUBLIC_CHAT_CONFIG.maxTrackedClients) {
    const oldestKey = rateLimits.keys().next().value;

    if (oldestKey) {
      rateLimits.delete(oldestKey);
    }
  }

  const key = await getClientKey(publicId);
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + PUBLIC_CHAT_CONFIG.rateLimitWindowMs,
    });
    return { allowed: true as const };
  }

  if (current.count >= PUBLIC_CHAT_CONFIG.requestsPerWindow) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  return { allowed: true as const };
}
