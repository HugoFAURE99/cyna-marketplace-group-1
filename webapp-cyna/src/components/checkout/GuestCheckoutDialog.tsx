"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2, LogIn, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

type GuestCheckoutDialogProps = {
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnPath: string;
};

export default function GuestCheckoutDialog({
  isPending,
  onConfirm,
  onOpenChange,
  open,
  returnPath,
}: GuestCheckoutDialogProps) {
  const t = useTranslations("guestCheckout");
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-80 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-81 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight">
                {t("title")}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">
                {t("description")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t("close")}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              disabled={isPending}
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-purple-700 px-4 text-center text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2"
              href="/register"
            >
              <UserPlus aria-hidden="true" className="size-5" />
              {t("createAccount")}
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-purple-300 bg-white px-4 text-center text-sm font-semibold text-purple-800 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              href={loginHref as never}
            >
              <LogIn aria-hidden="true" className="size-5" />
              {t("signIn")}
            </Link>
          </div>

          <div className="mt-3 flex justify-center">
            <button
              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={onConfirm}
              type="button"
            >
              {isPending ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  {t("redirecting")}
                </>
              ) : (
                t("continueAsGuest")
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
