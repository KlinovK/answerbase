import { notFound } from "next/navigation";

import { PublicChat } from "@/components/public-chat";
import { resolvePublicChatbot } from "@/lib/public-chatbot";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const chatbot = await resolvePublicChatbot(publicId);

  if (!chatbot) notFound();

  return (
    <PublicChat
      publicId={chatbot.publicId}
      chatbotName={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage}
      accentColor={chatbot.accentColor}
      showBranding={chatbot.showBranding}
    />
  );
}
