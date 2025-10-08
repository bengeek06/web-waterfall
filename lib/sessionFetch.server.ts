import { cookies } from "next/headers";

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

export async function serverSessionFetch(input: RequestInfo | URL, init?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let realInput = input;
  if (typeof input === "string" && input.startsWith("/")) {
    realInput = baseUrl + input;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

  const buildInit = (orig?: RequestInit): RequestInit => {
    const prepared = withJsonHeader(orig);
    let headers: Record<string, string> = {};
    if (prepared.headers instanceof Headers) {
      prepared.headers.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(prepared.headers)) {
      for (const [k, v] of prepared.headers) headers[k] = v;
    } else if (prepared.headers) {
      headers = { ...(prepared.headers as Record<string, string>) };
    }
    headers["Cookie"] = cookieHeader;
    return { ...prepared, headers, credentials: "include" };
  };

  const first = await fetch(realInput, buildInit(init));
  if (first.status !== 401) return first;

  const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
    credentials: "include",
  });
  if (!refreshRes.ok) return first;

  return fetch(realInput, buildInit(init));
}