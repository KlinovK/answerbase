"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChatbotNavigation({ chatbotId }: { chatbotId: string }) {
  const pathname = usePathname();
  const overviewPath = `/dashboard/chatbots/${chatbotId}`;
  const knowledgePath = `${overviewPath}/knowledge`;
  const playgroundPath = `${overviewPath}/playground`;
  const widgetPath = `${overviewPath}/widget`;
  const settingsPath = `${overviewPath}/settings`;

  const links = [
    { label: "Overview", href: overviewPath },
    { label: "Knowledge", href: knowledgePath },
    { label: "Playground", href: playgroundPath },
    { label: "Widget", href: widgetPath },
    { label: "Settings", href: settingsPath },
  ];

  return (
    <nav
      aria-label="Chatbot"
      className="mt-7 flex gap-1 overflow-x-auto"
    >
      {links.map(({ label, href }) => {
        const active = pathname === href;

        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "whitespace-nowrap rounded-lg bg-muted px-3 py-2 text-sm font-medium"
                : "whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
