import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";

export default async function Home() {
  const dictionary = await getDictionary('fr')


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/fr/waterfall_logo.png"
        alt="Waterfall Logo"
        width={1178}
        height={307}
        priority
      />
      <h1 className="mt-4 text-2xl font-bold">{dictionary.welcome}</h1>
      <p className="mt-2 text-lg text-gray-600">
        {dictionary.description}
      </p>
      <p className="mt-2 text-lg text-gray-600">
        LOG_LEVEL is set to: {process.env.LOG_LEVEL || "info"}
      </p>
    </div>
  );
}
