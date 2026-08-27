"use client";

import { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/server/provider";
import NiceModal from "@/store/nice-modal-context";

/**
 * Client providers, outermost first. `NiceModal.Provider` is what lets
 * `confirm()` and `selectOne()` be called from anywhere — the dialogs mount
 * here, not at each call site.
 */
export default function Providers({ children }: PropsWithChildren) {
  return (
    <TRPCReactProvider>
      <TooltipProvider>
        <NiceModal.Provider>
          {children}
          <Toaster richColors position="top-right" />
        </NiceModal.Provider>
      </TooltipProvider>
    </TRPCReactProvider>
  );
}
