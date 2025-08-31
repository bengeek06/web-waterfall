import { redirect } from "next/navigation";

export default async function InitRedirectPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/identity/init-app`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch initialization status");
  const data = await res.json();
  if (data.initialized === true) {
    redirect("/login");
  } else {
    redirect("/init-app");
  }
  return null;
}
