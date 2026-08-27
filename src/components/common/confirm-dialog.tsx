"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { LoaderIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One confirmation dialog for the whole app, reached as a function.
 *
 * Every destructive action needs the same three things — a question, a way
 * out, and the answer — and none of them belong in the calling component's
 * state. `confirm()` returns a promise, so an event handler reads top to
 * bottom:
 *
 * ```ts
 * if (!(await confirm({ title: "Delete organization?", destructive: true }))) return;
 * deleteMutation.mutate({ id });
 * ```
 *
 * Pass `onConfirm` to keep the dialog open — and spinning — until the work
 * finishes; a rejection leaves the dialog up so the error is still on screen.
 * Without it the dialog closes immediately and resolves `true`.
 */

export interface ConfirmDialogProps {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive colour. */
  destructive?: boolean;
  /** Awaited before the dialog closes. Throw to keep it open. */
  onConfirm?: () => void | Promise<void>;
}

export const ConfirmDialog = NiceModal.create(
  ({
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    onConfirm,
  }: ConfirmDialogProps) => {
    const modal = useModal();
    const [isPending, setIsPending] = useState(false);

    const close = (answer: boolean) => {
      modal.resolve(answer);
      modal.hide();
    };

    const handleConfirm = async () => {
      if (!onConfirm) {
        close(true);
        return;
      }
      setIsPending(true);
      try {
        await onConfirm();
        close(true);
      } catch {
        // Deliberately stays open: the caller has surfaced the failure (a
        // toast, an inline error) and closing would hide it.
      } finally {
        setIsPending(false);
      }
    };

    return (
      <AlertDialog
        open={modal.visible}
        onOpenChange={(open) => {
          if (!open && !isPending) close(false);
        }}
      >
        <AlertDialogContent onEscapeKeyDown={(e) => isPending && e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                // The action closes the dialog by default; we own closing.
                e.preventDefault();
                handleConfirm();
              }}
              className={cn(destructive && buttonVariants({ variant: "destructive" }))}
            >
              {isPending && <LoaderIcon className="size-4 animate-spin" />}
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

/** Ask, and wait for the answer. Resolves `false` on cancel or dismiss. */
export function confirm(props: ConfirmDialogProps): Promise<boolean> {
  return NiceModal.show(ConfirmDialog, props) as Promise<boolean>;
}
