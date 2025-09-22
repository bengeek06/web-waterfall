import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import Login from "@/components/login";

function getLocaleFromHeaders(headers: Headers): "fr" | "en" {
  const acceptLang = headers.get("accept-language");
  if (!acceptLang) return "fr";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";
  return "fr";
}

export default async function Home() {
  // Utilise les headers du serveur Next.js (import { headers } from "next/headers";)
  const { headers } = await import("next/headers");
  const headersObj = await headers(); // <-- Ajoute await ici
  const locale = getLocaleFromHeaders(headersObj);
  const dictionary = await getDictionary(locale);


  return (
    <div className="flex min-h-screen flex-col items-center p-12">
      <Image
        src="/waterfall_logo.png"
        alt="Waterfall Logo"
        width={400}
        height={104}
        priority
      />
      <p className="mt-4 text-lg text-waterfall-description">
        {dictionary.description}
      </p>
      <div className="mt-8 w-full max-w-sm">
        <Login dictionary={dictionary.login_component} />
      </div>
    </div>
  );
}
