export const PLAYGROUND_CONFIG = {
  model: "gpt-4.1-mini",
  temperature: 0.2,
  maxOutputTokens: 400,
  maxQuestionLength: 1000,
  fallbackAnswer: "I couldn't find that information in the available knowledge.",
} as const;
