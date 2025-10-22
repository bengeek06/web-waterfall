import { cookies } from "next/headers";

/**
 * Décode un JWT et extrait le user_id (champ sub)
 */
export function getUserIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("binary")
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Décode un JWT et extrait le company_id
 */
export function getCompanyIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("binary")
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.company_id || null;
  } catch {
    return null;
  }
}

/**
 * Récupère l'URL de l'avatar de l'utilisateur courant (ou null)
 */
export async function getAvatarUrl() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const userId = getUserIdFromToken(token);
  if (!userId) return null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}`,
      {
        headers: { Cookie: `access_token=${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const user = await res.json();
    return user.avatar_url || null;
  } catch {
    return null;
  }
}

/**
 * Récupère le prénom de l'utilisateur courant (ou null)
 */
export async function getFirstnameFromCookie() {
  const token = (await cookies()).get("access_token");
  if (!token) return null;
  const base64Url = token.value.split(".")[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  let jsonPayload;
  try {
    jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(jsonPayload);
  } catch {
    return null;
  }
  const userId = payload.sub;
  if (!userId) return null;

  const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}`;
  const res = await fetch(url, {
    headers: { Cookie: `token=${token.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.firstname || null;
}

/**
 * Récupère les informations du user courant via l'API.
 * Retourne un objet user ou null si non authentifié.
 */
export async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  // Décodage du user_id depuis le token (réutilise getUserIdFromToken si déjà présent)
  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}`;
  const res = await fetch(url, {
    headers: { Cookie: `access_token=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return await res.json();
}
