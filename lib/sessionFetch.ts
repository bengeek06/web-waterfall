import { cookies } from "next/headers";

/**
 * Vérifie la session utilisateur, tente un refresh si besoin, puis exécute le fetch demandé.
 * Retourne une réponse 401 si la session ne peut pas être rafraîchie.
 *
 * @param input - URL ou Request info pour fetch
 * @param init - options fetch (headers, method, body, etc.)
 * @returns La réponse fetch si session valide, sinon une réponse 401
 */
export async function checkSessionAndFetch(input: RequestInfo | URL, init?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let cookieHeader = "";
  if (typeof window === "undefined") {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  }
  const verifyUrl = typeof window === "undefined" ? `${baseUrl}/api/auth/verify` : "/api/auth/verify";
  const verifyRes = await fetch(verifyUrl, {
    method: "GET",
    credentials: "include",
    ...(typeof window === "undefined" ? { headers: { Cookie: cookieHeader } } : {})
  });
  if (verifyRes.ok) {
    const data = await verifyRes.json();
    if (data.valid) {
      let realInput = input;
      if (typeof input === "string" && typeof window === "undefined" && input.startsWith("/")) {
        realInput = baseUrl + input;
      }
      // Correction: conserve le type d'origine des headers
      const finalInit = { ...(init || {}) };
      if (
        finalInit.body &&
        finalInit.method &&
        ["POST", "PUT", "PATCH"].includes(finalInit.method.toUpperCase())
      ) {
        if (finalInit.headers instanceof Headers) {
          finalInit.headers.set("Content-Type", "application/json");
        } else if (Array.isArray(finalInit.headers)) {
          // tableau de paires [clé, valeur]
          let found = false;
          finalInit.headers = finalInit.headers.map(([k, v]) => {
            if (k.toLowerCase() === "content-type") {
              found = true;
              return ["Content-Type", "application/json"];
            }
            return [k, v];
          });
          if (!found) {
            finalInit.headers.push(["Content-Type", "application/json"]);
          }
        } else {
          // objet simple
          finalInit.headers = {
            ...(finalInit.headers || {}),
            "Content-Type": "application/json",
          };
        }
      }
      // Ajoute le cookie côté serveur
      if (typeof window === "undefined") {
        if (finalInit.headers instanceof Headers) {
          finalInit.headers.set("Cookie", cookieHeader);
        } else if (Array.isArray(finalInit.headers)) {
          finalInit.headers.push(["Cookie", cookieHeader]);
        } else {
          finalInit.headers = {
            ...(finalInit.headers || {}),
            Cookie: cookieHeader,
          };
        }
      }
      // LOGS DEBUG
      // Affiche les headers et le body transmis à fetch
      console.log("checkSessionAndFetch: URL", realInput);
      console.log("checkSessionAndFetch: method", finalInit.method);
      console.log("checkSessionAndFetch: headers", finalInit.headers);
      if (finalInit.body) {
        console.log("checkSessionAndFetch: body", finalInit.body);
      }
      return fetch(realInput, finalInit);
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
      // Avant d'appeler fetch, s'assurer que Content-Type est bien "application/json" si body présent
      const finalInit = { ...(init || {}) };
      if (
        finalInit.body &&
        finalInit.method &&
        ["POST", "PUT", "PATCH"].includes(finalInit.method.toUpperCase())
      ) {
        if (finalInit.headers instanceof Headers) {
          finalInit.headers.set("Content-Type", "application/json");
        } else if (Array.isArray(finalInit.headers)) {
          // tableau de paires [clé, valeur]
          let found = false;
          finalInit.headers = finalInit.headers.map(([k, v]) => {
            if (k.toLowerCase() === "content-type") {
              found = true;
              return ["Content-Type", "application/json"];
            }
            return [k, v];
          });
          if (!found) {
            finalInit.headers.push(["Content-Type", "application/json"]);
          }
        } else {
          // objet simple
          finalInit.headers = {
            ...(finalInit.headers || {}),
            "Content-Type": "application/json",
          };
        }
      }
      // Ajoute le cookie côté serveur
      if (typeof window === "undefined") {
        if (finalInit.headers instanceof Headers) {
          finalInit.headers.set("Cookie", cookieHeader);
        } else if (Array.isArray(finalInit.headers)) {
          finalInit.headers.push(["Cookie", cookieHeader]);
        } else {
          finalInit.headers = {
            ...(finalInit.headers || {}),
            Cookie: cookieHeader,
          };
        }
      }
      // LOGS DEBUG
      // Affiche les headers et le body transmis à fetch
      console.log("checkSessionAndFetch (refresh): URL", realInput);
      console.log("checkSessionAndFetch (refresh): method", finalInit.method);
      console.log("checkSessionAndFetch (refresh): headers", finalInit.headers);
      if (finalInit.body) {
        console.log("checkSessionAndFetch (refresh): body", finalInit.body);
      }
      return fetch(realInput, finalInit);
    }
  }
  // Retourne une réponse 401 si la session n'est pas récupérable
  return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
}
