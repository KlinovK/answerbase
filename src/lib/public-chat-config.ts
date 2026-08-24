export const PUBLIC_CHAT_CONFIG = {
  requestsPerWindow: 10,
  rateLimitWindowMs: 60_000,
  maxTrackedClients: 5_000,
  maxChunksScanned: 1_000,
} as const;
