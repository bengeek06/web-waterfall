import { cookies } from "next/headers";
import React from "react";

async function getFirstnameFromCookie() {
  const token = (await cookies()).get("token");
  if (!token) return null;
  // Décoder le JWT pour extraire le user_id (champ sub)
  const base64Url = token.value.split(".")[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  const payload = JSON.parse(jsonPayload);
  const userId = payload.sub;
  if (!userId) return null;
  // Appel API pour récupérer le firstname
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}`, {
    headers: { Cookie: `token=${token.value}` },
    cache: "no-store"
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.firstname || null;
}

export default async function WelcomePage() {
  const firstname = await getFirstnameFromCookie();
  return <div className="text-2xl font-bold">Bonjour {firstname ? firstname : "!"}</div>;
}
