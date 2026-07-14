"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteChatConversation } from "@/app/[locale]/(admin)/admin/_actions/chatbot.actions";
import { useRouter } from "@/i18n/navigation";

export function DeleteConversationButton({
  confirmMessage,
  conversationId,
  label,
}: {
  confirmMessage: string;
  conversationId: string;
  label: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  return (
    <div>
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(false);
          startTransition(async () => {
            const result = await deleteChatConversation(conversationId);
            if (!result.ok) setError(true);
            else router.push("/admin/chatbot");
          });
        }}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {label}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{label}</p>}
    </div>
  );
}
