import React from "react";
import TopBar from "@/components/TopBar";
import AuthGuard from "@/components/AuthGuard";

export default function WelcomeLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-[var(--waterfall-bg-light)] to-white">
        <TopBar />
        {/* Contenu de la page */}
        <main className="p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}


