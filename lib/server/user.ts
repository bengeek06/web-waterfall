/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

import { cookies } from "next/headers";
import { fetchWithAuthServer } from "@/lib/auth/fetchWithAuthServer";

/**
 * Décode un JWT et extrait le user_id (champ sub)
 */
export function getUserIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("binary")
        .split("")
        .map((c) => "%" + ("00" + (c.codePointAt(0) || 0).toString(16)).slice(-2))
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
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("binary")
        .split("")
        .map((c) => "%" + ("00" + (c.codePointAt(0) || 0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.company_id || null;
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur courant a un avatar
 * @returns true si l'utilisateur a un avatar (has_avatar), false sinon
 */
export async function hasUserAvatar(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const userId = getUserIdFromToken(token);
  if (!userId) return false;
  try {
    const res = await fetchWithAuthServer(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}`
    );
    if (!res.ok) return false;
    const user = await res.json();
    return user.has_avatar === true;
  } catch {
    return false;
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
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  let jsonPayload;
  try {
    jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + (c.codePointAt(0) || 0).toString(16)).slice(-2);
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
  const res = await fetchWithAuthServer(url);
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
  const res = await fetchWithAuthServer(url);
  if (!res.ok) return null;
  return await res.json();
}
