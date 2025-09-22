import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/**
 * Vérifie la session utilisateur, tente un refresh si besoin, puis exécute le fetch demandé.
 * Redirige vers /login si la session ne peut pas être rafraîchie.
 *
 * @param input - URL ou Request info pour fetch
 * @param init - options fetch (headers, method, body, etc.)
 * @returns La réponse fetch si session valide, sinon redirige vers /login
 */
export async function checkSessionAndFetch(input: RequestInfo | URL, init?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let cookieHeader = "";
  if (typeof window === "undefined") {
    // On est côté serveur, on récupère tous les cookies de la requête entrante
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  }
  // Vérification de la session
  const verifyUrl = typeof window === "undefined" ? `${baseUrl}/api/auth/verify` : "/api/auth/verify";
  const verifyRes = await fetch(verifyUrl, {
    method: "GET",
    credentials: "include",
    ...(typeof window === "undefined" ? { headers: { Cookie: cookieHeader } } : {})
  });
  if (verifyRes.ok) {
    const data = await verifyRes.json();
    if (data.valid) {
      // Si input est une URL relative côté serveur, la rendre absolue
      let realInput = input;
      if (typeof input === "string" && typeof window === "undefined" && input.startsWith("/")) {
        realInput = baseUrl + input;
      }
      return fetch(realInput, {
        ...init,
        ...(typeof window === "undefined" ? { headers: { ...(init?.headers || {}), Cookie: cookieHeader } } : {})
      });
    }
  }
  // Tentative de refresh
  const refreshUrl = typeof window === "undefined" ? `${baseUrl}/api/auth/refresh` : "/api/auth/refresh";
  const refreshRes = await fetch(refreshUrl, {
    method: "POST",
    credentials: "include",
    ...(typeof window === "undefined" ? { headers: { Cookie: cookieHeader } } : {})
  });
  if (refreshRes.ok) {
    const data = await refreshRes.json();
    if (data.valid) {
      let realInput = input;
      if (typeof input === "string" && typeof window === "undefined" && input.startsWith("/")) {
        realInput = baseUrl + input;
      }
      return fetch(realInput, {
        ...init,
        ...(typeof window === "undefined" ? { headers: { ...(init?.headers || {}), Cookie: cookieHeader } } : {})
      });
    }
  }
  // Redirection si la session n'est pas récupérable
  redirect("/login");
}
