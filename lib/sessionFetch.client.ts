'use client';

/**
 * Ajoute Content-Type application/json si besoin.
 */
function withJsonHeader(init: RequestInit | undefined): RequestInit {
  if (!init) return {};
  if (!init.body) return init;
  const method = init.method?.toUpperCase();
  if (!method || !["POST", "PUT", "PATCH"].includes(method)) return init;

  let headers: Record<string, string> = {};
  if (init.headers instanceof Headers) {
    init.headers.forEach((v, k) => (headers[k] = v));
  } else if (Array.isArray(init.headers)) {
    for (const [k, v] of init.headers) headers[k] = v;
  } else if (init.headers) {
    headers = { ...(init.headers as Record<string, string>) };
  }

  const ct = Object.keys(headers).find(k => k.toLowerCase() === "content-type");
  if (!ct || !headers[ct].toLowerCase().includes("application/json")) {
    headers["Content-Type"] = "application/json";
  }
  return { ...init, headers };
}

export async function clientSessionFetch(input: RequestInfo | URL, init?: RequestInit) {
  const first = await fetch(input, {
    ...withJsonHeader(init),
    credentials: "include",
  });
  if (first.status !== 401) return first;

  const refresh = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  if (!refresh.ok) return first;

  return fetch(input, {
    ...withJsonHeader(init),
    credentials: "include",
  });
}