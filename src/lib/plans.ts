export type Plan = "free" | "pro";

export type PlanConfig = {
  name: string;
  priceMonthly: number;
  description: string;
  chatbotLimit: number;
  documentsPerChatbot: number;
  aiPlayground: boolean;
  embeddableWidget: boolean;
  widgetCustomization: boolean;
  removeBranding: boolean;
};

export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    description: "For trying Answerbase",
    chatbotLimit: 1,
    documentsPerChatbot: 5,
    aiPlayground: true,
    embeddableWidget: true,
    widgetCustomization: false,
    removeBranding: false,
  },
  pro: {
    name: "Pro",
    priceMonthly: 19,
    description: "For teams using AI support with customers",
    chatbotLimit: 10,
    documentsPerChatbot: 50,
    aiPlayground: true,
    embeddableWidget: true,
    widgetCustomization: true,
    removeBranding: true,
  },
} as const satisfies Record<Plan, PlanConfig>;

export function isPlan(value: string): value is Plan {
  return value in PLANS;
}

export function getChatbotLimitMessage(plan: Plan) {
  const config = PLANS[plan];

  return `You've reached the limit for your plan. ${config.name} includes ${config.chatbotLimit} chatbot${config.chatbotLimit === 1 ? "" : "s"}.`;
}

export function getDocumentLimitMessage(plan: Plan) {
  const config = PLANS[plan];

  return `You've reached the limit for your plan. ${config.name} includes ${config.documentsPerChatbot} documents per chatbot.`;
}
