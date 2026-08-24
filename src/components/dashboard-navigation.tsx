"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, CreditCard, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { label: "Chatbots", icon: Bot, href: "/dashboard" },
  { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
  { label: "Settings", icon: Settings, href: null },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href || pathname.startsWith("/dashboard/chatbots/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard"
      className={mobile ? "flex gap-1 overflow-x-auto px-3 pb-3" : "space-y-1 p-3"}
    >
      {navigation.map(({ label, icon: Icon, href }) => {
        const active = href ? isActive(pathname, href) : false;
        const className = mobile
          ? cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap",
              active ? "bg-muted font-medium" : "text-muted-foreground",
            )
          : cn(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-sm",
              active ? "bg-muted font-medium" : "text-muted-foreground",
            );

        return href ? (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ) : (
          <span key={label} className={className} aria-disabled="true">
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </span>
        );
      })}
    </nav>
  );
}
