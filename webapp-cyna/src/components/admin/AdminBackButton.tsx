"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function AdminBackButton({
  className,
  href,
  label,
  onClick,
}: {
  className?: string;
  href?: string;
  label: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const classes = cn(
    "-ml-2 w-fit gap-1.5 text-muted-foreground hover:text-foreground",
    className,
  );
  const content = (
    <>
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </>
  );

  if (href) {
    return (
      <Button
        className={classes}
        nativeButton={false}
        render={<Link href={href} />}
        size="sm"
        variant="ghost"
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      className={classes}
      onClick={onClick ?? (() => router.back())}
      size="sm"
      type="button"
      variant="ghost"
    >
      {content}
    </Button>
  );
}
