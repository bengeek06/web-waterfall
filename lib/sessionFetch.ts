import { redirect } from "next/navigation";

/**
 * Vérifie la session utilisateur, tente un refresh si besoin, puis exécute le fetch demandé.
 * Redirige vers /login si la session ne peut pas être rafraîchie.
 *
 * @param input - URL ou Request info pour fetch
 * @param init - options fetch (headers, method, body, etc.)
 * @returns La réponse fetch si session valide, sinon redirige vers /login
 */
export async function checkSessionAndFetch(input: RequestInfo | URL, init?: RequestInit) {
  // Vérification de la session
  const verifyRes = await fetch("/api/auth/verify", { method: "POST", credentials: "include" });
  if (verifyRes.ok) {
    const data = await verifyRes.json();
    if (data.valid) {
      return fetch(input, init);
    }
  }
  // Tentative de refresh
  const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (refreshRes.ok) {
    const data = await refreshRes.json();
    if (data.valid) {
      return fetch(input, init);
    }
  }
  // Redirection si la session n'est pas récupérable
  redirect("/login");
}
