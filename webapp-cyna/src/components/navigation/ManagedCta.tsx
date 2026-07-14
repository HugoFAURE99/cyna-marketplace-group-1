import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { managedLinkOrFallback } from "@/lib/navigation/managed-link";

type ManagedCtaProps = Omit<ComponentProps<"a">, "href"> & {
  children: ReactNode;
  fallbackHref: string;
  href: string | null | undefined;
};

export function ManagedCta({ children, fallbackHref, href, ...props }: ManagedCtaProps) {
  const destination = managedLinkOrFallback(href, fallbackHref);

  if (destination.kind === "internal") {
    return (
      <Link {...props} href={destination.href}>
        {children}
      </Link>
    );
  }

  return (
    <a
      {...props}
      href={destination.href}
      rel={destination.kind === "external" ? "noopener noreferrer" : props.rel}
      target={destination.kind === "external" ? "_blank" : props.target}
    >
      {children}
    </a>
  );
}
