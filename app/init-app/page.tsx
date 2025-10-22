import InitApp from "@/components/initApp";
import { getDictionary } from "@/lib/dictionaries";

function getLocaleFromHeaders(headers: Headers): "fr" | "en" {
  const acceptLang = headers.get("accept-language");
  if (!acceptLang) return "fr";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";
  return "fr";
}

export default async function InitAppPage() {
  const { headers } = await import("next/headers");
  const headersObj = await headers();
  const locale = getLocaleFromHeaders(headersObj);
  const dictionary = await getDictionary(locale);
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <InitApp dictionary={dictionary.init_app} />
    </div>
  );
}
