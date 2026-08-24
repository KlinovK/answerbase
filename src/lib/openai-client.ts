import "server-only";

import OpenAI from "openai";

export class OpenAIConfigurationError extends Error {
  constructor() {
    super("Missing required server environment variable: OPENAI_API_KEY.");
    this.name = "OpenAIConfigurationError";
  }
}

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIConfigurationError();
  }

  return new OpenAI({ apiKey });
}
