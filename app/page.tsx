import { redirect } from "next/navigation";
import logger from "@/lib/logger";

export default async function InitRedirectPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  logger.info("baseurl: ${baseurl}");

  const res_identity = await fetch(`${baseUrl}/api/identity/init-app`, { cache: "no-store" });
  if (!res_identity.ok) throw new Error("Failed to fetch initialization status");
  const data_identity = await res_identity.json();

  const res_guardian = await fetch(`${baseUrl}/api/guardian/init-app`, { cache: "no-store" });
  if (!res_guardian.ok) throw new Error("Failed to fetch initialization status");
  const data_guardian = await res_guardian.json();

  if (data_identity.initialized === true && data_guardian.initialized === true) {
    logger.info("Application initialiezd");
    redirect("/login");
  } else if (data_identity.initialized === false || data_guardian.initialized === false) {
    logger.info("Application not initialized");
    redirect("/init-app");
  } else {
    throw new Error("Unexpected initialization status");
  }
  return null;
}
