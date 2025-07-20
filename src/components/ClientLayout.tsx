"use client";
import { AuthProvider } from "@/components/ui/AuthContext";
import { ToastProvider } from "@/components/ui/ToastContext";
import { useEffect, useState } from "react";

function CustomAuthProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Platform</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomAuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </CustomAuthProvider>
  );
} 