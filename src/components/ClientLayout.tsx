"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/ToastContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
} 