import React from "react";
import TopBar from "@/components/TopBar";

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopBar />
      {/* Contenu de la page */}
      <main>{children}</main>
    </div>
  );
}
