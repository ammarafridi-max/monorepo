"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@travel-suite/frontend-shared/contexts/UserAuthContext";
import Navbar from "@travel-suite/frontend-shared/components/v2/sections/Navbar";
import Footer from "@travel-suite/frontend-shared/components/v2/sections/Footer";

export default function AccountLayout({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/account")}`);
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
